/**
 * app/api/market-price/route.ts
 * Rota de consulta de precificação de mercado via Gemini — RepairFlow
 *
 * Fluxo:
 *   1. Recebe contexto do aparelho e serviço
 *   2. Consulta Gemini com prompt especializado em assistência técnica BR
 *      → O prompt ancora o Gemini no piso técnico calculado pela engine
 *      → Impede que o Gemini sugira valores tecnicamente inviáveis
 *   3. Parse robusto da resposta (com fallbacks em cascata)
 *   4. Validação final via engine (piso inegociável + teto dinâmico)
 *
 * Filosofia:
 *   • Engine local = autoridade técnica e de lucratividade
 *   • Gemini = inteligência de mercado (pode subir ou descer dentro dos limites)
 *   • Piso calculado pela engine é passado ao Gemini via prompt
 *   • Se Gemini ignorar o piso, validarPrecoFinal() corrige automaticamente
 *   • Fallback = subtotal técnico completo (nunca abaixo)
 */

import { NextResponse }                              from "next/server";
import { validarPrecoFinal, type PerfilAssistencia } from "@/lib/pricing-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const device:      string            = String(body.device      ?? "");
    const service:     string            = String(body.service     ?? "");
    const partCost:    number            = Number(body.partCost)    || 0;
    const subtotal:    number            = Number(body.subtotal)    || 0;
    const marketValue: number            = Number(body.marketValue) || 0;
    const perfil:      PerfilAssistencia = body.perfil ?? "equilibrado";

    const hasPart = partCost > 0;

    // ── Prompt especializado ───────────────────────────────────────────────────
    //
    // Decisão de design:
    //   O subtotal técnico é informado ao Gemini como âncora mínima.
    //   Isso ancora o raciocínio do Gemini na realidade operacional
    //   e reduz drasticamente sugestões tecnicamente inviáveis.
    //
    //   O Gemini pode:
    //     • Sugerir ACIMA se o mercado paga mais por aquele aparelho/serviço
    //     • Sugerir PRÓXIMO ao subtotal se o mercado está alinhado
    //     • Sugerir ABAIXO do subtotal APENAS se tiver certeza que o mercado
    //       real pratica um valor menor (ex: serviço muito simples + aparelho básico)
    //
    //   Mesmo se o Gemini sugerir abaixo do piso, validarPrecoFinal() corrige.
    //   O prompt é a primeira linha de defesa; a engine é a segunda.

    const prompt = `Você é um gestor sênior com 15 anos de experiência em assistência técnica de celulares no Brasil.

Preciso que você estime o preço real que uma assistência técnica profissional e bem estruturada cobraria por este serviço:

Aparelho: ${device}
Serviço: ${service}
${hasPart ? `Custo da peça: R$ ${partCost.toFixed(2)}` : "Serviço sem reposição de peça (mão de obra pura)"}
Custo técnico mínimo calculado internamente: R$ ${subtotal.toFixed(2)}

Raciocine como gestor de negócio considerando obrigatoriamente:
1. Faixa de preço real praticada no mercado brasileiro para este aparelho e serviço específicos
2. Complexidade técnica e tempo médio de execução
3. Risco operacional: chance de retrabalho, sensibilidade dos componentes
4. Responsabilidade financeira: o custo de um erro neste aparelho específico
5. Margem mínima para a assistência ser sustentável (overhead, garantia, mão de obra)
6. Competitividade: preço que o cliente aceita sem buscar concorrente
7. Perfil do cliente: quem tem um ${device} tem expectativa de valor diferente de quem tem um aparelho básico

${hasPart
  ? `O custo da peça é R$ ${partCost.toFixed(2)}. O preço final deve cobrir: peça + mão de obra especializada + overhead + risco operacional + margem real.`
  : `Serviço de mão de obra pura. Considere: tempo de execução, expertise técnica, risco de dano acidental e garantia do serviço.`
}

Referência interna: o custo técnico mínimo calculado para este serviço é R$ ${subtotal.toFixed(2)}.
Se o mercado real pagar mais, sugira acima. Se o mercado real pagar próximo, confirme. Só sugira abaixo se tiver absoluta certeza que o mercado pratica menos do que esse valor para este serviço específico.

Responda SOMENTE com JSON puro, sem markdown, sem texto adicional:
{"precoMin":0,"precoMax":0,"precoMedio":0,"precoIdeal":0}

precoIdeal = o preço exato que você cobraria se fosse dono desta assistência, equilibrando lucro real e competitividade de mercado.`;

    // ── Chamada Gemini ─────────────────────────────────────────────────────────
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     0.10, // baixa temperatura = respostas mais consistentes
            maxOutputTokens: 250,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini HTTP ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText    = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // ── Parse robusto em cascata ───────────────────────────────────────────────
    // Tenta 3 estratégias antes de cair no fallback.

    let precoIdeal = 0;
    let precoMedio = 0;

    try {
      // Estratégia 1: parse direto do texto limpo
      const clean  = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      precoIdeal = Number(parsed.precoIdeal) || 0;
      precoMedio = Number(parsed.precoMedio)  || 0;
    } catch {
      try {
        // Estratégia 2: extrai o primeiro objeto JSON encontrado no texto
        const jsonMatch = rawText.match(/\{[^{}]*"precoIdeal"[^{}]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          precoIdeal = Number(parsed.precoIdeal) || 0;
          precoMedio = Number(parsed.precoMedio)  || 0;
        }
      } catch {
        // Estratégia 3: extrai números individualmente via regex
        const idealMatch = rawText.match(/"precoIdeal"\s*:\s*(\d+(?:\.\d+)?)/);
        const medioMatch = rawText.match(/"precoMedio"\s*:\s*(\d+(?:\.\d+)?)/);
        precoIdeal = idealMatch ? Number(idealMatch[1]) : 0;
        precoMedio = medioMatch ? Number(medioMatch[1]) : 0;
      }
    }

    // ── Fallback conservador ───────────────────────────────────────────────────
    // Se o Gemini não retornou nada utilizável, usa o subtotal técnico completo.
    // Nunca usar subtotal * 0.95 ou qualquer fator abaixo de 1 — o subtotal já é
    // o mínimo técnico calculado pela engine, não faz sentido ir abaixo dele.
    if (precoIdeal <= 0 && precoMedio <= 0) {
      const fallback = hasPart
        ? Math.max(partCost * 2.2, subtotal) // markup razoável, nunca abaixo do subtotal
        : subtotal;                           // usa subtotal técnico completo como base
      precoIdeal = fallback;
      precoMedio = fallback;
    }

    // Usa precoIdeal como base; recorre ao precoMedio se necessário
    const precoGemini = precoIdeal > 0 ? precoIdeal : precoMedio;

    // ── Validação inteligente via engine ───────────────────────────────────────
    // Segunda linha de defesa: garante piso, teto e consistência técnica.
    // Mesmo que o prompt não tenha contido o Gemini, a validação corrige aqui.
    const adjustedPrice = validarPrecoFinal({
      precoGemini,
      subtotal,
      partCost,
      marketValue,
      perfil,
    });

    return NextResponse.json({ success: true, adjustedPrice });

  } catch (error) {
    console.error("[market-price] Erro:", error);
    return NextResponse.json(
      { success: false, adjustedPrice: null },
      { status: 500 }
    );
  }
}