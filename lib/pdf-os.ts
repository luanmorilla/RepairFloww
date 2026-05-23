// lib/pdf-os.ts
import jsPDF from "jspdf";

export async function gerarPdfOS(os: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const margin = 14;

  // ─── Paleta ─────────────────────────────────────────────
  const hex2rgb = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];

  const azul       = "#2563eb";
  const azulEscuro = "#1e3a5f";
  const branco     = "#ffffff";
  const cinzaF     = "#f8f9fc";
  const cinzaBorda = "#e2e8f0";
  const textoE     = "#0f172a";
  const textoL     = "#64748b";
  const verde      = "#16a34a";

  // ─── CABEÇALHO ──────────────────────────────────────────
  // Fundo degradê simulado (dois retângulos)
  doc.setFillColor(...hex2rgb(azulEscuro));
  doc.rect(0, 0, W, 42, "F");
  doc.setFillColor(...hex2rgb(azul));
  doc.rect(0, 32, W, 10, "F");

  // Logo se existir
  let logoWidth = 0;
  if (os.shop?.logo && os.shop.logo.startsWith("data:image")) {
    try {
      const imgType = os.shop.logo.includes("png") ? "PNG" : "JPEG";
      doc.addImage(os.shop.logo, imgType, margin, 6, 22, 22);
      logoWidth = 26;
    } catch (e) {
      logoWidth = 0;
    }
  }

  // Nome da assistência
  const nomeX = margin + logoWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...hex2rgb(branco));
  doc.text(os.shop?.name ?? "Assistência Técnica", nomeX, 15);

  // Contatos
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 255);
  const contatos = [os.shop?.phone, os.shop?.instagram, os.shop?.address]
    .filter(Boolean)
    .join("   •   ");
  if (contatos) doc.text(contatos, nomeX, 22);

  // Badge OS
  doc.setFillColor(...hex2rgb(branco));
  doc.roundedRect(W - margin - 46, 5, 46, 28, 4, 4, "F");
  doc.setTextColor(...hex2rgb(azul));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("ORDEM DE SERVIÇO", W - margin - 23, 13, { align: "center" });
  doc.setFontSize(20);
  doc.text(`#${String(os.orderNumber).padStart(4, "0")}`, W - margin - 23, 26, { align: "center" });

  // Status badge
  const statusMap: Record<string, { label: string; color: string }> = {
    RECEIVED:          { label: "Recebido",         color: "#64748b" },
    DIAGNOSING:        { label: "Diagnosticando",   color: "#d97706" },
    AWAITING_APPROVAL: { label: "Aguard. Aprovação",color: "#d97706" },
    APPROVED:          { label: "Aprovado",          color: "#2563eb" },
    IN_REPAIR:         { label: "Em Reparo",         color: "#7c3aed" },
    READY:             { label: "Pronto",            color: "#16a34a" },
    DELIVERED:         { label: "Entregue",          color: "#16a34a" },
    CANCELED:          { label: "Cancelado",         color: "#dc2626" },
  };
  const statusInfo = statusMap[os.status] ?? { label: os.status, color: "#64748b" };
  doc.setFillColor(...hex2rgb(statusInfo.color));
  doc.roundedRect(margin + logoWidth, 27, 42, 7, 2, 2, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(statusInfo.label.toUpperCase(), margin + logoWidth + 21, 32, { align: "center" });

  let y = 50;

  // ─── Helpers ─────────────────────────────────────────────
  const drawCard = (yPos: number, height: number, title: string) => {
    doc.setFillColor(...hex2rgb(cinzaF));
    doc.roundedRect(margin, yPos, W - margin * 2, height, 3, 3, "F");
    doc.setDrawColor(...hex2rgb(cinzaBorda));
    doc.roundedRect(margin, yPos, W - margin * 2, height, 3, 3, "S");
    // Barra azul esquerda
    doc.setFillColor(...hex2rgb(azul));
    doc.roundedRect(margin, yPos, 3.5, height, 1, 1, "F");
    // Título do card
    doc.setTextColor(...hex2rgb(azul));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title.toUpperCase(), margin + 7, yPos + 7);
    // Linha separadora do título
    doc.setDrawColor(...hex2rgb(cinzaBorda));
    doc.line(margin + 7, yPos + 9, W - margin - 5, yPos + 9);
  };

  const field = (label: string, value: string, x: number, yPos: number, maxW = 80) => {
    doc.setTextColor(...hex2rgb(textoL));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label, x, yPos);
    doc.setTextColor(...hex2rgb(textoE));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const val = value && value.trim() ? value : "—";
    doc.text(val, x, yPos + 5.5);
  };

  const col2 = margin + (W - margin * 2) / 2 + 4;

  // ─── CLIENTE ─────────────────────────────────────────────
  drawCard(y, 32, "Dados do Cliente");
  field("Nome", os.customer?.name ?? "", margin + 7, y + 14);
  field("Telefone", os.customer?.phone ?? "", col2, y + 14);
  field("CPF / Documento", os.customer?.document ?? "", margin + 7, y + 25);
  y += 37;

  // ─── APARELHO ────────────────────────────────────────────
  drawCard(y, 32, "Aparelho");
  field("Marca", os.device?.brand ?? "", margin + 7, y + 14);
  field("Modelo", os.device?.model ?? "", col2, y + 14);
  field("IMEI", os.device?.imei ?? "", margin + 7, y + 25);
  field("Senha / Padrão", os.device?.password ?? "", col2, y + 25);
  y += 37;

  // ─── DEFEITO ─────────────────────────────────────────────
  drawCard(y, 28, "Defeito Relatado");
  doc.setTextColor(...hex2rgb(textoE));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const defLines = doc.splitTextToSize(os.defect ?? "Não informado", W - margin * 2 - 14);
  doc.text(defLines, margin + 7, y + 15);
  y += 33;

  // ─── ORÇAMENTO ───────────────────────────────────────────
  drawCard(y, 40, "Orçamento de Serviço");

  // Header tabela
  doc.setFillColor(...hex2rgb(azul));
  doc.rect(margin + 3.5, y + 10, W - margin * 2 - 3.5, 7, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Descrição do Serviço", margin + 8, y + 15);
  doc.text("Valor", W - margin - 6, y + 15, { align: "right" });

  // Linha de serviço
  doc.setTextColor(...hex2rgb(textoE));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const servicoDesc = os.repairType?.name ?? os.defect ?? "Serviço técnico";
  doc.text(servicoDesc, margin + 8, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hex2rgb(azul));
  doc.text(`R$ ${(os.servicePrice || os.totalPrice || 0).toFixed(2)}`, W - margin - 6, y + 24, { align: "right" });

  // Total
  doc.setFillColor(...hex2rgb(azulEscuro));
  doc.roundedRect(W - margin - 58, y + 30, 54, 8, 2, 2, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`TOTAL   R$ ${(os.totalPrice || 0).toFixed(2)}`, W - margin - 31, y + 35.5, { align: "center" });

  y += 46;

  // ─── GARANTIA ────────────────────────────────────────────
  const diasGarantia = os.warrantyDays ?? os.shop?.standardWarranty ?? 90;
  const dataEntrada = new Date(os.createdAt);
  const dataGarantia = new Date(dataEntrada);
  dataGarantia.setDate(dataGarantia.getDate() + diasGarantia);

  doc.setFillColor(230, 245, 235);
  doc.roundedRect(margin, y, W - margin * 2, 24, 3, 3, "F");
  doc.setDrawColor(...hex2rgb(verde));
  doc.roundedRect(margin, y, W - margin * 2, 24, 3, 3, "S");
  doc.setFillColor(...hex2rgb(verde));
  doc.roundedRect(margin, y, 3.5, 24, 1, 1, "F");

  doc.setTextColor(...hex2rgb(verde));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("✓ GARANTIA DO SERVIÇO", margin + 7, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hex2rgb(textoE));
  doc.setFontSize(9.5);
  doc.text(
    `Este serviço possui garantia de ${diasGarantia} dias — válida até ${dataGarantia.toLocaleDateString("pt-BR")}.`,
    margin + 7, y + 14
  );
  doc.setFontSize(8);
  doc.setTextColor(...hex2rgb(textoL));
  doc.text("A garantia cobre apenas o serviço realizado, excluindo danos físicos ou por mau uso.", margin + 7, y + 20);
  y += 29;

  // ─── OBSERVAÇÕES ─────────────────────────────────────────
  if (os.notes) {
    drawCard(y, 24, "Observações");
    doc.setTextColor(...hex2rgb(textoE));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const notasLines = doc.splitTextToSize(os.notes, W - margin * 2 - 14);
    doc.text(notasLines, margin + 7, y + 15);
    y += 29;
  }

  // ─── DATA ────────────────────────────────────────────────
  doc.setTextColor(...hex2rgb(textoL));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Data de entrada: ${dataEntrada.toLocaleDateString("pt-BR")}`, margin, y + 4);
  if (os.deadline) {
    doc.text(`Prazo estimado: ${new Date(os.deadline).toLocaleDateString("pt-BR")}`, margin + 70, y + 4);
  }
  y += 12;

  // ─── ASSINATURAS ─────────────────────────────────────────
  const sigY = 265;
  doc.setDrawColor(...hex2rgb(cinzaBorda));
  doc.setLineWidth(0.5);
  doc.line(margin, sigY, margin + 72, sigY);
  doc.line(W - margin - 72, sigY, W - margin, sigY);
  doc.setTextColor(...hex2rgb(textoL));
  doc.setFontSize(8);
  doc.text("Assinatura do Cliente", margin + 36, sigY + 5, { align: "center" });
  doc.text("Assinatura da Assistência", W - margin - 36, sigY + 5, { align: "center" });

  // ─── RODAPÉ ──────────────────────────────────────────────
  doc.setFillColor(...hex2rgb(azulEscuro));
  doc.rect(0, 282, W, 15, "F");

  doc.setTextColor(180, 200, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  const shopName = os.shop?.name ?? "";
  const shopPhone = os.shop?.phone ? `  •  WhatsApp: ${os.shop.phone}` : "";
  doc.text(
    `${shopName}${shopPhone}   •   Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
    W / 2, 290,
    { align: "center" }
  );

  // ─── SALVAR ──────────────────────────────────────────────
  const nomeLoja = (os.shop?.name ?? "OS").replace(/\s+/g, "_");
  doc.save(`OS_${String(os.orderNumber).padStart(4, "0")}_${nomeLoja}.pdf`);
}