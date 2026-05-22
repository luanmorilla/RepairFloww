"use client";

import { useEffect, useState } from "react";
import { getStockItems, createStockItem, deleteStockItem } from "@/actions/stock-actions";
import { Plus, Trash2, Package, AlertTriangle } from "lucide-react";

const CATEGORIAS = [
  { value: "PART",      label: "Peça" },
  { value: "ACCESSORY", label: "Acessório" },
  { value: "DEVICE",    label: "Aparelho" },
  { value: "OTHER",     label: "Outro" },
];

const VAZIO = {
  name: "",
  category: "ACCESSORY",
  quantity: 1,
  costPrice: "",
  sellPrice: "",
  barcode: "",
  minQuantity: 2,
};

export function StockTab({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getStockItems(shopId);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { if (shopId) load(); }, [shopId]);

  async function handleSalvar() {
    if (!form.name || !form.sellPrice || !form.costPrice) {
      alert("Preencha nome, custo e preço de venda.");
      return;
    }
    setSalvando(true);
    try {
      await createStockItem({
        ...form,
        quantity: Number(form.quantity),
        costPrice: parseFloat(String(form.costPrice).replace(",", ".")),
        sellPrice: parseFloat(String(form.sellPrice).replace(",", ".")),
        minQuantity: Number(form.minQuantity),
        shopId,
      });
      setForm(VAZIO);
      setShowForm(false);
      await load();
    } catch (e: any) {
      alert(e.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto do estoque?")) return;
    await deleteStockItem(id);
    await load();
  }

  const lucroItem = (item: any) =>
    ((item.sellPrice - item.costPrice) / item.costPrice * 100).toFixed(0);

  const margemPreview =
    form.costPrice && form.sellPrice
      ? {
          pct: (((parseFloat(String(form.sellPrice)) - parseFloat(String(form.costPrice))) /
            parseFloat(String(form.costPrice))) * 100).toFixed(1),
          val: (parseFloat(String(form.sellPrice)) - parseFloat(String(form.costPrice))).toFixed(2),
        }
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-zinc-100">Estoque</h3>
          <p className="text-xs text-zinc-500">{items.length} produto(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-4 md:p-6 space-y-4">
          <h4 className="font-semibold text-zinc-200">Cadastrar Produto</h4>

          {/* Nome — linha cheia */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Nome do Produto *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Capinha iPhone 13, Carregador 20W..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Categoria + Código — grid 1→2 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Código de Barras</label>
              <input
                value={form.barcode}
                onChange={e => setForm({ ...form, barcode: e.target.value })}
                placeholder="Opcional"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custo + Venda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Custo (R$) *</label>
              <input
                value={form.costPrice}
                onChange={e => setForm({ ...form, costPrice: e.target.value })}
                placeholder="0,00"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Venda (R$) *</label>
              <input
                value={form.sellPrice}
                onChange={e => setForm({ ...form, sellPrice: e.target.value })}
                placeholder="0,00"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quantidade + Mínimo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Qtd. em Estoque</label>
              <input
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                type="number"
                min="0"
                inputMode="numeric"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Qtd. Mínima (Alerta)</label>
              <input
                value={form.minQuantity}
                onChange={e => setForm({ ...form, minQuantity: e.target.value })}
                type="number"
                min="0"
                inputMode="numeric"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preview de margem */}
          {margemPreview && (
            <div className="bg-zinc-900 rounded-xl p-3 flex gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs">Margem de lucro</span>
                <p className="font-bold text-green-400">{margemPreview.pct}%</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs">Lucro por unidade</span>
                <p className="font-bold text-zinc-200">R$ {margemPreview.val}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {salvando ? "Salvando..." : "Salvar Produto"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(VAZIO); }}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="p-4 text-zinc-500 text-sm">Carregando estoque...</div>
      ) : items.length === 0 ? (
        <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
          <Package size={32} className="mx-auto mb-2 opacity-40" />
          <p>Nenhum produto cadastrado.</p>
          <p className="text-xs mt-1">Clique em "Novo Produto" para começar.</p>
        </div>
      ) : (
        <>
          {/* ── CARDS — mobile ── */}
          <div className="md:hidden space-y-3">
            {items.map((item) => {
              const baixo = item.quantity <= item.minQuantity;
              return (
                <div
                  key={item.id}
                  className={`bg-zinc-950 border rounded-2xl p-4 space-y-3 ${
                    baixo ? "border-yellow-900/60" : "border-zinc-900"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        {baixo && <AlertTriangle size={13} className="text-yellow-400 shrink-0" />}
                        <p className={`font-semibold text-sm ${baixo ? "text-yellow-300" : "text-zinc-100"}`}>
                          {item.name}
                        </p>
                      </div>
                      <p className="text-zinc-600 text-xs mt-0.5">
                        {CATEGORIAS.find(c => c.value === item.category)?.label ?? item.category}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red-900/40 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">Estoque</p>
                      <p className={`font-bold font-mono ${baixo ? "text-yellow-400" : "text-zinc-300"}`}>
                        {item.quantity}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">Custo</p>
                      <p className="text-zinc-500 font-medium">R$ {item.costPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">Venda</p>
                      <p className="text-zinc-200 font-bold">R$ {item.sellPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">Margem</p>
                      <p className="text-green-400 font-bold">{lucroItem(item)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── TABELA — desktop ── */}
          <div className="hidden md:block border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Qtd.</th>
                  <th className="px-4 py-3">Custo</th>
                  <th className="px-4 py-3">Venda</th>
                  <th className="px-4 py-3">Margem</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const baixo = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {baixo && <AlertTriangle size={13} className="text-yellow-400" />}
                          <span className={baixo ? "text-yellow-300" : "text-zinc-100"}>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {CATEGORIAS.find(c => c.value === item.category)?.label ?? item.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-bold ${baixo ? "text-yellow-400" : "text-zinc-300"}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">R$ {item.costPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-zinc-300 font-medium">R$ {item.sellPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="text-green-400 font-bold">{lucroItem(item)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-900/40 text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
