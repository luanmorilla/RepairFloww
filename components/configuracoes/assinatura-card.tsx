"use client";

import { useState } from "react";
import {
  Shield,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

export function AssinaturaCard() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);

    try {
      const res = await fetch("/api/asaas/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao abrir assinatura.");
        return;
      }

      window.location.href = data.url;
    } catch {
      alert("Erro ao conectar com o Asaas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rf-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div className="rf-icon-box" style={{ background: "rgba(26,158,120,0.10)" }}>
          <Shield size={15} style={{ color: "var(--teal-light)" }} />
        </div>

        <div>
          <p style={{ fontSize: 13.5, fontWeight: 500 }}>Minha assinatura</p>
          <p style={{ fontSize: 12, color: "var(--rf-text-3)", marginTop: 2 }}>
            Gerencie cobrança e cancelamento da assinatura.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "10px 12px",
          marginBottom: 14,
          background: "rgba(232,164,48,0.08)",
          border: "0.5px solid rgba(232,164,48,0.15)",
          borderRadius: 10,
        }}
      >
        <AlertTriangle
          size={12}
          style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }}
        />
        <p style={{ fontSize: 11, color: "var(--rf-text-3)", lineHeight: 1.5 }}>
          Você será redirecionado para o link de pagamento Asaas, onde pode
          visualizar faturas e cancelar sua assinatura.
        </p>
      </div>

      <button
        onClick={handlePortal}
        disabled={loading}
        className="rf-btn-primary"
        style={{ width: "100%" }}
      >
        {loading ? (
          <>
            <Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />
            Abrindo portal...
          </>
        ) : (
          <>
            Gerenciar / cancelar assinatura
            <ExternalLink size={13} />
          </>
        )}
      </button>
    </div>
  );
}