// lib/pdf-os.ts
import jsPDF from "jspdf";

export async function gerarPdfOS(os: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const margin = 14;

  const hex2rgb = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];

  // ─── Paleta — cinza grafite + accent slate-blue discreto ─
  const headerBg    = "#1e2535"; // grafite azulado escuro
  const headerMid   = "#2a3347"; // degradê simulado
  const accent      = "#3b5bdb"; // azul discreto
  const accentSuave = "#eef2ff"; // fundo seções
  const branco      = "#ffffff";
  const cinzaF      = "#f9fafb";
  const cinzaBorda  = "#e5e7eb";
  const textoE      = "#111827";
  const textoL      = "#6b7280";
  const verdeG      = "#059669";
  const verdeLight  = "#ecfdf5";

  // ─── CABEÇALHO ──────────────────────────────────────────
  doc.setFillColor(...hex2rgb(headerBg));
  doc.rect(0, 0, W, 48, "F");

  // Faixa degradê simulada (camada mais clara no topo)
  doc.setFillColor(...hex2rgb(headerMid));
  doc.rect(0, 0, W, 18, "F");

  // Linha accent fina no topo
  doc.setFillColor(...hex2rgb(accent));
  doc.rect(0, 0, W, 2, "F");

  // Logo
  let logoWidth = 0;
  if (os.shop?.logo && os.shop.logo.startsWith("data:image")) {
    try {
      const imgType = os.shop.logo.includes("png") ? "PNG" : "JPEG";
      doc.addImage(os.shop.logo, imgType, margin, 9, 20, 20);
      logoWidth = 26;
    } catch (e) { logoWidth = 0; }
  }

  // Nome da loja — grande e bold
  const nomeX = margin + logoWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(...hex2rgb(branco));
  doc.text(os.shop?.name ?? "Assistencia Tecnica", nomeX, 20);

  // Contatos
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 175, 210);
  const contatos = [os.shop?.phone, os.shop?.instagram, os.shop?.address]
    .filter(Boolean).join("   ·   ");
  if (contatos) doc.text(contatos, nomeX, 28);

  // Status badge
  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    RECEIVED:          { label: "Recebido",        bg: "#374151", text: "#d1d5db" },
    DIAGNOSING:        { label: "Diagnosticando",  bg: "#78350f", text: "#fde68a" },
    AWAITING_APPROVAL: { label: "Ag. Aprovacao",   bg: "#78350f", text: "#fde68a" },
    APPROVED:          { label: "Aprovado",         bg: "#1e3a8a", text: "#bfdbfe" },
    IN_REPAIR:         { label: "Em Reparo",        bg: "#4c1d95", text: "#ddd6fe" },
    READY:             { label: "Pronto",           bg: "#064e3b", text: "#a7f3d0" },
    DELIVERED:         { label: "Entregue",         bg: "#064e3b", text: "#a7f3d0" },
    CANCELED:          { label: "Cancelado",        bg: "#7f1d1d", text: "#fecaca" },
  };
  const si = statusMap[os.status] ?? { label: os.status, bg: "#374151", text: "#d1d5db" };
  doc.setFillColor(...hex2rgb(si.bg));
  doc.roundedRect(nomeX, 33, 42, 7, 2, 2, "F");
  doc.setTextColor(...hex2rgb(si.text));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(si.label.toUpperCase(), nomeX + 21, 37.8, { align: "center" });

  // ─── Badge OS ─────────────────────────────────────────────
  // Box branco arredondado
  const bW = 48;
  const bH = 34;
  const bX = W - margin - bW;
  const bY = 7;

  doc.setFillColor(...hex2rgb(branco));
  doc.roundedRect(bX, bY, bW, bH, 3, 3, "F");

  // Mini label no topo do badge
  doc.setTextColor(...hex2rgb(textoL));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("ORDEM DE SERVICO", bX + bW / 2, bY + 6, { align: "center" });

  // Linha divisória
  doc.setDrawColor(...hex2rgb(cinzaBorda));
  doc.setLineWidth(0.3);
  doc.line(bX + 4, bY + 8, bX + bW - 4, bY + 8);

  // Numero grande
  doc.setTextColor(...hex2rgb(headerBg));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(`#${String(os.orderNumber).padStart(4, "0")}`, bX + bW / 2, bY + 28, { align: "center" });

  let y = 56;

  // ─── Helpers ─────────────────────────────────────────────
  const drawSection = (yPos: number, height: number, title: string) => {
    doc.setFillColor(...hex2rgb(cinzaF));
    doc.roundedRect(margin, yPos, W - margin * 2, height, 3, 3, "F");
    doc.setDrawColor(...hex2rgb(cinzaBorda));
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, W - margin * 2, height, 3, 3, "S");

    doc.setFillColor(...hex2rgb(accentSuave));
    doc.roundedRect(margin, yPos, W - margin * 2, 10, 3, 3, "F");
    doc.rect(margin, yPos + 6, W - margin * 2, 4, "F");

    doc.setFillColor(...hex2rgb(accent));
    doc.roundedRect(margin, yPos, 3, 10, 1, 1, "F");

    doc.setTextColor(...hex2rgb(accent));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setCharSpace(0.8);
    doc.text(title.toUpperCase(), margin + 7, yPos + 6.8);
    doc.setCharSpace(0);
  };

  const field = (label: string, value: string, x: number, yPos: number) => {
    doc.setTextColor(...hex2rgb(textoL));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(label, x, yPos);
    doc.setTextColor(...hex2rgb(textoE));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(value && value.trim() ? value : "—", x, yPos + 5.5);
  };

  const col2 = margin + (W - margin * 2) / 2 + 4;

  // ─── CLIENTE ─────────────────────────────────────────────
  drawSection(y, 32, "Dados do Cliente");
  field("Nome", os.customer?.name ?? "", margin + 7, y + 17);
  field("Telefone", os.customer?.phone ?? "", col2, y + 17);
  field("CPF / Documento", os.customer?.document ?? "", margin + 7, y + 26);
  y += 37;

  // ─── APARELHO ────────────────────────────────────────────
  drawSection(y, 32, "Aparelho");
  field("Marca", os.device?.brand ?? "", margin + 7, y + 17);
  field("Modelo", os.device?.model ?? "", col2, y + 17);
  field("IMEI", os.device?.imei ?? "", margin + 7, y + 26);
  field("Senha / Padrao", os.device?.password ?? "", col2, y + 26);
  y += 37;

  // ─── DEFEITO ─────────────────────────────────────────────
  drawSection(y, 26, "Defeito Relatado");
  doc.setTextColor(...hex2rgb(textoE));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const defLines = doc.splitTextToSize(os.defect ?? "Nao informado", W - margin * 2 - 14);
  doc.text(defLines, margin + 7, y + 18);
  y += 31;

  // ─── ORCAMENTO ───────────────────────────────────────────
  drawSection(y, 42, "Orcamento de Servico");

  doc.setFillColor(...hex2rgb(headerBg));
  doc.rect(margin + 3, y + 11, W - margin * 2 - 3, 7, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("DESCRICAO DO SERVICO", margin + 8, y + 16.2);
  doc.text("VALOR", W - margin - 6, y + 16.2, { align: "right" });

  doc.setFillColor(240, 244, 255);
  doc.rect(margin + 3, y + 18, W - margin * 2 - 3, 8, "F");

  doc.setTextColor(...hex2rgb(textoE));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const servicoDesc = os.repairType?.name ?? os.defect ?? "Servico tecnico";
  doc.text(servicoDesc, margin + 8, y + 23.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex2rgb(accent));
  doc.text(`R$ ${(os.servicePrice || os.totalPrice || 0).toFixed(2)}`, W - margin - 6, y + 23.5, { align: "right" });

  doc.setFillColor(...hex2rgb(headerBg));
  doc.roundedRect(W - margin - 62, y + 30, 58, 9, 2.5, 2.5, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`TOTAL   R$ ${(os.totalPrice || 0).toFixed(2)}`, W - margin - 33, y + 36, { align: "center" });
  y += 48;

  // ─── GARANTIA ────────────────────────────────────────────
  const diasGarantia = os.warrantyDays ?? os.shop?.standardWarranty ?? 90;
  const dataEntrada = new Date(os.createdAt);
  const dataGarantia = new Date(dataEntrada);
  dataGarantia.setDate(dataGarantia.getDate() + diasGarantia);

  doc.setFillColor(...hex2rgb(verdeLight));
  doc.roundedRect(margin, y, W - margin * 2, 24, 3, 3, "F");
  doc.setDrawColor(...hex2rgb(verdeG));
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, W - margin * 2, 24, 3, 3, "S");
  doc.setFillColor(...hex2rgb(verdeG));
  doc.roundedRect(margin, y, 3, 24, 1, 1, "F");

  doc.setTextColor(...hex2rgb(verdeG));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setCharSpace(0.8);
  doc.text("GARANTIA DO SERVICO", margin + 7, y + 7);
  doc.setCharSpace(0);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hex2rgb(textoE));
  doc.setFontSize(9.5);
  doc.text(
    `Este servico possui garantia de ${diasGarantia} dias — valida ate ${dataGarantia.toLocaleDateString("pt-BR")}.`,
    margin + 7, y + 14
  );
  doc.setFontSize(7.5);
  doc.setTextColor(...hex2rgb(textoL));
  doc.text("A garantia cobre apenas o servico realizado, excluindo danos fisicos ou por mau uso.", margin + 7, y + 20);
  y += 29;

  // ─── OBSERVACOES ─────────────────────────────────────────
  if (os.notes) {
    drawSection(y, 24, "Observacoes");
    doc.setTextColor(...hex2rgb(textoE));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const notasLines = doc.splitTextToSize(os.notes, W - margin * 2 - 14);
    doc.text(notasLines, margin + 7, y + 18);
    y += 29;
  }

  // ─── DATAS ───────────────────────────────────────────────
  doc.setTextColor(...hex2rgb(textoL));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Entrada: ${dataEntrada.toLocaleDateString("pt-BR")}`, margin, y + 4);
  if (os.deadline) {
    doc.text(`Prazo estimado: ${new Date(os.deadline).toLocaleDateString("pt-BR")}`, margin + 55, y + 4);
  }
  y += 10;

  // ─── ASSINATURAS ─────────────────────────────────────────
  const sigY = 262;
  doc.setLineDashPattern([1, 1.5], 0);
  doc.setDrawColor(...hex2rgb(cinzaBorda));
  doc.setLineWidth(0.5);
  doc.line(margin, sigY, margin + 74, sigY);
  doc.line(W - margin - 74, sigY, W - margin, sigY);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(...hex2rgb(textoL));
  doc.setFontSize(7.5);
  doc.text("Assinatura do Cliente", margin + 37, sigY + 5, { align: "center" });
  doc.text("Assinatura da Assistencia", W - margin - 37, sigY + 5, { align: "center" });

  // ─── RODAPE ──────────────────────────────────────────────
  doc.setFillColor(...hex2rgb(headerBg));
  doc.rect(0, 279, W, 18, "F");
  doc.setFillColor(...hex2rgb(accent));
  doc.rect(0, 279, W, 1.5, "F");

  doc.setTextColor(140, 155, 190);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const shopName = os.shop?.name ?? "";
  const shopPhone = os.shop?.phone ? `  ·  ${os.shop.phone}` : "";
  doc.text(
    `${shopName}${shopPhone}   ·   Gerado em ${new Date().toLocaleString("pt-BR")}`,
    W / 2, 290, { align: "center" }
  );

  // ─── SALVAR ──────────────────────────────────────────────
  const nomeLoja = (os.shop?.name ?? "OS").replace(/\s+/g, "_");
  doc.save(`OS_${String(os.orderNumber).padStart(4, "0")}_${nomeLoja}.pdf`);
}