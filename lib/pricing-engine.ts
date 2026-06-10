/**
 * pricing-engine.ts
 * Motor de Precificação Inteligente — RepairFlow
 *
 * Arquitetura em camadas:
 *   1. Classificação dinâmica do aparelho (por valor de mercado)
 *   2. Cálculo de mão de obra (dificuldade × categoria)
 *   3. Taxa de risco técnico (responsabilidade operacional)
 *   4. Fator de responsabilidade financeira
 *   5. Proteção de lucratividade (piso e margem mínima)
 *   6. Validação pós-Gemini (sem limites fixos arbitrários)
 *   7. Ajuste por perfil da assistência (econômico / equilibrado / premium)
 *
 * 100% dinâmico — funciona para qualquer aparelho ou serviço,
 * presente ou futuro, sem listas fixas de marcas ou modelos.
 */

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type PerfilAssistencia = "economico" | "equilibrado" | "premium";

export interface PricingEngineInput {
  /** Valor de mercado do aparelho em R$ */
  marketValue: number;
  /** Nível de dificuldade do serviço: "Baixa" | "Média" | "Alta" | "Muito Alta" */
  difficulty: string;
  /** Custo da peça em R$ (0 se não houver) */
  partCost: number;
  /** Perfil de mercado da assistência (padrão: "equilibrado") */
  perfil?: PerfilAssistencia;
}

export interface PricingEngineOutput {
  /** Mão de obra final calculada */
  maoDeObra: number;
  /** Taxa de risco técnico */
  taxaRisco: number;
  /** Fator de responsabilidade financeira */
  taxaResponsabilidade: number;
  /** Subtotal técnico antes do ajuste de mercado */
  subtotal: number;
  /** Nome da categoria do aparelho */
  categoriaAparelho: string;
  /** Multiplicador de risco aplicado */
  fatorRisco: number;
  /** Margem mínima estimada em R$ */
  margemMinima: number;
  /** Piso absoluto de lucratividade */
  pisoAbsoluto: number;
}

// ─── Classificação dinâmica por valor de mercado ───────────────────────────────
// Sem listas fixas. Qualquer aparelho é classificado automaticamente.
// Novos modelos adicionados no futuro recebem classificação correta sem
// nenhuma alteração no código.

interface CategoriaConfig {
  nome: string;
  /** % do valor de mercado usado como taxa de risco técnico */
  fatorRiscoBase: number;
  /** Multiplicador aplicado sobre a mão de obra base */
  multiplicadorMdo: number;
  /** Fator adicional de responsabilidade financeira */
  fatorResponsabilidade: number;
  /** Margem mínima aceitável (%) */
  margemMinimaPct: number;
}

function classificarAparelho(marketValue: number): CategoriaConfig {
  // Ultra Premium (ex: iPhone Pro Max, Galaxy Ultra, Fold, novos flagships)
  if (marketValue >= 8000) {
    return {
      nome:                  "Ultra Premium",
      fatorRiscoBase:        0.095,
      multiplicadorMdo:      2.4,
      fatorResponsabilidade: 1.35,
      margemMinimaPct:       0.45,
    };
  }
  // Premium (ex: iPhone Pro, Galaxy S, Pixel Pro)
  if (marketValue >= 5000) {
    return {
      nome:                  "Premium",
      fatorRiscoBase:        0.075,
      multiplicadorMdo:      1.9,
      fatorResponsabilidade: 1.25,
      margemMinimaPct:       0.40,
    };
  }
  // Intermediário Alto (ex: iPhone padrão, Galaxy A5x, Xiaomi 12)
  if (marketValue >= 2500) {
    return {
      nome:                  "Intermediário Alto",
      fatorRiscoBase:        0.058,
      multiplicadorMdo:      1.45,
      fatorResponsabilidade: 1.15,
      margemMinimaPct:       0.35,
    };
  }
  // Intermediário (ex: Galaxy A3x, Motorola Edge, Xiaomi Note)
  if (marketValue >= 1200) {
    return {
      nome:                  "Intermediário",
      fatorRiscoBase:        0.042,
      multiplicadorMdo:      1.15,
      fatorResponsabilidade: 1.08,
      margemMinimaPct:       0.30,
    };
  }
  // Básico Plus (ex: Motorola G, Xiaomi Redmi, Samsung A1x)
  if (marketValue >= 600) {
    return {
      nome:                  "Básico Plus",
      fatorRiscoBase:        0.032,
      multiplicadorMdo:      1.0,
      fatorResponsabilidade: 1.0,
      margemMinimaPct:       0.28,
    };
  }
  // Básico (ex: aparelhos de entrada, modelos muito acessíveis)
  return {
    nome:                  "Básico",
    fatorRiscoBase:        0.025,
    multiplicadorMdo:      0.88,
    fatorResponsabilidade: 1.0,
    margemMinimaPct:       0.25,
  };
}

// ─── Mão de obra base por dificuldade ─────────────────────────────────────────
// Escalável: qualquer dificuldade futura recebe um default seguro.

function maoDeObraBase(difficulty: string): number {
  const tabela: Record<string, number> = {
    "Baixa":      85,
    "Média":      165,
    "Alta":       290,
    "Muito Alta": 490,
  };
  // Default seguro para dificuldades futuras cadastradas pelo usuário
  return tabela[difficulty] ?? 130;
}

// ─── Perfil da assistência ─────────────────────────────────────────────────────
// Aplica um modificador suave no resultado final.
// Não altera os cálculos internos — apenas desloca o preço final.

function multiplicadorPerfil(perfil: PerfilAssistencia): number {
  const perfis: Record<PerfilAssistencia, number> = {
    economico:    0.90,  // −10% — mais competitivo
    equilibrado:  1.00,  // neutro — faixa média do mercado
    premium:      1.12,  // +12% — prioriza margem e valor agregado
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

  // Camada 1 — Mão de obra (dificuldade × categoria do aparelho)
  const mdoBase   = maoDeObraBase(difficulty);
  const maoDeObra = round2(mdoBase * categoria.multiplicadorMdo);

  // Camada 2 — Taxa de risco técnico (% do valor de mercado)
  // Quanto mais caro o aparelho, maior o risco de um erro operacional
  const taxaRisco = round2(marketValue * categoria.fatorRiscoBase);

  // Camada 3 — Fator de responsabilidade financeira
  // Serviços em aparelhos premium exigem maior responsabilidade do técnico
  const taxaResponsabilidade = round2(
    maoDeObra * (categoria.fatorResponsabilidade - 1)
  );

  // Subtotal técnico bruto (antes de qualquer ajuste de mercado)
  const subtotalBruto = maoDeObra + partCost + taxaRisco + taxaResponsabilidade;

  // Aplica modificador de perfil da assistência
  const subtotal = round2(subtotalBruto * multiplicadorPerfil(perfil));

  // Piso absoluto de lucratividade
  // Com peça: garante markup mínimo sobre o custo da peça + mão de obra base
  // Sem peça: garante que o subtotal técnico não seja ignorado
  const pisoAbsoluto = partCost > 0
    ? round2((partCost * (1 + categoria.margemMinimaPct)) + maoDeObra)
    : round2(subtotal * 0.65);

  // Margem mínima estimada em R$ (para exibição e validação)
  const margemMinima = round2(subtotal * categoria.margemMinimaPct);

  return {
    maoDeObra,
    taxaRisco,
    taxaResponsabilidade,
    subtotal,
    categoriaAparelho: categoria.nome,
    fatorRisco:        categoria.fatorRiscoBase,
    margemMinima,
    pisoAbsoluto,
  };
}

// ─── Validação pós-Gemini ──────────────────────────────────────────────────────
// Segunda camada de inteligência: valida o preço sugerido pelo Gemini
// contra a realidade técnica e financeira da assistência.
//
// Princípios:
//   • Não usa limites fixos ou percentuais arbitrários
//   • Não aplica reduções nem aumentos agressivos
//   • Mantém o preço se ele for correto
//   • Corrige apenas quando necessário
//   • Nunca sacrifica a lucratividade mínima

export interface ValidacaoInput {
  /** Preço sugerido pelo Gemini */
  precoGemini:  number;
  /** Base técnica calculada pela engine */
  subtotal:     number;
  /** Custo da peça */
  partCost:     number;
  /** Valor de mercado do aparelho */
  marketValue:  number;
  /** Perfil da assistência */
  perfil?:      PerfilAssistencia;
}

export function validarPrecoFinal(input: ValidacaoInput): number {
  const {
    precoGemini,
    subtotal,
    partCost,
    marketValue,
    perfil = "equilibrado",
  } = input;

  const categoria = classificarAparelho(marketValue);

  // Piso: nunca abaixo do custo total mínimo da operação
  const pisoAbsoluto = partCost > 0
    ? round2((partCost * (1 + categoria.margemMinimaPct)) + maoDeObraBase("Baixa"))
    : round2(subtotal * 0.60);

  // Teto dinâmico: baseado no valor do aparelho e no subtotal técnico
  // Evita valores absurdos sem usar um cap fixo e arbitrário
  // Um reparo nunca deve custar mais do que faz sentido para aquele aparelho
  const tetoDinamico = round2(
    Math.max(subtotal * 2.8, marketValue * 0.30)
  );

  // Faixa de conforto: entre 85% e 130% do subtotal técnico
  // Se o Gemini ficar dentro dessa faixa, o preço é mantido sem ajuste
  const faixaMin = round2(subtotal * 0.85);
  const faixaMax = round2(subtotal * 1.30);

  let precoFinal: number;

  if (precoGemini >= faixaMin && precoGemini <= faixaMax) {
    // Gemini está dentro da faixa técnica — mantém sem alteração
    precoFinal = precoGemini;
  } else if (precoGemini < faixaMin) {
    // Gemini sugeriu abaixo — puxa suavemente para a faixa mínima
    // Mas não ignora completamente o Gemini: pondera os dois
    precoFinal = round2((precoGemini * 0.35) + (faixaMin * 0.65));
  } else {
    // Gemini sugeriu acima — aceita se houver justificativa (aparelho premium)
    // Para Ultra Premium / Premium, o mercado justifica valores maiores
    const aceitaAcima = categoria.nome === "Ultra Premium" || categoria.nome === "Premium";
    precoFinal = aceitaAcima
      ? round2((precoGemini * 0.70) + (faixaMax * 0.30))  // aceita com ponderação
      : faixaMax;                                           // limita na faixa max
  }

  // Aplica perfil da assistência no resultado final
  precoFinal = round2(precoFinal * multiplicadorPerfil(perfil));

  // Aplica piso e teto finais
  precoFinal = Math.min(Math.max(precoFinal, pisoAbsoluto), tetoDinamico);

  return Math.round(precoFinal);
}

// ─── Utilitário interno ────────────────────────────────────────────────────────

/** Arredonda para 2 casas decimais sem erro de ponto flutuante */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}