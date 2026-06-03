import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { device, service, partCost } = await request.json();

    const prompt = `Você é um especialista em assistências técnicas de celular no Brasil.
    
Pesquise e estime o preço médio cobrado no Brasil para:
- Serviço: "${service}"
- Aparelho: "${device}"
- Custo da peça informado: R$ ${partCost}

Considere preços praticados em assistências técnicas brasileiras em 2024/2025.

Retorne APENAS um JSON válido sem markdown, sem explicações, exatamente neste formato:
{
  "precoMin": 150,
  "precoMax": 300,
  "precoMedio": 220,
  "confianca": "alta"
}

Onde confianca pode ser "alta", "media" ou "baixa" dependendo de quão específica é sua estimativa.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Remove markdown se vier com ```json
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Resposta inválida do Gemini");
    }

    const marketData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, ...marketData });
  } catch (error) {
    console.error("Erro ao buscar preço de mercado:", error);
    return NextResponse.json(
      { success: false, error: "Não foi possível buscar o preço de mercado." },
      { status: 500 }
    );
  }
}