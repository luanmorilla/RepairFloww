"use client";

import { useState } from "react";
import {
  Shield,
  Loader2,
  ExternalLink,
  AlertTriangle,
  FileText,
  XCircle,
} from "lucide-react";

export function AssinaturaCard() {
  const [loading, setLoading] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [erro, setErro] = useState("");

  async function handlePortal() {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/asaas/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao abrir faturas."); return; }
      window.open(data.url, "_blank");
    } catch {
      setErro("Erro ao conectar com o Asaas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar() {
    setCancelando(true);
    setErro("");
    try {
      const res = await fetch("/api/asaas/cancelar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao cancelar."); return; }
      setCancelSuccess(true);
      setMostrarCancelar(false);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className="rf-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
      {/* Glow de fundo */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(26,158,120,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "rgba(26,158,120,0.1)",
          border: "0.5px solid rgba(26,158,120,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Shield size={16} style={{ color: "var(--teal-light)" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--rf-text)" }}>Minha assinatura</p>
          <p style={{ fontSize: 12, color: "var(--rf-text-3)", marginTop: 2 }}>
            Gerencie cobranças e cancelamento
          </p>
        </div>

        {/* Badge */}
        {!cancelSuccess && (
          <div style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 99,
            background: "rgba(26,158,120,0.08)",
            border: "0.5px solid rgba(26,158,120,0.2)",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--teal-light)",
              boxShadow: "0 0 6px var(--teal)",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-light)", letterSpacing: "0.02em" }}>
              Ativo
            </span>
          </div>
        )}

        {cancelSuccess && (
          <div style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 99,
            background: "rgba(224,82,82,0.08)",
            border: "0.5px solid rgba(224,82,82,0.2)",
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", letterSpacing: "0.02em" }}>
              Cancelado
            </span>
          </div>
        )}
      </div>

      {/* Aviso cancelamento confirmado */}
      {cancelSuccess && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 14px", marginBottom: 18,
          background: "rgba(224,82,82,0.07)",
          border: "0.5px solid rgba(224,82,82,0.18)",
          borderRadius: 10,
        }}>
          <XCircle size={13} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "rgba(240,240,244,0.5)", lineHeight: 1.55 }}>
            Assinatura cancelada. Você continua com acesso até o fim do período pago.
          </p>
        </div>
      )}

      {/* Aviso padrão */}
      {!cancelSuccess && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 13px", marginBottom: 18,
          background: "rgba(232,164,48,0.06)",
          border: "0.5px solid rgba(232,164,48,0.15)",
          borderRadius: 10,
        }}>
          <AlertTriangle size={12} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11.5, color: "var(--rf-text-3)", lineHeight: 1.55 }}>
            Clique em <strong style={{ color: "var(--rf-text-2)" }}>Ver faturas</strong> para acessar seus boletos e comprovantes de pagamento.
          </p>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", marginBottom: 14,
          background: "rgba(224,82,82,0.08)",
          border: "0.5px solid rgba(224,82,82,0.2)",
          borderRadius: 10,
        }}>
          <XCircle size={13} style={{ color: "var(--red)", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "var(--red)" }}>{erro}</p>
        </div>
      )}

      {/* Botões principais */}
      {!cancelSuccess && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Ver faturas */}
          <button
            onClick={handlePortal}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 12,
              border: "0.5px solid rgba(26,158,120,0.35)",
              background: loading
                ? "rgba(26,158,120,0.06)"
                : "linear-gradient(135deg, rgba(26,158,120,0.14) 0%, rgba(34,201,151,0.09) 100%)",
              color: "var(--teal-light)",
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "var(--font)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.01em",
              boxShadow: loading ? "none" : "0 4px 20px rgba(26,158,120,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(26,158,120,0.22) 0%, rgba(34,201,151,0.15) 100%)";
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(26,158,120,0.2), inset 0 1px 0 rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(26,158,120,0.14) 0%, rgba(34,201,151,0.09) 100%)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,158,120,0.1), inset 0 1px 0 rgba(255,255,255,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? (
              <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} /> Abrindo faturas...</>
            ) : (
              <><FileText size={14} /> Ver faturas</>
            )}
          </button>

          {/* Cancelar assinatura — toggle */}
          {!mostrarCancelar ? (
            <button
              onClick={() => setMostrarCancelar(true)}
              style={{
                width: "100%",
                padding: "10px 18px",
                borderRadius: 12,
                border: "0.5px solid rgba(224,82,82,0.18)",
                background: "transparent",
                color: "rgba(224,82,82,0.55)",
                fontSize: 12.5,
                fontWeight: 500,
                fontFamily: "var(--font)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                cursor: "pointer",
                transition: "all 0.18s ease",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(224,82,82,0.06)";
                e.currentTarget.style.color = "var(--red)";
                e.currentTarget.style.borderColor = "rgba(224,82,82,0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(224,82,82,0.55)";
                e.currentTarget.style.borderColor = "rgba(224,82,82,0.18)";
              }}
            >
              <XCircle size={13} />
              Cancelar assinatura
            </button>
          ) : (
            /* Confirmação de cancelamento */
            <div style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "0.5px solid rgba(224,82,82,0.25)",
              background: "rgba(224,82,82,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
              <p style={{ fontSize: 12.5, color: "rgba(240,240,244,0.55)", lineHeight: 1.5, textAlign: "center" }}>
                Tem certeza? Você perderá acesso ao final do período pago.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setMostrarCancelar(false)}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 9,
                    border: "0.5px solid var(--rf-border-2)",
                    background: "var(--rf-surface-2)",
                    color: "var(--rf-text-2)",
                    fontSize: 12.5, fontWeight: 500, fontFamily: "var(--font)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelar}
                  disabled={cancelando}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 9,
                    border: "0.5px solid rgba(224,82,82,0.35)",
                    background: "rgba(224,82,82,0.12)",
                    color: "var(--red)",
                    fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font)",
                    cursor: cancelando ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: cancelando ? 0.6 : 1,
                  }}
                >
                  {cancelando
                    ? <><Loader2 size={12} style={{ animation: "spin .8s linear infinite" }} /> Cancelando...</>
                    : "Confirmar"
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
