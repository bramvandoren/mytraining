import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type { ClubBranding } from "./branding";

const MARGIN = 40;
const HEADER_BOTTOM = 78;

export interface BrandedDoc {
  doc: jsPDF;
}

function drawHeader(doc: jsPDF, branding: ClubBranding, title: string) {
  let x = MARGIN;
  if (branding.logoDataUrl) {
    try {
      doc.addImage(branding.logoDataUrl, x, 22, 32, 32, undefined, "FAST");
      x += 42;
    } catch {
      // unsupported image format in this browser - fall back to text-only header
    }
  }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(branding.name, x, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110);
  doc.text(title, x, 56);
  doc.setTextColor(0);
  doc.setDrawColor(210);
  doc.line(MARGIN, HEADER_BOTTOM, doc.internal.pageSize.getWidth() - MARGIN, HEADER_BOTTOM);
}

/** Creates an A4 jsPDF doc with the club's branded header drawn on every page (including pages added by autoTable's own pagination). */
export function createBrandedDoc(branding: ClubBranding, title: string): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.internal.events.subscribe("addPage", () => drawHeader(doc, branding, title));
  drawHeader(doc, branding, title);
  return doc;
}

export function startY(doc: jsPDF): number {
  const last = (doc as any).lastAutoTable;
  return last ? last.finalY + 24 : HEADER_BOTTOM + 24;
}

export function addTable(doc: jsPDF, y: number, head: RowInput[], body: RowInput[]) {
  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_BOTTOM + 16 },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    theme: "striped",
  });
}

export function addHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(text, MARGIN, y);
  doc.setFont("helvetica", "normal");
  return y + 16;
}

export function addParagraph(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(9);
  doc.setTextColor(40);
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2;
  const lines = doc.splitTextToSize(text, width) as string[];
  doc.text(lines, MARGIN, y);
  return y + lines.length * 12 + 10;
}

export function ensureSpace(doc: jsPDF, y: number, needed = 60): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return HEADER_BOTTOM + 24;
  }
  return y;
}

export function finishPdf(doc: jsPDF, filename: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pages} · Generated ${new Date().toLocaleDateString()}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 20,
    );
  }
  doc.save(filename);
}
