"use client";

import { useEffect, useState } from "react";
import { getOsList, concluirOS, getOsById, iniciarReparo } from "@/actions/os-actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, FileDown, Wrench, X, User, Smartphone,
  AlertCircle, DollarSign, Calendar, Clock, Hash,
  ChevronRight, Layers, Shield,
} from "lucide-react";
import { abrirPdfOS } from "@/lib/pdf-os";
// Remova qualquer import antigo de gerarPdfOS se existir

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  RECEIVED:          { label: "Recebido",      color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)",  dot: "#64748b" },
  DIAGNOSING:        { label: "Diagnóstico",   color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  dot: "#f59e0b" },
  AWAITING_APPROVAL: { label: "Ag. Aprovação", color: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  dot: "#f97316" },
  APPROVED:          { label: "Aprovado",      color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)",  dot: "#3b82f6" },
  IN_REPAIR:         { label: "Em Reparo",     color: "#c084fc", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.25)", dot: "#a855f7" },
  READY:             { label: "Pronto",        color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)",  dot: "#10b981" },
  DELIVERED:         { label: "Entregue",      color: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.15)", dot: "#4b5563" },
  CANCELED:          { label: "Cancelado",     color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)",  dot: "#ef4444" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.RECEIVED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 700,
      padding: "4px 10px", borderRadius: 99,
      color: s.color, background: s.bg,
      border: `1px solid ${s.border}`,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─── Modal de detalhes ────────────────────────────────────────────────────────

function OsModal({ os, onClose }: { os: any; onClose: () => void }) {
  const [baixando, setBaixando] = useState(false);

  async function handlePdf() {
    setBaixando(true);
    try { await abrirPdfOS(os); }
    catch { alert("Erro ao gerar PDF."); }
    finally { setBaixando(false); }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        }}
      />
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, pointerEvents: "none",
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
            display: "flex", flexDirection: "column",
            background: "linear-gradient(145deg, #13131a 0%, #0d0d13 100%)",
            borderRadius: 28,
            border: "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          {/* Faixa de status no topo */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, transparent 0%, ${(STATUS[os.status] ?? STATUS.RECEIVED).dot} 40%, ${(STATUS[os.status] ?? STATUS.RECEIVED).dot}60 70%, transparent 100%)`,
          }} />

          {/* Header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", margin: 0 }}>
                #{String(os.orderNumber).padStart(4, "0")}
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "4px 0 8px" }}>
                {os.customer?.name}
              </h2>
              <StatusBadge status={os.status} />
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} color="rgba(255,255,255,0.4)" />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: 12 }}>

            {[
              {
                icon: User, label: "Cliente",
                content: (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0 }}>{os.customer?.name}</p>
                    {os.customer?.phone && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{os.customer.phone}</p>}
                  </>
                ),
              },
              {
                icon: Smartphone, label: "Aparelho",
                content: (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0 }}>{os.device?.brand} {os.device?.model}</p>
                    {os.device?.imei && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>IMEI: {os.device.imei}</p>}
                    {os.device?.password && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Senha: {os.device.password}</p>}
                  </>
                ),
              },
              {
                icon: AlertCircle, label: "Defeito",
                content: (
                  <>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>{os.defect}</p>
                    {os.repairType && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Serviço: {os.repairType.name}</p>}
                  </>
                ),
              },
              {
                icon: DollarSign, label: "Valor",
                content: <p style={{ fontSize: 20, fontWeight: 800, color: "#34d399", margin: 0, fontVariantNumeric: "tabular-nums" }}>R$ {(os.totalPrice || 0).toFixed(2)}</p>,
              },
              {
                icon: Calendar, label: "Datas",
                content: (
                  <>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Entrada: {new Date(os.createdAt).toLocaleDateString("pt-BR")}</p>
                    {os.deadline && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Prazo: {new Date(os.deadline).toLocaleDateString("pt-BR")}</p>}
                  </>
                ),
              },
            ].map(({ icon: Icon, label, content }, i) => (
              <div key={i} style={{
                display: "flex", gap: 14, padding: "14px 16px",
                borderRadius: 16, background: "#0e0e14",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px", fontWeight: 600 }}>{label}</p>
                  {content}
                </div>
              </div>
            ))}

            {os.notes && (
              <div style={{
                padding: "14px 16px", borderRadius: 16,
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.12)",
              }}>
                <p style={{ fontSize: 10, color: "rgba(165,180,252,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px", fontWeight: 600 }}>Observações</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>{os.notes}</p>
              </div>
            )}
          </div>

          {/* Footer — PDF */}
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.15)",
          }}>
            <button
              onClick={handlePdf}
              disabled={baixando}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 14,
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
                border: "none", color: "white",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: baixando ? 0.7 : 1, transition: "opacity 0.2s",
              }}
            >
              <FileDown size={16} />
              {baixando ? "Gerando PDF..." : "Baixar / Imprimir PDF"}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Botão PDF reutilizável ───────────────────────────────────────────────────

function PdfButton({ osId, full = false }: { osId: string; full?: boolean }) {
  const [baixando, setBaixando] = useState(false);

  async function handlePdf(e: React.MouseEvent) {
    e.stopPropagation();
    setBaixando(true);
    try {
      const os = await getOsById(osId);
      if (!os) return alert("OS não encontrada.");
      await abrirPdfOS(os);
    } catch {
      alert("Erro ao gerar PDF.");
    } finally {
      setBaixando(false);
    }
  }

  // Mobile card: flex:1, desktop: padding lateral
  const isMobile = !full;
  return (
    <button
      onClick={handlePdf}
      disabled={baixando}
      style={{
        flex: isMobile ? 1 : undefined,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: isMobile ? "10px 0" : "7px 14px",
        borderRadius: isMobile ? 12 : 10,
        background: "rgba(96,165,250,0.1)",
        border: "1px solid rgba(96,165,250,0.22)",
        color: "#60a5fa",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        opacity: baixando ? 0.5 : 1,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(96,165,250,0.18)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(96,165,250,0.1)"; }}
    >
      <FileDown size={13} />
      {baixando ? "..." : "PDF"}
    </button>
  );
}

// ─── OsTable ──────────────────────────────────────────────────────────────────

export function OsTable({ shopId, onStatusChange }: { shopId: string; onStatusChange?: () => void }) {
  const [osList, setOsList]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [concluindo, setConcluindo] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState<string | null>(null);
  const [modalOs, setModalOs]     = useState<any | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await getOsList(shopId);
      setOsList(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (shopId) load(); }, [shopId]);

  async function handleConcluir(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Confirmar conclusão desta OS?")) return;
    setConcluindo(id);
    try { await concluirOS(id, shopId); await load(); onStatusChange?.(); }
    catch { alert("Erro ao concluir OS."); }
    finally { setConcluindo(null); }
  }

  async function handleIniciar(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Confirmar início do reparo?")) return;
    setIniciando(id);
    try { await iniciarReparo(id); await load(); onStatusChange?.(); }
    catch { alert("Erro ao iniciar reparo."); }
    finally { setIniciando(null); }
  }

  async function handleOpenModal(os: any) {
    const full = await getOsById(os.id);
    setModalOs(full);
  }

  // ── Skeletons ──
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}.sk{background:linear-gradient(90deg,#ffffff04 25%,#ffffff0b 50%,#ffffff04 75%);background-size:200% 100%;animation:shimmer 1.8s ease-in-out infinite;border-radius:16px}`}</style>
      {[80, 72, 80].map((h, i) => <div key={i} className="sk" style={{ height: h }} />)}
    </div>
  );

  // ── Empty ──
  if (osList.length === 0) return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "64px 24px", gap: 16,
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
        <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: 0 }}>Nenhuma OS encontrada</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", margin: "6px 0 0" }}>As ordens de serviço aparecerão aqui</p>
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {modalOs && <OsModal os={modalOs} onClose={() => setModalOs(null)} />}
      </AnimatePresence>

      <style>{`@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}.sk{background:linear-gradient(90deg,#ffffff04 25%,#ffffff0b 50%,#ffffff04 75%);background-size:200% 100%;animation:shimmer 1.8s ease-in-out infinite;border-radius:16px}`}</style>

      {/* ── CARDS — mobile ── */}
      <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <AnimatePresence>
          {osList.map((os, idx) => {
            const podeConcluir = !["DELIVERED", "CANCELED"].includes(os.status);
            const podeIniciar  = ["RECEIVED", "DIAGNOSING", "AWAITING_APPROVAL", "APPROVED"].includes(os.status);

            return (
              <motion.div
                key={os.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => handleOpenModal(os)}
                style={{
                  borderRadius: 18, background: "#0e0e14",
                  border: "1px solid rgba(255,255,255,0.07)",
                  overflow: "hidden", cursor: "pointer",
                  position: "relative",
                }}
              >
                {/* Linha de status */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                  background: (STATUS[os.status] ?? STATUS.RECEIVED).dot,
                  opacity: 0.7,
                }} />

                <div style={{ padding: "14px 14px 14px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", margin: 0 }}>
                        #{String(os.orderNumber).padStart(4, "0")}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.85)", margin: "2px 0 0" }}>
                        {os.customer?.name}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                        {os.device?.brand} {os.device?.model}
                      </p>
                    </div>
                    <StatusBadge status={os.status} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#34d399", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                      R$ {(os.totalPrice || 0).toFixed(2)}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                      {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                    {podeIniciar && (
                      <button
                        onClick={e => handleIniciar(e, os.id)}
                        disabled={iniciando === os.id}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "10px 0", borderRadius: 12,
                          background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.25)",
                          color: "#c084fc", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          opacity: iniciando === os.id ? 0.5 : 1,
                        }}
                      >
                        <Wrench size={13} />
                        {iniciando === os.id ? "..." : "Iniciar"}
                      </button>
                    )}
                    <PdfButton osId={os.id} />
                    {podeConcluir && (
                      <button
                        onClick={e => handleConcluir(e, os.id)}
                        disabled={concluindo === os.id}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "10px 0", borderRadius: 12,
                          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
                          color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          opacity: concluindo === os.id ? 0.5 : 1,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        {concluindo === os.id ? "..." : "Concluir"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── TABELA — desktop ── */}
      <div className="hidden md:block" style={{
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0a0a10",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#", "Cliente", "Aparelho", "Status", "Valor", "Data", "Ações"].map((h, i) => (
                <th key={h} style={{
                  padding: "14px 18px",
                  fontSize: 10, fontWeight: 700,
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  textAlign: i === 6 ? "right" : "left",
                  whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {osList.map((os, idx) => {
              const podeConcluir = !["DELIVERED", "CANCELED"].includes(os.status);
              const podeIniciar  = ["RECEIVED", "DIAGNOSING", "AWAITING_APPROVAL", "APPROVED"].includes(os.status);
              const statusDot    = (STATUS[os.status] ?? STATUS.RECEIVED).dot;

              return (
                <motion.tr
                  key={os.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleOpenModal(os)}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer", transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Dot de status à esquerda */}
                  <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 3, height: 32, borderRadius: 99, background: statusDot, opacity: 0.6, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                        #{String(os.orderNumber).padStart(4, "0")}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0 }}>{os.customer?.name}</p>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>{os.device?.brand} {os.device?.model}</p>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <StatusBadge status={os.status} />
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>
                      R$ {(os.totalPrice || 0).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                      {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}
                      onClick={e => e.stopPropagation()}
                    >
                      {podeIniciar && (
                        <button
                          onClick={e => handleIniciar(e, os.id)}
                          disabled={iniciando === os.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 10,
                            background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.2)",
                            color: "#c084fc", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            opacity: iniciando === os.id ? 0.5 : 1, transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(192,132,252,0.18)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(192,132,252,0.1)"; }}
                        >
                          <Wrench size={13} />
                          {iniciando === os.id ? "..." : "Iniciar Reparo"}
                        </button>
                      )}
                      <PdfButton osId={os.id} />
                      {podeConcluir && (
                        <button
                          onClick={e => handleConcluir(e, os.id)}
                          disabled={concluindo === os.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 10,
                            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
                            color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            opacity: concluindo === os.id ? 0.5 : 1, transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.18)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.1)"; }}
                        >
                          <CheckCircle2 size={13} />
                          {concluindo === os.id ? "..." : "Concluir"}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(os)}
                        style={{
                          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 9, background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
