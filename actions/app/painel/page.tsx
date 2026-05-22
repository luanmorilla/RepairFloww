"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wrench,
  Package,
  Plus,
  ShoppingBag,
  Clock,
  DollarSign,
  Settings,
  LogOut,
  Store,
  Phone,
  ShieldCheck,
  ImagePlus,
  Save,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { OsTable } from "@/components/dashboard/os-table";
import { StockTab } from "@/components/dashboard/stock-tab";
import { VendaRapidaModal } from "@/components/dashboard/venda-rapida-modal";
import { fetchDashboardData } from "@/actions/dashboard-actions";
import { getShopSettings, updateShopSettings } from "@/actions/shop-actions";
import { useRouter } from "next/navigation";

type Tab = "dashboard" | "os" | "estoque" | "configuracoes";

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
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setLogo(base64);
      setRemoveLogo(false);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    setLogo(null);
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("O nome da loja é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateShopSettings({
        name: name.trim(),
        phone: phone.trim(),
        standardWarranty: Number(warranty),
        logo: removeLogo ? null : logo,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Card dados da loja */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 md:p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-300 flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-400" />
          Dados da Assistência
        </h2>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            {logoPreview ? (
              <>
                <Image src={logoPreview} alt="Logo" fill className="object-contain p-1" />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 rounded-full p-0.5 transition"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </>
            ) : (
              <ImagePlus className="w-8 h-8 text-zinc-600" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
          >
            <ImagePlus className="w-4 h-4" />
            {logoPreview ? "Trocar logo" : "Upar logo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <p className="text-xs text-zinc-600">PNG, JPG ou SVG · máx. 2MB</p>
        </div>

        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-500 flex items-center gap-1.5">
            <Store className="w-4 h-4" /> Nome da Loja
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: TechFix Assistência"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition text-sm"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-500 flex items-center gap-1.5">
            <Phone className="w-4 h-4" /> WhatsApp
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition text-sm"
          />
        </div>

        {/* Garantia */}
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Garantia Padrão
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              min={1}
              max={730}
              value={warranty}
              onChange={(e) => setWarranty(Number(e.target.value))}
              className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-center text-sm"
            />
            <span className="text-zinc-500 text-sm">dias</span>
            <div className="flex gap-2 ml-auto">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setWarranty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    warranty === d
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Configurações salvas!
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>

      {/* Card sair */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 md:p-6">
        <h2 className="text-base font-semibold text-zinc-300 flex items-center gap-2 mb-4">
          <LogOut className="w-4 h-4 text-red-400" />
          Conta
        </h2>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
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
    if (shopId) {
      const data = await fetchDashboardData(shopId);
      setStats(data);
    }
  }

  useEffect(() => {
    recarregarStats();
  }, [shopId]);

  function handleVendaRealizada(lucro: number, total: number) {
    setStats((prev) => ({ ...prev, faturamento: prev.faturamento + total }));
  }

  const tabs = [
    { id: "dashboard"     as Tab, label: "Dashboard",         icon: LayoutDashboard },
    { id: "os"            as Tab, label: "Ordens de Serviço", icon: Wrench },
    { id: "estoque"       as Tab, label: "Estoque",           icon: Package },
    { id: "configuracoes" as Tab, label: "Configurações",     icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row">

      {/* ── SIDEBAR desktop ── */}
      <aside className="hidden md:flex w-64 border-r border-zinc-900 p-6 flex-col gap-8 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">RepairFlow</h1>

        <nav className="space-y-1 flex-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all text-sm ${
                activeTab === item.id
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setVendaModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <ShoppingBag size={16} />
          Venda Rápida
        </button>
      </aside>

      {/* ── HEADER MOBILE ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-[#050505] sticky top-0 z-30">
        <h1 className="text-base font-bold tracking-tight">RepairFlow</h1>
        <button
          onClick={() => setVendaModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium"
        >
          <ShoppingBag size={14} />
          Venda Rápida
        </button>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 md:pb-8">
        {/* Header desktop */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <div className="flex gap-3">
            {activeTab === "os" && (
              <button
                onClick={() => router.push("/painel/nova-os")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Nova OS
              </button>
            )}
            {activeTab === "dashboard" && (
              <button
                onClick={() => setVendaModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <ShoppingBag size={16} /> Venda Rápida
              </button>
            )}
          </div>
        </div>

        {/* Header mobile */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          {activeTab === "os" && (
            <button
              onClick={() => router.push("/painel/nova-os")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium"
            >
              <Plus size={14} /> Nova OS
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
                  <Card className="bg-zinc-950 border-zinc-900 p-4 md:p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <p className="text-zinc-500 text-sm">Total de OS</p>
                      <div className="p-2 rounded-lg bg-zinc-900">
                        <Wrench size={15} className="text-zinc-400" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold">{stats.total}</h3>
                    <p className="text-xs text-zinc-600 mt-1">ordens cadastradas</p>
                  </Card>

                  <Card className="bg-zinc-950 border-zinc-900 p-4 md:p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <p className="text-zinc-500 text-sm">Em Reparo</p>
                      <div className="p-2 rounded-lg bg-purple-900/50">
                        <Clock size={15} className="text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold">{stats.emReparo}</h3>
                    <p className="text-xs text-zinc-600 mt-1">em andamento agora</p>
                  </Card>

                  <Card className="bg-zinc-950 border-zinc-900 p-4 md:p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <p className="text-zinc-500 text-sm">Faturamento</p>
                      <div className="p-2 rounded-lg bg-green-900/50">
                        <DollarSign size={15} className="text-green-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-400">
                      R$ {stats.faturamento.toFixed(2)}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1">receita total acumulada</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <button
                    onClick={() => setActiveTab("os")}
                    className="p-4 md:p-5 rounded-2xl border border-zinc-900 bg-zinc-950 hover:border-zinc-700 active:bg-zinc-900 transition-colors text-left group"
                  >
                    <Wrench size={20} className="text-zinc-500 group-hover:text-zinc-300 mb-2 md:mb-3 transition-colors" />
                    <p className="font-semibold text-zinc-300">Ordens de Serviço</p>
                    <p className="text-zinc-600 text-sm mt-1">Gerencie e acompanhe reparos</p>
                  </button>

                  <button
                    onClick={() => setActiveTab("estoque")}
                    className="p-4 md:p-5 rounded-2xl border border-zinc-900 bg-zinc-950 hover:border-zinc-700 active:bg-zinc-900 transition-colors text-left group"
                  >
                    <Package size={20} className="text-zinc-500 group-hover:text-zinc-300 mb-2 md:mb-3 transition-colors" />
                    <p className="font-semibold text-zinc-300">Estoque</p>
                    <p className="text-zinc-600 text-sm mt-1">Produtos, capinhas e acessórios</p>
                  </button>
                </div>
              </div>
            )}

            {/* OS */}
            {activeTab === "os" && shopId && <OsTable shopId={shopId} />}
            {activeTab === "os" && !shopId && (
              <div className="text-center p-20 text-zinc-600">Aguardando dados da loja...</div>
            )}

            {/* ESTOQUE */}
            {activeTab === "estoque" && shopId && <StockTab shopId={shopId} />}
            {activeTab === "estoque" && !shopId && (
              <div className="text-center p-20 text-zinc-600">Aguardando dados da loja...</div>
            )}

            {/* CONFIGURAÇÕES */}
            {activeTab === "configuracoes" && <ConfiguracoesTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAV mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950 border-t border-zinc-900 flex">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === item.id ? "text-blue-400" : "text-zinc-600"
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium leading-none">
              {item.id === "os" ? "OS" : item.id === "configuracoes" ? "Config" : item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Modal Venda Rápida */}
      {vendaModal && shopId && (
        <VendaRapidaModal
          shopId={shopId}
          onClose={() => setVendaModal(false)}
          onVenda={(lucro, total) => {
            handleVendaRealizada(lucro, total);
            setVendaModal(false);
          }}
        />
      )}
    </div>
  );
}
