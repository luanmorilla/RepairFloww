"use client";

import { useEffect, useState } from "react";
import { getOsList, concluirOS, getOsById } from "@/actions/os-actions";
import { CheckCircle, FileDown } from "lucide-react";
import { gerarPdfOS } from "@/lib/pdf-os";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECEIVED:          { label: "Recebido",       color: "bg-zinc-800 text-zinc-300" },
  DIAGNOSING:        { label: "Diagnóstico",    color: "bg-yellow-900 text-yellow-300" },
  AWAITING_APPROVAL: { label: "Ag. Aprovação",  color: "bg-orange-900 text-orange-300" },
  APPROVED:          { label: "Aprovado",       color: "bg-blue-900 text-blue-300" },
  IN_REPAIR:         { label: "Em Reparo",      color: "bg-purple-900 text-purple-300" },
  READY:             { label: "Pronto",         color: "bg-green-900 text-green-300" },
  DELIVERED:         { label: "Entregue",       color: "bg-zinc-700 text-zinc-400" },
  CANCELED:          { label: "Cancelado",      color: "bg-red-900 text-red-400" },
};

export function OsTable({ shopId }: { shopId: string }) {
  const [osList, setOsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [concluindo, setConcluindo] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await getOsList(shopId);
      setOsList(data || []);
    } catch (err) {
      console.error("Erro ao buscar OS:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (shopId) load();
  }, [shopId]);

  async function handleConcluir(id: string) {
    if (!confirm("Confirmar conclusão desta OS?")) return;
    setConcluindo(id);
    try {
      await concluirOS(id, shopId);
      await load();
    } catch {
      alert("Erro ao concluir OS.");
    } finally {
      setConcluindo(null);
    }
  }

  async function handleDownloadPdf(id: string) {
    setBaixando(id);
    try {
      const os = await getOsById(id);
      if (!os) return alert("OS não encontrada.");
      await gerarPdfOS(os);
    } catch {
      alert("Erro ao gerar PDF.");
    } finally {
      setBaixando(null);
    }
  }

  if (loading) return <div className="p-4 text-zinc-500 text-sm">Carregando ordens...</div>;

  if (osList.length === 0)
    return (
      <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
        Nenhuma OS encontrada para esta loja.
      </div>
    );

  return (
    <>
      {/* ── CARDS — mobile ── */}
      <div className="md:hidden space-y-3">
        {osList.map((os) => {
          const st = STATUS_LABELS[os.status] ?? { label: os.status, color: "bg-zinc-800 text-zinc-300" };
          const podeConcluir = !["DELIVERED", "CANCELED"].includes(os.status);
          return (
            <div key={os.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
              {/* Linha 1: número + status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-zinc-400 text-sm font-bold">
                  #{String(os.orderNumber).padStart(4, "0")}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                  {st.label}
                </span>
              </div>

              {/* Linha 2: cliente + aparelho */}
              <div>
                <p className="text-zinc-100 font-semibold text-sm">{os.customer?.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {os.device?.brand} {os.device?.model}
                </p>
              </div>

              {/* Linha 3: valor + data */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-300 font-bold">
                  R$ {(os.totalPrice || 0).toFixed(2)}
                </span>
                <span className="text-zinc-600 text-xs">
                  {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>

              {/* Linha 4: ações */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleDownloadPdf(os.id)}
                  disabled={baixando === os.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FileDown size={15} />
                  {baixando === os.id ? "Gerando..." : "PDF"}
                </button>

                {podeConcluir && (
                  <button
                    onClick={() => handleConcluir(os.id)}
                    disabled={concluindo === os.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-900 hover:bg-green-800 text-green-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={15} />
                    {concluindo === os.id ? "..." : "Concluir"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TABELA — desktop ── */}
      <div className="hidden md:block overflow-x-auto border border-zinc-900 rounded-2xl bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Aparelho</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {osList.map((os) => {
              const st = STATUS_LABELS[os.status] ?? { label: os.status, color: "bg-zinc-800 text-zinc-300" };
              const podeConcluir = !["DELIVERED", "CANCELED"].includes(os.status);
              return (
                <tr key={os.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-400">
                    #{String(os.orderNumber).padStart(4, "0")}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-100">{os.customer?.name}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {os.device?.brand} {os.device?.model}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    R$ {(os.totalPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadPdf(os.id)}
                        disabled={baixando === os.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors disabled:opacity-50"
                      >
                        <FileDown size={14} />
                        {baixando === os.id ? "..." : "PDF"}
                      </button>
                      {podeConcluir && (
                        <button
                          onClick={() => handleConcluir(os.id)}
                          disabled={concluindo === os.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-900 hover:bg-green-800 text-green-300 text-xs transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          {concluindo === os.id ? "..." : "Concluir"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
