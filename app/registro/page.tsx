"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, Eye, EyeOff, CheckCircle2, Play,
  Smartphone, Star, Check, TrendingUp, Package,
  BarChart2, Zap, Shield, ArrowRight, Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Schema ───────────────────────────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
  shopName: z.string().min(3, "Digite o nome da assistência"),
  email: z.string().email("Digite um e-mail válido"),
  cpfCnpj: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof formSchema>;

// ─── Video ────────────────────────────────────────────────────────────────────
function VideoDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "#0a0f0c", border: "1px solid rgba(16,185,129,0.15)", aspectRatio: "16/9" }}>
      <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} playsInline onPlay={() => setPlaying(true)}>
        <source src="/videos/demo.mp4" type="video/mp4" />
      </video>
      {!playing && (
        <div
          onClick={() => { videoRef.current?.play(); setPlaying(true); }}
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", background: "rgba(0,0,0,0.5)",
          }}
        >
          {/* Pulse ring */}
          <div style={{ position: "relative", width: 64, height: 64 }}>
            <div style={{
              position: "absolute", inset: -8, borderRadius: "50%",
              border: "2px solid rgba(16,185,129,0.3)",
              animation: "pulseRing 2s ease-out infinite",
            }} />
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(16,185,129,0.45)",
            }}>
              <Play size={24} color="#011208" fill="#011208" style={{ marginLeft: 3 }} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 16, left: 16 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: 99 }}>
              Ver como funciona em 60s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Benefícios do lado direito ────────────────────────────────────────────────
const beneficios = [
  { icon: <BarChart2 size={14} />, text: "Abra uma OS em 30 segundos" },
  { icon: <Package size={14} />, text: "Estoque de peças sempre atualizado" },
  { icon: <TrendingUp size={14} />, text: "Margem real em cada reparo" },
  { icon: <Smartphone size={14} />, text: "Consulta de IMEI integrada" },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setValue("cpfCnpj", value);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Erro ao criar conta.");
      setSuccess(true);
      setTimeout(() => router.push("/planos"), 1800);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Estilos dos inputs ──────────────────────────────────────────────────
  const inputStyle = (name: string, hasError: boolean): React.CSSProperties => ({
    width: "100%",
    height: 48,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "rgba(248,113,113,0.6)" : focusedField === name ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 12,
    color: "white",
    fontSize: 14,
    padding: "0 14px",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#06060a",
      color: "white",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "row",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(16,185,129,0.3)} 50%{box-shadow:0 0 40px rgba(16,185,129,0.6)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .submit-btn {
          background: linear-gradient(90deg, #059669 0%, #10b981 40%, #34d399 50%, #10b981 60%, #059669 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 32px rgba(16,185,129,0.45) !important;
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; animation: none; background: #059669; }

        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0f1a14 inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white;
        }

        /* Mobile: coluna única */
        @media (max-width: 1023px) {
          .page-layout { flex-direction: column !important; }
          .form-col { width: 100% !important; min-height: auto !important; padding: 32px 24px !important; }
          .right-col { display: none !important; }
          .mobile-banner { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .mobile-banner { display: none !important; }
          .form-col { width: 50% !important; }
          .right-col { display: flex !important; }
        }
      `}</style>

      {/* ── FUNDO ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-20%", left: "25%",
          width: 700, height: 600,
          background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 30% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 30% 0%, black 30%, transparent 75%)",
        }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE BANNER (só aparece em telas pequenas)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mobile-banner" style={{
        display: "none",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(6,6,10,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(16,185,129,0.12)",
        padding: "12px 20px",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Smartphone size={13} color="#10b981" /></div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em" }}>RepairFlow</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 99, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "glow 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981" }}>+240 assistências ativas</span>
        </div>
      </div>

      {/* Layout principal */}
      <div className="page-layout" style={{ display: "flex", flexDirection: "row", width: "100%", position: "relative", zIndex: 10 }}>

        {/* ══════════════════════════════════════════════════════════════════
            COLUNA ESQUERDA — FORMULÁRIO
        ══════════════════════════════════════════════════════════════════ */}
        <div className="form-col" style={{
          width: "50%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Smartphone size={15} color="#10b981" /></div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", display: "block" }}>RepairFlow</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>para assistência de celular</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ marginBottom: 32 }}
            >
              <h1 style={{
                fontSize: "clamp(26px, 3vw, 32px)", fontWeight: 900,
                letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 8,
              }}>
                Crie sua conta grátis
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Configure em 60 segundos e comece a organizar<br />
                sua assistência técnica hoje mesmo.
              </p>
            </motion.div>

            {/* Erro API */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: "12px 16px", marginBottom: 20,
                    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                    borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#f87171",
                  }}
                >{apiError}</motion.div>
              )}
            </AnimatePresence>

            {/* Sucesso */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: "20px", marginBottom: 20,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 16, display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}><CheckCircle2 size={20} color="#10b981" /></div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#10b981", marginBottom: 2 }}>Conta criada com sucesso!</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Redirecionando para escolha do plano...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulário */}
            {!success && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onSubmit={handleSubmit(onSubmit)}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Nome */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6 }}>
                    Nome completo
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Ex: João Silva"
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("name", !!errors.name)}
                  />
                  {errors.name && <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{errors.name.message}</p>}
                </div>

                {/* Nome da assistência */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6 }}>
                    Nome da assistência
                  </label>
                  <input
                    {...register("shopName")}
                    placeholder="Ex: TechFix Pro"
                    onFocus={() => setFocusedField("shopName")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("shopName", !!errors.shopName)}
                  />
                  {errors.shopName && <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{errors.shopName.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6 }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="contato@suaassistencia.com"
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("email", !!errors.email)}
                  />
                  {errors.email && <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{errors.email.message}</p>}
                </div>

                {/* CPF */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6 }}>
                    CPF
                  </label>
                  <input
                    {...register("cpfCnpj")}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    onFocus={() => setFocusedField("cpf")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("cpf", !!errors.cpfCnpj)}
                  />
                  {errors.cpfCnpj && <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{errors.cpfCnpj.message}</p>}
                </div>

                {/* Senha */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6 }}>
                    Senha
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="Mínimo 6 caracteres"
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputStyle("password", !!errors.password), paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.3)", padding: 0, display: "flex",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{errors.password.message}</p>}
                </div>

                {/* Submit */}
                <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 14 }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="submit-btn"
                    style={{
                      width: "100%", height: 50, borderRadius: 13,
                      border: "none", cursor: "pointer",
                      color: "#011208", fontSize: 14, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 6px 24px rgba(16,185,129,0.35)",
                    }}
                  >
                    {isLoading
                      ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Criando conta...</>
                      : <>Criar minha conta <ArrowRight size={15} /></>
                    }
                  </button>

                  <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                    Já tem conta?{" "}
                    <Link href="/login" style={{ color: "#10b981", fontWeight: 700, textDecoration: "none" }}>
                      Fazer login
                    </Link>
                  </p>
                </div>
              </motion.form>
            )}

            {/* Micro social proof embaixo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}
            >
              <div style={{ display: "flex" }}>
                {["#f97316","#8b5cf6","#3b82f6","#10b981"].map((c, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: "50%", background: c,
                    border: "2px solid #06060a", marginLeft: i > 0 ? -7 : 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "white",
                  }}>{["A","R","T","M"][i]}</div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                <strong style={{ color: "rgba(255,255,255,0.55)" }}>+240 técnicos</strong> já usam o RepairFlow
              </span>
            </motion.div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            COLUNA DIREITA — PITCH + VÍDEO
        ══════════════════════════════════════════════════════════════════ */}
        <div className="right-col" style={{
          width: "50%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          background: "rgba(16,185,129,0.015)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Orb decorativo */}
          <div style={{
            position: "absolute", top: "-10%", right: "-10%",
            width: 500, height: 500,
            background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 460, width: "100%", position: "relative" }}>

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "glow 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Para assistência técnica de celular
              </span>
            </motion.div>

            {/* Headline direita */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                fontSize: "clamp(24px, 2.5vw, 34px)", fontWeight: 900,
                letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 12,
              }}
            >
              Do IMEI ao pagamento,<br />
              <span style={{
                background: "linear-gradient(135deg, #10b981, #34d399)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                tudo em 30 segundos
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, marginBottom: 28 }}
            >
              Chega de caderno, WhatsApp e improviso. Veja como funciona na prática.
            </motion.p>

            {/* Vídeo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ marginBottom: 28 }}
            >
              <VideoDemo />
            </motion.div>

            {/* Benefícios */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}
            >
              {beneficios.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981",
                  }}>{b.icon}</div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{b.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Depoimento */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, padding: "18px 20px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "white",
              }}>R</div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={11} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, marginBottom: 6 }}>
                  "Faturei{" "}
                  <strong style={{ color: "rgba(255,255,255,0.75)" }}>40% a mais no primeiro mês</strong>
                  {" "}depois que comecei a usar o RepairFlow."
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Roberto S. — RS Cell, Porto Alegre</p>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
}
