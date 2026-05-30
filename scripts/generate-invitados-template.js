const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Invitados');

  sheet.columns = [
    { header: 'nombre', key: 'nombre', width: 30 },
    { header: 'email', key: 'email', width: 35 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
  headerRow.commit();

  sheet.addRow({ nombre: 'Ana García', email: 'ana@ejemplo.com' });
  sheet.addRow({ nombre: 'Carlos López', email: 'carlos@ejemplo.com' });
  sheet.addRow({ nombre: 'Laura Martínez', email: '' });

  const outDir = path.join(__dirname, '..', 'public', 'templates');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'invitados-plantilla.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('Plantilla generada en:', outPath);
}

main().catch(console.error);
