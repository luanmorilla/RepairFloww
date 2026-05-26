"use client";

import { useEffect, useState } from "react";
import { getStockItems, vendaRapida } from "@/actions/stock-actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Plus, Minus, Check,
  CheckCircle2, Search, Tag, Wrench, Plug,
  Smartphone, FolderOpen, ArrowRight,
  TrendingUp, Package,
} from "lucide-react";

// ─── Reutiliza as categorias do StockTab ──────────────────────────────────────

const CATS = [
  { value: "PART",      label: "Peça",      icon: Wrench,      color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)"  },
  { value: "ACCESSORY", label: "Acessório",  icon: Plug,        color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)"  },
  { value: "DEVICE",    label: "Aparelho",   icon: Smartphone,  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)"  },
  { value: "OTHER",     label: "Outro",      icon: FolderOpen,  color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)"  },
];

function getCat(v: string) { return CATS.find(c => c.value === v) ?? CATS[0]; }

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Item = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  sellPrice: number;
  costPrice: number;
};

// ─── Overlay de sucesso ───────────────────────────────────────────────────────

function SuccessOverlay({ total, lucro }: { total: number; lucro: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(10,10,15,0.97)",
        zIndex: 10, gap: 20, borderRadius: 28,
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(16,185,129,0.15)",
          border: "2px solid rgba(16,185,129,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 40px rgba(16,185,129,0.25)",
        }}
      >
        <CheckCircle2 size={32} color="#10b981" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ textAlign: "center" }}
      >
        <p style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 6 }}>Venda realizada!</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
          Total: <strong style={{ color: "#60a5fa" }}>R$ {total.toFixed(2)}</strong>
          &nbsp;· Lucro: <strong style={{ color: "#34d399" }}>R$ {lucro.toFixed(2)}</strong>
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── MODAL PRINCIPAL ──────────────────────────────────────────────────────────

export function VendaRapidaModal({
  shopId,
  onClose,
  onVenda,
}: {
  shopId: string;
  onClose: () => void;
  onVenda: (lucro: number, total: number) => void;
}) {
  const [items, setItems]         = useState<Item[]>([]);
  const [busca, setBusca]         = useState("");
  const [selecionado, setSel]     = useState<Item | null>(null);
  const [quantidade, setQtd]      = useState(1);
  const [vendendo, setVendendo]   = useState(false);
  const [sucesso, setSucesso]     = useState(false);
  const [lastResult, setLast]     = useState({ total: 0, lucro: 0 });

  useEffect(() => { getStockItems(shopId).then(setItems); }, [shopId]);

  const filtrados = items.filter(
    i => i.quantity > 0 && i.name.toLowerCase().includes(busca.toLowerCase())
  );

  function select(item: Item) { setSel(item); setQtd(1); setBusca(item.name); }
  function deselect()         { setSel(null); setBusca(""); }

  async function handleVender() {
    if (!selecionado) return;
    setVendendo(true);
    try {
      const result = await vendaRapida(selecionado.id, quantidade, shopId);
      setLast({ total: result.total, lucro: result.lucro });
      setSucesso(true);
      onVenda(result.lucro, result.total);
      setTimeout(() => {
        setSucesso(false);
        deselect();
        setQtd(1);
        getStockItems(shopId).then(setItems);
      }, 1800);
    } catch (e: any) {
      alert(e.message ?? "Erro ao realizar venda.");
    } finally {
      setVendendo(false);
    }
  }

  const cat     = selecionado ? getCat(selecionado.category) : null;
  const total   = selecionado ? selecionado.sellPrice * quantidade : 0;
  const lucroUn = selecionado ? selecionado.sellPrice - selecionado.costPrice : 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Centering wrapper */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        pointerEvents: "none",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            width: "min(480px, 100%)",
            maxHeight: "calc(100dvh - 40px)",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(145deg, #13131a 0%, #0d0d13 100%)",
            borderRadius: 28,
            border: "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {sucesso && <SuccessOverlay total={lastResult.total} lucro={lastResult.lucro} />}

          {/* Faixa de cor no topo — muda conforme categoria selecionada */}
          <div style={{
            height: 3,
            background: cat
              ? `linear-gradient(90deg, ${cat.color}00 0%, ${cat.color} 30%, ${cat.color}80 70%, transparent 100%)`
              : "linear-gradient(90deg, #3b82f600 0%, #3b82f6 30%, #3b82f680 70%, transparent 100%)",
            transition: "background 0.4s",
          }} />

          {/* Header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: cat ? cat.bg : "rgba(59,130,246,0.1)",
                border: `1.5px solid ${cat ? cat.border : "rgba(59,130,246,0.25)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>
                {cat
                  ? <cat.icon size={18} style={{ color: cat.color }} />
                  : <ShoppingBag size={18} style={{ color: "#3b82f6" }} />
                }
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.1, margin: 0 }}>
                  Venda Rápida
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>
                  {selecionado ? selecionado.name : "Selecione um produto"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} color="rgba(255,255,255,0.4)" />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Busca */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid rgba(255,255,255,0.09)",
              borderRadius: 14, padding: "0 16px",
            }}>
              <Search size={15} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              <input
                value={busca}
                onChange={e => { setBusca(e.target.value); if (selecionado) setSel(null); }}
                placeholder="Buscar produto..."
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "white", fontSize: 15, padding: "14px 0",
                  fontFamily: "inherit",
                }}
                className="placeholder:text-white/20"
              />
              {selecionado && (
                <button
                  onClick={deselect}
                  style={{
                    fontSize: 11, color: "rgba(255,255,255,0.3)",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  Trocar
                </button>
              )}
            </div>

            {/* Lista de produtos — só aparece quando há busca e nada selecionado */}
            <AnimatePresence>
              {!selecionado && busca && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {filtrados.length === 0 ? (
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 8, padding: "28px 0",
                      }}>
                        <Package size={22} style={{ color: "rgba(255,255,255,0.15)" }} />
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>Nenhum produto encontrado.</p>
                      </div>
                    ) : filtrados.map(item => {
                      const c    = getCat(item.category);
                      const Icon = c.icon;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => select(item)}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 14px", borderRadius: 14,
                            background: "#0e0e14",
                            border: "1px solid rgba(255,255,255,0.06)",
                            cursor: "pointer", textAlign: "left",
                            transition: "border-color 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: c.bg, border: `1px solid ${c.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon size={16} style={{ color: c.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.name}
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                              {item.quantity} em estoque · {c.label}
                            </p>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#60a5fa", flexShrink: 0 }}>
                            R$ {item.sellPrice.toFixed(2)}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Produto selecionado — controle de quantidade + resumo */}
            <AnimatePresence>
              {selecionado && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Controle de quantidade */}
                  <div style={{
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.03)",
                    border: "1.5px solid rgba(255,255,255,0.07)",
                    padding: 24,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                      Quantidade
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <button
                        onClick={() => setQtd(Math.max(1, quantidade - 1))}
                        style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: "rgba(255,255,255,0.06)",
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          color: "white", fontSize: 22, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Minus size={18} />
                      </button>

                      <div style={{ textAlign: "center" }}>
                        <p style={{
                          fontSize: 56, fontWeight: 800, color: "white",
                          margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1,
                        }}>
                          {quantidade}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                          de {selecionado.quantity} disponíveis
                        </p>
                      </div>

                      <button
                        onClick={() => setQtd(Math.min(selecionado.quantity, quantidade + 1))}
                        style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: "rgba(99,102,241,0.15)",
                          border: "1.5px solid rgba(99,102,241,0.3)",
                          color: "rgba(165,180,252,1)", fontSize: 22, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Resumo financeiro */}
                  <div style={{
                    borderRadius: 20,
                    background: "rgba(99,102,241,0.05)",
                    border: "1.5px solid rgba(99,102,241,0.12)",
                    padding: 20,
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    {[
                      { label: "Preço unitário", value: `R$ ${selecionado.sellPrice.toFixed(2)}`,             color: "rgba(255,255,255,0.6)" },
                      { label: "Lucro por unid.", value: `R$ ${lucroUn.toFixed(2)}`,                          color: lucroUn >= 0 ? "#34d399" : "#f87171" },
                      { label: "Lucro total",     value: `R$ ${(lucroUn * quantidade).toFixed(2)}`,            color: lucroUn >= 0 ? "#34d399" : "#f87171" },
                    ].map(r => (
                      <div key={r.label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{r.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
                      </div>
                    ))}

                    {/* Total em destaque */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Total</span>
                      <span style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>
                        R$ {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer — botão de confirmar */}
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.15)",
          }}>
            <motion.button
              onClick={handleVender}
              disabled={!selecionado || vendendo || sucesso}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14,
                background: selecionado
                  ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                  : "rgba(255,255,255,0.04)",
                border: selecionado
                  ? "none"
                  : "1.5px solid rgba(255,255,255,0.06)",
                color: selecionado ? "white" : "rgba(255,255,255,0.2)",
                fontSize: 15, fontWeight: 700, cursor: selecionado ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: selecionado ? "0 4px 24px rgba(59,130,246,0.35)" : "none",
                transition: "all 0.25s",
                opacity: vendendo ? 0.7 : 1,
              }}
            >
              {vendendo ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Processando...
                </>
              ) : (
                <>
                  <ShoppingBag size={17} />
                  {selecionado ? `Confirmar · R$ ${total.toFixed(2)}` : "Selecione um produto"}
                  {selecionado && <ArrowRight size={15} />}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
