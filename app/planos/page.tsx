"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Zap, Shield, Lock, Star, TrendingUp, Clock, Users, ChevronRight, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlanosPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [contador, setContador] = useState({ h: 2, m: 47, s: 33 });
  const [pulse, setPulse] = useState(false);

  // Contador regressivo falso — cria urgência
  useEffect(() => {
    const t = setInterval(() => {
      setContador(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 2; m = 47; s = 33; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 3000);
    return () => clearInterval(t);
  }, []);

  async function handleCheckout(tipo: string) {
    setLoading(tipo);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Erro ao iniciar pagamento.");
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  const features = [
    { icon: "📋", text: "Ordens de serviço ilimitadas" },
    { icon: "📦", text: "Controle de estoque completo" },
    { icon: "💰", text: "Precificação inteligente" },
    { icon: "⚡", text: "Módulo de Venda Rápida" },
    { icon: "📱", text: "Consulta de IMEI integrada" },
    { icon: "🎧", text: "Suporte prioritário" },
  ];

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#06060a",
      color: "white",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes floatup { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes rotateSlow { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(16,185,129,0.3)} 50%{box-shadow:0 0 60px rgba(16,185,129,0.6)} }
        @keyframes countpop { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .trim-btn:hover { transform: translateY(-2px) scale(1.01); }
        .mensal-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 600,
          background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-10%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }} />
        {/* Grid sutil */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "relative", zIndex: 10,
          maxWidth: 900, margin: "0 auto",
          padding: "28px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Wrench size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "white", fontFamily: "'Syne', sans-serif" }}>
            RepairFlow
          </span>
        </div>

        {/* Badge conta criada */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 99,
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "glow 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>Conta criada com sucesso</span>
        </div>
      </motion.header>

      <main style={{
        position: "relative", zIndex: 10,
        maxWidth: 860, margin: "0 auto",
        padding: "0 24px 80px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* Título principal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          {/* Pílula de urgência */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 18px", borderRadius: 99, marginBottom: 24,
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.35)",
              boxShadow: "0 0 20px rgba(245,158,11,0.1)",
            }}
          >
            <Clock size={13} color="#fbbf24" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.04em" }}>
              OFERTA ESPECIAL EXPIRA EM&nbsp;
            </span>
            <span style={{
              fontFamily: "monospace", fontSize: 13, fontWeight: 800,
              color: "#fbbf24", letterSpacing: "0.08em",
            }}>
              {pad(contador.h)}:{pad(contador.m)}:{pad(contador.s)}
            </span>
          </motion.div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 16,
            background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Sua assistência técnica<br />
            <span style={{
              background: "linear-gradient(135deg, #10b981, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              no próximo nível
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Profissionalize sua gestão hoje. Cada dia sem o RepairFlow é dinheiro deixado na mesa.
          </p>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex" }}>
                {["#f97316","#8b5cf6","#3b82f6","#10b981"].map((c, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: c, border: "2px solid #06060a",
                    marginLeft: i > 0 ? -8 : 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "white",
                  }}>
                    {["A","R","T","M"][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                <strong style={{ color: "white" }}>+240</strong> assistências ativas
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#fbbf24" color="#fbbf24" />)}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>
                <strong style={{ color: "white" }}>4.9</strong>/5
              </span>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20, width: "100%", alignItems: "start",
        }}>

          {/* MENSAL */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              borderRadius: 24,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 32,
              display: "flex", flexDirection: "column", gap: 28,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={15} color="rgba(255,255,255,0.5)" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Mensal</span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-0.03em", fontFamily: "'Syne', sans-serif" }}>
                  R$ 19,90
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                Sem compromisso de longo prazo
              </p>
            </div>

            <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {features.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              className="mensal-btn"
              onClick={() => handleCheckout("mensal")}
              disabled={!!loading}
              style={{
                width: "100%", padding: "14px 0",
                borderRadius: 14, cursor: "pointer",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
                opacity: !!loading ? 0.5 : 1,
              }}
            >
              {loading === "mensal"
                ? <Loader2 size={16} style={{ animation: "rotateSlow 0.8s linear infinite" }} />
                : "Começar agora"}
            </button>
          </motion.div>

          {/* TRIMESTRAL — destaque absoluto */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ position: "relative" }}
          >
            {/* Glow externo */}
            <div style={{
              position: "absolute", inset: -2,
              borderRadius: 26,
              background: "linear-gradient(135deg, #10b981, #059669, #047857)",
              filter: "blur(20px)",
              opacity: 0.35,
              animation: "glow 3s ease-in-out infinite",
            }} />

            <div style={{
              position: "relative",
              borderRadius: 24,
              background: "linear-gradient(145deg, #0d1a14 0%, #0a1510 100%)",
              border: "1.5px solid rgba(16,185,129,0.4)",
              padding: 32,
              display: "flex", flexDirection: "column", gap: 28,
              overflow: "hidden",
            }}>
              {/* Texture de fundo */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 200, height: 200,
                background: "radial-gradient(ellipse at top right, rgba(16,185,129,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Badge */}
              <div style={{
                position: "absolute", top: -1, right: 28,
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#011208",
                fontSize: 10, fontWeight: 800,
                padding: "6px 14px",
                borderRadius: "0 0 12px 12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
              }}>
                ⭐ Mais escolhido
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Shield size={15} color="#10b981" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>Trimestral</span>
                </div>

                {/* Preço com tachado */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 14, color: "rgba(255,255,255,0.25)",
                      textDecoration: "line-through",
                    }}>
                      R$ 59,70
                    </span>
                    <div style={{
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: 6, padding: "2px 8px",
                      fontSize: 11, fontWeight: 800, color: "#10b981",
                      letterSpacing: "0.04em",
                    }}>
                      −40%
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap" }}>
                    <span style={{
                      fontSize: 44, fontWeight: 900,
                      color: "white", letterSpacing: "-0.03em",
                      fontFamily: "'Syne', sans-serif",
                      whiteSpace: "nowrap",
                    }}>
                      R$ 34,90
                    </span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>/3 meses</span>
                  </div>
                </div>

                {/* Economia destacada */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 8, padding: "6px 12px",
                }}>
                  <TrendingUp size={13} color="#10b981" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>
                    Você economiza R$ 24,80 agora
                  </span>
                </div>
              </div>

              {/* Features com destaque */}
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {features.map((f, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Check size={12} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{f.text}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA principal */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <motion.button
                  className="trim-btn"
                  onClick={() => handleCheckout("trimestral")}
                  disabled={!!loading}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%",
                    padding: "17px 0",
                    borderRadius: 16, cursor: "pointer",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    border: "none",
                    color: "#011208",
                    fontSize: 15, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
                    transition: "all 0.2s",
                    opacity: !!loading ? 0.7 : 1,
                  }}
                >
                  {loading === "trimestral" ? (
                    <Loader2 size={18} style={{ animation: "rotateSlow 0.8s linear infinite" }} />
                  ) : (
                    <>
                      Quero economizar R$ 24,80
                      <ChevronRight size={18} />
                    </>
                  )}
                </motion.button>

                {/* Micro-copy de urgência */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                    {pulse ? "🔥 12 pessoas assinaram hoje" : "✅ Cancele quando quiser"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Depoimento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 40, width: "100%", maxWidth: 560,
            borderRadius: 20,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "24px 28px",
            display: "flex", gap: 16, alignItems: "flex-start",
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "white",
          }}>
            R
          </div>
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />)}
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, marginBottom: 10 }}>
              "Antes eu perdia peças, não sabia minha margem real, atrasava ordens. Agora controlo tudo pelo RepairFlow. <strong style={{ color: "rgba(255,255,255,0.8)" }}>Faturei 40% a mais no primeiro mês.</strong>"
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
              Roberto S. — Assistência Técnica RS Cell, Porto Alegre
            </p>
          </div>
        </motion.div>

        {/* Footer trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={13} color="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
              Pagamento 100% seguro via Stripe · Criptografia SSL
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
            Sem fidelidade · Cancele quando quiser · Sem taxa de cancelamento
          </p>
        </motion.div>
      </main>
    </div>
  );
}
