"use client";

import { useEffect, useState } from "react";
import { getStockItems, vendaRapida } from "@/actions/stock-actions";
import { X, ShoppingBag, Plus, Minus, Check } from "lucide-react";

export function VendaRapidaModal({
  shopId,
  onClose,
  onVenda,
}: {
  shopId: string;
  onClose: () => void;
  onVenda: (lucro: number, total: number) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<any | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [vendendo, setVendendo] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    getStockItems(shopId).then(setItems);
  }, [shopId]);

  const filtrados = items.filter(
    (i) =>
      i.quantity > 0 &&
      i.name.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleVender() {
    if (!selecionado) return;
    setVendendo(true);
    try {
      const result = await vendaRapida(selecionado.id, quantidade, shopId);
      setSucesso(true);
      onVenda(result.lucro, result.total);
      setTimeout(() => {
        setSucesso(false);
        setSelecionado(null);
        setQuantidade(1);
        setBusca("");
        getStockItems(shopId).then(setItems);
      }, 1500);
    } catch (e: any) {
      alert(e.message ?? "Erro ao realizar venda.");
    } finally {
      setVendendo(false);
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/*
        Mobile  → sheet de baixo (rounded-t-3xl, sem rounded-b)
        Desktop → modal centralizado (rounded-2xl)
      */}
      <div className="
        bg-zinc-950 border border-zinc-800 shadow-2xl w-full
        rounded-t-3xl md:rounded-2xl
        md:max-w-md
        p-6
        max-h-[90vh] overflow-y-auto
      ">
        {/* Alça visual (só mobile) */}
        <div className="md:hidden w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-400" />
            <h3 className="font-bold text-zinc-100 text-lg">Venda Rápida</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Busca */}
        <div className="mb-3">
          <input
            value={busca}
            onChange={e => { setBusca(e.target.value); setSelecionado(null); }}
            placeholder="Buscar produto..."
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Lista de produtos */}
        {!selecionado && busca && (
          <div className="max-h-52 overflow-y-auto space-y-1 mb-4">
            {filtrados.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">Nenhum produto encontrado.</p>
            ) : filtrados.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelecionado(item); setQuantidade(1); }}
                className="w-full flex justify-between items-center p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
              >
                <div>
                  <p className="text-zinc-200 text-sm font-medium">{item.name}</p>
                  <p className="text-zinc-500 text-xs">{item.quantity} em estoque</p>
                </div>
                <p className="text-blue-400 font-bold text-sm">R$ {item.sellPrice.toFixed(2)}</p>
              </button>
            ))}
          </div>
        )}

        {/* Produto selecionado */}
        {selecionado && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-zinc-200 font-medium">{selecionado.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{selecionado.quantity} em estoque</p>
              </div>
              <button
                onClick={() => setSelecionado(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs underline"
              >
                Trocar
              </button>
            </div>

            {/* Quantidade — botões grandes para toque */}
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Quantidade</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 flex items-center justify-center transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="text-3xl font-bold text-zinc-100 flex-1 text-center">{quantidade}</span>
                <button
                  onClick={() => setQuantidade(Math.min(selecionado.quantity, quantidade + 1))}
                  className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Preço unitário</span>
                <span className="text-zinc-300">R$ {selecionado.sellPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Lucro por unid.</span>
                <span className="text-green-400">
                  R$ {(selecionado.sellPrice - selecionado.costPrice).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between">
                <span className="font-bold text-zinc-200">Total</span>
                <span className="font-bold text-blue-400 text-xl">
                  R$ {(selecionado.sellPrice * quantidade).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleVender}
              disabled={vendendo || sucesso}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                sucesso
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50"
              }`}
            >
              {sucesso ? (
                <><Check size={18} /> Venda realizada!</>
              ) : vendendo ? "Processando..." : (
                <><ShoppingBag size={18} /> Confirmar Venda</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
