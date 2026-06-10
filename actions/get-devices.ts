/**
 * actions/get-devices.ts
 * Busca o catálogo de aparelhos e serviços.
 *
 * Inclui metadados de busca normalizados para que o frontend possa
 * fazer pesquisa inteligente sem depender de digitação exata.
 */

"use server";

import { prisma } from "@/lib/prisma";

// ─── Aliases de marca ──────────────────────────────────────────────────────────
// Mapeia termos que os usuários digitam para o nome oficial no banco.
// Adicionar novos aliases aqui é suficiente — o frontend usa automaticamente.
// Estrutura: [termoDigitado] → nomeBancoNormalizado

const BRAND_ALIASES: Record<string, string> = {
  // Apple
  "apple":   "Apple",
  "iphone":  "Apple",
  "ios":     "Apple",
  "mac":     "Apple",
  // Samsung
  "samsung": "Samsung",
  "galaxy":  "Samsung",
  "galax":   "Samsung",
  // Motorola
  "moto":    "Motorola",
  "motorola":"Motorola",
  // Xiaomi
  "xiaomi":  "Xiaomi",
  "redmi":   "Xiaomi",
  "poco":    "Xiaomi",
  "mi ":     "Xiaomi",
  // Google
  "google":  "Google",
  "pixel":   "Google",
  // Sony
  "sony":    "Sony",
  "xperia":  "Sony",
  // LG
  "lg":      "LG",
  // OnePlus
  "oneplus": "OnePlus",
  "one plus":"OnePlus",
  // Realme
  "realme":  "Realme",
  // Asus
  "asus":    "Asus",
  "zenfone": "Asus",
  // Huawei
  "huawei":  "Huawei",
  "honor":   "Honor",
};

export interface DeviceModelWithMeta {
  id:          string;
  brand:       string;
  model:       string;
  marketValue: number;
  /** Termos de busca normalizados — usados internamente pelo frontend */
  searchTerms: string[];
}

export async function getDeviceModels(): Promise<DeviceModelWithMeta[]> {
  const devices = await prisma.deviceModel.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  return devices.map((d) => ({
    id:          d.id,
    brand:       d.brand,
    model:       d.model,
    marketValue: Number(d.marketValue),
    // Pré-computa termos de busca normalizados para o frontend
    searchTerms: buildSearchTerms(d.brand, d.model),
  }));
}

export async function getRepairTypes() {
  return await prisma.repairType.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

// ─── Normalização de busca ─────────────────────────────────────────────────────

/**
 * Gera todos os termos pelos quais um aparelho pode ser encontrado.
 * Exemplo: brand="Apple", model="iPhone 12 Pro"
 * → ["apple iphone 12 pro", "iphone 12 pro", "12 pro", "apple", "iphone"]
 */
function buildSearchTerms(brand: string, model: string): string[] {
  const brandNorm = normalize(brand);
  const modelNorm = normalize(model);
  const full      = `${brandNorm} ${modelNorm}`;

  const terms = new Set<string>([
    full,
    modelNorm,
    brandNorm,
  ]);

  // Adiciona aliases da marca como termos de busca
  // Ex: "apple" → também encontra ao digitar "iphone"
  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    if (normalize(canonical) === brandNorm) {
      terms.add(`${normalize(alias)} ${modelNorm}`);
      terms.add(normalize(alias));
    }
  }

  // Adiciona sufixos do modelo para busca parcial
  // Ex: "iphone 12 pro" → também "12 pro", "pro"
  const modelParts = modelNorm.split(" ");
  for (let i = 1; i < modelParts.length; i++) {
    terms.add(modelParts.slice(i).join(" "));
  }

  return Array.from(terms).filter((t) => t.length > 0);
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim();
}

// ─── Utilitário exportado para o frontend ──────────────────────────────────────

/**
 * Resolve um termo digitado pelo usuário para o nome oficial da marca.
 * Ex: "iphone" → "Apple", "galaxy" → "Samsung"
 * Retorna null se não houver alias.
 */
export function resolveAlias(input: string): string | null {
  const key = input.toLowerCase().trim();
  return BRAND_ALIASES[key] ?? null;
}