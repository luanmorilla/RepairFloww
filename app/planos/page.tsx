"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, Loader2, Zap, Shield, Lock, Star, TrendingUp, Clock,
  ChevronRight, Wrench, X, Copy, CheckCheck, CreditCard, QrCode,
  AlertTriangle, Users, BarChart2, Package, Smartphone, Headphones,
  ArrowRight, Play, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Metodo = "pix" | "cartao";
type EtapaModal = "metodo" | "cpf" | "pix-aguardando" | "confirmado";

interface PixData {
  paymentId: string;
  qrCode: string;
  copiaCola: string;
  valor: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");

const features = [
  { icon: <BarChart2 size={15} />, text: "Ordens de serviço ilimitadas", desc: "Abertura, acompanhamento e entrega de celulares em segundos" },
  { icon: <Package size={15} />, text: "Estoque de peças completo", desc: "Tela, bateria, conector — tudo rastreado. Nunca mais vende no prejuízo" },
  { icon: <TrendingUp size={15} />, text: "Precificação inteligente", desc: "Margem real por reparo, calculada automática" },
  { icon: <Zap size={15} />, text: "Módulo de Venda Rápida", desc: "Vende capinha, carregador e acessório sem abrir OS" },
  { icon: <Smartphone size={15} />, text: "Consulta de IMEI integrada", desc: "Confere bloqueio e situação do aparelho antes de aceitar" },
  { icon: <Headphones size={15} />, text: "Suporte prioritário", desc: "Time real disponível pra te ajudar quando precisar" },
];

const dores = [
  { emoji: "📱", title: "Celular entregue sem OS", sub: "Cliente busca o aparelho e você não lembra o que fez nem quanto cobrou" },
  { emoji: "💸", title: "Tela trocada no prejuízo", sub: "Comprou a peça por R$ 80, cobrou R$ 90. Ficou sem margem e sem controle" },
  { emoji: "👻", title: "Celular parado há 3 semanas", sub: "Cliente sumiu, aparelho ocupando bancada, dinheiro parado" },
  { emoji: "📦", title: "Peça comprada duas vezes", sub: "Estoque na cabeça. Comprou duplicado porque não sabia que tinha em casa" },
];

const depoimentos = [
  {
    nome: "Roberto S.",
    empresa: "RS Cell, Porto Alegre",
    foto: "#f97316",
    letra: "R",
    texto: "Antes eu perdia peça, não sabia minha margem real por reparo, atrasava entrega. Agora controlo tudo pelo RepairFlow.",
    destaque: "Faturei 40% a mais no primeiro mês.",
    stars: 5,
  },
  {
    nome: "Marcos T.",
    empresa: "TechFix, São Paulo",
    foto: "#8b5cf6",
    letra: "M",
    texto: "Eram 3 cadernos e um grupo de WhatsApp pra cada celular em reparo. Hoje é tudo numa tela só.",
    destaque: "Economizo 2 horas por dia.",
    stars: 5,
  },
  {
    nome: "Ana L.",
    empresa: "CelularFácil, Curitiba",
    foto: "#3b82f6",
    letra: "A",
    texto: "Nunca mais cobrei errado numa troca de tela. O sistema calcula a margem sozinho antes de eu confirmar o orçamento.",
    destaque: "Zero erro de precificação.",
    stars: 5,
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PlanosPage() {
  const router = useRouter();
  const { update } = useSession();

  // Contador regressivo
  const [contador, setContador] = useState({ h: 2, m: 47, s: 33 });
  const [pulse, setPulse] = useState(false);
  const [depoIdx, setDepoIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  // Contador de assinantes (animado)
  const [assinantes, setAssinantes] = useState(240);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [etapa, setEtapa] = useState<EtapaModal>("metodo");
  const [metodoSelecionado, setMetodoSelecionado] = useState<Metodo>("pix");
  const [tipoPlano, setTipoPlano] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // CPF
  const [cpfInput, setCpfInput] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [savingCpf, setSavingCpf] = useState(false);

  // PIX
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll para seção de planos
  const planosRef = useRef<HTMLDivElement>(null);

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

  // Rotaciona depoimentos
  useEffect(() => {
    const t = setInterval(() => setDepoIdx(i => (i + 1) % depoimentos.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Simula novos assinantes
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.7) setAssinantes(n => n + 1);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!showModal && pollingRef.current) clearTimeout(pollingRef.current);
  }, [showModal]);

  const iniciarPolling = useCallback(async () => {
    let count = 0;
    async function tentarAtualizar() {
      try {
        const res = await fetch("/api/auth/plan-status");
        const { planStatus } = await res.json();
        if (planStatus === "active") {
          await update();
          setEtapa("confirmado");
          setTimeout(() => router.replace("/painel"), 1500);
          return;
        }
        count++;
        setTentativas(count);
        if (count < 40) {
          pollingRef.current = setTimeout(tentarAtualizar, 1500);
        } else {
          await update();
          setEtapa("confirmado");
          setTimeout(() => router.replace("/painel"), 1500);
        }
      } catch {
        pollingRef.current = setTimeout(tentarAtualizar, 1500);
      }
    }
    setTimeout(tentarAtualizar, 1000);
  }, [update, router]);

  function abrirModal(tipo: string) {
    setTipoPlano(tipo);
    setEtapa("metodo");
    setMetodoSelecionado("pix");
    setErro("");
    setPixData(null);
    setTentativas(0);
    setShowModal(true);
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpfInput(value);
    setCpfError("");
  }

  async function salvarCpfEContinuar() {
    const cpfLimpo = cpfInput.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) { setCpfError("Digite um CPF válido com 11 dígitos."); return; }
    setSavingCpf(true);
    setCpfError("");
    try {
      const res = await fetch("/api/auth/update-cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj: cpfLimpo }),
      });
      if (!res.ok) { setCpfError("Erro ao salvar CPF. Tente novamente."); return; }
      await fazerCheckout();
    } catch { setCpfError("Erro inesperado. Tente novamente."); }
    finally { setSavingCpf(false); }
  }

  async function fazerCheckout() {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipoPlano, metodo: metodoSelecionado }),
      });
      const data = await res.json();
      if (res.status === 400 && data.error?.includes("CPF")) { setEtapa("cpf"); return; }
      if (!res.ok) { setErro(data.error || "Erro ao iniciar pagamento."); return; }
      if (data.metodo === "pix") { setPixData(data); setEtapa("pix-aguardando"); iniciarPolling(); return; }
      if (data.metodo === "cartao" && data.url) window.location.href = data.url;
    } catch { setErro("Erro ao iniciar pagamento. Tente novamente."); }
    finally { setLoading(false); }
  }

  async function copiarPix() {
    if (!pixData?.copiaCola) return;
    await navigator.clipboard.writeText(pixData.copiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function scrollToPlanos() {
    planosRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#06060a",
      color: "white",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(16,185,129,0.3)} 50%{box-shadow:0 0 60px rgba(16,185,129,0.6)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pixPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-40px);opacity:0} }
        @keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes scanline { 0%{top:0%} 100%{top:100%} }
        @keyframes timerPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes badgePop { 0%{transform:scale(0.8) translateY(10px);opacity:0} 60%{transform:scale(1.05) translateY(-2px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes orbFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.04)} }

        .trim-btn { transition: all 0.2s ease; }
        .trim-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(16,185,129,0.55) !important; }
        .mensal-btn { transition: all 0.2s ease; }
        .mensal-btn:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.2) !important; }
        .metodo-card { transition: all 0.18s ease; cursor: pointer; }
        .metodo-card:hover { border-color: rgba(16,185,129,0.4) !important; background: rgba(16,185,129,0.06) !important; }
        .dor-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .dor-card:hover { transform: translateY(-3px); border-color: rgba(239,68,68,0.3) !important; }
        .depo-dot { transition: all 0.3s; cursor: pointer; }
        .depo-dot:hover { background: rgba(255,255,255,0.5) !important; }
        .cta-hero { transition: all 0.2s ease; }
        .cta-hero:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(16,185,129,0.5) !important; }
        .cpf-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
          color: white; font-size: 18px; font-weight: 600; padding: 14px 18px;
          letter-spacing: 0.08em; outline: none; transition: border-color 0.2s; text-align: center;
        }
        .cpf-input:focus { border-color: rgba(16,185,129,0.5); }
        .cpf-input::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; letter-spacing: 0.02em; }
        .copiar-btn { transition: all 0.2s ease; }
        .copiar-btn:hover { background: rgba(16,185,129,0.15) !important; }
        .feature-row { transition: background 0.2s; border-radius: 10px; padding: 8px 6px; }
        .feature-row:hover { background: rgba(16,185,129,0.05); }

        /* Shimmer no botão principal */
        .shimmer-btn {
          background: linear-gradient(90deg, #059669 0%, #10b981 40%, #34d399 50%, #10b981 60%, #059669 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        /* Timer digits */
        .timer-digit {
          font-family: 'Courier New', monospace;
          font-variant-numeric: tabular-nums;
          animation: timerPulse 1s ease-in-out infinite;
        }

        /* Scroll indicator */
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .scroll-bounce { animation: bounce 1.8s infinite; }

        @media (max-width: 640px) {
          .hero-h1 { font-size: 32px !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .dores-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-row { flex-wrap: wrap; gap: 16px !important; }
        }
      `}</style>

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              style={{
                background: "#0a0f0c",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 24,
                padding: "32px 28px",
                width: "100%",
                maxWidth: 420,
                position: "relative",
              }}
            >
              {etapa !== "confirmado" && (
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    position: "absolute", top: 16, right: 16,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "rgba(255,255,255,0.35)",
                  }}
                ><X size={14} /></button>
              )}

              {/* ETAPA: Método */}
              {etapa === "metodo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Como prefere pagar?</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                      Plano {tipoPlano} · R$ {tipoPlano === "trimestral" ? "28,90" : "12,90"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { id: "pix" as Metodo, Icon: QrCode, label: "PIX", desc: "QR Code aqui mesmo · Confirmação instantânea" },
                      { id: "cartao" as Metodo, Icon: CreditCard, label: "Cartão de crédito", desc: "Redireciona para página segura do Asaas" },
                    ].map(({ id, Icon, label, desc }) => (
                      <div
                        key={id}
                        className="metodo-card"
                        onClick={() => setMetodoSelecionado(id)}
                        style={{
                          border: `1px solid ${metodoSelecionado === id ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)"}`,
                          background: metodoSelecionado === id ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
                          borderRadius: 14, padding: "16px 18px",
                          display: "flex", alignItems: "center", gap: 14,
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: metodoSelecionado === id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${metodoSelecionado === id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={18} color={metodoSelecionado === id ? "#10b981" : "rgba(255,255,255,0.3)"} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: metodoSelecionado === id ? "white" : "rgba(255,255,255,0.6)" }}>{label}</p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{desc}</p>
                        </div>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: `2px solid ${metodoSelecionado === id ? "#10b981" : "rgba(255,255,255,0.15)"}`,
                          background: metodoSelecionado === id ? "#10b981" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {metodoSelecionado === id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#011208" }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                  {erro && <p style={{ fontSize: 12, color: "#f87171", fontWeight: 500, textAlign: "center" }}>{erro}</p>}
                  <button
                    onClick={fazerCheckout}
                    disabled={loading}
                    className="shimmer-btn"
                    style={{
                      width: "100%", padding: "15px 0", borderRadius: 12,
                      border: "none", cursor: loading ? "not-allowed" : "pointer",
                      color: "#011208", fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <>Continuar <ChevronRight size={16} /></>}
                  </button>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>🔒 Pagamento seguro via Asaas</p>
                </div>
              )}

              {/* ETAPA: CPF */}
              {etapa === "cpf" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><Shield size={20} color="#10b981" /></div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>Informe seu CPF</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>Necessário para emitir sua cobrança. Seus dados são protegidos.</p>
                  </div>
                  <input className="cpf-input" type="text" placeholder="000.000.000-00" value={cpfInput} onChange={handleCpfChange} maxLength={14} autoFocus />
                  {cpfError && <p style={{ fontSize: 12, color: "#f87171", fontWeight: 500 }}>{cpfError}</p>}
                  <button
                    onClick={salvarCpfEContinuar}
                    disabled={savingCpf}
                    className="shimmer-btn"
                    style={{
                      width: "100%", padding: "15px 0", borderRadius: 12,
                      border: "none", cursor: savingCpf ? "not-allowed" : "pointer",
                      color: "#011208", fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: savingCpf ? 0.7 : 1,
                    }}
                  >
                    {savingCpf ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : "Confirmar e pagar"}
                  </button>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>🔒 Dados protegidos · Powered by Asaas</p>
                </div>
              )}

              {/* ETAPA: PIX */}
              {etapa === "pix-aguardando" && pixData && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Pague com PIX</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Escaneie o QR Code ou copie o código</p>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code PIX" width={200} height={200} style={{ display: "block" }} />
                  </div>
                  <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: "8px 20px", textAlign: "center" }}>
                    <span style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>R$ {pixData.valor.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div style={{ width: "100%" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 6, textAlign: "center" }}>Ou copie o código PIX</p>
                    <button
                      className="copiar-btn"
                      onClick={copiarPix}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: 10,
                        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                        cursor: "pointer", color: copiado ? "#10b981" : "rgba(255,255,255,0.6)",
                        fontSize: 13, fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      {copiado ? <><CheckCheck size={15} color="#10b981" /> Copiado!</> : <><Copy size={15} /> Copiar código PIX</>}
                    </button>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    width: "100%", justifyContent: "center",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", animation: "pixPulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                      Aguardando pagamento...{tentativas > 5 && ` (${tentativas}/40)`}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>Após o pagamento, seu plano é ativado automaticamente</p>
                </div>
              )}

              {/* ETAPA: Confirmado */}
              {etapa === "confirmado" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "8px 0" }}>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 14, stiffness: 260 }}
                    style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  ><Check size={34} color="#10b981" strokeWidth={2.5} /></motion.div>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#10b981", marginBottom: 6 }}>Plano ativado!</h2>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Redirecionando para o painel...</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={14} color="rgba(255,255,255,0.3)" style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Carregando painel</span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FUNDO AMBIENTE ─────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Orb principal */}
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 700,
          background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)",
          animation: "orbFloat 8s ease-in-out infinite",
        }} />
        {/* Orb secundário esquerda */}
        <div style={{
          position: "absolute", top: "40%", left: "-10%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 65%)",
          animation: "orbFloat 12s ease-in-out infinite reverse",
        }} />
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 80%)",
        }} />
      </div>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "relative", zIndex: 10,
          maxWidth: 960, margin: "0 auto",
          padding: "24px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Smartphone size={16} color="#10b981" /></div>
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em", display: "block" }}>RepairFlow</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 500, letterSpacing: "0.04em" }}>para assistência de celular</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "glow 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>Conta criada com sucesso</span>
        </div>
      </motion.header>

      <main style={{ position: "relative", zIndex: 10 }}>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 1 — HERO: QUEM É E QUAL DOR RESOLVE
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px 80px", textAlign: "center" }}>

          {/* Badge urgência */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "8px 18px", borderRadius: 99, marginBottom: 32,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle size={12} color="#f87171" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Oferta de lançamento · expira em
            </span>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[pad(contador.h), pad(contador.m), pad(contador.s)].map((v, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="timer-digit" style={{
                    fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#fbbf24",
                    background: "rgba(245,158,11,0.12)", padding: "2px 6px", borderRadius: 5,
                    letterSpacing: "0.05em",
                  }}>{v}</span>
                  {i < 2 && <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 12 }}>:</span>}
                </span>
              ))}
            </div>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="hero-h1"
            style={{
              fontSize: "clamp(36px, 5.5vw, 60px)", fontWeight: 900,
              lineHeight: 1.06, letterSpacing: "-0.04em", marginBottom: 22,
            }}
          >
            O sistema feito para<br />
            <span style={{
              background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%", animation: "gradientMove 4s ease infinite",
            }}>
              assistência técnica de celular
            </span>
          </motion.h1>

          {/* Subtítulo real */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.8, maxWidth: 540, margin: "0 auto 36px",
            }}
          >
            Gerencie OS, estoque de peças e cobranças<br />em um lugar só — do iPhone ao Android.<br />
            <strong style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Sem caderno. Sem WhatsApp. Sem improviso.</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}
          >
            <button
              className="cta-hero shimmer-btn"
              onClick={scrollToPlanos}
              style={{
                padding: "16px 32px", borderRadius: 14, border: "none",
                color: "#011208", fontSize: 15, fontWeight: 800,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
              }}
            >
              Começar agora <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setShowVideo(true)}
              style={{
                padding: "16px 28px", borderRadius: 14, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.65)", fontSize: 15, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              <Play size={14} fill="currentColor" /> Ver como funciona
            </button>
          </motion.div>

          {/* Social proof inline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="stats-row"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}
          >
            {/* Avatares */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex" }}>
                {["#f97316","#8b5cf6","#3b82f6","#10b981"].map((c, i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: "50%", background: c,
                    border: "2px solid #06060a", marginLeft: i > 0 ? -9 : 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "white",
                  }}>
                    {["A","R","T","M"][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                <strong style={{ color: "white", fontWeight: 700 }}>+{assinantes}</strong> assistências ativas
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#fbbf24" color="#fbbf24" />)}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>
                <strong style={{ color: "white" }}>4.9</strong>/5
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "glow 2s infinite" }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                <strong style={{ color: "#34d399" }}>12</strong> assinaram hoje
              </span>
            </div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="scroll-bounce"
            style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}
            onClick={scrollToPlanos}
          >
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ver planos</span>
            <ChevronDown size={16} color="rgba(255,255,255,0.2)" />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 2 — DOR: O CAOS QUE ELE VIVE HOJE
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ background: "rgba(239,68,68,0.03)", borderTop: "1px solid rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.08)", padding: "60px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: 40 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                Isso ainda acontece na sua assistência?
              </p>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                A maioria das assistências de celular<br />
                <span style={{ color: "#f87171" }}>perde dinheiro sem perceber</span>
              </h2>
            </motion.div>

            <div className="dores-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {dores.map((d, i) => (
                <motion.div
                  key={i}
                  className="dor-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)",
                    borderRadius: 16, padding: "20px 18px",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{d.emoji}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6, lineHeight: 1.3 }}>{d.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>{d.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Transição para solução */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginTop: 40, padding: "24px 0" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06))" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>Com o RepairFlow</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(255,255,255,0.06))" }} />
              </div>
              <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 700, color: "#34d399" }}>
                Tudo isso vira passado no primeiro dia de uso.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 3 — SOLUÇÃO: COMO FICA COM O REPAIRFLOW
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "72px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: 52 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                O que você ganha
              </p>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Tudo que sua assistência precisa,<br />em um lugar só
              </h2>
            </motion.div>

            {/* Features em grid 2 colunas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="feature-row"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    display: "flex", gap: 16, alignItems: "flex-start",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 14, padding: "18px 18px",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981",
                  }}>{f.icon}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>{f.text}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Números de resultado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                marginTop: 48, display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 2, borderRadius: 20, overflow: "hidden",
                border: "1px solid rgba(16,185,129,0.12)",
              }}
            >
              {[
                { num: "40%", label: "mais faturamento", sub: "média dos técnicos no 1º mês de uso" },
                { num: "2h", label: "economizadas por dia", sub: "sem caderno, sem WhatsApp, sem improviso" },
                { num: "0", label: "celular perdido na bancada", sub: "cada aparelho rastreado do recebimento à entrega" },
                { num: "30s", label: "para abrir uma OS", sub: "do IMEI ao orçamento enviado pro cliente" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "28px 24px", textAlign: "center",
                  background: i % 2 === 0 ? "rgba(16,185,129,0.04)" : "rgba(16,185,129,0.02)",
                  borderRight: i < 3 ? "1px solid rgba(16,185,129,0.08)" : "none",
                }}>
                  <p style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#10b981", lineHeight: 1 }}>{s.num}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>{s.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 4 — PROVA SOCIAL: DEPOIMENTOS
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "64px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: 44 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                Quem já usa
              </p>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Técnicos reais. Resultados reais.
              </h2>
            </motion.div>

            {/* Carrossel de depoimentos */}
            <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={depoIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 20, padding: "28px 28px", display: "flex", gap: 18,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${depoimentos[depoIdx].foto}, #111)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "white",
                  }}>
                    {depoimentos[depoIdx].letra}
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#fbbf24" color="#fbbf24" />)}
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 10 }}>
                      "{depoimentos[depoIdx].texto}{" "}
                      <strong style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>{depoimentos[depoIdx].destaque}</strong>"
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>{depoimentos[depoIdx].nome} — {depoimentos[depoIdx].empresa}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                {depoimentos.map((_, i) => (
                  <div
                    key={i}
                    className="depo-dot"
                    onClick={() => setDepoIdx(i)}
                    style={{
                      width: i === depoIdx ? 24 : 7, height: 7, borderRadius: 99,
                      background: i === depoIdx ? "#10b981" : "rgba(255,255,255,0.15)",
                      transition: "all 0.35s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 5 — PLANOS
        ══════════════════════════════════════════════════════════════════ */}
        <section ref={planosRef} style={{ padding: "72px 24px 80px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>

            {/* Header da seção */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: 44 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                Escolha seu plano
              </p>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 12 }}>
                Invista menos que um almoço por mês
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Sem fidelidade. Cancele quando quiser. Sem surpresa.</p>
            </motion.div>

            {/* Cards */}
            <div
              className="plans-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}
            >
              {/* MENSAL */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                style={{
                  borderRadius: 20, background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "28px 28px 32px", display: "flex", flexDirection: "column", gap: 22,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Zap size={14} color="rgba(255,255,255,0.4)" /></div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Mensal</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>R$ 12,90</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", marginLeft: 2 }}>/mês</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>Sem compromisso de longo prazo</p>
                </div>

                <ul style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}><Check size={10} color="rgba(255,255,255,0.3)" /></div>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="mensal-btn"
                  onClick={() => abrirModal("mensal")}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 12, cursor: "pointer",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >Começar agora</button>
              </motion.div>

              {/* TRIMESTRAL */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                style={{ position: "relative" }}
              >
                {/* Glow externo */}
                <div style={{
                  position: "absolute", inset: -2, borderRadius: 22,
                  background: "linear-gradient(135deg, rgba(16,185,129,0.5), rgba(5,150,105,0.3))",
                  filter: "blur(20px)", opacity: 0.28,
                }} />

                <div style={{
                  position: "relative", borderRadius: 20,
                  background: "linear-gradient(160deg, #0c1a13 0%, #091310 100%)",
                  border: "1px solid rgba(16,185,129,0.38)",
                  padding: "28px 28px 32px",
                  display: "flex", flexDirection: "column", gap: 22, overflow: "hidden",
                }}>
                  {/* Orb interno */}
                  <div style={{
                    position: "absolute", top: 0, right: 0, width: 250, height: 250,
                    background: "radial-gradient(ellipse at top right, rgba(16,185,129,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />

                  {/* Badge */}
                  <div style={{
                    position: "absolute", top: -1, right: 24,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#011208", fontSize: 10, fontWeight: 800,
                    padding: "5px 12px", borderRadius: "0 0 10px 10px",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    animation: "badgePop 0.6s ease forwards",
                  }}>⭐ Mais escolhido</div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}><Shield size={14} color="#10b981" /></div>
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
                        <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>R$ 28,90</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/3 meses</span>
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

                  <ul style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {features.map((f, i) => (
                      <motion.li key={i}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6,
                          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}><Check size={11} color="#10b981" /></div>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{f.text}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <motion.button
                      className="trim-btn shimmer-btn"
                      onClick={() => abrirModal("trimestral")}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: "100%", padding: "16px 0", borderRadius: 12, cursor: "pointer",
                        border: "none", color: "#011208", fontSize: 14, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: "0 8px 28px rgba(16,185,129,0.35)",
                      }}
                    >
                      Quero economizar R$ 9,80 <ChevronRight size={16} />
                    </motion.button>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                        {pulse ? "🔥 12 pessoas assinaram hoje" : "✅ Cancele quando quiser"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Garantias */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                marginTop: 32, display: "flex", justifyContent: "center",
                flexWrap: "wrap", gap: 20,
              }}
            >
              {[
                { icon: "🔒", text: "Pagamento seguro via Asaas" },
                { icon: "🔄", text: "Cancele quando quiser" },
                { icon: "⚡", text: "Acesso imediato após pagamento" },
                { icon: "🎧", text: "Suporte humano incluído" },
              ].map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{g.icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>{g.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

      </main>
    </div>
  );
}
