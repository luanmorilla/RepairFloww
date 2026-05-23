"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Wrench, Package, Plus, ShoppingBag,
  Clock, DollarSign, Settings, LogOut, Store, Phone,
  ShieldCheck, ImagePlus, Save, Loader2, X, CheckCircle2,
  Smartphone, Search, AlertTriangle, CheckCircle, XCircle,
  Info, ExternalLink, TrendingUp, Zap,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { OsTable } from "@/components/dashboard/os-table";
import { StockTab } from "@/components/dashboard/stock-tab";
import { VendaRapidaModal } from "@/components/dashboard/venda-rapida-modal";
import { fetchDashboardData } from "@/actions/dashboard-actions";
import { getShopSettings, updateShopSettings } from "@/actions/shop-actions";
import { useRouter } from "next/navigation";
import { detectarMarca } from "@/lib/detectarMarca";

type Tab = "dashboard" | "os" | "estoque" | "imei" | "configuracoes";

// ─────────────────────────────────────────
// Sub-componente: Aba de Configurações
// ─────────────────────────────────────────
function ConfiguracoesTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [warranty, setWarranty] = useState(90);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getShopSettings()
      .then((shop) => {
        setName(shop.name ?? "");
        setPhone(shop.phone ?? "");
        setWarranty(shop.standardWarranty ?? 90);
        setLogo(shop.logo ?? null);
        setLogoPreview(shop.logo ?? null);
      })
      .catch(() => setError("Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("A imagem deve ter no máximo 2MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64); setLogo(base64); setRemoveLogo(false);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setLogoPreview(null); setLogo(null); setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!name.trim()) { setError("O nome da loja é obrigatório."); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      await updateShopSettings({ name: name.trim(), phone: phone.trim(), standardWarranty: Number(warranty), logo: removeLogo ? null : logo });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Erro ao salvar. Tente novamente."); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rf-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Store className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Dados da Assistência</h2>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {logoPreview ? (
              <>
                <Image src={logoPreview} alt="Logo" fill className="object-contain p-2" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-white" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }} className="absolute top-1.5 right-1.5 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition z-10">
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-white/20 group-hover:text-white/40 transition">
                <ImagePlus className="w-6 h-6" />
                <span className="text-[9px]">Logo</span>
              </div>
            )}
          </div>
          <p className="text-xs text-white/20">PNG, JPG ou SVG · máx. 2MB</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>

        <div className="space-y-4">
          {[
            { label: "Nome da Loja", icon: Store, value: name, onChange: setName, placeholder: "Ex: TechFix Assistência" },
            { label: "WhatsApp", icon: Phone, value: phone, onChange: setPhone, placeholder: "(11) 99999-9999" },
          ].map(({ label, icon: Icon, value, onChange, placeholder }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-xs text-white/40 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                <Icon className="w-3 h-3" /> {label}
              </label>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="rf-input"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs text-white/40 flex items-center gap-1.5 font-medium uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" /> Garantia Padrão
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="number" min={1} max={730} value={warranty}
                onChange={(e) => setWarranty(Number(e.target.value))}
                className="rf-input w-20 text-center"
              />
              <span className="text-white/30 text-sm">dias</span>
              <div className="flex gap-2 ml-auto">
                {[30, 60, 90, 180].map((d) => (
                  <button key={d} onClick={() => setWarranty(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${warranty === d ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">Configurações salvas com sucesso!</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="rf-btn-primary w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>

      <div className="rf-card p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Conta</h2>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 transition-all">
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-componente: Aba de Consulta IMEI
// ─────────────────────────────────────────
function ImeiTab() {
  const [imei, setImei] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function validarLuhn(num: string): boolean {
    let sum = 0; let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);
      if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit; shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function consultar() {
    setErro(""); setResultado(null);
    const num = imei.replace(/\D/g, "");
    if (num.length !== 15) { setErro("O IMEI deve ter exatamente 15 dígitos."); return; }
    if (!validarLuhn(num)) { setErro("IMEI inválido — falhou na verificação de dígito (Luhn). Verifique se digitou corretamente."); return; }
    setLoading(true);
    setTimeout(() => {
      const { marca, info } = detectarMarca(num);
      setResultado({ imei: num, marca, info });
      setLoading(false);
    }, 800);
  }

  const imeiLimpo = imei.replace(/\D/g, "");

  const linksConsulta = [
    { nome: "Anatel — Homologação Oficial", descricao: "Verifica homologação no Brasil", url: "https://sistemas.anatel.gov.br/sch/", badge: "BR" },
    { nome: "Apple — Verificar Cobertura", descricao: "Status, garantia e bloqueio de iPhones", url: "https://checkcoverage.apple.com/br/pt/", badge: "iOS" },
    { nome: "Consulta IMEI Brasil", descricao: "Base de operadoras brasileiras", url: `https://www.consultaimei.com.br/${imeiLimpo ? `?imei=${imeiLimpo}` : ""}`, badge: "BR" },
    { nome: "IMEI.info — Internacional", descricao: "Informações detalhadas do dispositivo", url: `https://www.imei.info/${imeiLimpo ? `?imei=${imeiLimpo}` : ""}`, badge: "INT" },
    { nome: "Vivo — Desbloqueio", descricao: "Verificar bloqueio de rede Vivo", url: "https://www.vivo.com.br/para-voce/produtos-e-servicos/para-o-celular/desbloqueio/", badge: "OP" },
    { nome: "Claro — Desbloqueio", descricao: "Verificar bloqueio de rede Claro", url: "https://www.claro.com.br/suporte/desbloqueio-de-aparelho", badge: "OP" },
    { nome: "Tim — Desbloqueio", descricao: "Verificar bloqueio de rede Tim", url: "https://www.tim.com.br/para-voce/servicos/desbloqueio-de-aparelho", badge: "OP" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rf-card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Consulta de IMEI</h2>
            <p className="text-xs text-white/30 mt-0.5">Valide, identifique e consulte bloqueio</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={imei}
            onChange={(e) => { setImei(e.target.value.replace(/\D/g, "").slice(0, 15)); setErro(""); setResultado(null); }}
            placeholder="000000000000000"
            maxLength={15}
            className="rf-input flex-1 font-mono tracking-[0.2em] text-base"
          />
          <button onClick={consultar} disabled={loading || imeiLimpo.length < 15} className="rf-btn-primary px-5 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex justify-between items-center -mt-2">
          <p className="text-xs text-white/25">Disque <span className="font-mono text-white/40">*#06#</span> para ver o IMEI</p>
          <div className="flex gap-1">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i < imeiLimpo.length ? "bg-blue-500" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        {erro && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/15 rounded-xl">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{erro}</p>
          </motion.div>
        )}

        {resultado && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">IMEI Válido</p>
                <p className="text-xs text-white/30 font-mono mt-0.5 tracking-widest">{resultado.imei}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rf-card p-4">
                <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">Fabricante</p>
                <p className="text-sm font-bold text-white">{resultado.marca}</p>
              </div>
              <div className="rf-card p-4">
                <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">TAC</p>
                <p className="text-sm font-mono font-bold text-white tracking-wider">{resultado.imei.substring(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/15 rounded-xl">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40">{resultado.info}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="rf-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Verificar Bloqueio / Roubo</h3>
            <p className="text-xs text-white/30 mt-0.5">
              {imeiLimpo.length === 15 ? "IMEI preenchido nos links disponíveis" : "Preencha o IMEI para auto-completar"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {linksConsulta.map((link) => (
            <a key={link.nome} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded font-mono">{link.badge}</span>
                <div>
                  <p className="text-sm text-white/70 group-hover:text-white transition font-medium">{link.nome}</p>
                  <p className="text-xs text-white/25 mt-0.5">{link.descricao}</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition shrink-0 ml-3" />
            </a>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500/50 shrink-0 mt-0.5" />
          <p className="text-xs text-white/25">Consulta oficial de bloqueio é feita pelas operadoras e Anatel. Serviços de terceiros podem cobrar por consultas completas.</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState({ total: 0, emReparo: 0, faturamento: 0 });
  const [vendaModal, setVendaModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const shopId = (session?.user as any)?.shopId;

  async function recarregarStats() {
    if (shopId) { const data = await fetchDashboardData(shopId); setStats(data); }
  }

  useEffect(() => { recarregarStats(); }, [shopId]);

  function handleVendaRealizada(lucro: number, total: number) {
    setStats((prev) => ({ ...prev, faturamento: prev.faturamento + total }));
  }

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "os" as Tab, label: "Ordens de Serviço", icon: Wrench },
    { id: "estoque" as Tab, label: "Estoque", icon: Package },
    { id: "imei" as Tab, label: "Consulta IMEI", icon: Smartphone },
    { id: "configuracoes" as Tab, label: "Configurações", icon: Settings },
  ];

  const metricCards = [
    {
      label: "Total de OS",
      value: stats.total.toString(),
      sub: "ordens cadastradas",
      icon: Wrench,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      accent: "from-blue-500/5 to-transparent",
      border: "border-blue-500/10",
    },
    {
      label: "Em Reparo",
      value: stats.emReparo.toString(),
      sub: "em andamento agora",
      icon: Clock,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      accent: "from-violet-500/5 to-transparent",
      border: "border-violet-500/10",
    },
    {
      label: "Faturamento",
      value: `R$ ${stats.faturamento.toFixed(2)}`,
      sub: "receita total acumulada",
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      accent: "from-emerald-500/5 to-transparent",
      border: "border-emerald-500/10",
      valueColor: "text-emerald-400",
    },
  ];

  return (
    <>
      <style>{`
        :root {
          --rf-bg: #080808;
          --rf-surface: #0f0f0f;
          --rf-border: rgba(255,255,255,0.06);
          --rf-text: #ffffff;
        }
        .rf-card {
          background: var(--rf-surface);
          border: 1px solid var(--rf-border);
          border-radius: 16px;
        }
        .rf-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .rf-input::placeholder { color: rgba(255,255,255,0.2); }
        .rf-input:focus {
          border-color: rgba(59,130,246,0.5);
          background: rgba(255,255,255,0.06);
        }
        .rf-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          background: #2563eb;
          color: white;
          font-size: 14px;
          font-weight: 600;
          border-radius: 12px;
          transition: all 0.15s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .rf-btn-primary:hover { background: #1d4ed8; box-shadow: 0 8px 24px rgba(37,99,235,0.25); }
        .rf-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .rf-sidebar-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
          color: rgba(255,255,255,0.35);
          border: 1px solid transparent;
        }
        .rf-sidebar-item:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
        .rf-sidebar-item.active {
          color: white;
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.08);
        }
        .rf-logo-dot {
          width: 7px; height: 7px;
          background: #2563eb;
          border-radius: 50%;
          box-shadow: 0 0 8px #2563eb;
        }
      `}</style>

      <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--rf-bg)", color: "var(--rf-text)" }}>

        {/* ── SIDEBAR desktop ── */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col" style={{ borderRight: "1px solid var(--rf-border)" }}>
          <div className="p-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--rf-border)" }}>
            <div className="rf-logo-dot" />
            <span className="text-sm font-bold tracking-tight">RepairFlow</span>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {tabs.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`rf-sidebar-item ${activeTab === item.id ? "active" : ""}`}>
                <item.icon size={15} />
                {item.label}
                {activeTab === item.id && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-3" style={{ borderTop: "1px solid var(--rf-border)" }}>
            <button onClick={() => setVendaModal(true)}
              className="rf-btn-primary w-full text-xs py-2.5">
              <Zap size={13} /> Venda Rápida
            </button>
          </div>
        </aside>

        {/* ── HEADER MOBILE ── */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: "var(--rf-bg)", borderBottom: "1px solid var(--rf-border)" }}>
          <div className="flex items-center gap-2">
            <div className="rf-logo-dot" />
            <span className="text-sm font-bold">RepairFlow</span>
          </div>
          <button onClick={() => setVendaModal(true)} className="rf-btn-primary text-xs py-2 px-3">
            <Zap size={12} /> Venda Rápida
          </button>
        </header>

        {/* ── CONTEÚDO PRINCIPAL ── */}
        <main className="flex-1 overflow-auto pb-24 md:pb-0">
          {/* Topbar desktop */}
          <div className="hidden md:flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid var(--rf-border)" }}>
            <div>
              <h2 className="text-lg font-bold">{tabs.find((t) => t.id === activeTab)?.label}</h2>
              <p className="text-xs text-white/25 mt-0.5">
                {activeTab === "dashboard" && "Visão geral da sua operação"}
                {activeTab === "os" && "Gerencie todas as ordens de serviço"}
                {activeTab === "estoque" && "Controle seu inventário"}
                {activeTab === "imei" && "Consulte e valide IMEIs"}
                {activeTab === "configuracoes" && "Personalize sua conta"}
              </p>
            </div>
            <div className="flex gap-2">
              {activeTab === "os" && (
                <button onClick={() => router.push("/painel/nova-os")} className="rf-btn-primary text-xs py-2 px-4">
                  <Plus size={13} /> Nova OS
                </button>
              )}
              {activeTab === "dashboard" && (
                <button onClick={() => setVendaModal(true)} className="rf-btn-primary text-xs py-2 px-4">
                  <ShoppingBag size={13} /> Venda Rápida
                </button>
              )}
            </div>
          </div>

          {/* Topbar mobile */}
          <div className="md:hidden flex justify-between items-center px-4 py-3">
            <h2 className="text-base font-bold">{tabs.find((t) => t.id === activeTab)?.label}</h2>
            {activeTab === "os" && (
              <button onClick={() => router.push("/painel/nova-os")} className="rf-btn-primary text-xs py-2 px-3">
                <Plus size={12} /> Nova OS
              </button>
            )}
          </div>

          <div className="p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
              >
                {/* ── DASHBOARD ── */}
                {activeTab === "dashboard" && (
                  <div className="space-y-5">
                    {/* Métricas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {metricCards.map((card, i) => (
                        <motion.div
                          key={card.label}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`rf-card p-5 bg-gradient-to-br ${card.accent} relative overflow-hidden`}
                          style={{ borderColor: `rgba(255,255,255,0.06)` }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <p className="text-xs text-white/35 font-medium uppercase tracking-wider">{card.label}</p>
                            <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                              <card.icon size={15} className={card.iconColor} />
                            </div>
                          </div>
                          <p className={`text-2xl font-bold ${card.valueColor || "text-white"} mb-1`}>{card.value}</p>
                          <p className="text-xs text-white/20">{card.sub}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Atalhos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { tab: "os" as Tab, icon: Wrench, label: "Ordens de Serviço", desc: "Gerencie e acompanhe reparos", color: "text-blue-400", bg: "bg-blue-500/8 hover:bg-blue-500/12", border: "border-blue-500/10 hover:border-blue-500/20" },
                        { tab: "estoque" as Tab, icon: Package, label: "Estoque", desc: "Produtos, capinhas e acessórios", color: "text-violet-400", bg: "bg-violet-500/8 hover:bg-violet-500/12", border: "border-violet-500/10 hover:border-violet-500/20" },
                      ].map(({ tab, icon: Icon, label, desc, color, bg, border }) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className={`${bg} border ${border} rounded-2xl p-5 text-left transition-all group`}>
                          <div className="flex items-start justify-between mb-3">
                            <Icon size={18} className={`${color} transition-transform group-hover:scale-110`} />
                            <ExternalLink size={12} className="text-white/15 group-hover:text-white/30 transition" />
                          </div>
                          <p className="text-sm font-semibold text-white/80 group-hover:text-white transition">{label}</p>
                          <p className="text-xs text-white/25 mt-1">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* OS */}
                {activeTab === "os" && shopId && <OsTable shopId={shopId} />}
                {activeTab === "os" && !shopId && (
                  <div className="flex items-center justify-center h-48 text-white/20 text-sm">Aguardando sessão...</div>
                )}

                {/* ESTOQUE */}
                {activeTab === "estoque" && shopId && <StockTab shopId={shopId} />}
                {activeTab === "estoque" && !shopId && (
                  <div className="flex items-center justify-center h-48 text-white/20 text-sm">Aguardando sessão...</div>
                )}

                {/* IMEI */}
                {activeTab === "imei" && <ImeiTab />}

                {/* CONFIGURAÇÕES */}
                {activeTab === "configuracoes" && <ConfiguracoesTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* ── BOTTOM NAV mobile ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex"
          style={{ background: "var(--rf-bg)", borderTop: "1px solid var(--rf-border)" }}>
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === item.id ? "text-blue-400" : "text-white/20"}`}>
              <item.icon size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-wide leading-none">
                {item.id === "os" ? "OS" : item.id === "configuracoes" ? "Config" : item.id === "imei" ? "IMEI" : item.id === "estoque" ? "Estoque" : "Home"}
              </span>
              {activeTab === item.id && (
                <div className="absolute bottom-0 w-6 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Modal Venda Rápida */}
        {vendaModal && shopId && (
          <VendaRapidaModal
            shopId={shopId}
            onClose={() => setVendaModal(false)}
            onVenda={(lucro, total) => { handleVendaRealizada(lucro, total); setVendaModal(false); }}
          />
        )}
      </div>
    </>
  );
}
