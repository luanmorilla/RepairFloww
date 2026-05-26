"use client";

import { useEffect, useState, useRef } from "react";
import { getStockItems, createStockItem, deleteStockItem } from "@/actions/stock-actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Package, AlertTriangle, CheckCircle2,
  TrendingUp, ShoppingBag, ChevronRight, ChevronLeft,
  Barcode, ScanLine, Boxes, DollarSign, Tag, FileText,
  Wrench, Plug, Smartphone, FolderOpen, Check, X,
  ArrowUpRight, Layers,
} from "lucide-react";

// ─── Types & Constants ────────────────────────────────────────────────────────

const CATS = [
  {
    value: "PART",
    label: "Peça",
    sub: "Display, bateria, conector...",
    icon: Wrench,
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.25)",
    glow: "rgba(249,115,22,0.15)",
  },
  {
    value: "ACCESSORY",
    label: "Acessório",
    sub: "Capas, cabos, películas...",
    icon: Plug,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    glow: "rgba(59,130,246,0.15)",
  },
  {
    value: "DEVICE",
    label: "Aparelho",
    sub: "Celulares, tablets, notebooks...",
    icon: Smartphone,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    value: "OTHER",
    label: "Outro",
    sub: "Qualquer item diverso...",
    icon: FolderOpen,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    glow: "rgba(16,185,129,0.15)",
  },
];

const STEPS = [
  { id: 1, label: "Identidade",  icon: Tag },
  { id: 2, label: "Preços",      icon: DollarSign },
  { id: 3, label: "Estoque",     icon: Boxes },
  { id: 4, label: "Detalhes",    icon: FileText },
];

const VAZIO = {
  name: "", category: "PART", quantity: 1,
  costPrice: "", sellPrice: "", barcode: "", minQuantity: 2, notes: "",
};

function getCat(v: string) { return CATS.find(c => c.value === v) ?? CATS[0]; }

function calcMargem(cost: number, sell: number) {
  if (!cost || !sell || cost <= 0) return null;
  const pct = ((sell - cost) / cost * 100);
  return {
    pct: pct.toFixed(1),
    val: (sell - cost).toFixed(2),
    positive: sell >= cost,
    bar: Math.min(Math.abs(pct), 100),
  };
}

// ─── Animated number ──────────────────────────────────────────────────────────

function NumInput({
  label, value, onChange, min = 0, step = "0.01", prefix, suffix, hint, big,
}: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: focused ? "1.5px solid rgba(99,102,241,0.6)" : "1.5px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "0 16px",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
        }}
      >
        {prefix && <span style={{ fontSize: 15, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          step={step}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "white",
            fontSize: big ? 28 : 16,
            fontWeight: big ? 700 : 500,
            padding: big ? "20px 0" : "14px 0",
            fontVariantNumeric: "tabular-nums",
            width: 0,
          }}
          placeholder="0"
        />
        {suffix && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{suffix}</span>}
      </div>
      {hint && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: -4 }}>{hint}</p>}
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────

function TxtInput({ label, value, onChange, placeholder, multiline, icon: Icon }: any) {
  const [focused, setFocused] = useState(false);
  const style: any = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "white",
    fontSize: 15,
    resize: "none",
    fontFamily: "inherit",
    padding: 0,
  };
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          {Icon && <Icon size={10} />}
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: multiline ? "flex-start" : "center",
          gap: 12,
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: focused ? "1.5px solid rgba(99,102,241,0.6)" : "1.5px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: multiline ? "14px 16px" : "0 16px",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
        }}
      >
        {Icon && !label && <Icon size={16} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, marginTop: multiline ? 2 : 0 }} />}
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...style, paddingTop: 0 }}
            className="placeholder:text-white/20"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...style, padding: "15px 0" }}
            className="placeholder:text-white/20"
          />
        )}
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {STEPS.map((s, i) => {
        const done    = i + 1 < current;
        const active  = i + 1 === current;
        return (
          <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <div
              style={{
                height: 3,
                borderRadius: 99,
                background: done
                  ? "rgba(99,102,241,1)"
                  : active
                  ? "rgba(99,102,241,0.7)"
                  : "rgba(255,255,255,0.08)",
                transition: "background 0.4s",
                width: "100%",
              }}
            />
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: active ? "rgba(165,180,252,0.9)" : done ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.2)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "color 0.3s",
            }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── STEP 1 — Identidade (nome + categoria) ───────────────────────────────────

function Step1({ form, set }: any) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 200); }, []);
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Nome grande */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Nome do produto *
        </label>
        <div
          style={{
            background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
            border: focused ? "1.5px solid rgba(99,102,241,0.6)" : "1.5px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "4px 20px",
            transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
          }}
        >
          <input
            ref={ref}
            type="text"
            value={form.name}
            onChange={e => set("name")(e.target.value)}
            placeholder="Ex: Tela iPhone 14 Pro OLED..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 22,
              fontWeight: 700,
              padding: "18px 0",
              letterSpacing: "-0.01em",
            }}
            className="placeholder:text-white/15"
          />
        </div>
      </div>

      {/* Categoria — cards grandes com ícone */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Categoria
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CATS.map(c => {
            const sel = form.category === c.value;
            const Icon = c.icon;
            return (
              <motion.button
                key={c.value}
                onClick={() => set("category")(c.value)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 16,
                  background: sel ? c.bg : "rgba(255,255,255,0.025)",
                  border: sel ? `1.5px solid ${c.border}` : "1.5px solid rgba(255,255,255,0.07)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: sel ? `0 0 24px ${c.glow}` : "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Glow background */}
                {sel && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse at 20% 50%, ${c.glow} 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: sel ? `${c.color}22` : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}>
                  <Icon size={18} style={{ color: sel ? c.color : "rgba(255,255,255,0.3)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 700,
                    color: sel ? "white" : "rgba(255,255,255,0.5)",
                    margin: 0, lineHeight: 1.2,
                  }}>{c.label}</p>
                  <p style={{
                    fontSize: 11,
                    color: sel ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
                    margin: "3px 0 0",
                    lineHeight: 1.3,
                  }}>{c.sub}</p>
                </div>
                {sel && (
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: c.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Check size={11} color="white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2 — Preços ──────────────────────────────────────────────────────────

function Step2({ form, set }: any) {
  const cost = parseFloat(String(form.costPrice).replace(",", ".")) || 0;
  const sell = parseFloat(String(form.sellPrice).replace(",", ".")) || 0;
  const mg   = calcMargem(cost, sell);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <NumInput label="Custo (R$) *"        value={form.costPrice} onChange={set("costPrice")} prefix="R$" big />
        <NumInput label="Preço de venda (R$) *" value={form.sellPrice} onChange={set("sellPrice")} prefix="R$" big />
      </div>

      {/* Barra de margem animada */}
      <AnimatePresence>
        {(cost > 0 || sell > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              borderRadius: 20,
              overflow: "hidden",
              background: "rgba(255,255,255,0.03)",
              border: "1.5px solid rgba(255,255,255,0.07)",
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Margem de lucro
                </p>
                <p style={{
                  fontSize: 36, fontWeight: 800,
                  color: !mg ? "rgba(255,255,255,0.2)" : mg.positive ? "#10b981" : "#ef4444",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}>
                  {mg ? `${mg.pct}%` : "—"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Lucro unitário
                </p>
                <p style={{
                  fontSize: 22, fontWeight: 700,
                  color: !mg ? "rgba(255,255,255,0.15)" : mg.positive ? "#34d399" : "#f87171",
                }}>
                  {mg ? `R$ ${mg.val}` : "R$ 0,00"}
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 6, overflow: "hidden" }}>
              <motion.div
                animate={{ width: mg ? `${mg.bar}%` : "0%" }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: !mg
                    ? "transparent"
                    : mg.positive
                    ? "linear-gradient(90deg, #059669, #10b981)"
                    : "linear-gradient(90deg, #dc2626, #ef4444)",
                }}
              />
            </div>

            {/* Sugestões rápidas de preço */}
            {cost > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", alignSelf: "center" }}>Sugestões:</p>
                {[30, 50, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => set("sellPrice")((cost * (1 + pct / 100)).toFixed(2))}
                    style={{
                      fontSize: 11, fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "rgba(165,180,252,0.8)",
                      cursor: "pointer",
                    }}
                  >
                    +{pct}% → R$ {(cost * (1 + pct / 100)).toFixed(2)}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── STEP 3 — Quantidades ─────────────────────────────────────────────────────

function Step3({ form, set }: any) {
  const cat = getCat(form.category);
  const low = Number(form.quantity) <= Number(form.minQuantity);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Visual quantity picker */}
      <div style={{
        borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        border: "1.5px solid rgba(255,255,255,0.07)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Quantidade em estoque
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button
            onClick={() => set("quantity")(Math.max(0, Number(form.quantity) - 1))}
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.1)",
              color: "white", fontSize: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >−</button>

          <div style={{ textAlign: "center" }}>
            <input
              type="number"
              value={form.quantity}
              onChange={e => set("quantity")(e.target.value)}
              min={0}
              style={{
                width: 100,
                background: "transparent", border: "none", outline: "none",
                color: "white", fontSize: 56, fontWeight: 800,
                textAlign: "center", fontVariantNumeric: "tabular-nums",
              }}
            />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: -4 }}>unidades</p>
          </div>

          <button
            onClick={() => set("quantity")(Number(form.quantity) + 1)}
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(99,102,241,0.15)",
              border: "1.5px solid rgba(99,102,241,0.3)",
              color: "rgba(165,180,252,1)", fontSize: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >+</button>
        </div>
      </div>

      {/* Mínimo e status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <NumInput
          label="Quantidade mínima"
          value={form.minQuantity}
          onChange={set("minQuantity")}
          min={0}
          step="1"
          hint="Abaixo disso: alerta de reposição"
        />

        {/* Status visual */}
        <div style={{
          borderRadius: 14,
          background: low ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
          border: low ? "1.5px solid rgba(245,158,11,0.25)" : "1.5px solid rgba(16,185,129,0.2)",
          padding: "14px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Status
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: low ? "#f59e0b" : "#10b981",
              boxShadow: low ? "0 0 8px #f59e0b" : "0 0 8px #10b981",
            }} />
            <p style={{
              fontSize: 14, fontWeight: 700,
              color: low ? "#fbbf24" : "#34d399",
            }}>
              {low ? "Estoque baixo" : "Normal"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 4 — Detalhes extras ─────────────────────────────────────────────────

function Step4({ form, set }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <TxtInput
        label="Código de barras"
        icon={ScanLine}
        value={form.barcode}
        onChange={set("barcode")}
        placeholder="Escaneie ou digite o código EAN/QR (opcional)"
      />

      <TxtInput
        label="Observações"
        icon={FileText}
        value={form.notes}
        onChange={set("notes")}
        placeholder="Notas internas, fornecedor, prazo de garantia..."
        multiline
      />

      {/* Resumo final */}
      <div style={{
        borderRadius: 20,
        background: "rgba(99,102,241,0.06)",
        border: "1.5px solid rgba(99,102,241,0.15)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(165,180,252,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Resumo do produto
        </p>
        {[
          { label: "Nome",      value: form.name        || "—" },
          { label: "Categoria", value: getCat(form.category).label },
          { label: "Custo",     value: form.costPrice ? `R$ ${parseFloat(form.costPrice).toFixed(2)}` : "—" },
          { label: "Venda",     value: form.sellPrice ? `R$ ${parseFloat(form.sellPrice).toFixed(2)}` : "—" },
          { label: "Estoque",   value: `${form.quantity} unidades` },
        ].map(r => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overlay de sucesso ───────────────────────────────────────────────────────

function SuccessOverlay() {
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
        <p style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 6 }}>Produto salvo!</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Adicionado ao seu estoque com sucesso</p>
      </motion.div>
    </motion.div>
  );
}

// ─── FORMULÁRIO PRINCIPAL ─────────────────────────────────────────────────────

function NovoForm({
  shopId, onClose, onSaved,
}: { shopId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm]       = useState<any>(VAZIO);
  const [step, setStep]       = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro]       = useState("");

  function set(key: string) { return (val: any) => setForm((p: any) => ({ ...p, [key]: val })); }

  function canNext() {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.costPrice && form.sellPrice;
    return true;
  }

  function next() {
    if (step === 4) return handleSalvar();
    if (!canNext()) { setErro("Preencha os campos obrigatórios antes de continuar."); return; }
    setErro("");
    setStep(s => s + 1);
  }

  function back() { setErro(""); setStep(s => s - 1); }

  async function handleSalvar() {
    if (!form.name.trim() || !form.costPrice || !form.sellPrice) {
      setErro("Verifique os campos obrigatórios.");
      return;
    }
    setSalvando(true); setErro("");
    try {
      await createStockItem({
        ...form,
        quantity:    Number(form.quantity),
        costPrice:   parseFloat(String(form.costPrice).replace(",", ".")),
        sellPrice:   parseFloat(String(form.sellPrice).replace(",", ".")),
        minQuantity: Number(form.minQuantity),
        shopId,
      });
      setSucesso(true);
      setTimeout(() => { onSaved(); onClose(); }, 1600);
    } catch (e: any) {
      setErro(e.message ?? "Erro ao salvar.");
      setSalvando(false);
    }
  }

  const cat = getCat(form.category);

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Wrapper fixo de centralização — Framer Motion nao interfere no translate */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          pointerEvents: "none",
        }}
      >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          pointerEvents: "auto",
          width: "min(560px, 100%)",
          maxHeight: "calc(100dvh - 40px)",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(145deg, #13131a 0%, #0d0d13 100%)",
          borderRadius: 28,
          border: "1.5px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
          overflow: "hidden",
        }}
      >
        {sucesso && <SuccessOverlay />}

        {/* Faixa colorida da categoria no topo */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${cat.color}00 0%, ${cat.color} 30%, ${cat.color}80 70%, transparent 100%)`,
          transition: "background 0.4s",
        }} />

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: cat.bg, border: `1.5px solid ${cat.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>
                {<cat.icon size={18} style={{ color: cat.color }} />}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.1 }}>
                  {step === 1 ? "Novo produto" : form.name || "Novo produto"}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                  Etapa {step} de {STEPS.length} · {STEPS[step - 1]?.label}
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

          <StepBar current={step} total={STEPS.length} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <Step1 form={form} set={set} />}
              {step === 2 && <Step2 form={form} set={set} />}
              {step === 3 && <Step3 form={form} set={set} />}
              {step === 4 && <Step4 form={form} set={set} />}
            </motion.div>
          </AnimatePresence>

          {/* Erro */}
          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  overflow: "hidden",
                }}
              >
                <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#fca5a5" }}>{erro}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(0,0,0,0.15)",
        }}>
          {step > 1 ? (
            <button
              onClick={back}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: "10px 16px", borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Progresso numérico */}
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            {step}/{STEPS.length}
          </p>

          <motion.button
            onClick={next}
            disabled={salvando}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 13,
              background: step === 4
                ? "linear-gradient(135deg, #059669, #10b981)"
                : `linear-gradient(135deg, ${cat.color}cc, ${cat.color})`,
              boxShadow: step === 4
                ? "0 4px 20px rgba(16,185,129,0.35)"
                : `0 4px 20px ${cat.glow}`,
              border: "none",
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", minWidth: 140, justifyContent: "center",
              transition: "box-shadow 0.3s",
              opacity: salvando ? 0.7 : 1,
            }}
          >
            {salvando ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  animation: "spin 0.8s linear infinite",
                }} />
                Salvando...
              </>
            ) : step === 4 ? (
              <><CheckCircle2 size={16} /> Salvar produto</>
            ) : (
              <>Próximo <ChevronRight size={16} /></>
            )}
          </motion.button>
        </div>
      </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── StockTab ─────────────────────────────────────────────────────────────────

export function StockTab({ shopId }: { shopId: string }) {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await getStockItems(shopId);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { if (shopId) load(); }, [shopId]);

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    setDeletando(id);
    await deleteStockItem(id);
    await load();
    setDeletando(null);
  }

  const totalItens = items.reduce((a, i) => a + i.quantity, 0);
  const alertas    = items.filter(i => i.quantity <= i.minQuantity).length;
  const valorTotal = items.reduce((a, i) => a + i.sellPrice * i.quantity, 0);

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
        .sk { background:linear-gradient(90deg,#ffffff04 25%,#ffffff0b 50%,#ffffff04 75%); background-size:200% 100%; animation:shimmer 1.8s ease-in-out infinite; border-radius:16px; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>Estoque</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "4px 0 0" }}>
              {items.length} {items.length === 1 ? "produto" : "produtos"} cadastrado{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 13,
              background: "linear-gradient(135deg, #4338ca, #6366f1)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              border: "none", color: "white", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> Novo produto
          </button>
        </div>

        {/* Stats */}
        {!loading && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}
          >
            {[
              { icon: ShoppingBag, label: "Em estoque",  value: totalItens,                   color: "#818cf8", bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.18)" },
              { icon: AlertTriangle, label: "Alertas",   value: alertas,                      color: alertas > 0 ? "#fbbf24" : "rgba(255,255,255,0.25)", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
              { icon: TrendingUp, label: "Valor total",  value: `R$ ${valorTotal.toFixed(0)}`, color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)" },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 8, padding: "16px 8px",
                borderRadius: 18,
                background: s.bg, border: `1px solid ${s.border}`,
                textAlign: "center",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[72, 64, 72].map((h, i) => <div key={i} className="sk" style={{ height: h }} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "64px 24px", gap: 16,
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Layers size={24} style={{ color: "rgba(255,255,255,0.15)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: 0 }}>Nenhum produto ainda</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", margin: "6px 0 0" }}>
                Adicione itens para controlar seu estoque
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 12,
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.22)",
                color: "rgba(165,180,252,0.8)", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Adicionar primeiro produto
            </button>
          </motion.div>
        )}

        {/* Lista */}
        {!loading && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {items.map((item, idx) => {
                const cat   = getCat(item.category);
                const baixo = item.quantity <= item.minQuantity;
                const mg    = calcMargem(item.costPrice, item.sellPrice);
                const Icon  = cat.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{
                      borderRadius: 18,
                      background: "#0e0e14",
                      border: baixo ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Linha de cor da categoria */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: cat.color, opacity: 0.6,
                      borderRadius: "0 0 0 0",
                    }} />

                    <div style={{ padding: "14px 16px 14px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: cat.bg, border: `1px solid ${cat.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={17} style={{ color: cat.color }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.name}
                          </p>
                          {baixo && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                              color: "#fbbf24", whiteSpace: "nowrap", flexShrink: 0,
                            }}>
                              ⚠ Baixo
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>{cat.label}</p>
                      </div>

                      {/* Métricas */}
                      <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Qtd</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: baixo ? "#fbbf24" : "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums" }}>{item.quantity}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Venda</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)", fontVariantNumeric: "tabular-nums" }}>R$ {item.sellPrice.toFixed(0)}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Margem</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: mg?.positive ? "#34d399" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                            {mg ? `${mg.pct}%` : "—"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletando === item.id}
                        style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: "rgba(239,68,68,0.07)",
                          border: "1px solid rgba(239,68,68,0.12)",
                          cursor: "pointer", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: deletando === item.id ? 0.5 : 1,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)"; }}
                      >
                        {deletando === item.id
                          ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(239,68,68,0.3)", borderTop: "2px solid #ef4444", animation: "spin 0.8s linear infinite" }} />
                          : <Trash2 size={13} color="#f87171" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <NovoForm
            shopId={shopId}
            onClose={() => setShowForm(false)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </>
  );
}
