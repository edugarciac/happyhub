import ExcelJS from 'exceljs';
import type { ExtractedInvoice } from './invoiceExtractor';

const HEADERS = [
  'Nº Factura',
  'Fecha',
  'Proveedor / Emisor',
  'NIF / CIF',
  'Concepto',
  'Base Imponible (€)',
  '% IVA',
  'Cuota IVA (€)',
  'Total (€)',
  'Forma de Pago',
  'Categoría',
  'Notas',
  'Archivo en Drive',
  'Fecha Registro',
];

const COL_WIDTHS = [16, 13, 30, 15, 35, 18, 8, 15, 13, 18, 22, 35, 45, 16];

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
  row.alignment = { horizontal: 'center', vertical: 'middle' };
  row.height = 22;
  row.eachCell(cell => {
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F766E' } },
      bottom: { style: 'medium', color: { argb: 'FF0F766E' } },
      left: { style: 'thin', color: { argb: 'FF0F766E' } },
      right: { style: 'thin', color: { argb: 'FF0F766E' } },
    };
  });
}

function parseNumber(value: string): number {
  const num = parseFloat(value?.replace(',', '.') || '0');
  return isNaN(num) ? 0 : num;
}

export async function addInvoiceRow(
  existingBuffer: Buffer | ArrayBuffer | null,
  invoice: ExtractedInvoice,
  driveLink: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HappyHub';

  let worksheet: ExcelJS.Worksheet;

  if (existingBuffer && (existingBuffer as Buffer).length > 0) {
    await workbook.xlsx.load(existingBuffer as any);
    worksheet = workbook.getWorksheet('Facturas') as ExcelJS.Worksheet;
    if (!worksheet) {
      worksheet = workbook.addWorksheet('Facturas');
      setupWorksheet(worksheet);
    }
  } else {
    worksheet = workbook.addWorksheet('Facturas');
    setupWorksheet(worksheet);
  }

  const isEvenRow = worksheet.rowCount % 2 === 0;
  const dataRow = worksheet.addRow([
    invoice.numeroFactura,
    invoice.fecha,
    invoice.proveedor,
    invoice.nifCif,
    invoice.concepto,
    parseNumber(invoice.baseImponible),
    parseNumber(invoice.porcentajeIva),
    parseNumber(invoice.cuotaIva),
    parseNumber(invoice.total),
    invoice.formaPago,
    invoice.categoria,
    invoice.notas,
    { text: 'Ver archivo', hyperlink: driveLink },
    new Date().toLocaleDateString('es-ES'),
  ]);

  // Alternate row background
  if (isEvenRow) {
    dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } };
  }

  // Format currency columns
  [6, 8, 9].forEach(col => {
    const cell = dataRow.getCell(col);
    cell.numFmt = '#,##0.00 €';
  });

  // Format percentage column
  dataRow.getCell(7).numFmt = '0"%"';

  // Hyperlink style for Drive link
  const linkCell = dataRow.getCell(13);
  linkCell.font = { color: { argb: 'FF0284C7' }, underline: true };

  dataRow.eachCell(cell => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
    cell.alignment = { vertical: 'middle', wrapText: false };
  });

  dataRow.height = 18;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function setupWorksheet(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.addRow(HEADERS);
  styleHeaderRow(headerRow);
  COL_WIDTHS.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width;
  });
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function readInvoiceRows(buffer: Buffer | ArrayBuffer): Promise<Record<string, string | number>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.getWorksheet('Facturas');
  if (!worksheet) return [];

  const rows: Record<string, string | number>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    rows.push({
      numeroFactura: String(row.getCell(1).value || ''),
      fecha: String(row.getCell(2).value || ''),
      proveedor: String(row.getCell(3).value || ''),
      nifCif: String(row.getCell(4).value || ''),
      concepto: String(row.getCell(5).value || ''),
      baseImponible: row.getCell(6).value as number || 0,
      porcentajeIva: row.getCell(7).value as number || 0,
      cuotaIva: row.getCell(8).value as number || 0,
      total: row.getCell(9).value as number || 0,
      formaPago: String(row.getCell(10).value || ''),
      categoria: String(row.getCell(11).value || ''),
      notas: String(row.getCell(12).value || ''),
      driveLink: String((row.getCell(13).value as ExcelJS.CellHyperlinkValue)?.hyperlink || row.getCell(13).value || ''),
      fechaRegistro: String(row.getCell(14).value || ''),
    });
  });
  return rows;
}
