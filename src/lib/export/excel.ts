import ExcelJS from "exceljs";
import type { ClubBranding } from "./branding";
import { downloadBlob } from "./download";

function parseLogoDataUrl(dataUrl: string): { base64: string; extension: "png" | "jpeg" } | null {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { base64: match[2], extension: match[1] === "jpg" ? "jpeg" : (match[1] as "png" | "jpeg") };
}

export function createBrandedWorkbook(branding: ClubBranding): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = branding.name;
  wb.created = new Date();
  return wb;
}

/** Title row + generated-date row + logo (if set), at the top of a sheet. Returns the next free row index. */
export function addBrandedHeader(wb: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, branding: ClubBranding, title: string): number {
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${branding.name} — ${title}`;
  titleCell.font = { bold: true, size: 14 };
  sheet.getRow(1).height = 22;

  sheet.mergeCells("A2:E2");
  const dateCell = sheet.getCell("A2");
  dateCell.value = `Generated ${new Date().toLocaleDateString()}`;
  dateCell.font = { size: 9, color: { argb: "FF888888" } };

  if (branding.logoDataUrl) {
    const parsed = parseLogoDataUrl(branding.logoDataUrl);
    if (parsed) {
      try {
        const imageId = wb.addImage({ base64: parsed.base64, extension: parsed.extension });
        sheet.addImage(imageId, { tl: { col: 5.2, row: 0.1 } as any, ext: { width: 50, height: 50 } });
      } catch {
        // unsupported image - skip, title-only header still renders
      }
    }
  }

  return 4;
}

export interface ExcelColumn {
  header: string;
  width?: number;
}

/** Writes a header row (bold, dark fill) + data rows starting at startRow. Returns the next free row index. */
export function addTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  columns: ExcelColumn[],
  rows: (string | number | null)[][],
): number {
  const headerRow = sheet.getRow(startRow);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    const column = sheet.getColumn(i + 1);
    column.width = col.width ?? Math.max(12, col.header.length + 2);
  });
  rows.forEach((row, r) => {
    const dataRow = sheet.getRow(startRow + 1 + r);
    row.forEach((value, c) => {
      dataRow.getCell(c + 1).value = value;
    });
  });
  return startRow + 2 + rows.length;
}

export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename,
  );
}
