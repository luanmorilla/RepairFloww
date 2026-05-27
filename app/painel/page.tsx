"use client";
import { AssinaturaCard } from "@/components/configuracoes/assinatura-card";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Wrench, Package, Plus, ShoppingBag,
  Clock, DollarSign, Settings, LogOut, Store, Phone,
  ShieldCheck, ImagePlus, Save, Loader2, X, CheckCircle2,
  Smartphone, Search, AlertTriangle, CheckCircle, XCircle,
  Info, ExternalLink, TrendingUp, Zap, ChevronRight,
  Activity, ArrowUpRight, BarChart2,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { OsTable } from "@/components/dashboard/os-table";
import { StockTab } from "@/components/dashboard/stock-tab";
import { VendaRapidaModal } from "@/components/dashboard/venda-rapida-modal";
import { FaturamentoModal } from "@/components/dashboard/FaturamentoModal";
import { fetchDashboardData } from "@/actions/dashboard-actions";
import { getShopSettings, updateShopSettings } from "@/actions/shop-actions";
import { useRouter } from "next/navigation";
import { detectarMarca } from "@/lib/detectarMarca";

type Tab = "dashboard" | "os" | "estoque" | "imei" | "configuracoes";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  :root {
    --rf-bg:          #060608;
    --rf-surface:     #0c0c10;
    --rf-surface-2:   #111116;
    --rf-surface-3:   #16161c;
    --rf-border:      rgba(255,255,255,0.055);
    --rf-border-2:    rgba(255,255,255,0.09);
    --rf-text:        #f0f0f4;
    --rf-text-2:      rgba(240,240,244,0.45);
    --rf-text-3:      rgba(240,240,244,0.22);

    --teal:           #1a9e78;
    --teal-light:     #22c997;
    --teal-dim:       rgba(26,158,120,0.12);
    --teal-dim-2:     rgba(26,158,120,0.07);
    --teal-border:    rgba(26,158,120,0.25);

    --amber:          #e8a430;
    --amber-dim:      rgba(232,164,48,0.1);
    --violet:         #8b7cf8;
    --violet-dim:     rgba(139,124,248,0.1);
    --red:            #e05252;
    --red-dim:        rgba(224,82,82,0.1);
    --red-border:     rgba(224,82,82,0.2);

    --sidebar-w:      220px;
    --radius:         10px;
    --radius-lg:      14px;
    --radius-xl:      18px;
    --font:           'Geist', system-ui, sans-serif;
    --mono:           'Geist Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font);
    background: var(--rf-bg);
    color: var(--rf-text);
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

  .rf-title-gradient {
    background: linear-gradient(135deg, #ffffff 0%, var(--teal-light) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
  }

  .rf-card {
    background: var(--rf-surface);
    border: 0.5px solid var(--rf-border);
    border-radius: var(--radius-lg);
    transition: border-color 0.2s;
  }
  .rf-card:hover { border-color: var(--rf-border-2); }

  .rf-input {
    width: 100%;
    background: var(--rf-surface-2);
    border: 0.5px solid var(--rf-border-2);
    border-radius: var(--radius);
    padding: 9px 13px;
    color: var(--rf-text);
    font-family: var(--font);
    font-size: 13.5px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rf-input::placeholder { color: var(--rf-text-3); }
  .rf-input:focus {
    border-color: var(--teal-border);
    box-shadow: 0 0 0 3px rgba(26,158,120,0.08);
  }

  .rf-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 16px;
    background: var(--teal);
    color: #fff;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--radius);
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    border: none;
    cursor: pointer;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
  .rf-btn-primary:hover {
    background: var(--teal-light);
    box-shadow: 0 4px 20px rgba(26,158,120,0.28);
    transform: translateY(-1px);
  }
  .rf-btn-primary:active { transform: translateY(0); }
  .rf-btn-primary:disabled { opacity: 0.38; cursor: not-allowed; transform: none; box-shadow: none; }

  .rf-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    background: transparent;
    color: var(--rf-text-2);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--radius);
    border: 0.5px solid var(--rf-border-2);
    cursor: pointer;
    transition: all 0.15s;
  }
  .rf-btn-ghost:hover {
    background: var(--rf-surface-2);
    color: var(--rf-text);
    border-color: var(--rf-border-2);
  }

  .rf-nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 400;
    color: var(--rf-text-3);
    border: 0.5px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    background: none;
    letter-spacing: 0.01em;
  }
  .rf-nav-item:hover {
    color: var(--rf-text-2);
    background: var(--rf-surface-2);
  }
  .rf-nav-item.active {
    color: var(--rf-text);
    background: var(--rf-surface-3);
    border-color: var(--rf-border-2);
  }
  .rf-nav-item .nav-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--teal);
    margin-left: auto;
    box-shadow: 0 0 6px var(--teal);
  }

  .rf-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10.5px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 20px;
    letter-spacing: 0.02em;
  }
  .rf-badge-teal { background: var(--teal-dim); color: var(--teal-light); border: 0.5px solid var(--teal-border); }
  .rf-badge-amber { background: var(--amber-dim); color: var(--amber); border: 0.5px solid rgba(232,164,48,0.2); }
  .rf-badge-violet { background: var(--violet-dim); color: var(--violet); border: 0.5px solid rgba(139,124,248,0.2); }
  .rf-badge-red { background: var(--red-dim); color: var(--red); border: 0.5px solid var(--red-border); }

  .rf-logo-mark {
    width: 26px; height: 26px;
    background: var(--teal);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(26,158,120,0.35);
    flex-shrink: 0;
  }
  .rf-logo-mark svg { width: 14px; height: 14px; }

  .rf-divider { height: 0.5px; background: var(--rf-border); width: 100%; }

  .rf-metric {
    background: var(--rf-surface);
    border: 0.5px solid var(--rf-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .rf-metric:hover {
    border-color: var(--rf-border-2);
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  }
  .rf-metric.clickable { cursor: pointer; }
  .rf-metric::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 120px; height: 120px;
    border-radius: 50%;
    opacity: 0.04;
    pointer-events: none;
  }
  .rf-metric-teal::before { background: var(--teal); }
  .rf-metric-violet::before { background: var(--violet); }
  .rf-metric-amber::before { background: var(--amber); }

  .rf-shortcut {
    background: var(--rf-surface);
    border: 0.5px solid var(--rf-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rf-shortcut:hover {
    background: var(--rf-surface-2);
    border-color: var(--rf-border-2);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  }

  .rf-icon-box {
    width: 34px; height: 34px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  @keyframes rf-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
  .rf-pulse { animation: rf-pulse 1.5s ease-in-out infinite; }

  .rf-link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 13px;
    background: var(--rf-surface-2);
    border: 0.5px solid var(--rf-border);
    border-radius: var(--radius);
    transition: all 0.15s;
    text-decoration: none;
  }
  .rf-link-item:hover {
    background: var(--rf-surface-3);
    border-color: var(--rf-border-2);
  }

  .rf-bottom-nav {
    background: rgba(6,6,8,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 0.5px solid var(--rf-border);
  }

  @keyframes rf-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rf-anim { animation: rf-fade-up 0.2s ease forwards; }
`;

function LogoIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7C2 4.24 4.24 2 7 2s5 2.24 5 5-2.24 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 5v2l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(26,158,120,0.15)", borderTopColor: "var(--teal)", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const warrantyOptions = [30, 60, 90, 180];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Card principal — Dados da Assistência */}
      <div className="rf-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div className="rf-icon-box" style={{ background: "var(--teal-dim)" }}>
            <Store size={16} style={{ color: "var(--teal-light)" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--rf-text)" }}>Dados da Assistência</p>
            <p style={{ fontSize: 12, color: "var(--rf-text-3)", marginTop: 1 }}>Informações exibidas nas ordens de serviço</p>
          </div>
        </div>

        <div className="rf-divider" style={{ marginBottom: 24 }} />

        {/* Logo upload */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "relative", width: 88, height: 88,
              borderRadius: 18, overflow: "hidden",
              background: "var(--rf-surface-2)",
              border: "0.5px dashed var(--rf-border-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "border-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--teal-border)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--rf-border-2)")}
          >
            {logoPreview ? (
              <>
                <Image src={logoPreview} alt="Logo" fill style={{ objectFit: "contain", padding: 8 }} />
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
                  opacity: 0, transition: "opacity 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <ImagePlus size={18} style={{ color: "#fff" }} />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                  style={{
                    position: "absolute", top: 6, right: 6,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "var(--red)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", zIndex: 10,
                  }}
                >
                  <X size={10} color="#fff" />
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--rf-text-3)" }}>
                <ImagePlus size={20} />
                <p style={{ fontSize: 9, marginTop: 4, letterSpacing: "0.05em" }}>LOGO</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--rf-text-3)" }}>PNG, JPG ou SVG · máx. 2MB</p>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Nome da Loja", icon: Store, value: name, onChange: setName, placeholder: "Ex: TechFix Assistência" },
            { label: "WhatsApp", icon: Phone, value: phone, onChange: setPhone, placeholder: "(11) 99999-9999" },
          ].map(({ label, icon: Icon, value, onChange, placeholder }) => (
            <div key={label}>
              <label style={{
                fontSize: 11, color: "var(--rf-text-3)", fontWeight: 500,
                textTransform: "uppercase", letterSpacing: "0.07em",
                display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
              }}>
                <Icon size={11} /> {label}
              </label>
              <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rf-input" />
            </div>
          ))}

          {/* Garantia */}
          <div>
            <label style={{
              fontSize: 11, color: "var(--rf-text-3)", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.07em",
              display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
            }}>
              <ShieldCheck size={11} /> Garantia Padrão
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number" min={1} max={730} value={warranty}
                  onChange={(e) => setWarranty(Number(e.target.value))}
                  className="rf-input" style={{ width: 72, textAlign: "center" }}
                />
                <span style={{ fontSize: 12, color: "var(--rf-text-3)" }}>dias</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                {warrantyOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => setWarranty(d)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      border: warranty === d ? "0.5px solid var(--teal-border)" : "0.5px solid var(--rf-border)",
                      background: warranty === d ? "var(--teal-dim)" : "var(--rf-surface-2)",
                      color: warranty === d ? "var(--teal-light)" : "var(--rf-text-3)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 13px", marginTop: 16,
            background: "var(--red-dim)", border: "0.5px solid var(--red-border)",
            borderRadius: "var(--radius)",
          }}>
            <XCircle size={15} style={{ color: "var(--red)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
          </div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 13px", marginTop: 16,
              background: "var(--teal-dim)", border: "0.5px solid var(--teal-border)",
              borderRadius: "var(--radius)",
            }}
          >
            <CheckCircle2 size={15} style={{ color: "var(--teal-light)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--teal-light)" }}>Configurações salvas com sucesso!</p>
          </motion.div>
        )}

        <div style={{ marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} className="rf-btn-primary" style={{ width: "100%" }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Save size={14} />}
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>

      {/* ── Assinatura — portal Stripe ── */}
      <AssinaturaCard />

      {/* Conta */}
      <div className="rf-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="rf-icon-box" style={{ background: "var(--red-dim)" }}>
            <LogOut size={15} style={{ color: "var(--red)" }} />
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 500 }}>Conta</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%", padding: "9px 16px",
            borderRadius: "var(--radius)",
            background: "var(--red-dim)",
            border: "0.5px solid var(--red-border)",
            color: "var(--red)",
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <LogOut size={14} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

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
    if (!validarLuhn(num)) { setErro("IMEI inválido — falhou na verificação de dígito (Luhn)."); return; }
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
    <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="rf-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div className="rf-icon-box" style={{ background: "var(--teal-dim)" }}>
            <Smartphone size={15} style={{ color: "var(--teal-light)" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Consulta de IMEI</p>
            <p style={{ fontSize: 11.5, color: "var(--rf-text-3)", marginTop: 1 }}>Valide, identifique e verifique bloqueio</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={imei}
            onChange={(e) => { setImei(e.target.value.replace(/\D/g, "").slice(0, 15)); setErro(""); setResultado(null); }}
            placeholder="000 000 000 000 000"
            maxLength={15}
            className="rf-input"
            style={{ fontFamily: "var(--mono)", letterSpacing: "0.18em", fontSize: 15, flex: 1 }}
          />
          <button
            onClick={consultar}
            disabled={loading || imeiLimpo.length < 15}
            className="rf-btn-primary"
            style={{ padding: "9px 16px", flexShrink: 0 }}
          >
            {loading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Search size={15} />}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <p style={{ fontSize: 11, color: "var(--rf-text-3)" }}>
            Disque <span style={{ fontFamily: "var(--mono)", color: "var(--rf-text-2)" }}>*#06#</span> para ver o IMEI
          </p>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i < imeiLimpo.length ? "var(--teal)" : "var(--rf-surface-3)",
                transition: "background 0.1s",
                boxShadow: i < imeiLimpo.length ? "0 0 4px var(--teal)" : "none",
              }} />
            ))}
          </div>
        </div>

        {erro && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "11px 13px", marginBottom: 12,
              background: "var(--red-dim)", border: "0.5px solid var(--red-border)",
              borderRadius: "var(--radius)",
            }}
          >
            <XCircle size={14} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "var(--red)" }}>{erro}</p>
          </motion.div>
        )}

        {resultado && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "13px 15px",
              background: "var(--teal-dim-2)",
              border: "0.5px solid var(--teal-border)",
              borderRadius: "var(--radius)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--teal-dim)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle size={16} style={{ color: "var(--teal-light)" }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--teal-light)" }}>IMEI Válido</p>
                <p style={{ fontSize: 11, color: "var(--rf-text-3)", fontFamily: "var(--mono)", letterSpacing: "0.15em", marginTop: 2 }}>{resultado.imei}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Fabricante", value: resultado.marca },
                { label: "TAC (8 dígitos)", value: resultado.imei.substring(0, 8), mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="rf-card" style={{ padding: "13px 15px" }}>
                  <p style={{ fontSize: 10, color: "var(--rf-text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: mono ? "var(--mono)" : undefined, letterSpacing: mono ? "0.12em" : undefined }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "11px 13px",
              background: "var(--rf-surface-2)", border: "0.5px solid var(--rf-border)",
              borderRadius: "var(--radius)",
            }}>
              <Info size={13} style={{ color: "var(--rf-text-3)", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "var(--rf-text-3)", lineHeight: 1.5 }}>{resultado.info}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="rf-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div className="rf-icon-box" style={{ background: "var(--amber-dim)" }}>
            <AlertTriangle size={14} style={{ color: "var(--amber)" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Verificar Bloqueio / Roubo</p>
            <p style={{ fontSize: 11.5, color: "var(--rf-text-3)", marginTop: 1 }}>
              {imeiLimpo.length === 15 ? "IMEI preenchido nos links" : "Preencha o IMEI para auto-completar"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {linksConsulta.map((link) => (
            <a key={link.nome} href={link.url} target="_blank" rel="noopener noreferrer" className="rf-link-item">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, fontFamily: "var(--mono)",
                  color: "var(--rf-text-3)", background: "var(--rf-surface-3)",
                  padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em",
                }}>{link.badge}</span>
                <div>
                  <p style={{ fontSize: 13, color: "var(--rf-text-2)", fontWeight: 500 }}>{link.nome}</p>
                  <p style={{ fontSize: 11, color: "var(--rf-text-3)", marginTop: 1 }}>{link.descricao}</p>
                </div>
              </div>
              <ExternalLink size={12} style={{ color: "var(--rf-text-3)", flexShrink: 0 }} />
            </a>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "10px 12px", marginTop: 14,
          background: "var(--amber-dim)", border: "0.5px solid rgba(232,164,48,0.15)",
          borderRadius: "var(--radius)",
        }}>
          <AlertTriangle size={12} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "var(--rf-text-3)", lineHeight: 1.5 }}>
            Consulta oficial de bloqueio é feita pelas operadoras e Anatel. Serviços de terceiros podem cobrar por consultas completas.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState({ total: 0, emReparo: 0, prontas: 0, atrasadas: 0, faturamento: 0 });
  const [vendaModal, setVendaModal] = useState(false);
  const [faturamentoModal, setFaturamentoModal] = useState(false);
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

  const tabSubtitles: Record<Tab, string> = {
    dashboard: "Visão geral da operação",
    os: "Gerencie todas as ordens de serviço",
    estoque: "Controle seu inventário de peças",
    imei: "Valide e consulte dispositivos",
    configuracoes: "Personalize sua conta",
  };

  const metricCards = [
    {
      label: "Total de OS",
      value: stats.total.toString(),
      sub: "ordens cadastradas",
      icon: Wrench,
      colorClass: "rf-metric-teal",
      iconBg: "var(--teal-dim)",
      iconColor: "var(--teal-light)",
      valueColor: "var(--rf-text)",
      badge: null,
      onClick: undefined,
    },
    {
      label: "Em Reparo",
      value: stats.emReparo.toString(),
      sub: "em andamento agora",
      icon: Activity,
      colorClass: "rf-metric-violet",
      iconBg: "var(--violet-dim)",
      iconColor: "var(--violet)",
      valueColor: "var(--rf-text)",
      badge: stats.atrasadas > 0 ? `${stats.atrasadas} atrasada${stats.atrasadas > 1 ? "s" : ""}` : null,
      onClick: undefined,
    },
    {
      label: "Faturamento",
      value: `R$ ${stats.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "receita total acumulada",
      icon: TrendingUp,
      colorClass: "rf-metric-teal",
      iconBg: "var(--teal-dim)",
      iconColor: "var(--teal-light)",
      valueColor: "var(--teal-light)",
      badge: null,
      onClick: () => setFaturamentoModal(true),
    },
  ];

  const mobileLabel: Record<Tab, string> = {
    dashboard: "Home", os: "OS", estoque: "Estoque", imei: "IMEI", configuracoes: "Config",
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          height: 60,
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(6,6,8,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "0.5px solid var(--rf-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="rf-logo-mark" style={{ width: 26, height: 26, borderRadius: 7 }}><LogoIcon /></div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>RepairFlow</span>
        </div>
        <button
          onClick={() => setVendaModal(true)}
          className="rf-btn-primary"
          style={{ fontSize: 13, padding: "8px 16px", gap: 6 }}
        >
          <Zap size={14} />
          <span className="hidden sm:inline">Venda Rápida</span>
        </button>
      </header>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--rf-bg)", paddingTop: "60px" }}>
        <div style={{ display: "flex", flex: 1 }}>

          {/* Sidebar desktop */}
          <aside
            className="hidden md:flex"
            style={{
              width: "var(--sidebar-w)",
              flexShrink: 0,
              flexDirection: "column",
              borderRight: "0.5px solid var(--rf-border)",
              background: "var(--rf-surface)",
            }}
          >
            <div style={{ padding: "20px 20px 10px" }}>
              <p style={{ fontSize: 10, color: "var(--rf-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gestão Interna</p>
            </div>
            <nav style={{ flex: 1, padding: "0px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
              {tabs.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`rf-nav-item ${activeTab === item.id ? "active" : ""}`}>
                  <item.icon size={15} />
                  {item.label}
                  {activeTab === item.id && <span className="nav-dot" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main
            style={{ flex: 1, overflowX: "hidden", minHeight: "calc(100vh - 60px)" }}
            className="pb-24 md:pb-0"
          >
            {/* Desktop sub-header */}
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center", justifyContent: "space-between",
                padding: "20px 32px",
                borderBottom: "0.5px solid var(--rf-border)",
                position: "sticky",
                top: 0,
                zIndex: 20,
                background: "rgba(6,6,8,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div>
                <h1 className="rf-title-gradient" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <p style={{ fontSize: 13, color: "var(--rf-text-2)", marginTop: 4, fontWeight: 400 }}>
                  {tabSubtitles[activeTab]}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {activeTab === "os" && (
                  <button onClick={() => router.push("/painel/nova-os")} className="rf-btn-primary" style={{ fontSize: 12 }}>
                    <Plus size={14} /> Nova OS
                  </button>
                )}
              </div>
            </div>

            {/* Mobile page title */}
            <div className="md:hidden" style={{ padding: "16px 16px 0" }}>
              <h1 className="rf-title-gradient" style={{ fontSize: 20, fontWeight: 600 }}>
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p style={{ fontSize: 12, color: "var(--rf-text-2)", marginTop: 2, fontWeight: 400 }}>
                {tabSubtitles[activeTab]}
              </p>
              {activeTab === "os" && (
                <button onClick={() => router.push("/painel/nova-os")} className="rf-btn-primary"
                  style={{ fontSize: 12, marginTop: 12 }}>
                  <Plus size={13} /> Nova OS
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: "24px 24px 32px" }} className="md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Dashboard */}
                  {activeTab === "dashboard" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                        {metricCards.map((card, i) => (
                          <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.2 }}
                            onClick={card.onClick}
                            className={`rf-metric ${card.colorClass} ${card.onClick ? "clickable" : ""}`}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                              <div>
                                <p style={{ fontSize: 10.5, color: "var(--rf-text-3)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                  {card.label}
                                </p>
                                {card.badge && (
                                  <span className="rf-badge rf-badge-amber" style={{ marginTop: 4 }}>{card.badge}</span>
                                )}
                              </div>
                              <div className="rf-icon-box" style={{ background: card.iconBg }}>
                                <card.icon size={15} style={{ color: card.iconColor }} />
                              </div>
                            </div>
                            <p style={{ fontSize: 26, fontWeight: 500, color: card.valueColor, letterSpacing: "-0.025em", marginBottom: 4 }}>
                              {card.value}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <p style={{ fontSize: 11.5, color: "var(--rf-text-3)" }}>{card.sub}</p>
                              {card.onClick && (
                                <ArrowUpRight size={13} style={{ color: "var(--rf-text-3)" }} />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                        {[
                          {
                            tab: "os" as Tab, icon: Wrench,
                            label: "Ordens de Serviço",
                            desc: "Gerencie e acompanhe reparos",
                            accentColor: "var(--teal-light)",
                            accentBg: "var(--teal-dim)",
                            borderHover: "var(--teal-border)",
                          },
                          {
                            tab: "estoque" as Tab, icon: Package,
                            label: "Estoque",
                            desc: "Produtos, capinhas e acessórios",
                            accentColor: "var(--violet)",
                            accentBg: "var(--violet-dim)",
                            borderHover: "rgba(139,124,248,0.2)",
                          },
                        ].map(({ tab, icon: Icon, label, desc, accentColor, accentBg, borderHover }) => (
                          <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.2 }}
                            className="rf-shortcut"
                            style={{ textAlign: "left", border: "0.5px solid var(--rf-border)" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = borderHover)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--rf-border)")}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div className="rf-icon-box" style={{ background: accentBg }}>
                                <Icon size={15} style={{ color: accentColor }} />
                              </div>
                              <ChevronRight size={14} style={{ color: "var(--rf-text-3)" }} />
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--rf-text)" }}>{label}</p>
                              <p style={{ fontSize: 12, color: "var(--rf-text-3)", marginTop: 3 }}>{desc}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OS */}
                  {activeTab === "os" && shopId && <OsTable shopId={shopId} onStatusChange={recarregarStats} />}
                  {activeTab === "os" && !shopId && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--rf-text-3)", fontSize: 13 }}>
                      Aguardando sessão...
                    </div>
                  )}

                  {/* Estoque */}
                  {activeTab === "estoque" && shopId && <StockTab shopId={shopId} />}
                  {activeTab === "estoque" && !shopId && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--rf-text-3)", fontSize: 13 }}>
                      Aguardando sessão...
                    </div>
                  )}

                  {/* IMEI */}
                  {activeTab === "imei" && <ImeiTab />}

                  {/* Config */}
                  {activeTab === "configuracoes" && <ConfiguracoesTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Bottom nav mobile */}
        <nav
          className="md:hidden rf-bottom-nav"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
            display: "flex",
          }}
        >
          {tabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "10px 4px", gap: 3,
                  color: isActive ? "var(--teal-light)" : "var(--rf-text-3)",
                  background: "none", border: "none", cursor: "pointer",
                  transition: "color 0.15s",
                  position: "relative",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position: "absolute", top: 0, left: "50%",
                      transform: "translateX(-50%)",
                      width: 24, height: 2,
                      background: "var(--teal)",
                      borderRadius: "0 0 2px 2px",
                      boxShadow: "0 0 8px var(--teal)",
                    }}
                  />
                )}
                <item.icon size={18} />
                <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {mobileLabel[item.id]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Modais */}
        {vendaModal && shopId && (
          <VendaRapidaModal
            shopId={shopId}
            onClose={() => setVendaModal(false)}
            onVenda={(lucro, total) => { handleVendaRealizada(lucro, total); setVendaModal(false); }}
          />
        )}
        {faturamentoModal && shopId && (
          <FaturamentoModal
            shopId={shopId}
            totalGeral={stats.faturamento}
            onClose={() => setFaturamentoModal(false)}
          />
        )}
      </div>
    </>
  );
}
