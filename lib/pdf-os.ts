/**
 * pdf-os.ts
 * Gera e abre a Ordem de Serviço em uma janela de impressão premium.
 * Funciona em mobile, desktop e impressão A4 — sem dependências externas.
 *
 * Uso:
 *   import { abrirPdfOS } from "@/lib/pdf-os";
 *   await abrirPdfOS(os);   // os = retorno de getOsById()
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

function money(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pad(n: number | null | undefined) {
  return String(n ?? 0).padStart(6, "0");
}



// ─── Status labels ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RECEIVED:          { label: "Recebido",       color: "#64748b" },
  DIAGNOSING:        { label: "Em Diagnóstico", color: "#d97706" },
  AWAITING_APPROVAL: { label: "Ag. Aprovação",  color: "#ea580c" },
  APPROVED:          { label: "Aprovado",       color: "#2563eb" },
  IN_REPAIR:         { label: "Em Reparo",      color: "#7c3aed" },
  READY:             { label: "Pronto",         color: "#059669" },
  DELIVERED:         { label: "Entregue",       color: "#475569" },
  CANCELED:          { label: "Cancelado",      color: "#dc2626" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export function abrirPdfOS(os: any) {
  const shop       = os.shop ?? {};
  const customer   = os.customer ?? {};
  const device     = os.device ?? {};
  const status     = STATUS_MAP[os.status] ?? { label: os.status, color: "#64748b" };
  const osNum      = pad(os.orderNumber);
  const garantia   = shop.warrantyDays ?? shop.standardWarranty ?? 90;
  // A logo já é salva como base64 no banco (campo "logo") — usa direto, sem fetch
  const logoBase64 = shop.logo ?? "";
  const whatsapp   = shop.whatsapp ?? shop.phone ?? "";
  const endereco   = shop.address ?? "";

  // ── Linha de informação reutilizável ──
  function row(label: string, value: string | null | undefined, accent = false) {
    if (!value) return "";
    return `
      <div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value${accent ? " accent" : ""}">${value}</span>
      </div>`;
  }

  // ── Seção com título ──
  function section(title: string, icon: string, content: string) {
    return `
      <section class="section">
        <div class="section-header">
          <span class="section-icon">${icon}</span>
          <h3 class="section-title">${title}</h3>
        </div>
        <div class="section-body">${content}</div>
      </section>`;
  }

  // ── Bloco da logo: base64 já vem do banco, senão mostra placeholder ──
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="${shop.name ?? "Logo"}" />`
    : `<span class="logo-placeholder">${(shop.name ?? "RF").slice(0, 2).toUpperCase()}</span>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OS #${osNum} — ${customer.name ?? ""}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Base ── */
    html { font-size: 16px; }
    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page wrapper ── */
    .page {
      max-width: 794px;
      margin: 0 auto;
      background: #fff;
      min-height: 100vh;
    }

    /* ── Header ── */
    .header {
      padding: 40px 48px 32px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    .header-left { display: flex; align-items: center; gap: 20px; flex: 1; min-width: 0; }
    .logo-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      overflow: hidden; flex-shrink: 0;
      border: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      background: #f1f5f9;
    }
    .logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
    .logo-placeholder {
      font-size: 22px; font-weight: 900; color: #1e40af;
      letter-spacing: -1px;
    }
    .shop-name {
      font-size: 22px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.5px; line-height: 1.2;
    }
    .shop-meta { margin-top: 6px; display: flex; flex-direction: column; gap: 2px; }
    .shop-meta span { font-size: 12px; color: #64748b; font-weight: 400; }
    .header-right { flex-shrink: 0; text-align: right; }
    .os-label {
      font-size: 10px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.12em;
      margin-bottom: 6px;
    }
    .os-number {
      font-size: 32px; font-weight: 900; color: #0f172a;
      letter-spacing: -1.5px; line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .os-number span { color: #2563eb; }

    /* ── Status + Data banner ── */
    .banner {
      margin: 0 48px;
      padding: 16px 20px;
      background: #f8fafc;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 24px;
    }
    .banner-left { display: flex; align-items: center; gap: 12px; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 6px 14px; border-radius: 99px;
      font-size: 12px; font-weight: 700;
      letter-spacing: 0.02em;
      border: 1.5px solid;
    }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .banner-date { font-size: 12px; color: #64748b; }
    .banner-date strong { color: #334155; font-weight: 600; }

    /* ── Content ── */
    .content {
      padding: 32px 48px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Sections ── */
    .section {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
    }
    .section-header {
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 10px;
    }
    .section-icon { font-size: 14px; line-height: 1; }
    .section-title {
      font-size: 11px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.1em;
    }
    .section-body { padding: 4px 0; }

    /* ── Info rows ── */
    .info-row {
      display: flex; align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding: 11px 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
      font-size: 12px; color: #94a3b8; font-weight: 500;
      flex-shrink: 0; min-width: 120px;
    }
    .info-value {
      font-size: 13px; color: #1e293b; font-weight: 500;
      text-align: right; word-break: break-word;
    }
    .info-value.accent { color: #2563eb; font-weight: 700; }

    /* ── Defect highlight ── */
    .defect-box {
      margin: 0 20px 16px;
      padding: 14px 16px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 12px;
    }
    .defect-label { font-size: 10px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
    .defect-text { font-size: 13px; color: #431407; font-weight: 500; line-height: 1.6; }

    /* ── Two columns ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    /* ── Total card ── */
    .total-card {
      border: 2px solid #2563eb;
      border-radius: 20px;
      overflow: hidden;
    }
    .total-header {
      padding: 14px 24px;
      background: #2563eb;
      display: flex; align-items: center; justify-content: space-between;
    }
    .total-header-label {
      font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.75);
      text-transform: uppercase; letter-spacing: 0.12em;
    }
    .total-body {
      padding: 20px 24px;
      display: flex; align-items: center; justify-content: space-between;
      background: #eff6ff;
    }
    .total-desc { font-size: 13px; color: #1e40af; font-weight: 500; }
    .total-value {
      font-size: 38px; font-weight: 900; color: #1d4ed8;
      letter-spacing: -1.5px; font-variant-numeric: tabular-nums;
    }

    /* ── Warranty card ── */
    .warranty-card {
      border: 1px solid #e2e8f0;
      border-radius: 16px; overflow: hidden;
    }
    .warranty-header {
      padding: 14px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 10px;
    }
    .warranty-icon { font-size: 16px; }
    .warranty-title { font-size: 13px; font-weight: 700; color: #334155; }
    .warranty-days {
      font-size: 11px; color: #2563eb; font-weight: 700;
      margin-left: auto;
      background: #eff6ff; padding: 3px 10px; border-radius: 99px;
      border: 1px solid #bfdbfe;
    }
    .warranty-body { padding: 16px 20px; }
    .warranty-text { font-size: 12px; color: #475569; line-height: 1.7; }
    .warranty-list { margin-top: 10px; padding-left: 16px; }
    .warranty-list li { font-size: 12px; color: #64748b; margin-bottom: 3px; }

    /* ── Signatures ── */
    .signatures {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
      margin-top: 8px;
    }
    .sig-block { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .sig-line {
      width: 100%; height: 1px; background: #cbd5e1;
      margin-bottom: 6px;
    }
    .sig-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-align: center; }

    /* ── Footer ── */
    .footer {
      margin-top: 8px;
      padding: 24px 48px;
      border-top: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px;
    }
    .footer-left { display: flex; flex-direction: column; gap: 3px; }
    .footer-brand { font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
    .footer-contact { font-size: 11px; color: #64748b; }
    .footer-thanks { font-size: 12px; color: #94a3b8; font-style: italic; }
    .footer-badge {
      font-size: 9px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.1em;
      background: #f1f5f9; padding: 4px 10px; border-radius: 99px;
    }

    /* ── Print ── */
    @media print {
      html, body { background: #fff; }
      .page { max-width: 100%; min-height: auto; box-shadow: none; }
      .no-print { display: none !important; }
      @page { margin: 0; size: A4; }
    }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      .header { padding: 24px 20px 20px; flex-direction: column; gap: 16px; }
      .header-right { text-align: left; }
      .banner { margin: 0 20px; margin-top: 16px; flex-wrap: wrap; }
      .content { padding: 20px; gap: 16px; }
      .two-col { grid-template-columns: 1fr; }
      .total-value { font-size: 28px; }
      .signatures { grid-template-columns: 1fr; gap: 16px; }
      .footer { padding: 20px; flex-direction: column; align-items: flex-start; }
      .info-label { min-width: 100px; }
    }

    /* ── Print button ── */
    .print-btn {
      position: fixed; bottom: 24px; right: 24px;
      padding: 14px 28px;
      background: #2563eb;
      color: white;
      border: none; border-radius: 14px;
      font-family: "Inter", sans-serif;
      font-size: 14px; font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 32px rgba(37,99,235,0.35);
      display: flex; align-items: center; gap: 8px;
      transition: background 0.2s;
      z-index: 999;
    }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <header class="header">
    <div class="header-left">
      <div class="logo-wrap">
        ${logoHtml}
      </div>
      <div>
        <div class="shop-name">${shop.name ?? "Assistência Técnica"}</div>
        <div class="shop-meta">
          ${whatsapp ? `<span>📱 ${whatsapp}</span>` : ""}
          ${endereco ? `<span>📍 ${endereco}</span>` : ""}
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="os-label">Ordem de Serviço</div>
      <div class="os-number"><span>#</span>${osNum}</div>
    </div>
  </header>

  <!-- ── STATUS BANNER ── -->
  <div class="banner">
    <div class="banner-left">
      <span class="status-badge" style="color:${status.color};border-color:${status.color}22;background:${status.color}10">
        <span class="status-dot" style="background:${status.color}"></span>
        ${status.label}
      </span>
    </div>
    <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;">
      <div class="banner-date">Entrada: <strong>${fmt(os.createdAt)}</strong></div>
      ${os.deadline ? `<div class="banner-date">Previsão: <strong>${fmt(os.deadline)}</strong></div>` : ""}
    </div>
  </div>

  <!-- ── CONTENT ── -->
  <main class="content">

    <!-- Cliente + Aparelho (2 colunas) -->
    <div class="two-col">
      ${section("Cliente", "👤",
        row("Nome", customer.name) +
        row("Telefone", customer.phone) +
        row("WhatsApp", customer.whatsapp)
      )}
      ${section("Aparelho", "📱",
        row("Marca", device.brand) +
        row("Modelo", device.model) +
        row("Cor", device.color) +
        row("IMEI", device.imei) +
        row("Senha / PIN", device.password)
      )}
    </div>

    <!-- Defeito -->
    ${section("Defeito & Observações", "🔍",
      `<div class="defect-box">
        <div class="defect-label">Defeito relatado pelo cliente</div>
        <div class="defect-text">${os.defect ?? "Não informado"}</div>
      </div>` +
      (os.notes ? row("Observações internas", os.notes) : "") +
      (os.repairType?.name ? row("Tipo de serviço", os.repairType.name) : "") +
      (os.accessories ? row("Acessórios entregues", os.accessories) : "")
    )}

    <!-- VALOR TOTAL -->
    <div class="total-card">
      <div class="total-header">
        <span class="total-header-label">Total do Serviço</span>
        <span style="font-size:18px;">💳</span>
      </div>
      <div class="total-body">
        <span class="total-desc">Valor total acordado<br/>com o cliente</span>
        <span class="total-value">${money(os.totalPrice)}</span>
      </div>
    </div>

    <!-- GARANTIA -->
    <div class="warranty-card">
      <div class="warranty-header">
        <span class="warranty-icon">🛡️</span>
        <span class="warranty-title">Garantia do Serviço</span>
        <span class="warranty-days">${garantia} dias</span>
      </div>
      <div class="warranty-body">
        <div class="warranty-text">
          A garantia cobre exclusivamente o serviço executado por esta assistência técnica, pelo período de <strong>${garantia} dias</strong> a partir da data de entrega.
        </div>
        <div class="warranty-text" style="margin-top:8px;">A garantia <strong>não cobre</strong>:</div>
        <ul class="warranty-list">
          <li>Danos causados por mau uso, quedas ou impactos</li>
          <li>Oxidação, umidade ou danos por líquidos</li>
          <li>Danos externos ocorridos após a entrega</li>
          <li>Defeitos não relacionados ao serviço realizado</li>
        </ul>
      </div>
    </div>

    <!-- ASSINATURAS -->
    <div class="signatures">
      <div class="sig-block">
        <div style="height:48px;"></div>
        <div class="sig-line"></div>
        <span class="sig-label">Assinatura do Cliente</span>
      </div>
      <div class="sig-block">
        <div style="height:48px;"></div>
        <div class="sig-line"></div>
        <span class="sig-label">Assinatura do Técnico</span>
      </div>
      <div class="sig-block">
        <div style="height:48px;"></div>
        <div class="sig-line"></div>
        <span class="sig-label">Data de Entrega</span>
      </div>
    </div>

  </main>

  <!-- ── FOOTER ── -->
  <footer class="footer">
    <div class="footer-left">
      <span class="footer-brand">${shop.name ?? "Assistência Técnica"}</span>
      ${whatsapp ? `<span class="footer-contact">📱 ${whatsapp}</span>` : ""}
      <span class="footer-thanks">Obrigado por confiar em nossa assistência técnica.</span>
    </div>
    <span class="footer-badge">RepairFlow</span>
  </footer>

</div>

<!-- Botão flutuante de impressão (some no print) -->
<button class="print-btn no-print" onclick="window.print()">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
  Imprimir / Salvar PDF
</button>

</body>
</html>`;

  const filename = `OS-${osNum}-${(customer.name ?? "cliente").replace(/\s+/g, "-")}.html`;

  // Gera Blob e faz download direto — funciona em mobile e desktop sem pop-up
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Libera memória após o download iniciar
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}