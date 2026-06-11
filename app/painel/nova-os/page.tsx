"use client";

/**
 * app/(painel)/nova-os/page.tsx
 * Formulário de criação de Ordem de Serviço — RepairFlow
 *
 * Melhorias implementadas:
 *   • Busca inteligente com score de relevância e alias de marca
 *   • Dropdown fecha ao clicar fora (ref + mousedown global)
 *   • AbortController cancela fetches desatualizados (sem race condition)
 *   • Estado sempre consistente ao trocar aparelho/serviço
 *   • Aritmética monetária sem erro de ponto flutuante
 *   • Preço recalculado no servidor (não confia no valor do cliente)
 *   • Acessibilidade: ARIA nos dropdowns, aria-label no botão fechar
 *   • Validação completa antes do submit
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter }    from "next/navigation";
import { useSession }   from "next-auth/react";
import { createServiceOrderWithPricing } from "@/actions/create-os";
import { getDeviceModels, getRepairTypes, type DeviceModelWithMeta } from "@/actions/get-devices";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { calcularPrecoBase } from "@/lib/pricing-engine";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface Repair {
  id:         string;
  category:   string;
  name:       string;
  difficulty: string;
}

type PricingMode = "auto" | "manual";

// ─── Utilitário monetário ──────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Busca com score de relevância ────────────────────────────────────────────

function scoreDevice(device: DeviceModelWithMeta, query: string): number {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!q) return 0;

  const fullName = `${device.brand} ${device.model}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Score máximo: começa exatamente com a query
  if (fullName.startsWith(q)) return 100;

  // Verifica nos termos pré-computados
  for (const term of device.searchTerms) {
    if (term === q)          return 95;  // match exato de um termo
    if (term.startsWith(q)) return 85;  // termo começa com a query
    if (term.includes(q))   return 70;  // query aparece em algum termo
  }

  // Busca palavra por palavra
  const words = q.split(/\s+/).filter(Boolean);
  const matchedWords = words.filter((w) => fullName.includes(w) || device.searchTerms.some((t) => t.includes(w)));
  if (matchedWords.length === words.length) return 60;  // todas as palavras encontradas
  if (matchedWords.length > 0)             return 30;  // pelo menos uma palavra

  return 0;
}

function filterDevices(
  devices: DeviceModelWithMeta[],
  query:   string,
  limit    = 8
): DeviceModelWithMeta[] {
  if (!query.trim()) return [];

  return devices
    .map((d) => ({ device: d, score: scoreDevice(d, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ device }) => device);
}

function filterRepairs(repairs: Repair[], query: string, limit = 8): Repair[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return repairs
    .filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    .slice(0, limit);
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function NewOSPage() {
  const router      = useRouter();
  const { data: session } = useSession();

  // Estado geral
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceModelWithMeta[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);

  // Busca de aparelho
  const [searchDevice,          setSearchDevice]          = useState("");
  const [selectedDevice,        setSelectedDevice]        = useState<DeviceModelWithMeta | null>(null);
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);
  const deviceWrapperRef = useRef<HTMLDivElement>(null);

  // Busca de serviço
  const [searchRepair,          setSearchRepair]          = useState("");
  const [selectedRepair,        setSelectedRepair]        = useState<Repair | null>(null);
  const [showRepairSuggestions, setShowRepairSuggestions] = useState(false);
  const repairWrapperRef = useRef<HTMLDivElement>(null);

  // Custo da peça
  const [partCost, setPartCost] = useState<string>("0");

  // Desconto
  const [discountType,  setDiscountType]  = useState<"%" | "R$">("%");
  const [discountValue, setDiscountValue] = useState<string>("");

  // Precificação automática
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const marketFetchRef  = useRef<string>("");
  const abortRef        = useRef<AbortController | null>(null);

  // Modo de precificação
  const [pricingMode, setPricingMode] = useState<PricingMode>("auto");
  const [manualPrice, setManualPrice] = useState<string>("");

  // Edição do valor automático
  const [editingAutoPrice, setEditingAutoPrice] = useState(false);
  const [editedAutoPrice,  setEditedAutoPrice]  = useState<string>("");

  // ── Carrega dados iniciais ─────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      try {
        const [devicesData, repairsData] = await Promise.all([
          getDeviceModels(),
          getRepairTypes(),
        ]);
        setDevices(devicesData);
        setRepairs(repairsData as Repair[]);
      } catch {
        setError("Falha ao carregar aparelhos/serviços. Verifique a conexão.");
      }
    }
    loadData();
  }, []);

  // ── Fecha dropdowns ao clicar fora ────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!deviceWrapperRef.current?.contains(e.target as Node)) {
        setShowDeviceSuggestions(false);
      }
      if (!repairWrapperRef.current?.contains(e.target as Node)) {
        setShowRepairSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Engine de precificação (cálculo local) ────────────────────────────────

  const engineResult = selectedDevice && selectedRepair
    ? calcularPrecoBase({
        marketValue: selectedDevice.marketValue,
        difficulty:  selectedRepair.difficulty,
        partCost:    Number(partCost) || 0,
      })
    : null;

  const maoDeObra            = engineResult?.maoDeObra            ?? 0;
  const taxaRisco            = engineResult?.taxaRisco            ?? 0;
  const taxaResponsabilidade = engineResult?.taxaResponsabilidade ?? 0;
  const subtotal             = engineResult?.subtotal             ?? 0;
  const categoria            = engineResult?.categoriaAparelho    ?? "";

  // ── Consulta de mercado — com AbortController ─────────────────────────────

  useEffect(() => {
    if (pricingMode === "manual" || !selectedDevice || !selectedRepair) {
      setAdjustedPrice(null);
      marketFetchRef.current = "";
      return;
    }

    const key = `${selectedDevice.id}|${selectedRepair.id}|${partCost}`;
    if (key === marketFetchRef.current) return;
    marketFetchRef.current = key;

    setAdjustedPrice(null);

    const timer = setTimeout(async () => {
      // Cancela fetch anterior se ainda estiver em andamento
      abortRef.current?.abort();
      const controller      = new AbortController();
      abortRef.current      = controller;

      setFetchingPrice(true);
      try {
        const res = await fetch("/api/market-price", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          signal:  controller.signal,
          body: JSON.stringify({
            device:      `${selectedDevice.brand} ${selectedDevice.model}`,
            service:     selectedRepair.name,
            partCost:    Number(partCost) || 0,
            subtotal,
            marketValue: selectedDevice.marketValue,
          }),
        });

        const data = await res.json();
        if (data.success && data.adjustedPrice) {
          setAdjustedPrice(data.adjustedPrice);
          setEditingAutoPrice(false);
          setEditedAutoPrice("");
        }
      } catch (err: unknown) {
        // AbortError é esperado — não é um erro real
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("[market-price] Fetch falhou, usando subtotal da engine.");
        }
      } finally {
        setFetchingPrice(false);
      }
    }, 900);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [selectedDevice, selectedRepair, partCost, subtotal, pricingMode]);

  // ── Preços derivados ──────────────────────────────────────────────────────

  // Base do preço automático (Gemini ou subtotal da engine como fallback)
  const autoBasePrice = adjustedPrice ?? subtotal;

  // Preço exibido (com possível edição manual no modo auto)
  const displayPrice = editingAutoPrice
    ? (Number(editedAutoPrice) || autoBasePrice)
    : autoBasePrice;

  // Desconto com proteção de ponto flutuante
  const discountRaw    = Number(discountValue) || 0;
  const discountAmount = round2(
    discountType === "%"
      ? Math.min(round2((displayPrice * discountRaw) / 100), displayPrice)
      : Math.min(discountRaw, displayPrice)
  );
  const displayFinal = round2(displayPrice - discountAmount);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const clearDeviceState = useCallback(() => {
    setSelectedDevice(null);
    setAdjustedPrice(null);
    setEditingAutoPrice(false);
    setEditedAutoPrice("");
    setDiscountValue("");
    marketFetchRef.current = "";
  }, []);

  const clearRepairState = useCallback(() => {
    setSelectedRepair(null);
    setAdjustedPrice(null);
    setEditingAutoPrice(false);
    setEditedAutoPrice("");
    marketFetchRef.current = "";
  }, []);

  function handlePricingModeChange(mode: PricingMode) {
    setPricingMode(mode);
    setEditingAutoPrice(false);
    setEditedAutoPrice("");
    setDiscountValue("");
    if (mode === "manual") {
      setAdjustedPrice(null);
      abortRef.current?.abort();
      marketFetchRef.current = "";
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedDevice || !selectedRepair) {
      setError("Selecione um aparelho e um serviço na lista de sugestões.");
      return;
    }
    if (pricingMode === "manual" && (!manualPrice || Number(manualPrice) <= 0)) {
      setError("Informe um valor válido para o serviço no modo manual.");
      return;
    }

    const shopId = (session?.user as { shopId?: string })?.shopId;
    if (!shopId) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    // Valida telefone — formato básico BR
    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 11) {
      setError("Informe um número de WhatsApp válido (10 ou 11 dígitos).");
      return;
    }

    setLoading(true);
    try {
      await createServiceOrderWithPricing(
        {
          customer: {
            name: String(formData.get("customerName") ?? ""),
            phone: String(formData.get("phone") ?? ""),
          },
          deviceId:          selectedDevice.id,
          repairTypeId:      selectedRepair.id,
          defectDescription: String(formData.get("defectDescription") ?? "").trim(),
          partCost:          Number(partCost) || 0,
          pricingMode,
          manualPrice:       pricingMode === "manual" ? Number(manualPrice) : null,
          discountAmount,
          finalPrice:        displayFinal,
        },
        shopId
      );
      router.push("/painel");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar OS. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const showPricePanel = Boolean(selectedDevice && selectedRepair);

  // ─── Sugestões filtradas ───────────────────────────────────────────────────

  const deviceSuggestions = filterDevices(devices, searchDevice);
  const repairSuggestions = filterRepairs(repairs, searchRepair);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-8 text-white">
      <div className="max-w-2xl mx-auto bg-zinc-950 p-6 md:p-8 rounded-2xl border border-zinc-900 shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
          <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
          <button
            type="button"
            aria-label="Cancelar e voltar ao painel"
            onClick={() => router.push("/painel")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* CLIENTE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs text-zinc-500 font-medium">
                Nome do Cliente
              </label>
              <Input
                id="name"
                name="name"
                autoComplete="off"
                className="bg-zinc-900 border-zinc-800"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs text-zinc-500 font-medium">
                WhatsApp
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                className="bg-zinc-900 border-zinc-800"
                required
              />
            </div>
          </div>

          {/* BUSCA DE APARELHO */}
          <div ref={deviceWrapperRef} className="space-y-2 relative">
            <label htmlFor="device-search" className="text-xs text-zinc-500 font-medium">
              Buscar Aparelho
            </label>
            <Input
              id="device-search"
              role="combobox"
              aria-expanded={showDeviceSuggestions && deviceSuggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="device-listbox"
              placeholder='Ex: "iPhone 12", "Galaxy A54", "Moto G"...'
              className="bg-zinc-900 border-zinc-800"
              value={searchDevice}
              autoComplete="off"
              onChange={(e) => {
                setSearchDevice(e.target.value);
                setShowDeviceSuggestions(true);
                if (selectedDevice) clearDeviceState();
              }}
              onFocus={() => {
                if (!selectedDevice) setShowDeviceSuggestions(true);
              }}
            />

            {/* Aparelho selecionado */}
            {selectedDevice && (
              <div className="text-sm text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20 flex items-center justify-between">
                <span>
                  ✅ {selectedDevice.brand} {selectedDevice.model}
                </span>
                <div className="flex items-center gap-2">
                  {categoria && (
                    <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {categoria}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Trocar aparelho"
                    onClick={() => {
                      clearDeviceState();
                      setSearchDevice("");
                      setShowDeviceSuggestions(false);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                  >
                    trocar
                  </button>
                </div>
              </div>
            )}

            {/* Dropdown de sugestões */}
            {showDeviceSuggestions && !selectedDevice && searchDevice.trim() && (
              <ul
                id="device-listbox"
                role="listbox"
                aria-label="Aparelhos encontrados"
                className="absolute z-20 w-full bg-zinc-800 border border-zinc-700 mt-1 max-h-56 overflow-y-auto rounded-lg shadow-2xl"
              >
                {devices.length === 0 ? (
                  <li className="p-3 text-sm text-zinc-500">Carregando aparelhos...</li>
                ) : deviceSuggestions.length === 0 ? (
                  <li className="p-3 text-sm text-zinc-500">
                    Nenhum aparelho encontrado para "{searchDevice}"
                  </li>
                ) : (
                  deviceSuggestions.map((d) => (
                    <li
                      key={d.id}
                      role="option"
                      aria-selected={false}
                      className="p-3 hover:bg-blue-600 cursor-pointer text-sm flex items-center justify-between group"
                      onMouseDown={(e) => {
                        e.preventDefault(); // evita blur antes do click
                        setSearchDevice(`${d.brand} ${d.model}`);
                        setSelectedDevice(d);
                        setShowDeviceSuggestions(false);
                      }}
                    >
                      <span>
                        <span className="font-medium text-white">{d.brand}</span>
                        {" "}
                        <span className="text-zinc-300">{d.model}</span>
                      </span>
                      <span className="text-xs text-zinc-500 group-hover:text-blue-200">
                        R$ {d.marketValue.toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* BUSCA DE SERVIÇO */}
          <div ref={repairWrapperRef} className="space-y-2 relative">
            <label htmlFor="repair-search" className="text-xs text-zinc-500 font-medium">
              Serviço Solicitado
            </label>
            <Input
              id="repair-search"
              role="combobox"
              aria-expanded={showRepairSuggestions && repairSuggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="repair-listbox"
              placeholder='Ex: "Troca de tela", "Bateria", "Placa"...'
              className="bg-zinc-900 border-zinc-800"
              value={searchRepair}
              autoComplete="off"
              onChange={(e) => {
                setSearchRepair(e.target.value);
                setShowRepairSuggestions(true);
                if (selectedRepair) clearRepairState();
              }}
              onFocus={() => {
                if (!selectedRepair) setShowRepairSuggestions(true);
              }}
            />

            {/* Serviço selecionado */}
            {selectedRepair && (
              <div className="text-sm text-blue-500 bg-blue-500/10 p-2 rounded border border-blue-500/20 flex items-center justify-between">
                <span>🛠️ {selectedRepair.name}</span>
                <button
                  type="button"
                  aria-label="Trocar serviço"
                  onClick={() => {
                    clearRepairState();
                    setSearchRepair("");
                    setShowRepairSuggestions(false);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                >
                  trocar
                </button>
              </div>
            )}

            {/* Dropdown de sugestões */}
            {showRepairSuggestions && !selectedRepair && searchRepair.trim() && (
              <ul
                id="repair-listbox"
                role="listbox"
                aria-label="Serviços encontrados"
                className="absolute z-10 w-full bg-zinc-800 border border-zinc-700 mt-1 max-h-56 overflow-y-auto rounded-lg shadow-2xl"
              >
                {repairs.length === 0 ? (
                  <li className="p-3 text-sm text-zinc-500">Carregando serviços...</li>
                ) : repairSuggestions.length === 0 ? (
                  <li className="p-3 text-sm text-zinc-500">
                    Nenhum serviço encontrado para "{searchRepair}"
                  </li>
                ) : (
                  repairSuggestions.map((r) => (
                    <li
                      key={r.id}
                      role="option"
                      aria-selected={false}
                      className="p-3 hover:bg-blue-600 cursor-pointer text-sm flex items-center justify-between group"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchRepair(r.name);
                        setSelectedRepair(r);
                        setShowRepairSuggestions(false);
                      }}
                    >
                      <span className="text-zinc-100">{r.name}</span>
                      <span className="text-xs text-zinc-500 group-hover:text-blue-200">
                        {r.difficulty}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* CUSTO DA PEÇA */}
          <div className="space-y-1">
            <label htmlFor="part-cost" className="text-xs text-zinc-500 font-medium">
              Custo da Peça (R$)
            </label>
            <Input
              id="part-cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="bg-zinc-900 border-zinc-800"
              value={partCost}
              onChange={(e) => setPartCost(e.target.value)}
            />
            <p className="text-xs text-zinc-600">
              Digite 0 se o serviço não tiver custo de peça
            </p>
          </div>

          {/* OBSERVAÇÕES */}
          <div className="space-y-1">
            <label htmlFor="defect-desc" className="text-xs text-zinc-500 font-medium">
              Observações
            </label>
            <Textarea
              id="defect-desc"
              name="defectDescription"
              className="bg-zinc-900 border-zinc-800 h-20 resize-none"
              placeholder="Descreva o defeito relatado pelo cliente..."
            />
          </div>

          {/* MODO DE PRECIFICAÇÃO */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
              💰 Precificação
            </p>

            {/* Automática */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="radio"
                  name="pricingMode"
                  value="auto"
                  checked={pricingMode === "auto"}
                  onChange={() => handlePricingModeChange("auto")}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  pricingMode === "auto"
                    ? "border-emerald-500"
                    : "border-zinc-600 group-hover:border-zinc-400"
                }`}>
                  {pricingMode === "auto" && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white leading-tight">Automática</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Precificação Inteligente RepairFlow calcula o valor automaticamente.
                </p>
              </div>
            </label>

            {/* Manual */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="radio"
                  name="pricingMode"
                  value="manual"
                  checked={pricingMode === "manual"}
                  onChange={() => handlePricingModeChange("manual")}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  pricingMode === "manual"
                    ? "border-blue-500"
                    : "border-zinc-600 group-hover:border-zinc-400"
                }`}>
                  {pricingMode === "manual" && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white leading-tight">Manual</p>
                <p className="text-xs text-zinc-500 mt-0.5">Eu vou informar o valor manualmente.</p>

                {pricingMode === "manual" && (
                  <div className="mt-3">
                    <label htmlFor="manual-price" className="text-xs text-zinc-400 font-medium block mb-1">
                      Valor do Serviço
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400 font-medium">R$</span>
                      <Input
                        id="manual-price"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        className="bg-zinc-800 border-zinc-700 focus:border-blue-500 flex-1"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {manualPrice && Number(manualPrice) > 0 && (
                      <p className="text-xs text-blue-400 mt-1.5">
                        Valor definido: R$ {Number(manualPrice).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* PAINEL — MODO AUTOMÁTICO */}
          {showPricePanel && pricingMode === "auto" && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-emerald-500 font-bold text-base">Valor Sugerido</h2>
                {fetchingPrice && (
                  <span className="text-xs text-zinc-500 animate-pulse">calculando...</span>
                )}
              </div>

              {/* Breakdown técnico */}
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Mão de obra ({selectedRepair?.difficulty}):</span>
                <span>R$ {maoDeObra.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Taxa de risco técnico ({categoria}):</span>
                <span>R$ {taxaRisco.toFixed(2)}</span>
              </div>
              {taxaResponsabilidade > 0 && (
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Responsabilidade técnica:</span>
                  <span>R$ {taxaResponsabilidade.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Custo da peça:</span>
                <span>R$ {(Number(partCost) || 0).toFixed(2)}</span>
              </div>

              {/* Desconto */}
              <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                <label className="text-xs text-zinc-500 font-medium">Desconto (opcional)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label={`Tipo de desconto: ${discountType}. Clique para alternar.`}
                    onClick={() => {
                      setDiscountType((prev) => (prev === "%" ? "R$" : "%"));
                      setDiscountValue("");
                    }}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-bold text-zinc-300 transition w-14 shrink-0"
                  >
                    {discountType}
                  </button>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={discountType === "%" ? "100" : undefined}
                    step="0.01"
                    placeholder={discountType === "%" ? "Ex: 10" : "Ex: 50"}
                    className="bg-zinc-900 border-zinc-800 flex-1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                {discountAmount > 0 && (
                  <p className="text-xs text-orange-400">
                    − R$ {discountAmount.toFixed(2)} de desconto aplicado
                  </p>
                )}
              </div>

              {/* Editar valor sugerido */}
              <div className="pt-2 border-t border-emerald-500/20">
                {!editingAutoPrice ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAutoPrice(true);
                      setEditedAutoPrice(autoBasePrice.toFixed(2));
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                  >
                    <span aria-hidden="true">✏️</span>
                    <span>Editar valor sugerido</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="edit-auto-price" className="text-xs text-zinc-400 font-medium block">
                      Ajustar valor sugerido
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">R$</span>
                      <Input
                        id="edit-auto-price"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        className="bg-zinc-900 border-zinc-700 focus:border-emerald-500 flex-1"
                        value={editedAutoPrice}
                        onChange={(e) => setEditedAutoPrice(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAutoPrice(false);
                          setEditedAutoPrice("");
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition px-2 py-1 rounded bg-zinc-800 border border-zinc-700 whitespace-nowrap"
                      >
                        Usar sugerido
                      </button>
                    </div>
                    <p className="text-xs text-amber-400">
                      Valor original: R$ {autoBasePrice.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Preço final */}
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-emerald-500/30">
                <span>Preço Final{discountAmount > 0 ? " (c/ desconto)" : ""}:</span>
                <span className="text-emerald-400">R$ {displayFinal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* PAINEL — MODO MANUAL */}
          {showPricePanel && pricingMode === "manual" && manualPrice && Number(manualPrice) > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Valor do Serviço:</span>
                <span className="text-blue-400">R$ {Number(manualPrice).toFixed(2)}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Valor definido manualmente pelo técnico.
              </p>
            </div>
          )}

          {/* BOTÃO SUBMIT */}
          <Button
            type="submit"
            disabled={
              loading ||
              !selectedDevice ||
              !selectedRepair ||
              (pricingMode === "manual" && (!manualPrice || Number(manualPrice) <= 0))
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 h-12 text-lg font-bold mt-4"
          >
            {loading ? "Processando..." : "Gerar OS com este Orçamento"}
          </Button>

        </form>
      </div>
    </div>
  );
}
