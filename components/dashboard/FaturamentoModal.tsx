"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchFaturamentoDiario } from "@/actions/dashboard-actions";

interface Ponto { date: string; total: number }

interface Props {
  shopId: string;
  totalGeral: number;
  onClose: () => void;
}

const PERIODOS = [7, 15, 30];

export function FaturamentoModal({ shopId, totalGeral, onClose }: Props) {
  const [periodo, setPeriodo] = useState(30);
  const [dados, setDados] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<Ponto | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchFaturamentoDiario(shopId, periodo)
      .then(setDados)
      .finally(() => setLoading(false));
  }, [shopId, periodo]);

  const max = Math.max(...dados.map((d) => d.total), 1);
  const totalPeriodo = dados.reduce((s, d) => s + d.total, 0);
  const diasComVenda = dados.filter((d) => d.total > 0).length;
  const mediaDiaria = diasComVenda > 0 ? totalPeriodo / diasComVenda : 0;

  // Tendência: compara primeira metade vs segunda metade
  const meio = Math.floor(dados.length / 2);
  const primeira = dados.slice(0, meio).reduce((s, d) => s + d.total, 0);
  const segunda = dados.slice(meio).reduce((s, d) => s + d.total, 0);
  const tendencia = segunda > primeira ? "up" : segunda < primeira ? "down" : "flat";

  const formatDate = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };

  const formatVal = (v: number) =>
    v >= 1000
      ? `R$ ${(v / 1000).toFixed(1)}k`
      : `R$ ${v.toFixed(2)}`;

  // Labels do eixo X — mostra só alguns para não poluir
  const labelStep = periodo === 7 ? 1 : periodo === 15 ? 3 : 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Faturamento</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Receita acumulada por dia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 px-5 pt-4">
          {[
            {
              label: `Total (${periodo}d)`,
              value: formatVal(totalPeriodo),
              color: "text-emerald-400",
            },
            {
              label: "Média/dia ativo",
              value: formatVal(mediaDiaria),
              color: "text-white",
            },
            {
              label: "Dias c/ venda",
              value: `${diasComVenda}/${periodo}`,
              color: "text-white",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {c.label}
              </p>
              <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tendência */}
        <div className="px-5 pt-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: tendencia === "up"
                ? "rgba(16,185,129,0.08)"
                : tendencia === "down"
                ? "rgba(239,68,68,0.08)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${tendencia === "up" ? "rgba(16,185,129,0.2)" : tendencia === "down" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
              color: tendencia === "up" ? "#34d399" : tendencia === "down" ? "#f87171" : "rgba(255,255,255,0.4)",
            }}
          >
            {tendencia === "up" && <TrendingUp size={13} />}
            {tendencia === "down" && <TrendingDown size={13} />}
            {tendencia === "flat" && <Minus size={13} />}
            {tendencia === "up" && "Segunda metade do período com faturamento maior — tendência positiva"}
            {tendencia === "down" && "Segunda metade do período com faturamento menor — atenção"}
            {tendencia === "flat" && "Faturamento estável no período"}
          </div>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-2 px-5 pt-4">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: periodo === p ? "#2563eb" : "rgba(255,255,255,0.05)",
                color: periodo === p ? "#fff" : "rgba(255,255,255,0.35)",
                border: periodo === p ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              }}
            >
              {p} dias
            </button>
          ))}
        </div>

        {/* Gráfico */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="relative">
              {/* Tooltip */}
              {hover && (
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium z-10 pointer-events-none whitespace-nowrap"
                  style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                >
                  {formatDate(hover.date)} — <span className="text-emerald-400">{`R$ ${hover.total.toFixed(2)}`}</span>
                </div>
              )}

              {/* Barras */}
              <div className="flex items-end gap-1 h-40" style={{ paddingTop: "28px" }}>
                {dados.map((d, i) => {
                  const pct = max > 0 ? (d.total / max) * 100 : 0;
                  const isHover = hover?.date === d.date;
                  const showLabel = i % labelStep === 0;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end gap-1 h-full cursor-pointer"
                      onMouseEnter={() => setHover(d)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div
                        className="w-full rounded-t-sm transition-all duration-150"
                        style={{
                          height: `${Math.max(pct, d.total > 0 ? 4 : 1)}%`,
                          background: isHover
                            ? "#34d399"
                            : d.total > 0
                            ? "rgba(16,185,129,0.55)"
                            : "rgba(255,255,255,0.06)",
                          minHeight: "2px",
                        }}
                      />
                      {showLabel && (
                        <span
                          className="text-[8px] leading-none whitespace-nowrap"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        >
                          {formatDate(d.date)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Linha base */}
              <div className="mt-1" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>
          )}
        </div>

        {/* Total geral no rodapé */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Total acumulado (tudo)</span>
          <span className="text-sm font-bold text-emerald-400">{`R$ ${totalGeral.toFixed(2)}`}</span>
        </div>
      </div>
    </div>
  );
}
