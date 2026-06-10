/**
 * app/api/market-price/route.ts
 * Rota de consulta de precificação de mercado via Gemini.
 *
 * Fluxo:
 *   1. Recebe contexto do aparelho e serviço
 *   2. Consulta Gemini com prompt especializado em assistência técnica BR
 *   3. Faz parse robusto da resposta (com fallbacks em cascata)
 *   4. Valida o preço via engine antes de retornar
 */

import { NextResponse }                         from "next/server";
import { validarPrecoFinal, type PerfilAssistencia } from "@/lib/pricing-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const device:      string             = String(body.device      ?? "");
    const service:     string             = String(body.service     ?? "");
    const partCost:    number             = Number(body.partCost)    || 0;
    const subtotal:    number             = Number(body.subtotal)    || 0;
    const marketValue: number             = Number(body.marketValue) || 0;
    const perfil:      PerfilAssistencia  = body.perfil ?? "equilibrado";

    const hasPart = partCost > 0;

    // ── Prompt especializado ───────────────────────────────────────────────────
    // Instrui o Gemini a raciocinar como gestor experiente de assistência técnica
    // brasileira, não como IA genérica. Não menciona algoritmos nem IA.
    const prompt = `Você é um gestor sênior com 15 anos de experiência em assistência técnica de celulares no Brasil.

Preciso que você estime o preço real que uma assistência técnica profissional e bem estruturada cobraria por este serviço:

Aparelho: ${device}
Serviço:  ${service}
${hasPart ? `Custo da peça: R$ ${partCost.toFixed(2)}` : "Serviço sem reposição de peça"}

Raciocine como gestor de negócio considerando obrigatoriamente:
1. Faixa de preço real praticada no mercado brasileiro para este aparelho específico
2. Complexidade técnica e tempo médio de execução deste serviço
3. Risco operacional: chance de retrabalho, sensibilidade dos componentes, dificuldade de desmontagem
4. Responsabilidade financeira: custo de um erro neste aparelho específico
5. Margem mínima para a assistência ser sustentável (cobrir overhead, garantia, mão de obra)
6. Competitividade: preço que o cliente aceita pagar sem buscar o concorrente
7. Perfil do aparelho: clientes de aparelhos premium aceitam faixas de preço diferentes de aparelhos básicos

${hasPart
  ? `Com custo de peça de R$ ${partCost.toFixed(2)}, o preço final deve cobrir: peça + mão de obra especializada + overhead + risco operacional + margem de lucro real.`
  : `Serviço de mão de obra pura: considere tempo de execução, expertise técnica necessária, risco de dano acidental e garantia do serviço.`
}

Importante: preços abaixo do mercado prejudicam a sustentabilidade da assistência. Preços acima espantam o cliente. Busque o equilíbrio profissional real.

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
            temperature:     0.10,  // baixa temperatura = mais consistente
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
    // Tenta 3 estratégias antes de cair no fallback técnico

    let precoIdeal = 0;
    let precoMedio = 0;

    try {
      // Estratégia 1: parse direto do texto limpo
      const clean = rawText.replace(/```json|```/g, "").trim();
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
        const ideaMatch  = rawText.match(/"precoIdeal"\s*:\s*(\d+(?:\.\d+)?)/);
        const medioMatch = rawText.match(/"precoMedio"\s*:\s*(\d+(?:\.\d+)?)/);
        precoIdeal = ideaMatch  ? Number(ideaMatch[1])  : 0;
        precoMedio = medioMatch ? Number(medioMatch[1]) : 0;
      }
    }

    // Fallback conservador: se o Gemini não retornou nada utilizável
    if (precoIdeal <= 0 && precoMedio <= 0) {
      const fallback = hasPart
        ? partCost * 2.2   // markup razoável sobre o custo da peça
        : subtotal * 0.95; // próximo do subtotal técnico
      precoIdeal = fallback;
      precoMedio = fallback;
    }

    // Usa precoIdeal como base; recorre ao precoMedio se necessário
    const precoGemini = precoIdeal > 0 ? precoIdeal : precoMedio;

    // ── Validação inteligente via engine ───────────────────────────────────────
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