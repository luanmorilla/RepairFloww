import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { device, service, partCost } = await request.json();

    const prompt = `Você é um especialista em assistências técnicas de celular no Brasil.

Estime o preço médio cobrado no Brasil para:
- Serviço: "${service}"
- Aparelho: "${device}"
- Custo da peça: R$ ${partCost}

Responda SOMENTE com um JSON, sem texto antes ou depois, sem markdown, sem explicação:
{"precoMin":150,"precoMax":300,"precoMedio":220,"confianca":"alta"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    const data = await response.json();

    // Log para debug
    console.log("Gemini raw response:", JSON.stringify(data).slice(0, 500));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("Gemini text:", text);

    // Tenta extrair JSON de qualquer forma
    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = clean.match(/\{[^{}]*"precoMedio"[^{}]*\}/);

    if (!jsonMatch) {
      // Fallback: tenta parse direto
      try {
        const parsed = JSON.parse(clean);
        return NextResponse.json({ success: true, ...parsed });
      } catch {
        console.error("Texto recebido:", text);
        // Retorna estimativa baseada no custo da peça como fallback
        const estimativa = {
          precoMin: Math.round(partCost * 1.5),
          precoMax: Math.round(partCost * 3),
          precoMedio: Math.round(partCost * 2),
          confianca: "baixa",
        };
        return NextResponse.json({ success: true, ...estimativa });
      }
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