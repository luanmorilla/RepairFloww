"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingDown, TrendingUp, Minus, Globe, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface MarketFilterProps {
  device: string;       // Ex: "Apple iPhone 16"
  service: string;      // Ex: "Troca de tela AMOLED"
  partCost: number;
  subtotal: number;     // Preço calculado pela engine atual
  onSuggestedPrice?: (price: number) => void; // Callback opcional
}

interface MarketData {
  precoMin: number;
  precoMax: number;
  precoMedio: number;
  fontes: string[];
}

export function MarketPriceFilter({ device, service, partCost, subtotal, onSuggestedPrice }: MarketFilterProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const prevKeyRef = useRef<string>("");

  // Preço sugerido: se nosso preço > 20% acima da média, ajusta para +10% da média
  const suggestedPrice = marketData
    ? subtotal > marketData.precoMedio * 1.2
      ? Math.round(marketData.precoMedio * 1.1)
      : subtotal
    : null;

  const isAboveMarket = marketData ? subtotal > marketData.precoMedio * 1.2 : false;
  const isBelowMarket = marketData ? subtotal < marketData.precoMedio * 0.8 : false;

  useEffect(() => {
    if (!device || !service || partCost <= 0) return;

    const key = `${device}|${service}|${partCost}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/market-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device, service, partCost }),
        });
        const data = await res.json();
        if (data.success) {
          setMarketData(data);
          if (onSuggestedPrice && data) {
            const sp = subtotal > data.precoMedio * 1.2
              ? Math.round(data.precoMedio * 1.1)
              : subtotal;
            onSuggestedPrice(sp);
          }
        } else {
          setError("Não foi possível buscar dados de mercado.");
        }
      } catch {
        setError("Erro ao consultar mercado.");
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [device, service, partCost]);

  if (!device || !service || partCost <= 0) return null;

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">Filtro de Mercado</span>
          {loading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
          {!loading && marketData && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isAboveMarket ? "bg-orange-500/20 text-orange-400" :
              isBelowMarket ? "bg-green-500/20 text-green-400" :
              "bg-blue-500/20 text-blue-400"
            }`}>
              {isAboveMarket ? "Acima do mercado" : isBelowMarket ? "Abaixo do mercado" : "Competitivo"}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {/* Conteúdo */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Pesquisando preços praticados no mercado...
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {marketData && !loading && (
            <>
              {/* Faixa de preços */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-900/60 rounded-lg p-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Mínimo</p>
                  <p className="text-sm font-bold text-zinc-300">R$ {marketData.precoMin}</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider">Média</p>
                  <p className="text-sm font-bold text-blue-300">R$ {marketData.precoMedio}</p>
                </div>
                <div className="bg-zinc-900/60 rounded-lg p-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Máximo</p>
                  <p className="text-sm font-bold text-zinc-300">R$ {marketData.precoMax}</p>
                </div>
              </div>

              {/* Comparação */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                isAboveMarket ? "bg-orange-500/10 border border-orange-500/20" :
                isBelowMarket ? "bg-green-500/10 border border-green-500/20" :
                "bg-zinc-900/40 border border-zinc-800"
              }`}>
                <div className="flex items-center gap-2">
                  {isAboveMarket ? (
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                  ) : isBelowMarket ? (
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-xs text-zinc-400">
                    {isAboveMarket
                      ? "Seu preço está acima da média. Considere ajustar."
                      : isBelowMarket
                      ? "Seu preço está abaixo da média. Você pode cobrar mais."
                      : "Seu preço está alinhado com o mercado."}
                  </span>
                </div>
              </div>

              {/* Sugestão de ajuste */}
              {isAboveMarket && suggestedPrice && suggestedPrice !== subtotal && (
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div>
                    <p className="text-xs text-emerald-400 font-semibold">Preço sugerido pelo filtro</p>
                    <p className="text-xs text-zinc-500">Competitivo e ainda lucrativo</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    R$ {suggestedPrice}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
