"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export function ExpiryBanner() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  // Reseta dismiss diário
  useEffect(() => {
    const saved = localStorage.getItem("rf_banner_dismissed");
    if (saved) {
      const dismissedAt = new Date(saved);
      const now = new Date();
      // Reexibe se passou de meia-noite
      if (dismissedAt.toDateString() !== now.toDateString()) {
        localStorage.removeItem("rf_banner_dismissed");
      } else {
        setDismissed(true);
      }
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem("rf_banner_dismissed", new Date().toISOString());
    setDismissed(true);
  }

  const user = session?.user as any;
  const planStatus    = user?.planStatus as string | undefined;
  const planExpiresAt = user?.planExpiresAt as string | null | undefined;

  if (!planExpiresAt || !planStatus) return null;
  if (planStatus === "inactive" || planStatus === "canceled") return null;
  if (dismissed) return null;

  const expiresDate = new Date(planExpiresAt);
  const now         = new Date();
  const diffMs = expiresDate.getTime() - now.getTime();
const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Só exibe se faltar 7 dias ou menos (e ainda não expirou)
  if (diffDays > 7 || diffDays < 0) return null;

  const isUrgent  = diffDays <= 2;
  const isToday   = diffDays <= 0;

  const msg = isToday
    ? "Seu plano expira hoje!"
    : diffDays === 1
    ? "Seu plano expira amanhã!"
    : `Seu plano expira em ${diffDays} dias.`;

  const sub = "Renove agora para continuar usando o RepairFlow sem interrupções.";

  // Cores adaptadas à urgência
  const colors = isUrgent
    ? {
        bg:     "rgba(224,82,82,0.08)",
        border: "rgba(224,82,82,0.22)",
        icon:   "#e05252",
        text:   "#fca5a5",
        sub:    "rgba(252,165,165,0.6)",
        btn:    { bg: "rgba(224,82,82,0.18)", border: "rgba(224,82,82,0.4)", color: "#fca5a5" },
        glow:   "rgba(224,82,82,0.12)",
      }
    : {
        bg:     "rgba(232,164,48,0.07)",
        border: "rgba(232,164,48,0.2)",
        icon:   "#e8a430",
        text:   "#fcd34d",
        sub:    "rgba(252,211,77,0.55)",
        btn:    { bg: "rgba(232,164,48,0.15)", border: "rgba(232,164,48,0.35)", color: "#fcd34d" },
        glow:   "rgba(232,164,48,0.08)",
      };

  return (
    <AnimatePresence>
      <motion.div
        key="expiry-banner"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "relative",
          width: "100%",
          background: colors.bg,
          borderBottom: `0.5px solid ${colors.border}`,
          boxShadow: `0 4px 24px ${colors.glow}`,
          zIndex: 40,
          overflow: "hidden",
        }}
      >
        {/* Glow strip no topo */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${colors.icon} 50%, transparent 100%)`,
          opacity: 0.5,
        }} />

        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          flexWrap: "wrap",
        }}>
          {/* Ícone */}
          <div style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: `rgba(${isUrgent ? "224,82,82" : "232,164,48"},0.12)`,
            border: `0.5px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <AlertTriangle size={13} style={{ color: colors.icon }} />
          </div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "'Geist', system-ui, sans-serif",
            }}>
              {msg}{" "}
            </span>
            <span style={{
              fontSize: 12,
              color: colors.sub,
              fontFamily: "'Geist', system-ui, sans-serif",
            }}>
              {sub}
            </span>
          </div>

          {/* Botão renovar */}
          <button
            onClick={() => router.push("/planos")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: `0.5px solid ${colors.btn.border}`,
              background: colors.btn.bg,
              color: colors.btn.color,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "'Geist', system-ui, sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <Zap size={12} />
            Renovar agora
          </button>

          {/* Fechar (só quando não é urgente) */}
          {!isUrgent && (
            <button
              onClick={handleDismiss}
              style={{
                width: 26, height: 26,
                borderRadius: 7,
                border: `0.5px solid ${colors.border}`,
                background: "transparent",
                color: colors.sub,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(${isUrgent ? "224,82,82" : "232,164,48"},0.1)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              title="Dispensar por hoje"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
