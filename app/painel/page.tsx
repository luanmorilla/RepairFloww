"use client";
import { AssinaturaCard } from "@/components/configuracoes/assinatura-card";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Wrench, Package, Plus, ShoppingBag,
  Clock, DollarSign, Settings, LogOut, Store, Phone,
  ShieldCheck, ImagePlus, Save, Loader2, X, CheckCircle2,
  Smartphone, Search, AlertTriangle, CheckCircle, XCircle,
  Info, ExternalLink, TrendingUp, Zap, ChevronRight,
  Activity, ArrowUpRight, BarChart2, Sparkles,
  Target, Receipt, PercentCircle, ClipboardList,
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
import { ExpiryBanner } from "@/components/expiry-banner";

type Tab = "dashboard" | "os" | "estoque" | "imei" | "configuracoes";

// ─── Estilos globais ───────────────────────────────────────────────────────────

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
    --red-dim-2:      rgba(224,82,82,0.06);
    --blue:           #4f8ef7;
    --blue-dim:       rgba(79,142,247,0.10);

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
    display: inline-flex; align-items: center; justify-content: center;
    gap: 7px; padding: 9px 16px;
    background: var(--teal); color: #fff;
    font-family: var(--font); font-size: 13px; font-weight: 500;
    border-radius: var(--radius);
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    border: none; cursor: pointer; letter-spacing: 0.01em; white-space: nowrap;
  }
  .rf-btn-primary:hover {
    background: var(--teal-light);
    box-shadow: 0 4px 20px rgba(26,158,120,0.28);
    transform: translateY(-1px);
  }
  .rf-btn-primary:active { transform: translateY(0); }
  .rf-btn-primary:disabled { opacity: 0.38; cursor: not-allowed; transform: none; box-shadow: none; }

  .rf-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px; padding: 8px 14px;
    background: transparent; color: var(--rf-text-2);
    font-family: var(--font); font-size: 13px; font-weight: 500;
    border-radius: var(--radius); border: 0.5px solid var(--rf-border-2);
    cursor: pointer; transition: all 0.15s;
  }
  .rf-btn-ghost:hover {
    background: var(--rf-surface-2); color: var(--rf-text); border-color: var(--rf-border-2);
  }

  .rf-btn-save {
    position: relative; width: 100%;
    display: inline-flex; align-items: center; justify-content: center;
    gap: 8px; padding: 13px 20px;
    border-radius: var(--radius); border: none; cursor: pointer;
    font-family: var(--font); font-size: 14px; font-weight: 600;
    letter-spacing: 0.01em; color: #fff;
    background: linear-gradient(135deg, #1a9e78 0%, #22c997 50%, #1a9e78 100%);
    background-size: 200% 200%; background-position: 0% 50%;
    box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 0 0.5px rgba(26,158,120,0.4), 0 4px 24px rgba(26,158,120,0.2);
    transition: background-position 0.4s ease, box-shadow 0.2s ease, transform 0.12s ease;
    overflow: hidden;
  }
  .rf-btn-save::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 60%);
    pointer-events: none;
  }
  .rf-btn-save:hover {
    background-position: 100% 50%;
    box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 0 0.5px rgba(34,201,151,0.5), 0 8px 32px rgba(26,158,120,0.35);
    transform: translateY(-1px);
  }
  .rf-btn-save:active { transform: translateY(0); }
  .rf-btn-save:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

  .rf-btn-danger {
    position: relative; width: 100%;
    display: inline-flex; align-items: center; justify-content: center;
    gap: 8px; padding: 13px 20px;
    border-radius: var(--radius); cursor: pointer;
    font-family: var(--font); font-size: 14px; font-weight: 600;
    letter-spacing: 0.01em; color: #f87171;
    background: var(--red-dim-2); border: 0.5px solid var(--red-border);
    box-shadow: 0 2px 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03);
    transition: all 0.18s ease; overflow: hidden;
  }
  .rf-btn-danger::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(224,82,82,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .rf-btn-danger:hover {
    background: rgba(224,82,82,0.13); border-color: rgba(224,82,82,0.38); color: #fca5a5;
    box-shadow: 0 2px 0 rgba(0,0,0,0.25), 0 6px 24px rgba(224,82,82,0.18), inset 0 1px 0 rgba(255,255,255,0.04);
    transform: translateY(-1px);
  }
  .rf-btn-danger:active { transform: translateY(0); }

  .rf-warranty-chip {
    padding: 8px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 500; font-family: var(--font);
    cursor: pointer; transition: all 0.15s ease; letter-spacing: 0.01em;
  }
  .rf-warranty-chip.inactive {
    border: 0.5px solid var(--rf-border); background: var(--rf-surface-2); color: var(--rf-text-3);
  }
  .rf-warranty-chip.inactive:hover {
    border-color: var(--rf-border-2); color: var(--rf-text-2); background: var(--rf-surface-3);
  }
  .rf-warranty-chip.active {
    border: 0.5px solid var(--teal-border); background: var(--teal-dim); color: var(--teal-light);
    box-shadow: 0 0 0 1px rgba(26,158,120,0.08), 0 2px 8px rgba(26,158,120,0.12);
  }

  @media (max-width: 768px) {
    .rf-btn-save, .rf-btn-danger { padding: 15px 20px; font-size: 15px; border-radius: 12px; }
    .rf-warranty-chip { padding: 10px 16px; font-size: 13.5px; }
  }

  .rf-nav-item {
    width: 100%; display: flex; align-items: center; gap: 9px;
    padding: 8px 10px; border-radius: var(--radius);
    font-size: 13px; font-weight: 400; color: var(--rf-text-3);
    border: 0.5px solid transparent; cursor: pointer; transition: all 0.15s;
    text-align: left; background: none; letter-spacing: 0.01em;
  }
  .rf-nav-item:hover { color: var(--rf-text-2); background: var(--rf-surface-2); }
  .rf-nav-item.active { color: var(--rf-text); background: var(--rf-surface-3); border-color: var(--rf-border-2); }
  .rf-nav-item .nav-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--teal); margin-left: auto;
    box-shadow: 0 0 6px var(--teal);
  }

  .rf-badge {
    display: inline-flex; align-items: center;
    font-size: 10.5px; font-weight: 500;
    padding: 2px 7px; border-radius: 20px; letter-spacing: 0.02em;
  }
  .rf-badge-teal   { background: var(--teal-dim);   color: var(--teal-light); border: 0.5px solid var(--teal-border); }
  .rf-badge-amber  { background: var(--amber-dim);  color: var(--amber);      border: 0.5px solid rgba(232,164,48,0.2); }
  .rf-badge-violet { background: var(--violet-dim); color: var(--violet);     border: 0.5px solid rgba(139,124,248,0.2); }
  .rf-badge-red    { background: var(--red-dim);    color: var(--red);        border: 0.5px solid var(--red-border); }

  .rf-logo-mark {
    width: 26px; height: 26px; background: var(--teal); border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(26,158,120,0.35); flex-shrink: 0;
  }
  .rf-logo-mark svg { width: 14px; height: 14px; }

  .rf-divider { height: 0.5px; background: var(--rf-border); width: 100%; }

  /* ── Metric card ── */
  .rf-metric {
    background: var(--rf-surface);
    border: 0.5px solid var(--rf-border);
    border-radius: var(--radius-lg);
    padding: 20px; position: relative; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .rf-metric.clickable { cursor: pointer; }
  .rf-metric:hover {
    border-color: var(--rf-border-2);
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  }
  .rf-metric::before {
    content: ''; position: absolute; top: -20px; right: -20px;
    width: 100px; height: 100px; border-radius: 50%; opacity: 0.035; pointer-events: none;
  }
  .rf-metric-teal::before   { background: var(--teal); }
  .rf-metric-violet::before { background: var(--violet); }
  .rf-metric-amber::before  { background: var(--amber); }
  .rf-metric-red::before    { background: var(--red); }

  /* ── Secondary metric ── */
  .rf-sec-metric {
    background: var(--rf-surface);
    border: 0.5px solid var(--rf-border);
    border-radius: var(--radius-lg);
    padding: 16px 18px;
    display: flex; align-items: center; gap: 14px;
    transition: border-color 0.2s, transform 0.15s, box-shadow 0.15s;
  }
  .rf-sec-metric:hover {
    border-color: var(--rf-border-2);
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0,0,0,0.2);
  }

  /* ── Activity item ── */
  .rf-activity-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px;
    border-radius: var(--radius);
    transition: background 0.15s;
  }
  .rf-activity-item:hover { background: var(--rf-surface-2); }

  .rf-icon-box {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rf-icon-box-sm {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .rf-shortcut {
    background: var(--rf-surface); border: 0.5px solid var(--rf-border);
    border-radius: var(--radius-lg); padding: 20px; cursor: pointer;
    transition: all 0.18s; display: flex; flex-direction: column; gap: 12px;
  }
  .rf-shortcut:hover {
    background: var(--rf-surface-2); border-color: var(--rf-border-2);
    transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  }

  @keyframes rf-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
  .rf-pulse { animation: rf-pulse 1.5s ease-in-out infinite; }

  .rf-link-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 13px; background: var(--rf-surface-2);
    border: 0.5px solid var(--rf-border); border-radius: var(--radius);
    transition: all 0.15s; text-decoration: none;
  }
  .rf-link-item:hover { background: var(--rf-surface-3); border-color: var(--rf-border-2); }

  .rf-bottom-nav {
    background: rgba(9,9,12,0.96);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-top: 0.5px solid rgba(255,255,255,0.07);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .rf-bottom-nav-btn {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 10px 4px 11px; gap: 5px;
    background: none; border: none; cursor: pointer;
    position: relative; transition: color 0.18s ease;
    -webkit-tap-highlight-color: transparent; min-height: 60px;
  }
  .rf-bottom-nav-btn .nav-icon { transition: transform 0.18s ease, color 0.18s ease; }
  .rf-bottom-nav-btn.active .nav-icon { transform: translateY(-1px); }
  .rf-bottom-nav-btn .nav-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; transition: color 0.18s ease, opacity 0.18s ease;
    font-family: var(--font);
  }
  .rf-bottom-nav-btn.inactive { color: rgba(240,240,244,0.28); }
  .rf-bottom-nav-btn.inactive:active { color: rgba(240,240,244,0.5); }
  .rf-bottom-nav-btn.active { color: var(--teal-light); }
  .rf-nav-indicator {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 28px; height: 2.5px; background: var(--teal-light);
    border-radius: 0 0 3px 3px;
    box-shadow: 0 0 10px rgba(34,201,151,0.6), 0 0 20px rgba(34,201,151,0.2);
  }
  .rf-nav-icon-wrap {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 42px; height: 30px; border-radius: 10px; transition: background 0.18s ease;
  }
  .rf-bottom-nav-btn.active .rf-nav-icon-wrap { background: rgba(26,158,120,0.12); }

  @keyframes rf-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .rf-anim { animation: rf-fade-up 0.2s ease forwards; }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Empty state ── */
  .rf-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 52px 24px; gap: 16px;
  }
  .rf-empty-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: var(--teal-dim); border: 0.5px solid var(--teal-border);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }

  /* ── Welcome banner ── */
  .rf-welcome {
    background: linear-gradient(135deg, var(--rf-surface) 0%, rgba(26,158,120,0.06) 100%);
    border: 0.5px solid var(--teal-border);
    border-radius: var(--radius-xl);
    padding: 24px 28px;
    position: relative; overflow: hidden;
  }
  .rf-welcome::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: radial-gradient(circle, rgba(34,201,151,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7C2 4.24 4.24 2 7 2s5 2.24 5 5-2.24 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 5v2l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function saudacao(nome: string): string {
  const h = new Date().getHours();
  const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const emoji = h < 12 ? "☀️" : h < 18 ? "👋" : "🌙";
  const primeiroNome = nome?.split(" ")[0] ?? "";
  return primeiroNome ? `${periodo}, ${primeiroNome} ${emoji}` : `${periodo} ${emoji}`;
}

function resumoOperacao(emReparo: number, prontas: number): string {
  if (emReparo === 0 && prontas === 0) return "Nenhuma ordem ativa no momento.";
  const partes: string[] = [];
  if (emReparo > 0) partes.push(`${emReparo} em reparo`);
  if (prontas > 0) partes.push(`${prontas} pronta${prontas > 1 ? "s" : ""} para entrega`);
  return partes.join(" · ");
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── DashboardTab — componente isolado ────────────────────────────────────────

interface DashboardStats {
  total: number;
  emReparo: number;
  prontas: number;
  atrasadas: number;
  faturamento: number;
}

function DashboardTab({
  stats,
  shopId,
  nomeAssistencia,
  onNovaOS,
  onFaturamentoClick,
}: {
  stats: DashboardStats;
  shopId: string;
  nomeAssistencia: string;
  onNovaOS: () => void;
  onFaturamentoClick: () => void;
}) {
  const router = useRouter();
  const hasData = stats.total > 0;

  const ticketMedio = stats.faturamento > 0 && stats.total > 0
    ? stats.faturamento / stats.total
    : 0;

  const taxaConclusao = stats.total > 0
    ? Math.round(((stats.total - stats.emReparo) / stats.total) * 100)
    : 0;

  const atividadesRecentes: Array<{
    nome: string;
    servico: string;
    tempo: string;
    status: "reparo" | "pronta" | "entregue";
  }> = [];

  // ── Cards principais ──────────────────────────────────────────────────────

  const mainCards = [
    {
      label: "Total de OS",
      value: stats.total.toString(),
      sub: stats.total === 1 ? "ordem cadastrada" : "ordens cadastradas",
      icon: ClipboardList,
      colorClass: "rf-metric-teal",
      iconBg: "var(--teal-dim)",
      iconColor: "var(--teal-light)",
      valueColor: "var(--rf-text)",
      badge: null as string | null,
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: "Em Reparo",
      value: stats.emReparo.toString(),
      sub: stats.emReparo === 1 ? "em andamento agora" : "em andamento agora",
      icon: Activity,
      colorClass: "rf-metric-violet",
      iconBg: "var(--violet-dim)",
      iconColor: "var(--violet)",
      valueColor: "var(--rf-text)",
      badge: stats.atrasadas > 0 ? `${stats.atrasadas} atrasada${stats.atrasadas > 1 ? "s" : ""}` : null,
      onClick: undefined,
    },
    {
      label: "Prontas",
      value: stats.prontas.toString(),
      sub: stats.prontas === 1 ? "aguardando retirada" : "aguardando retirada",
      icon: CheckCircle2,
      colorClass: "rf-metric-amber",
      iconBg: "var(--amber-dim)",
      iconColor: "var(--amber)",
      valueColor: stats.prontas > 0 ? "var(--amber)" : "var(--rf-text)",
      badge: null,
      onClick: undefined,
    },
    {
      label: "Faturamento",
      value: formatCurrency(stats.faturamento),
      sub: "receita total acumulada",
      icon: TrendingUp,
      colorClass: "rf-metric-teal",
      iconBg: "var(--teal-dim)",
      iconColor: "var(--teal-light)",
      valueColor: "var(--teal-light)",
      badge: null,
      onClick: onFaturamentoClick,
    },
  ];

  // ── Métricas secundárias ──────────────────────────────────────────────────

  const secMetrics = [
    {
      label: "Ticket Médio",
      value: ticketMedio > 0 ? formatCurrency(ticketMedio) : "—",
      icon: Receipt,
      iconBg: "var(--blue-dim)",
      iconColor: "var(--blue)",
    },
    {
      label: "Taxa de Conclusão",
      value: stats.total > 0 ? `${taxaConclusao}%` : "—",
      icon: PercentCircle,
      iconBg: "var(--teal-dim)",
      iconColor: "var(--teal-light)",
    },
    {
      label: "OS do Mês",
      value: "—",
      icon: Target,
      iconBg: "var(--violet-dim)",
      iconColor: "var(--violet)",
    },
    {
      label: "Lucro Estimado",
      value: "—",
      icon: Sparkles,
      iconBg: "var(--amber-dim)",
      iconColor: "var(--amber)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Saudação ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="rf-welcome"
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--rf-text)", marginBottom: 6 }}>
              {saudacao(nomeAssistencia)}
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--rf-text-2)", lineHeight: 1.5 }}>
              {resumoOperacao(stats.emReparo, stats.prontas)}
            </p>
          </div>
          <button onClick={onNovaOS} className="rf-btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={14} /> Nova OS
          </button>
        </div>
      </motion.div>

      {/* ── Cards principais ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="sm:grid-cols-4">
        {mainCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.055, duration: 0.2 }}
            onClick={card.onClick}
            className={`rf-metric ${card.colorClass} ${card.onClick ? "clickable" : ""}`}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div className="rf-icon-box" style={{ background: card.iconBg }}>
                <card.icon size={15} style={{ color: card.iconColor }} />
              </div>
              {card.badge && (
                <span className="rf-badge rf-badge-amber">{card.badge}</span>
              )}
              {card.onClick && !card.badge && (
                <ArrowUpRight size={13} style={{ color: "var(--rf-text-3)" }} />
              )}
            </div>
            <p style={{ fontSize: 26, fontWeight: 500, color: card.valueColor, letterSpacing: "-0.025em", marginBottom: 4, lineHeight: 1 }}>
              {card.value}
            </p>
            <p style={{ fontSize: 11, color: "var(--rf-text-3)", fontWeight: 400 }}>{card.sub}</p>
            <p style={{ fontSize: 10.5, color: "var(--rf-text-3)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 10 }}>
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Estado vazio ── */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rf-card"
        >
          <div className="rf-empty">
            <div className="rf-empty-icon">
              <Wrench size={22} style={{ color: "var(--teal-light)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--rf-text)" }}>
                Bem-vindo ao RepairFlow
              </p>
              <p style={{ fontSize: 13, color: "var(--rf-text-3)", lineHeight: 1.6, maxWidth: 300 }}>
                Crie sua primeira Ordem de Serviço para começar a gerenciar os reparos da sua assistência.
              </p>
            </div>
            <button onClick={onNovaOS} className="rf-btn-primary" style={{ marginTop: 4 }}>
              <Plus size={14} /> Criar primeira OS
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Métricas secundárias ── */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.2 }}
        >
          <p style={{ fontSize: 10.5, color: "var(--rf-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Indicadores
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {secMetrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.20 + i * 0.04 }}
                className="rf-sec-metric"
              >
                <div className="rf-icon-box-sm" style={{ background: m.iconBg }}>
                  <m.icon size={13} style={{ color: m.iconColor }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 500, color: "var(--rf-text)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                    {m.value}
                  </p>
                  <p style={{ fontSize: 10.5, color: "var(--rf-text-3)", marginTop: 3, fontWeight: 400 }}>{m.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Atividade recente ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.2 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 10.5, color: "var(--rf-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Atividade Recente
          </p>
          {atividadesRecentes.length > 0 && (
            <button
              onClick={() => {/* navegar para OS */}}
              style={{ fontSize: 11, color: "var(--teal-light)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              Ver todas <ChevronRight size={11} />
            </button>
          )}
        </div>

        <div className="rf-card" style={{ overflow: "hidden" }}>
          {atividadesRecentes.length === 0 ? (
            <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--rf-surface-2)", border: "0.5px solid var(--rf-border-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} style={{ color: "var(--rf-text-3)" }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--rf-text-3)", textAlign: "center" }}>
                {hasData
                  ? "As últimas movimentações aparecerão aqui."
                  : "Nenhuma atividade ainda."}
              </p>
            </div>
          ) : (
            <div>
              {atividadesRecentes.map((item, i) => (
                <div
                  key={i}
                  className="rf-activity-item"
                  style={{ borderBottom: i < atividadesRecentes.length - 1 ? "0.5px solid var(--rf-border)" : "none" }}
                >
                  <div className="rf-icon-box-sm" style={{ background: "var(--teal-dim)" }}>
                    <Wrench size={12} style={{ color: "var(--teal-light)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--rf-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nome}</p>
                    <p style={{ fontSize: 11.5, color: "var(--rf-text-3)", marginTop: 1 }}>{item.servico}</p>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--rf-text-3)", flexShrink: 0 }}>{item.tempo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Atalhos rápidos (quando há dados) ── */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33, duration: 0.2 }}
        >
          <p style={{ fontSize: 10.5, color: "var(--rf-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Acesso Rápido
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              {
                icon: Wrench,
                label: "Ordens de Serviço",
                desc: "Gerencie e acompanhe reparos",
                accentColor: "var(--teal-light)",
                accentBg: "var(--teal-dim)",
                borderHover: "var(--teal-border)",
                onClick: () => router.push("/painel/nova-os"),
                cta: "Nova OS",
              },
              {
                icon: Package,
                label: "Estoque",
                desc: "Produtos, capinhas e acessórios",
                accentColor: "var(--violet)",
                accentBg: "var(--violet-dim)",
                borderHover: "rgba(139,124,248,0.2)",
                onClick: undefined,
                cta: "Ver estoque",
              },
            ].map(({ icon: Icon, label, desc, accentColor, accentBg, borderHover, onClick, cta }) => (
              <button
                key={label}
                onClick={onClick}
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
              </button>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}

// ─── ConfiguracoesTab ─────────────────────────────────────────────────────────

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
    </div>
  );

  const warrantyOptions = [30, 60, 90, 180];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
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

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "relative", width: 88, height: 88, borderRadius: 18, overflow: "hidden",
              background: "var(--rf-surface-2)", border: "0.5px dashed var(--rf-border-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "border-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--teal-border)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--rf-border-2)")}
          >
            {logoPreview ? (
              <>
                <Image src={logoPreview} alt="Logo" fill style={{ objectFit: "contain", padding: 8 }} />
                <div
                  style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", opacity: 0, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <ImagePlus size={18} style={{ color: "#fff" }} />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                  style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Nome da Loja", icon: Store, value: name, onChange: setName, placeholder: "Ex: TechFix Assistência" },
            { label: "WhatsApp", icon: Phone, value: phone, onChange: setPhone, placeholder: "(11) 99999-9999" },
          ].map(({ label, icon: Icon, value, onChange, placeholder }) => (
            <div key={label}>
              <label style={{ fontSize: 11, color: "var(--rf-text-3)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <Icon size={11} /> {label}
              </label>
              <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rf-input" />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 11, color: "var(--rf-text-3)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <ShieldCheck size={11} /> Garantia Padrão
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" min={1} max={730} value={warranty} onChange={(e) => setWarranty(Number(e.target.value))} className="rf-input" style={{ width: 72, textAlign: "center" }} />
                <span style={{ fontSize: 12, color: "var(--rf-text-3)" }}>dias</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
                {warrantyOptions.map((d) => (
                  <button key={d} onClick={() => setWarranty(d)} className={`rf-warranty-chip ${warranty === d ? "active" : "inactive"}`}>{d}d</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", marginTop: 16, background: "var(--red-dim)", border: "0.5px solid var(--red-border)", borderRadius: "var(--radius)" }}>
            <XCircle size={15} style={{ color: "var(--red)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
          </div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", marginTop: 16, background: "var(--teal-dim)", border: "0.5px solid var(--teal-border)", borderRadius: "var(--radius)" }}
          >
            <CheckCircle2 size={15} style={{ color: "var(--teal-light)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--teal-light)" }}>Configurações salvas com sucesso!</p>
          </motion.div>
        )}

        <div style={{ marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} className="rf-btn-save">
            {saving ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }} /> : <Save size={16} style={{ flexShrink: 0 }} />}
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>

      <AssinaturaCard />

      <div className="rf-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="rf-icon-box" style={{ background: "var(--red-dim)" }}>
            <LogOut size={15} style={{ color: "var(--red)" }} />
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 500 }}>Conta</p>
            <p style={{ fontSize: 11.5, color: "var(--rf-text-3)", marginTop: 1 }}>Encerrar sessão do painel</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="rf-btn-danger">
          <LogOut size={16} style={{ flexShrink: 0 }} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

// ─── ImeiTab ──────────────────────────────────────────────────────────────────

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
          <button onClick={consultar} disabled={loading || imeiLimpo.length < 15} className="rf-btn-primary" style={{ padding: "9px 16px", flexShrink: 0 }}>
            {loading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Search size={15} />}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <p style={{ fontSize: 11, color: "var(--rf-text-3)" }}>
            Disque <span style={{ fontFamily: "var(--mono)", color: "var(--rf-text-2)" }}>*#06#</span> para ver o IMEI
          </p>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < imeiLimpo.length ? "var(--teal)" : "var(--rf-surface-3)", transition: "background 0.1s", boxShadow: i < imeiLimpo.length ? "0 0 4px var(--teal)" : "none" }} />
            ))}
          </div>
        </div>

        {erro && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", marginBottom: 12, background: "var(--red-dim)", border: "0.5px solid var(--red-border)", borderRadius: "var(--radius)" }}
          >
            <XCircle size={14} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "var(--red)" }}>{erro}</p>
          </motion.div>
        )}

        {resultado && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", background: "var(--teal-dim-2)", border: "0.5px solid var(--teal-border)", borderRadius: "var(--radius)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--teal-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", background: "var(--rf-surface-2)", border: "0.5px solid var(--rf-border)", borderRadius: "var(--radius)" }}>
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
                <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--rf-text-3)", background: "var(--rf-surface-3)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" }}>{link.badge}</span>
                <div>
                  <p style={{ fontSize: 13, color: "var(--rf-text-2)", fontWeight: 500 }}>{link.nome}</p>
                  <p style={{ fontSize: 11, color: "var(--rf-text-3)", marginTop: 1 }}>{link.descricao}</p>
                </div>
              </div>
              <ExternalLink size={12} style={{ color: "var(--rf-text-3)", flexShrink: 0 }} />
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginTop: 14, background: "var(--amber-dim)", border: "0.5px solid rgba(232,164,48,0.15)", borderRadius: "var(--radius)" }}>
          <AlertTriangle size={12} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "var(--rf-text-3)", lineHeight: 1.5 }}>
            Consulta oficial de bloqueio é feita pelas operadoras e Anatel. Serviços de terceiros podem cobrar por consultas completas.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── DashboardPage — principal ─────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<DashboardStats>({ total: 0, emReparo: 0, prontas: 0, atrasadas: 0, faturamento: 0 });
  // ✅ CORREÇÃO: nome da assistência técnica vindo do banco, não da sessão
  const [shopName, setShopName] = useState("");
  const [vendaModal, setVendaModal] = useState(false);
  const [faturamentoModal, setFaturamentoModal] = useState(false);
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
    if (!shopId) return;

    // Carrega stats e nome da assistência em paralelo
    recarregarStats();

    // ✅ CORREÇÃO: busca o nome da shop no banco de dados
    getShopSettings()
      .then((shop) => setShopName(shop.name ?? ""))
      .catch(() => {});
  }, [shopId]);

  function handleVendaRealizada(lucro: number, total: number) {
    setStats((prev) => ({ ...prev, faturamento: prev.faturamento + total }));
  }

  const tabs = [
    { id: "dashboard"     as Tab, label: "Dashboard",         icon: LayoutDashboard },
    { id: "os"            as Tab, label: "Ordens de Serviço", icon: Wrench          },
    { id: "estoque"       as Tab, label: "Estoque",           icon: Package         },
    { id: "imei"          as Tab, label: "Consulta IMEI",     icon: Smartphone      },
    { id: "configuracoes" as Tab, label: "Configurações",     icon: Settings        },
  ];

  const tabSubtitles: Record<Tab, string> = {
    dashboard:     "Visão geral da operação",
    os:            "Gerencie todas as ordens de serviço",
    estoque:       "Controle seu inventário de peças",
    imei:          "Valide e consulte dispositivos",
    configuracoes: "Personalize sua conta",
  };

  const mobileLabel: Record<Tab, string> = {
    dashboard: "Home", os: "OS", estoque: "Estoque", imei: "IMEI", configuracoes: "Config",
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Header fixo ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 60,
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(6,6,8,0.92)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "0.5px solid var(--rf-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="rf-logo-mark" style={{ width: 26, height: 26, borderRadius: 7 }}><LogoIcon /></div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>RepairFlow</span>
        </div>
        <button onClick={() => setVendaModal(true)} className="rf-btn-primary" style={{ fontSize: 13, padding: "8px 16px", gap: 6 }}>
          <Zap size={14} />
          <span className="hidden sm:inline">Venda Rápida</span>
        </button>
      </header>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--rf-bg)", paddingTop: "60px" }}>
        <ExpiryBanner />
        <div style={{ display: "flex", flex: 1 }}>

          {/* ── Sidebar desktop ── */}
          <aside className="hidden md:flex" style={{
            width: "var(--sidebar-w)", flexShrink: 0, flexDirection: "column",
            borderRight: "0.5px solid var(--rf-border)", background: "var(--rf-surface)",
          }}>
            <div style={{ padding: "20px 20px 10px" }}>
              <p style={{ fontSize: 10, color: "var(--rf-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gestão Interna</p>
            </div>
            <nav style={{ flex: 1, padding: "0px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
              {tabs.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`rf-nav-item ${activeTab === item.id ? "active" : ""}`}>
                  <item.icon size={15} />
                  {item.label}
                  {activeTab === item.id && <span className="nav-dot" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Main ── */}
          <main style={{ flex: 1, overflowX: "hidden", minHeight: "calc(100vh - 60px)" }} className="pb-24 md:pb-0">

            {/* Sub-header desktop */}
            <div className="hidden md:flex" style={{
              alignItems: "center", justifyContent: "space-between",
              padding: "20px 32px",
              borderBottom: "0.5px solid var(--rf-border)",
              position: "sticky", top: 0, zIndex: 20,
              background: "rgba(6,6,8,0.92)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            }}>
              <div>
                <h1 className="rf-title-gradient" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <p style={{ fontSize: 13, color: "var(--rf-text-2)", marginTop: 4, fontWeight: 400 }}>
                  {tabSubtitles[activeTab]}
                </p>
              </div>
              {activeTab === "os" && (
                <button onClick={() => router.push("/painel/nova-os")} className="rf-btn-primary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Nova OS
                </button>
              )}
            </div>

            {/* Título mobile */}
            <div className="md:hidden" style={{ padding: "16px 16px 0" }}>
              <h1 className="rf-title-gradient" style={{ fontSize: 20, fontWeight: 600 }}>
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p style={{ fontSize: 12, color: "var(--rf-text-2)", marginTop: 2, fontWeight: 400 }}>
                {tabSubtitles[activeTab]}
              </p>
              {activeTab === "os" && (
                <button onClick={() => router.push("/painel/nova-os")} className="rf-btn-primary" style={{ fontSize: 12, marginTop: 12 }}>
                  <Plus size={13} /> Nova OS
                </button>
              )}
            </div>

            {/* Conteúdo */}
            <div style={{ padding: "24px 16px 32px" }} className="md:px-8 md:py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === "dashboard" && shopId && (
                    <DashboardTab
                      stats={stats}
                      shopId={shopId}
                      // ✅ CORREÇÃO: usa shopName (banco) em vez de userName (sessão)
                      nomeAssistencia={shopName}
                      onNovaOS={() => router.push("/painel/nova-os")}
                      onFaturamentoClick={() => setFaturamentoModal(true)}
                    />
                  )}

                  {activeTab === "os" && shopId && <OsTable shopId={shopId} onStatusChange={recarregarStats} />}
                  {activeTab === "os" && !shopId && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--rf-text-3)", fontSize: 13 }}>Aguardando sessão...</div>
                  )}

                  {activeTab === "estoque" && shopId && <StockTab shopId={shopId} />}
                  {activeTab === "estoque" && !shopId && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--rf-text-3)", fontSize: 13 }}>Aguardando sessão...</div>
                  )}

                  {activeTab === "imei" && <ImeiTab />}
                  {activeTab === "configuracoes" && <ConfiguracoesTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* ── Bottom nav mobile ── */}
        <nav className="md:hidden rf-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, display: "flex" }}>
          {tabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`rf-bottom-nav-btn ${isActive ? "active" : "inactive"}`}>
                {isActive && (
                  <motion.div layoutId="tab-indicator" className="rf-nav-indicator" transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                )}
                <div className="rf-nav-icon-wrap nav-icon">
                  <item.icon size={20} strokeWidth={isActive ? 2 : 1.75} />
                </div>
                <span className="nav-label">{mobileLabel[item.id]}</span>
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
