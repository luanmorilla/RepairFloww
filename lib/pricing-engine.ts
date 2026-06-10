/**
 * lib/pricing-engine.ts
 * Motor de Precificação Inteligente — RepairFlow
 *
 * Arquitetura em camadas:
 *   1. Classificação dinâmica do aparelho (por valor de mercado)
 *   2. Cálculo de mão de obra (dificuldade × categoria)
 *   3. Taxa de risco técnico (responsabilidade operacional)
 *   4. Fator de responsabilidade financeira
 *   5. Proteção de lucratividade (piso e margem mínima)
 *   6. Validação pós-Gemini — engine é a autoridade, Gemini é o consultor de mercado
 *   7. Ajuste por perfil da assistência (econômico / equilibrado / premium)
 *
 * Filosofia da validação pós-Gemini:
 *   • O Gemini pode AUMENTAR o preço se o mercado justifica
 *   • O Gemini pode REDUZIR o preço se o valor estiver acima do mercado
 *   • O Gemini NUNCA perfura o piso técnico calculado pela engine
 *   • Se o Gemini sugerir abaixo do piso, o piso prevalece integralmente
 *   • Não existe ponderação com valor baixo do Gemini — ou ele está correto, ou é ignorado
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
// Novos modelos adicionados no futuro recebem classificação correta
// sem nenhuma alteração no código.

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
  // Ultra Premium (ex: iPhone Pro Max, Galaxy Ultra, Fold, Z Flip top)
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
// Valores calibrados para o mercado brasileiro em 2025.
// Escalável: qualquer dificuldade futura cadastrada recebe um default seguro.

function maoDeObraBase(difficulty: string): number {
  const tabela: Record<string, number> = {
    "Baixa":      95,   // serviços simples: bateria, conector, limpeza
    "Média":      180,  // telas de intermediários, câmeras, biometria
    "Alta":       320,  // telas premium, placa, Face ID, oxidação severa
    "Muito Alta": 520,  // microsolda, reballing, componentes ultra sensíveis
  };
  // Default seguro para dificuldades futuras cadastradas pelo usuário
  return tabela[difficulty] ?? 145;
}

// ─── Perfil da assistência ─────────────────────────────────────────────────────
// Aplica um modificador suave no resultado final.
// Não altera os cálculos internos — apenas desloca o preço final.

function multiplicadorPerfil(perfil: PerfilAssistencia): number {
  const perfis: Record<PerfilAssistencia, number> = {
    economico:    0.90,  // −10% — prioriza competitividade
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
  // Sem peça: garante que o subtotal técnico nunca seja subvertido
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
//
// Papel do Gemini: consultor de mercado.
// Papel da engine: guardiã da lucratividade.
//
// Regras aplicadas nesta ordem:
//
//   1. Calcular o piso técnico inegociável (engine define, Gemini não perfura)
//   2. Calcular o teto dinâmico (evita valores absurdos)
//   3. Se Gemini está dentro da faixa saudável → aceita sem alteração
//   4. Se Gemini está abaixo do piso → ignora Gemini, usa subtotal da engine
//   5. Se Gemini está acima do piso mas abaixo do subtotal → puxa suavemente para cima
//   6. Se Gemini está acima do subtotal (mercado justifica) → aceita com suavização leve
//   7. Se Gemini está acima do teto → limita no teto
//   8. Aplica perfil da assistência
//   9. Aplica piso e teto finais como garantia absoluta

export interface ValidacaoInput {
  /** Preço sugerido pelo Gemini */
  precoGemini:  number;
  /** Subtotal técnico calculado pela engine */
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

  // ── Piso técnico inegociável ───────────────────────────────────────────────
  // Representa o mínimo que a operação precisa gerar para ser sustentável.
  // O Gemini NUNCA pode perfurar esse valor, independente do que sugerir.
  const pisoAbsoluto = partCost > 0
    ? round2((partCost * (1 + categoria.margemMinimaPct)) + maoDeObraBase("Baixa"))
    : round2(subtotal * 0.70);

  // ── Teto dinâmico ──────────────────────────────────────────────────────────
  // Baseado no valor do aparelho — evita orçamentos absurdos.
  // Um reparo dificilmente deve custar mais que 35% do valor do aparelho,
  // exceto em casos extremos de microsolda em premium.
  const tetoDinamico = round2(
    Math.max(subtotal * 3.0, marketValue * 0.35)
  );

  // ── Faixa de equilíbrio ────────────────────────────────────────────────────
  // Zona onde o preço da engine e o mercado estão alinhados.
  // Ampliada para dar mais espaço ao mercado premium (era 85%–130%).
  const faixaMin = round2(subtotal * 0.82);  // 18% abaixo do subtotal técnico
  const faixaMax = round2(subtotal * 1.55);  // 55% acima (mercado premium justifica)

  let precoFinal: number;

  // ── Regra 1: Gemini abaixo do piso técnico ────────────────────────────────
  // O Gemini errou (ou não conhece o contexto real).
  // Descarta a sugestão integralmente — usa o subtotal técnico como base.
  // Não existe ponderação: dar qualquer peso a um valor ruim contamina o resultado.
  if (precoGemini < pisoAbsoluto) {
    precoFinal = subtotal;
  }

  // ── Regra 2: Gemini dentro da faixa de equilíbrio ────────────────────────
  // Gemini e engine concordam — o preço é válido e representa o mercado.
  // Mantém sem qualquer alteração.
  else if (precoGemini >= faixaMin && precoGemini <= faixaMax) {
    precoFinal = precoGemini;
  }

  // ── Regra 3: Gemini acima do piso mas abaixo da faixa mínima ─────────────
  // Gemini está baixo, mas não tecnicamente inviável.
  // Puxa suavemente para cima, priorizando o subtotal da engine.
  // O Gemini recebe apenas 20% de influência — suficiente para sinalizar
  // que o mercado está um pouco abaixo, sem comprometer a margem.
  else if (precoGemini >= pisoAbsoluto && precoGemini < faixaMin) {
    precoFinal = round2((precoGemini * 0.20) + (subtotal * 0.80));
  }

  // ── Regra 4: Gemini acima da faixa máxima ────────────────────────────────
  // O mercado justifica valores maiores (especialmente em aparelhos premium).
  // Aceita com suavização: dá peso maior ao Gemini para não desperdiçar
  // a inteligência de mercado, mas ancora no subtotal técnico.
  // Para Ultra Premium e Premium: suavização menor (mercado tem mais peso).
  // Para outros: suavização maior (precaução).
  else {
    const isPremium = categoria.nome === "Ultra Premium" || categoria.nome === "Premium";
    if (isPremium) {
      // 65% Gemini + 35% faixaMax — aceita com confiança em aparelhos premium
      precoFinal = round2((precoGemini * 0.65) + (faixaMax * 0.35));
    } else {
      // 40% Gemini + 60% faixaMax — mais conservador em aparelhos comuns
      precoFinal = round2((precoGemini * 0.40) + (faixaMax * 0.60));
    }
  }

  // ── Aplica perfil da assistência ──────────────────────────────────────────
  precoFinal = round2(precoFinal * multiplicadorPerfil(perfil));

  // ── Aplica piso e teto como garantia absoluta final ───────────────────────
  precoFinal = Math.max(precoFinal, pisoAbsoluto);
  precoFinal = Math.min(precoFinal, tetoDinamico);

  return Math.round(precoFinal);
}

// ─── Utilitário interno ────────────────────────────────────────────────────────

/** Arredonda para 2 casas decimais sem erro de ponto flutuante */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}