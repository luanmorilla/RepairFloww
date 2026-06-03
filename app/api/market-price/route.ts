import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { device, service, partCost, subtotal } = await request.json();

    const hasPart = Number(partCost) > 0;

    const prompt = `Você é um especialista em assistências técnicas de celular no Brasil.
Estime o preço médio cobrado no mercado brasileiro para:
- Serviço: "${service}"
- Aparelho: "${device}"
- Custo da peça: R$ ${partCost}

Responda SOMENTE com JSON puro, sem texto antes ou depois, sem markdown, sem explicação:
{"precoMin":150,"precoMax":300,"precoMedio":220}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[^{}]*"precoMedio"[^{}]*\}/);

    let precoMedio: number;

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      precoMedio = Number(parsed.precoMedio);
    } else {
      try {
        const parsed = JSON.parse(clean);
        precoMedio = Number(parsed.precoMedio);
      } catch {
        // Fallback se Gemini falhar completamente
        precoMedio = hasPart ? Number(partCost) * 2 : Number(subtotal) * 0.85;
      }
    }

    // ── Lógica de margem invisível ──────────────────────────────────────────
    // COM PEÇA:
    //   candidato 1 → média mercado × 1.35  (35% acima da média)
    //   candidato 2 → custo da peça × 2.8   (markup de 2.8× na peça)
    //   floor       → nunca menos que 70% do subtotal calculado pela engine
    //   teto        → subtotal da engine (não cobra absurdo)
    //
    // SEM PEÇA:
    //   candidato 1 → média mercado × 1.25  (25% acima da média)
    //   floor       → nunca menos que 75% do subtotal calculado pela engine
    //   teto        → subtotal da engine

    let adjustedPrice: number;

    if (hasPart) {
      const byMarket   = Math.round(precoMedio * 1.35);
      const byPartCost = Math.round(Number(partCost) * 2.8);
      const floor      = Math.round(Number(subtotal) * 0.70);
      const ceiling    = Math.round(Number(subtotal));
      adjustedPrice = Math.min(Math.max(byMarket, byPartCost, floor), ceiling);
    } else {
      const byMarket = Math.round(precoMedio * 1.25);
      const floor    = Math.round(Number(subtotal) * 0.75);
      const ceiling  = Math.round(Number(subtotal));
      adjustedPrice = Math.min(Math.max(byMarket, floor), ceiling);
    }

    return NextResponse.json({ success: true, adjustedPrice });

  } catch (error) {
    console.error("Erro market-price:", error);
    return NextResponse.json(
      { success: false, adjustedPrice: null },
      { status: 500 }
    );
  }
}