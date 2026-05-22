"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    async function loadData() {
      try {
        const [devicesData, repairsData] = await Promise.all([
          getDeviceModels(),
          getRepairTypes(),
        ]);
        setDevices(
          devicesData.map((d: any) => ({ ...d, marketValue: Number(d.marketValue) }))
        );
        setRepairs(repairsData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Falha ao carregar aparelhos/serviços. Verifique o banco de dados.");
      }
    }
    loadData();
  }, []);

  // Motor de precificação ao vivo
  let liveSuggestedPrice = 0;
  let riskValue = 0;
  let maoDeObra = 0;

  if (selectedDevice && selectedRepair) {
    maoDeObra = 100;
    if (selectedRepair.difficulty === "Média") maoDeObra = 160;
    if (selectedRepair.difficulty === "Alta") maoDeObra = 250;
    if (selectedRepair.difficulty === "Muito Alta") maoDeObra = 450;

    const riskRate = selectedDevice.marketValue > 5000 ? 0.06 : 0.04;
    riskValue = selectedDevice.marketValue * riskRate;
    liveSuggestedPrice = maoDeObra + (Number(partCost) || 0) + riskValue;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedDevice || !selectedRepair) {
      setError("Selecione um aparelho e um serviço nas sugestões.");
      return;
    }

    // ✅ CORREÇÃO: pega shopId da sessão real do usuário logado
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
    };

    try {
      await createServiceOrderWithPricing(data, shopId);
      router.push("/painel");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao criar Ordem de Serviço. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white">
      <div className="max-w-2xl mx-auto bg-zinc-950 p-8 rounded-2xl border border-zinc-900 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 border-b border-zinc-900 pb-4">
          Nova Ordem de Serviço
        </h1>

        {/* ✅ Mostra erros claramente ao usuário */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium">Nome do Cliente</label>
              <Input name="name" className="bg-zinc-900 border-zinc-800" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium">WhatsApp</label>
              <Input name="phone" className="bg-zinc-900 border-zinc-800" required />
            </div>
          </div>

          {/* APARELHO */}
          <div className="space-y-2 relative">
            <label className="text-xs text-zinc-500 font-medium">Buscar Aparelho</label>
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
                  <li className="p-3 text-sm text-zinc-500">Carregando aparelhos...</li>
                )}
                {devices.length > 0 &&
                  devices
                    .filter(
                      (d) =>
                        d.model.toLowerCase().includes(searchDevice.toLowerCase()) ||
                        d.brand.toLowerCase().includes(searchDevice.toLowerCase())
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
            <label className="text-xs text-zinc-500 font-medium">Serviço Solicitado</label>
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
                  <li className="p-3 text-sm text-zinc-500">Carregando serviços...</li>
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

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 font-medium">Custo da Peça (R$)</label>
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

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 font-medium">Observações</label>
            <Textarea
              name="defectDescription"
              className="bg-zinc-900 border-zinc-800 h-20"
            />
          </div>

          {/* PAINEL DE PREÇO AO VIVO */}
          {selectedDevice && selectedRepair && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl space-y-2 mt-6">
              <h3 className="text-emerald-500 font-bold mb-2">Resumo do Orçamento Sugerido</h3>
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
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-emerald-500/30 mt-2">
                <span>Preço Final Sugerido:</span>
                <span className="text-emerald-400">R$ {liveSuggestedPrice.toFixed(2)}</span>
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