"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createServiceOrderWithPricing } from "@/actions/create-os";
import { getDeviceModels, getRepairTypes } from "@/actions/get-devices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Device {
  id: string;
  brand: string;
  model: string;
  marketValue: number;
}

interface Repair {
  id: string;
  category: string;
  name: string;
  difficulty: string;
}

export default function NewOSPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);

  const [searchDevice, setSearchDevice] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);

  const [searchRepair, setSearchRepair] = useState("");
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [showRepairSuggestions, setShowRepairSuggestions] = useState(false);

  const [partCost, setPartCost] = useState<string>("");

  // ── Desconto ──────────────────────────────────────────────────────────────
  const [discountType, setDiscountType] = useState<"%" | "R$">("%");
  const [discountValue, setDiscountValue] = useState<string>("");

  // ── Preço ajustado invisível ──────────────────────────────────────────────
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const marketFetchRef = useRef<string>("");

  // ── Carrega aparelhos e serviços ──────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [devicesData, repairsData] = await Promise.all([
          getDeviceModels(),
          getRepairTypes(),
        ]);
        setDevices(
          devicesData.map((d: any) => ({
            ...d,
            marketValue: Number(d.marketValue),
          }))
        );
        setRepairs(repairsData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          "Falha ao carregar aparelhos/serviços. Verifique o banco de dados."
        );
      }
    }
    loadData();
  }, []);

  // ── Motor de precificação ─────────────────────────────────────────────────
  let subtotal = 0;
  let riskValue = 0;
  let maoDeObra = 0;

  if (selectedDevice && selectedRepair) {
    maoDeObra = 100;
    if (selectedRepair.difficulty === "Média") maoDeObra = 160;
    if (selectedRepair.difficulty === "Alta") maoDeObra = 250;
    if (selectedRepair.difficulty === "Muito Alta") maoDeObra = 450;

    const riskRate = selectedDevice.marketValue > 5000 ? 0.06 : 0.04;
    riskValue = selectedDevice.marketValue * riskRate;
    subtotal = maoDeObra + (Number(partCost) || 0) + riskValue;
  }

  // ── Consulta mercado invisível ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDevice || !selectedRepair) {
      setAdjustedPrice(null);
      marketFetchRef.current = "";
      return;
    }

    const key = `${selectedDevice.id}|${selectedRepair.id}|${partCost}`;
    if (key === marketFetchRef.current) return;
    marketFetchRef.current = key;

    // Reseta enquanto busca novo preço
    setAdjustedPrice(null);

    const timer = setTimeout(async () => {
      setFetchingPrice(true);
      try {
        const res = await fetch("/api/market-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device: `${selectedDevice.brand} ${selectedDevice.model}`,
            service: selectedRepair.name,
            partCost: Number(partCost) || 0,
            subtotal,
          }),
        });
        const data = await res.json();
        if (data.success && data.adjustedPrice) {
          setAdjustedPrice(data.adjustedPrice);
        }
      } catch {
        // silencioso — usa subtotal normal como fallback
      } finally {
        setFetchingPrice(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [selectedDevice, selectedRepair, partCost, subtotal]);

  // ── Preço a exibir (ajustado ou subtotal engine como fallback) ────────────
  const displayPrice = adjustedPrice ?? subtotal;

  // ── Desconto sobre o preço exibido ────────────────────────────────────────
  const discountRaw = Number(discountValue) || 0;
  const discountAmount =
    discountType === "%"
      ? Math.min((displayPrice * discountRaw) / 100, displayPrice)
      : Math.min(discountRaw, displayPrice);
  const displayFinal = displayPrice - discountAmount;

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedDevice || !selectedRepair) {
      setError("Selecione um aparelho e um serviço nas sugestões.");
      return;
    }

    const shopId = (session?.user as any)?.shopId;
    if (!shopId) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const data = {
      customer: {
        name: formData.get("name"),
        phone: formData.get("phone"),
      },
      deviceId: selectedDevice.id,
      repairTypeId: selectedRepair.id,
      defectDescription: formData.get("defectDescription"),
      partCost: Number(partCost),
      discountAmount,
      finalPrice: displayFinal,
    };

    try {
      await createServiceOrderWithPricing(data, shopId);
      router.push("/painel");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Erro ao criar Ordem de Serviço. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-8 text-white">
      <div className="max-w-2xl mx-auto bg-zinc-950 p-6 md:p-8 rounded-2xl border border-zinc-900 shadow-2xl">
      <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
  <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
  <button
    type="button"
    onClick={() => router.push("/painel")}
    className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
    title="Cancelar e voltar"
  >
    ✕
  </button>
</div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CLIENTE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium">
                Nome do Cliente
              </label>
              <Input
                name="name"
                className="bg-zinc-900 border-zinc-800"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium">
                WhatsApp
              </label>
              <Input
                name="phone"
                className="bg-zinc-900 border-zinc-800"
                required
              />
            </div>
          </div>

          {/* APARELHO */}
          <div className="space-y-2 relative">
            <label className="text-xs text-zinc-500 font-medium">
              Buscar Aparelho
            </label>
            <Input
              placeholder="Digite e CLIQUE na sugestão..."
              className="bg-zinc-900 border-zinc-800"
              value={searchDevice}
              onChange={(e) => {
                setSearchDevice(e.target.value);
                setShowDeviceSuggestions(true);
                if (selectedDevice) setSelectedDevice(null);
              }}
              onFocus={() => setShowDeviceSuggestions(true)}
            />
            {selectedDevice && (
              <div className="text-sm text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20">
                ✅ Confirmado: {selectedDevice.brand} {selectedDevice.model}
              </div>
            )}
            {showDeviceSuggestions && searchDevice && !selectedDevice && (
              <ul className="absolute z-20 w-full bg-zinc-800 border border-zinc-700 mt-1 max-h-48 overflow-y-auto rounded shadow-2xl">
                {devices.length === 0 && (
                  <li className="p-3 text-sm text-zinc-500">
                    Carregando aparelhos...
                  </li>
                )}
                {devices
                  .filter(
                    (d) =>
                      d.model
                        .toLowerCase()
                        .includes(searchDevice.toLowerCase()) ||
                      d.brand
                        .toLowerCase()
                        .includes(searchDevice.toLowerCase())
                  )
                  .map((d) => (
                    <li
                      key={d.id}
                      className="p-3 hover:bg-blue-600 cursor-pointer text-sm"
                      onMouseDown={() => {
                        setSearchDevice(`${d.brand} ${d.model}`);
                        setSelectedDevice(d);
                        setShowDeviceSuggestions(false);
                      }}
                    >
                      {d.brand} {d.model}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* SERVIÇO */}
          <div className="space-y-2 relative">
            <label className="text-xs text-zinc-500 font-medium">
              Serviço Solicitado
            </label>
            <Input
              placeholder="Digite e CLIQUE na sugestão..."
              className="bg-zinc-900 border-zinc-800"
              value={searchRepair}
              onChange={(e) => {
                setSearchRepair(e.target.value);
                setShowRepairSuggestions(true);
                if (selectedRepair) setSelectedRepair(null);
              }}
              onFocus={() => setShowRepairSuggestions(true)}
            />
            {selectedRepair && (
              <div className="text-sm text-blue-500 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                🛠️ Confirmado: {selectedRepair.name}
              </div>
            )}
            {showRepairSuggestions && searchRepair && !selectedRepair && (
              <ul className="absolute z-10 w-full bg-zinc-800 border border-zinc-700 mt-1 max-h-48 overflow-y-auto rounded shadow-2xl">
                {repairs.length === 0 && (
                  <li className="p-3 text-sm text-zinc-500">
                    Carregando serviços...
                  </li>
                )}
                {repairs
                  .filter((r) =>
                    r.name.toLowerCase().includes(searchRepair.toLowerCase())
                  )
                  .map((r) => (
                    <li
                      key={r.id}
                      className="p-3 hover:bg-blue-600 cursor-pointer text-sm"
                      onMouseDown={() => {
                        setSearchRepair(r.name);
                        setSelectedRepair(r);
                        setShowRepairSuggestions(false);
                      }}
                    >
                      {r.name}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* CUSTO DA PEÇA */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 font-medium">
              Custo da Peça (R$)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="bg-zinc-900 border-zinc-800"
              value={partCost}
              onChange={(e) => setPartCost(e.target.value)}
              required
            />
          </div>

          {/* OBSERVAÇÕES */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 font-medium">
              Observações
            </label>
            <Textarea
              name="defectDescription"
              className="bg-zinc-900 border-zinc-800 h-20"
            />
          </div>

          {/* PAINEL DE PREÇO AO VIVO */}
          {selectedDevice && selectedRepair && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl space-y-2 mt-6">
              <h3 className="text-emerald-500 font-bold mb-2">
                Resumo do Orçamento Sugerido
              </h3>

              <div className="flex justify-between text-sm text-zinc-400">
                <span>Mão de obra ({selectedRepair.difficulty}):</span>
                <span>R$ {maoDeObra.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Taxa de Risco do Aparelho:</span>
                <span>R$ {riskValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Custo da Peça:</span>
                <span>R$ {(Number(partCost) || 0).toFixed(2)}</span>
              </div>

              {/* Desconto */}
              <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                <label className="text-xs text-zinc-500 font-medium">
                  Desconto (opcional)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
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

              {/* Preço final */}
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-emerald-500/30 mt-2">
                <span>
                  Preço Final{discountAmount > 0 ? " (c/ desconto)" : ""}:
                </span>
                <span className="text-emerald-400 flex items-center gap-2">
                  {fetchingPrice && (
                    <span className="text-xs text-zinc-500 font-normal animate-pulse">
                      calculando...
                    </span>
                  )}
                  R$ {displayFinal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !selectedDevice || !selectedRepair}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold mt-4"
          >
            {loading ? "Processando..." : "Gerar OS com este Orçamento"}
          </Button>
        </form>
      </div>
    </div>
  );
}