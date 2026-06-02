"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Zap, Shield, Lock, Star, TrendingUp, Clock, ChevronRight, Wrench, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlanosPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [contador, setContador] = useState({ h: 2, m: 47, s: 33 });
  const [pulse, setPulse] = useState(false);

  // Modal CPF
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [savingCpf, setSavingCpf] = useState(false);
  const [pendingTipo, setPendingTipo] = useState<string | null>(null);

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

  // Formata CPF enquanto digita
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpfInput(value);
    setCpfError("");
  };

  async function handleCheckout(tipo: string) {
    setLoading(tipo);
    try {
      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      const data = await res.json();

      // Se não tem CPF, abre o modal
      if (res.status === 400 && data.error?.includes("CPF")) {
        setPendingTipo(tipo);
        setShowCpfModal(true);
        return;
      }

      if (data.url) window.location.href = data.url;
      else alert(data.error || "Erro ao iniciar pagamento.");
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveCpfAndCheckout() {
    const cpfLimpo = cpfInput.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      setCpfError("Digite um CPF válido com 11 dígitos.");
      return;
    }

    setSavingCpf(true);
    setCpfError("");

    try {
      // Salva o CPF no banco
      const saveRes = await fetch("/api/auth/update-cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj: cpfLimpo }),
      });

      if (!saveRes.ok) {
        setCpfError("Erro ao salvar CPF. Tente novamente.");
        return;
      }

      // Agora faz o checkout com o CPF salvo
      setShowCpfModal(false);
      setLoading(pendingTipo);

      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: pendingTipo }),
      });
      const data = await res.json();

      if (data.url) window.location.href = data.url;
      else alert(data.error || "Erro ao iniciar pagamento.");
    } catch {
      setCpfError("Erro inesperado. Tente novamente.");
    } finally {
      setSavingCpf(false);
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
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(16,185,129,0.3)} 50%{box-shadow:0 0 60px rgba(16,185,129,0.6)} }
        @keyframes rotateSlow { to { transform: rotate(360deg); } }
        .trim-btn { transition: all 0.2s ease; }
        .trim-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(16,185,129,0.5) !important; }
        .mensal-btn { transition: all 0.2s ease; }
        .mensal-btn:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.2) !important; }
        .cpf-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          padding: 14px 18px;
          letter-spacing: 0.08em;
          outline: none;
          transition: border-color 0.2s;
          text-align: center;
        }
        .cpf-input:focus { border-color: rgba(16,185,129,0.5); }
        .cpf-input::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; letter-spacing: 0.02em; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
          width: 1000, height: 700,
          background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />
      </div>

      {/* MODAL CPF */}
      <AnimatePresence>
        {showCpfModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              style={{
                background: "#0e1a14",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 24,
                padding: "36px 32px",
                width: "100%",
                maxWidth: 420,
                position: "relative",
              }}
            >
              {/* Fechar */}
              <button
                onClick={() => setShowCpfModal(false)}
                style={{
                  position: "absolute", top: 16, right: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(255,255,255,0.4)",
                }}
              >
                <X size={14} />
              </button>

              {/* Ícone */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <Shield size={22} color="#10b981" />
              </div>

              <h2 style={{
                fontSize: 22, fontWeight: 800, color: "white",
                letterSpacing: "-0.03em", marginBottom: 8,
              }}>
                Informe seu CPF
              </h2>
              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.38)",
                lineHeight: 1.6, marginBottom: 28,
              }}>
                Necessário para emitir sua cobrança com segurança. Seus dados são protegidos e não são compartilhados.
              </p>

              <input
                className="cpf-input"
                type="text"
                placeholder="000.000.000-00"
                value={cpfInput}
                onChange={handleCpfChange}
                maxLength={14}
                autoFocus
              />

              {cpfError && (
                <p style={{
                  fontSize: 12, color: "#f87171",
                  marginTop: 8, fontWeight: 500,
                }}>
                  {cpfError}
                </p>
              )}

              <button
                onClick={handleSaveCpfAndCheckout}
                disabled={savingCpf}
                style={{
                  width: "100%", marginTop: 20,
                  padding: "15px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  border: "none", cursor: savingCpf ? "not-allowed" : "pointer",
                  color: "#011208", fontSize: 14, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: savingCpf ? 0.7 : 1,
                  boxShadow: "0 6px 24px rgba(16,185,129,0.3)",
                }}
              >
                {savingCpf
                  ? <><Loader2 size={15} style={{ animation: "rotateSlow 0.8s linear infinite" }} /> Salvando...</>
                  : "Confirmar e pagar"}
              </button>

              <p style={{
                fontSize: 11, color: "rgba(255,255,255,0.18)",
                textAlign: "center", marginTop: 14,
              }}>
                🔒 Dados protegidos · Powered by Asaas
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Wrench size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
            RepairFlow
          </span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 14px", borderRadius: 99,
          background: "rgba(16,185,129,0.07)",
          border: "1px solid rgba(16,185,129,0.18)",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "glow 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", letterSpacing: "0.01em" }}>Conta criada com sucesso</span>
        </div>
      </motion.header>

      <main style={{
        position: "relative", zIndex: 10,
        maxWidth: 860, margin: "0 auto",
        padding: "0 24px 80px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 16px", borderRadius: 99, marginBottom: 28,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            <Clock size={12} color="#fbbf24" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Oferta especial expira em
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.1em" }}>
              {pad(contador.h)}:{pad(contador.m)}:{pad(contador.s)}
            </span>
          </motion.div>

          <h1 style={{
            fontSize: "clamp(34px, 5.5vw, 56px)",
            fontWeight: 800, lineHeight: 1.08,
            letterSpacing: "-0.035em", marginBottom: 18, color: "white",
          }}>
            Sua assistência técnica<br />
            <span style={{
              background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              no próximo nível
            </span>
          </h1>

          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.38)",
            lineHeight: 1.75, maxWidth: 460, margin: "0 auto",
            fontWeight: 400, letterSpacing: "0.005em",
          }}>
            Profissionalize sua gestão hoje. Cada dia sem o RepairFlow é dinheiro deixado na mesa.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex" }}>
                {["#f97316","#8b5cf6","#3b82f6","#10b981"].map((c, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: c, border: "2px solid #06060a",
                    marginLeft: i > 0 ? -8 : 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "white",
                  }}>
                    {["A","R","T","M"][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                <strong style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>+240</strong> assistências ativas
              </span>
            </div>
            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />)}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 4, fontWeight: 500 }}>
                <strong style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>4.9</strong>/5
              </span>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20, width: "100%", alignItems: "start",
        }}>

          {/* MENSAL */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              borderRadius: 20,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "28px 28px 32px",
              display: "flex", flexDirection: "column", gap: 24,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={14} color="rgba(255,255,255,0.4)" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.01em" }}>Mensal</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  R$ 12,90
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginLeft: 2, fontWeight: 500 }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>
                Sem compromisso de longo prazo
              </p>
            </div>

            <ul style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {features.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15 }}>{f.icon}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", fontWeight: 400 }}>{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              className="mensal-btn"
              onClick={() => handleCheckout("mensal")}
              disabled={!!loading}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: !!loading ? 0.5 : 1,
              }}
            >
              {loading === "mensal"
                ? <Loader2 size={15} style={{ animation: "rotateSlow 0.8s linear infinite" }} />
                : "Começar agora"}
            </button>
          </motion.div>

          {/* TRIMESTRAL */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ position: "relative" }}
          >
            <div style={{
              position: "absolute", inset: -1, borderRadius: 22,
              background: "linear-gradient(135deg, rgba(16,185,129,0.5), rgba(5,150,105,0.3))",
              filter: "blur(18px)", opacity: 0.3,
            }} />
            <div style={{
              position: "relative", borderRadius: 20,
              background: "linear-gradient(160deg, #0c1a13 0%, #091310 100%)",
              border: "1px solid rgba(16,185,129,0.35)",
              padding: "28px 28px 32px",
              display: "flex", flexDirection: "column", gap: 24, overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, right: 0, width: 220, height: 220,
                background: "radial-gradient(ellipse at top right, rgba(16,185,129,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", top: -1, right: 24,
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#011208", fontSize: 10, fontWeight: 800,
                padding: "5px 12px", borderRadius: "0 0 10px 10px",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                ⭐ Mais escolhido
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Shield size={14} color="#10b981" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>Trimestral</span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textDecoration: "line-through" }}>R$ 38,70</span>
                    <div style={{
                      background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                      borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 800, color: "#10b981",
                    }}>−25%</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 48, fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      R$ 28,90
                    </span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>/3 meses</span>
                  </div>
                </div>

                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)",
                  borderRadius: 8, padding: "6px 12px",
                }}>
                  <TrendingUp size={12} color="#10b981" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>Você economiza R$ 9,80 agora</span>
                </div>
              </div>

              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {features.map((f, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Check size={11} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 400 }}>{f.text}</span>
                  </motion.li>
                ))}
              </ul>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <motion.button
                  className="trim-btn"
                  onClick={() => handleCheckout("trimestral")}
                  disabled={!!loading}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", padding: "16px 0", borderRadius: 12, cursor: "pointer",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    border: "none", color: "#011208", fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 8px 28px rgba(16,185,129,0.35)",
                    opacity: !!loading ? 0.7 : 1,
                  }}
                >
                  {loading === "trimestral"
                    ? <Loader2 size={16} style={{ animation: "rotateSlow 0.8s linear infinite" }} />
                    : <>Quero economizar R$ 9,80 <ChevronRight size={16} /></>}
                </motion.button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 500 }}>
                    {pulse ? "🔥 12 pessoas assinaram hoje" : "✅ Cancele quando quiser"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Depoimento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            marginTop: 40, width: "100%", maxWidth: 540, borderRadius: 18,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            padding: "22px 26px", display: "flex", gap: 16, alignItems: "flex-start",
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "white",
          }}>R</div>
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={11} fill="#fbbf24" color="#fbbf24" />)}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 10 }}>
              "Antes eu perdia peças, não sabia minha margem real, atrasava ordens. Agora controlo tudo pelo RepairFlow.{" "}
              <strong style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Faturei 40% a mais no primeiro mês.</strong>"
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
              Roberto S. — RS Cell, Porto Alegre
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={12} color="rgba(255,255,255,0.2)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
              Pagamento 100% seguro via Asaas · Pix, Boleto ou Cartão
            </span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.12)" }}>
            Sem fidelidade · Cancele quando quiser · Sem taxa de cancelamento
          </p>
        </motion.div>
      </main>
    </div>
  );
}
