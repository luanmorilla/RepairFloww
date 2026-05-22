// lib/pdf-os.ts
// Instalar: npm install jspdf

import jsPDF from "jspdf";

export async function gerarPdfOS(os: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const margin = 18;
  const col2 = W / 2 + 4;

  // ─── Paleta ─────────────────────────────────────────────
  const preto   = "#0a0a0a";
  const cinzaE  = "#1c1c1c";  // cabeçalho
  const cinzaL  = "#f4f4f4";  // fundo seções
  const azul    = "#2563eb";
  const branco  = "#ffffff";
  const cinzaT  = "#555555";
  const cinzaTL = "#888888";

  const hex2rgb = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return [r, g, b] as [number, number, number];
  };

  // ─── CABEÇALHO ──────────────────────────────────────────
  doc.setFillColor(...hex2rgb(cinzaE));
  doc.rect(0, 0, W, 38, "F");

  // Nome da assistência
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hex2rgb(branco));
  doc.text(os.shop?.name ?? "Assistência Técnica", margin, 16);

  // Subtítulo
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hex2rgb(cinzaTL));
  const subInfo = [os.shop?.phone, os.shop?.address, os.shop?.instagram]
    .filter(Boolean)
    .join("   •   ");
  if (subInfo) doc.text(subInfo, margin, 23);

  // Número da OS (destaque direita)
  doc.setFillColor(...hex2rgb(azul));
  doc.roundedRect(W - margin - 44, 7, 44, 22, 3, 3, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ORDEM DE SERVIÇO", W - margin - 22, 14, { align: "center" });
  doc.setFontSize(16);
  doc.text(`#${String(os.orderNumber).padStart(4, "0")}`, W - margin - 22, 24, { align: "center" });

  let y = 46;

  // ─── LINHA AZUL DECORATIVA ──────────────────────────────
  doc.setFillColor(...hex2rgb(azul));
  doc.rect(margin, y - 4, W - margin * 2, 1.2, "F");

  // ─── SEÇÃO: CLIENTE & APARELHO ─────────────────────────
  const drawSection = (title: string, yPos: number, height: number) => {
    doc.setFillColor(...hex2rgb(cinzaL));
    doc.roundedRect(margin, yPos, W - margin * 2, height, 3, 3, "F");
    doc.setTextColor(...hex2rgb(azul));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(title.toUpperCase(), margin + 4, yPos + 6);
    doc.setFillColor(...hex2rgb(azul));
    doc.rect(margin, yPos, 3, height, "F");
  };

  const field = (label: string, value: string, x: number, yPos: number) => {
    doc.setTextColor(...hex2rgb(cinzaTL));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(label, x, yPos);
    doc.setTextColor(...hex2rgb(preto));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(value || "—", x, yPos + 5);
  };

  // Cliente
  drawSection("Dados do Cliente", y, 30);
  field("Nome", os.customer?.name ?? "", margin + 6, y + 11);
  field("Telefone", os.customer?.phone ?? "", col2, y + 11);
  field("CPF / Documento", os.customer?.document ?? "", margin + 6, y + 22);
  y += 35;

  // Aparelho
  drawSection("Aparelho", y, 30);
  field("Marca", os.device?.brand ?? "", margin + 6, y + 11);
  field("Modelo", os.device?.model ?? "", col2, y + 11);
  field("IMEI", os.device?.imei ?? "", margin + 6, y + 22);
  field("Senha / Padrão", os.device?.password ?? "", col2, y + 22);
  y += 35;

  // ─── DEFEITO RELATADO ───────────────────────────────────
  drawSection("Defeito Relatado", y, 26);
  doc.setTextColor(...hex2rgb(cinzaT));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const defecto = doc.splitTextToSize(os.defect ?? "Não informado", W - margin * 2 - 12);
  doc.text(defecto, margin + 6, y + 11);
  y += 31;

  // ─── ORÇAMENTO (só mão de obra) ─────────────────────────
  drawSection("Orçamento de Serviço", y, 36);

  doc.setTextColor(...hex2rgb(cinzaTL));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Descrição do Serviço", margin + 6, y + 12);
  doc.text("Mão de Obra", W - margin - 6, y + 12, { align: "right" });

  // Linha separadora
  doc.setDrawColor(...hex2rgb("#dddddd"));
  doc.line(margin + 4, y + 15, W - margin - 4, y + 15);

  doc.setTextColor(...hex2rgb(preto));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const servicoDesc = os.repairType?.name ?? os.defect ?? "Serviço técnico";
  doc.text(servicoDesc, margin + 6, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...hex2rgb(azul));
  doc.text(`R$ ${(os.servicePrice || os.totalPrice || 0).toFixed(2)}`, W - margin - 6, y + 22, { align: "right" });

  // Total
  doc.setFillColor(...hex2rgb(azul));
  doc.roundedRect(W - margin - 55, y + 27, 51, 7, 2, 2, "F");
  doc.setTextColor(...hex2rgb(branco));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL  R$ " + (os.totalPrice || 0).toFixed(2), W - margin - 29, y + 32.5, { align: "center" });

  y += 43;

  // ─── GARANTIA ────────────────────────────────────────────
  const diasGarantia = os.warrantyDays ?? os.shop?.standardWarranty ?? 90;
  const dataEntrada = new Date(os.createdAt);
  const dataGarantia = new Date(dataEntrada);
  dataGarantia.setDate(dataGarantia.getDate() + diasGarantia);

  doc.setFillColor(...hex2rgb("#eaf1ff"));
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, "F");
  doc.setFillColor(...hex2rgb(azul));
  doc.rect(margin, y, 3, 22, "F");

  doc.setTextColor(...hex2rgb(azul));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("GARANTIA DO SERVIÇO", margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hex2rgb(cinzaT));
  doc.setFontSize(8.5);
  doc.text(
    `Este serviço possui garantia de ${diasGarantia} dias — válida até ${dataGarantia.toLocaleDateString("pt-BR")}.`,
    margin + 6,
    y + 14
  );
  doc.setFontSize(7.5);
  doc.text("A garantia cobre apenas o serviço realizado, excluindo danos físicos ou por mau uso.", margin + 6, y + 19.5);

  y += 28;

  // ─── OBSERVAÇÕES ────────────────────────────────────────
  if (os.notes) {
    drawSection("Observações", y, 22);
    doc.setTextColor(...hex2rgb(cinzaT));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const notas = doc.splitTextToSize(os.notes, W - margin * 2 - 12);
    doc.text(notas, margin + 6, y + 11);
    y += 28;
  }

  // ─── DATAS ───────────────────────────────────────────────
  doc.setTextColor(...hex2rgb(cinzaTL));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Data de entrada: ${dataEntrada.toLocaleDateString("pt-BR")}`, margin, y);
  if (os.deadline) {
    doc.text(
      `Prazo estimado: ${new Date(os.deadline).toLocaleDateString("pt-BR")}`,
      margin,
      y + 5
    );
  }
  y += 12;

  // ─── ASSINATURA ──────────────────────────────────────────
  const assinaturaY = 270;
  doc.setDrawColor(...hex2rgb("#cccccc"));
  doc.line(margin, assinaturaY, margin + 70, assinaturaY);
  doc.line(W - margin - 70, assinaturaY, W - margin, assinaturaY);

  doc.setTextColor(...hex2rgb(cinzaTL));
  doc.setFontSize(7.5);
  doc.text("Assinatura do Cliente", margin + 35, assinaturaY + 4, { align: "center" });
  doc.text("Assinatura da Assistência", W - margin - 35, assinaturaY + 4, { align: "center" });

  // ─── RODAPÉ ──────────────────────────────────────────────
  doc.setFillColor(...hex2rgb(cinzaE));
  doc.rect(0, 284, W, 13, "F");
  doc.setTextColor(...hex2rgb(cinzaTL));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `Documento gerado em ${new Date().toLocaleString("pt-BR")}   •   ${os.shop?.name ?? ""}`,
    W / 2,
    291,
    { align: "center" }
  );

  // ─── SALVAR ──────────────────────────────────────────────
  const nomeLoja = (os.shop?.name ?? "OS").replace(/\s+/g, "_");
  doc.save(`OS_${String(os.orderNumber).padStart(4, "0")}_${nomeLoja}.pdf`);
}