/**
 * lib/pricing-engine.ts
 * Motor de Precificação Inteligente — RepairFlow
 *
 * Versão corrigida: valores calibrados para o mercado brasileiro real.
 * Taxas de risco e responsabilidade deixaram de ser proporcionais ao
 * valor do aparelho (o que gerava valores absurdos em premiums) e
 * passaram a ser valores fixos/moderados por categoria.
 */

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type PerfilAssistencia = "economico" | "equilibrado" | "premium";

export interface PricingEngineInput {
  marketValue: number;
  difficulty: string;
  partCost: number;
  perfil?: PerfilAssistencia;
}

export interface PricingEngineOutput {
  maoDeObra: number;
  taxaRisco: number;
  taxaResponsabilidade: number;
  subtotal: number;
  subtotalBruto: number;
  categoriaAparelho: string;
  fatorRisco: number;
  margemMinima: number;
  pisoAbsoluto: number;
}

// ─── Classificação dinâmica por valor de mercado ───────────────────────────────

interface CategoriaConfig {
  nome: string;
  /** Taxa de risco técnico fixa (R$) */
  taxaRiscoFixa: number;
  /** Multiplicador aplicado sobre a mão de obra base */
  multiplicadorMdo: number;
  /** Fator adicional de responsabilidade financeira */
  fatorResponsabilidade: number;
  /** Margem mínima aceitável sobre o subtotal bruto (%) */
  margemMinimaPct: number;
  /** Markup mínimo sobre custo da peça (%) — papel distinto da margem */
  markupPecaPct: number;
}

function classificarAparelho(marketValue: number): CategoriaConfig {
  if (marketValue >= 8000) {
    return {
      nome:                  "Ultra Premium",
      taxaRiscoFixa:         90,
      multiplicadorMdo:      1.50,
      fatorResponsabilidade: 1.15,
      margemMinimaPct:       0.45,
      markupPecaPct:         0.30,
    };
  }
  if (marketValue >= 5000) {
    return {
      nome:                  "Premium",
      taxaRiscoFixa:         70,
      multiplicadorMdo:      1.30,
      fatorResponsabilidade: 1.10,
      margemMinimaPct:       0.40,
      markupPecaPct:         0.25,
    };
  }
  if (marketValue >= 2500) {
    return {
      nome:                  "Intermediário Alto",
      taxaRiscoFixa:         55,
      multiplicadorMdo:      1.15,
      fatorResponsabilidade: 1.06,
      margemMinimaPct:       0.35,
      markupPecaPct:         0.20,
    };
  }
  if (marketValue >= 1200) {
    return {
      nome:                  "Intermediário",
      taxaRiscoFixa:         35,
      multiplicadorMdo:      1.05,
      fatorResponsabilidade: 1.03,
      margemMinimaPct:       0.30,
      markupPecaPct:         0.18,
    };
  }
  if (marketValue >= 600) {
    return {
      nome:                  "Básico Plus",
      taxaRiscoFixa:         25,
      multiplicadorMdo:      0.95,
      fatorResponsabilidade: 1.0,
      margemMinimaPct:       0.28,
      markupPecaPct:         0.15,
    };
  }
  return {
    nome:                  "Básico",
    taxaRiscoFixa:         15,
    multiplicadorMdo:      0.85,
    fatorResponsabilidade: 1.0,
    margemMinimaPct:       0.25,
    markupPecaPct:         0.12,
  };
}

// ─── Mão de obra base por dificuldade ─────────────────────────────────────────

function maoDeObraBase(difficulty: string): number {
  const tabela: Record<string, number> = {
    "Baixa":      45,
    "Média":      90,
    "Alta":       160,
    "Muito Alta": 280,
  };
  if (!(difficulty in tabela)) {
    console.warn(`[pricing-engine] Dificuldade desconhecida: "${difficulty}". Usando "Média" como fallback.`);
  }
  return tabela[difficulty] ?? 90;
}

// ─── Perfil da assistência ─────────────────────────────────────────────────────

function multiplicadorPerfil(perfil: PerfilAssistencia): number {
  const perfis: Record<PerfilAssistencia, number> = {
    economico:    0.90,
    equilibrado:  1.00,
    premium:      1.12,
  };
  return perfis[perfil] ?? 1.00;
}

// ─── Função principal ──────────────────────────────────────────────────────────

export function calcularPrecoBase(input: PricingEngineInput): PricingEngineOutput {
  const {
    marketValue,
    difficulty,
    partCost,
    perfil = "equilibrado",
  } = input;

  const categoria = classificarAparelho(marketValue);

  // Com peça: mão de obra = 180% do custo da peça
  // Sem peça: tabela de dificuldade × multiplicador do aparelho
  const maoDeObra = partCost > 0
    ? round2(partCost * 1.80)
    : round2(maoDeObraBase(difficulty) * categoria.multiplicadorMdo);

  const taxaRisco = categoria.taxaRiscoFixa;

  const taxaResponsabilidade = round2(
    maoDeObra * (categoria.fatorResponsabilidade - 1)
  );

  // Subtotal bruto: sem perfil aplicado — usado como referência pela validação
  const subtotalBruto = round2(maoDeObra + partCost + taxaRisco + taxaResponsabilidade);

  // Subtotal com perfil: para exibição ao usuário
  const subtotal = round2(subtotalBruto * multiplicadorPerfil(perfil));

  // Piso usa markupPecaPct (sobre custo da peça) — semântica correta
  const pisoAbsoluto = partCost > 0
    ? round2((partCost * (1 + categoria.markupPecaPct)) + maoDeObra)
    : round2(subtotalBruto * 0.70);

  // margemMinima usa margemMinimaPct (sobre subtotal bruto) — semântica correta
  const margemMinima = round2(subtotalBruto * categoria.margemMinimaPct);

  return {
    maoDeObra,
    taxaRisco,
    taxaResponsabilidade,
    subtotal,
    subtotalBruto,
    categoriaAparelho: categoria.nome,
    fatorRisco:        categoria.taxaRiscoFixa,
    margemMinima,
    pisoAbsoluto,
  };
}

// ─── Validação pós-Gemini ──────────────────────────────────────────────────────
//
// Papel do Gemini: fonte de verdade de preços de mercado.
// Papel da engine: garantir que o preço cobre custos mínimos.
//
// Regra única:
//   - Se Gemini >= piso → aceita o Gemini (mercado manda)
//   - Se Gemini < piso  → usa o subtotalBruto (engine protege a lucratividade)
//   - Aplica perfil UMA vez no resultado final
//   - Aplica teto para evitar absurdos

export interface ValidacaoInput {
  precoGemini:   number;
  subtotalBruto: number;   // subtotal SEM perfil aplicado (vem de calcularPrecoBase)
  partCost:      number;
  marketValue:   number;
  perfil?:       PerfilAssistencia;
}

export function validarPrecoFinal(input: ValidacaoInput): number {
  const {
    precoGemini,
    subtotalBruto,
    partCost,
    marketValue,
    perfil = "equilibrado",
  } = input;

  const categoria = classificarAparelho(marketValue);
  const mdoBaixa  = maoDeObraBase("Baixa");

  // Piso: mínimo inegociável para cobrir custos
  const pisoAbsoluto = partCost > 0
    ? round2((partCost * (1 + categoria.markupPecaPct)) + mdoBaixa)
    : round2(subtotalBruto * 0.70);

  // Teto: evita valores absurdos
  // Garante que teto >= piso sempre
  const tetoDinamico = round2(
    Math.max(
      subtotalBruto * 2.2,
      marketValue > 0 ? marketValue * 0.20 : 0,
      pisoAbsoluto * 1.5   // teto nunca menor que 1.5× o piso
    )
  );

  // Regra principal: Gemini é a fonte de verdade de mercado
  // A engine só intervém se o Gemini ficar abaixo do piso
  let precoFinal: number;

  if (precoGemini >= pisoAbsoluto) {
    // Gemini sabe o que o mercado paga → aceita sem blend
    precoFinal = precoGemini;
  } else {
    // Gemini retornou abaixo do custo mínimo → usa subtotal da engine
    precoFinal = subtotalBruto;
  }

  // Aplica perfil UMA vez aqui (subtotalBruto não carrega perfil)
  precoFinal = round2(precoFinal * multiplicadorPerfil(perfil));

  // Piso e teto como garantia absoluta final
  precoFinal = Math.max(precoFinal, pisoAbsoluto);
  precoFinal = Math.min(precoFinal, tetoDinamico);

  return Math.round(precoFinal);
}

// ─── Utilitário interno ────────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}