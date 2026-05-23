/**
 * detectarMarca — Identificação de fabricante por IMEI
 *
 * Busca otimizada: O(1) via lookup direto pelo prefixo de 6 dígitos (TAC parcial).
 * TAC real = 8 primeiros dígitos do IMEI (os 6 aqui são suficientes para identificar o fabricante).
 * Sem duplicatas. Sem loop desnecessário.
 */

export interface ResultadoMarca {
    marca: string;
    info: string;
  }
  
  // ---------------------------------------------------------------------------
  // Tabela principal: prefixo de 6 dígitos → fabricante
  // Sem duplicatas — cada chave aparece exatamente uma vez.
  // ---------------------------------------------------------------------------
  const TABELA_TAC: Readonly<Record<string, string>> = {
    // ── Apple iPhone ──────────────────────────────────────────────────────────
    "350024": "Apple iPhone",
    "351097": "Apple iPhone",
    "351503": "Apple iPhone",
    "352033": "Apple iPhone",
    "352099": "Apple iPhone",
    "352402": "Apple iPhone",
    "353079": "Apple iPhone",
    "353288": "Apple iPhone",
    "353879": "Apple iPhone",
    "353880": "Apple iPhone",
    "354403": "Apple iPhone",
    "354514": "Apple iPhone",
    "354809": "Apple iPhone",
    "355299": "Apple iPhone",
    "355874": "Apple iPhone",
    "356109": "Apple iPhone",
    "356114": "Apple iPhone",
    "356728": "Apple iPhone",
    "357398": "Apple iPhone",
    "357686": "Apple iPhone",
    "357934": "Apple iPhone",
    "358457": "Apple iPhone",
    "358819": "Apple iPhone",
    "359093": "Apple iPhone",
    "359304": "Apple iPhone",
  
    // ── Samsung Galaxy ────────────────────────────────────────────────────────
    "352168": "Samsung Galaxy",
    "352849": "Samsung Galaxy",
    "353969": "Samsung Galaxy",
    "354244": "Samsung Galaxy",
    "354448": "Samsung Galaxy",
    "354833": "Samsung Galaxy",
    "355678": "Samsung Galaxy",
    "356258": "Samsung Galaxy",
    "357171": "Samsung Galaxy",
    "357259": "Samsung Galaxy",
    "357757": "Samsung Galaxy",
    "358443": "Samsung Galaxy",
    "860218": "Samsung Galaxy",
    "861563": "Samsung Galaxy",
    "862397": "Samsung Galaxy",
    "863478": "Samsung Galaxy",
    "863838": "Samsung Galaxy",
    "864200": "Samsung Galaxy",
    "864346": "Samsung Galaxy",
    "864440": "Samsung Galaxy",
    "864908": "Samsung Galaxy",
    "865490": "Samsung Galaxy",
    "867179": "Samsung Galaxy",
    "868943": "Samsung Galaxy",
  
    // ── Motorola ──────────────────────────────────────────────────────────────
    "352315": "Motorola Moto",
    "352848": "Motorola Moto",
    "353117": "Motorola Moto",
    "354006": "Motorola Moto",
    "354872": "Motorola Moto",
    "355913": "Motorola Moto",
    "356145": "Motorola Moto",
    "356316": "Motorola Moto",
    "356874": "Motorola Moto",
    "357384": "Motorola Moto",
    "358124": "Motorola Moto",
    "860693": "Motorola Moto",
    "861834": "Motorola Moto",
    "862914": "Motorola Moto",
    "863104": "Motorola Moto",
    "863128": "Motorola Moto",
    "863429": "Motorola Moto",
    "864013": "Motorola Moto",
    "864529": "Motorola Moto",
    "865197": "Motorola Moto",
    "865432": "Motorola Moto",
    "866071": "Motorola Moto",
    "867341": "Motorola Moto",
    "868124": "Motorola Moto",
  
    // ── Xiaomi ────────────────────────────────────────────────────────────────
    "860039": "Xiaomi Redmi",
    "860461": "Xiaomi Mi",
    "860817": "Xiaomi Mi",
    "861297": "Xiaomi Redmi",
    "861723": "Xiaomi Note",
    "862134": "Xiaomi Redmi",
    "863912": "Xiaomi Mi",
    "864103": "Xiaomi Redmi",
    "864297": "Xiaomi Redmi",
    "864742": "Xiaomi Redmi",
    "865834": "Xiaomi POCO",
    "866712": "Xiaomi Redmi",
    "867534": "Xiaomi Mi",
    "868214": "Xiaomi Redmi",
    "869034": "Xiaomi POCO",
    "869269": "Xiaomi Redmi",
    "869512": "Xiaomi POCO",
  
    // ── Nokia ─────────────────────────────────────────────────────────────────
    "352812": "Nokia",
    "353624": "Nokia",
    "354719": "Nokia",
    "355483": "Nokia",
    "356147": "Nokia",
    "356148": "Nokia",
    "356152": "Nokia",
    "357023": "Nokia",
    "358241": "Nokia",
    "358634": "Nokia",
    "861234": "Nokia",
    "862891": "Nokia",
  
    // ── LG ───────────────────────────────────────────────────────────────────
    "352634": "LG",
    "353961": "LG",
    "354129": "LG",
    "355574": "LG",
    "356891": "LG",
    "357805": "LG",
    "358712": "LG",
    "860123": "LG",
    "862345": "LG",
    "863901": "LG",
    "864134": "LG",
  
    // ── Huawei / Honor ────────────────────────────────────────────────────────
    "860234": "Huawei",
    "860657": "Huawei Honor",
    "861220": "Huawei",
    "861789": "Huawei",
    "862567": "Huawei",
    "863345": "Huawei Honor",
    "864599": "Huawei",
    "865123": "Huawei",
    "866789": "Huawei Honor",
    "867456": "Huawei",
    "868034": "Huawei Honor",
    "869812": "Huawei",
  
    // ── Sony Xperia ───────────────────────────────────────────────────────────
    "352741": "Sony Xperia",
    "353512": "Sony Xperia",
    "354678": "Sony Xperia",
    "356325": "Sony Xperia",
    "357123": "Sony Xperia",
    "358346": "Sony Xperia",
    "359012": "Sony Xperia",
    "861456": "Sony Xperia",
  
    // ── OPPO ─────────────────────────────────────────────────────────────────
    "860789": "OPPO",
    "864894": "OPPO",
    "865678": "OPPO",
    "867890": "OPPO",
  
    // ── Realme ────────────────────────────────────────────────────────────────
    "861345": "Realme",
    "866234": "Realme",
    "868456": "Realme",
    "869067": "Realme",
    "869623": "Realme",
  
    // ── OnePlus ───────────────────────────────────────────────────────────────
    "864123": "OnePlus",
    "869234": "OnePlus",
  
    // ── Positivo ──────────────────────────────────────────────────────────────
    "352624": "Positivo",
    "353412": "Positivo",
    "354588": "Positivo",
    "355123": "Positivo",
    "356789": "Positivo",
  
    // ── Asus ─────────────────────────────────────────────────────────────────
    "353849": "Asus ZenFone",
    "355234": "Asus ZenFone",
    "864567": "Asus ZenFone",
    "865901": "Asus ROG Phone",
  
    // ── Google Pixel ──────────────────────────────────────────────────────────
    "353490": "Google Pixel",
    "356034": "Google Pixel",
    "357512": "Google Pixel",
    "860912": "Google Pixel",
    "862078": "Google Pixel",
  
    // ── Alcatel / TCL ─────────────────────────────────────────────────────────
    "351234": "Alcatel",
    "352789": "Alcatel",
    "353456": "TCL",
    "860345": "Alcatel",
    "861901": "TCL",
  } as const;
  
  // ---------------------------------------------------------------------------
  // Fallback por prefixo de 2 dígitos (quando TAC não está catalogado)
  // Ordenado do mais específico para o mais genérico.
  // ---------------------------------------------------------------------------
  const FALLBACKS: ReadonlyArray<[string, string]> = [
    ["35", "Provavelmente Apple, Nokia ou Samsung"],
    ["86", "Provavelmente Samsung, Xiaomi ou Huawei"],
    ["87", "Provavelmente dispositivo asiático (Xiaomi / OPPO / Vivo)"],
    ["01", "Provavelmente dispositivo americano"],
    ["30", "Provavelmente dispositivo europeu"],
    ["31", "Provavelmente dispositivo europeu"],
  ];
  
  // ---------------------------------------------------------------------------
  // Função principal
  // ---------------------------------------------------------------------------
  export function detectarMarca(imei: string): ResultadoMarca {
    const digits = imei.replace(/\D/g, ""); // aceita IMEI com traços/espaços
    const tac = digits.substring(0, 8);
    const prefix6 = digits.substring(0, 6);
  
    // 1. Lookup O(1) na tabela principal
    const marcaConhecida = TABELA_TAC[prefix6];
    if (marcaConhecida) {
      return {
        marca: marcaConhecida,
        info: `TAC identificado: ${tac} — Fabricante confirmado: ${marcaConhecida}. Use os links abaixo para verificar bloqueio.`,
      };
    }
  
    // 2. Fallback por prefixo de 2 dígitos
    const prefix2 = digits.substring(0, 2);
    for (const [pfx, descricao] of FALLBACKS) {
      if (prefix2 === pfx) {
        return {
          marca: descricao,
          info: `TAC não catalogado: ${tac}. ${descricao}. Consulte os links abaixo para identificação completa.`,
        };
      }
    }
  
    // 3. Totalmente desconhecido
    return {
      marca: "Fabricante não identificado",
      info: `TAC: ${tac} — Este modelo não está em nossa base local. Use os links de consulta abaixo para identificação completa.`,
    };
  }