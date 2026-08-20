import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'preview-pedido-sample.pdf');

const headerColor = [89, 176, 45];
const headerBorderColor = [159, 205, 138];
const bodyBorderColor = [216, 229, 208];
const altRowColor = [247, 251, 243];
const totalColor = [237, 247, 230];

const data = {
  title: 'Resumen pedido',
  enterpriseHeader: {
    name: 'Distribuidora Los Andes C.A.',
    rif: 'J-30123456-7',
    address: 'Av. Principal de Los Ruices, Edif. Torre Empresarial, Piso 3, Caracas',
  },
  meta: [
    { label: 'Pedido', value: '10482' },
    { label: 'Cliente', value: 'SUPERMERCADO EL SOL' },
    { label: 'Fecha', value: '13/07/2026 10:45' },
    { label: 'Moneda', value: 'USD' },
    { label: 'Items', value: '5' },
  ],
  columns: [
    { label: 'Código', align: 'center', width: '8%' },
    { label: 'Producto', align: 'left', width: '32%' },
    { label: 'Cantidad', align: 'center', width: '8%' },
    { label: 'Unidad', align: 'center', width: '8%' },
    { label: 'Precio Base', align: 'right', width: '10%' },
    { label: 'Descuento', align: 'right', width: '15%' },
    { label: 'IVA %', align: 'center', width: '7%' },
    { label: 'Importe Total', align: 'right', width: '12%' },
  ],
  rows: [
    ['P-00124', 'Harina PAN 1Kg', '24', 'UND', '1,25', '5%\n0,06 USD', '16%', '28,32'],
    ['P-00308', 'Aceite Vegetal 900ml', '12', 'UND', '3,80', '', '16%', '45,60'],
    ['P-00715', 'Arroz Premium 1Kg', '36\n12', 'UND\nCJ', '2,10', '3%\n2,27 USD', '0%', '73,53'],
    ['P-00902', 'Leche Entera 1L', '48', 'UND', '1,95', '', '16%', '93,60'],
    ['P-01140', 'Atún en Aceite 170g', '20', 'UND', '2,45', '2%\n0,98 USD', '16%', '47,06'],
  ],
  summaryTotalsRow: {
    labelColumnSpan: 2,
    leftLabel: 'Totales ',
    detailLines: [
      'Base: 265,47 USD',
      'Descuento Productos: 3,31 USD',
      'IVA: 38,12 USD',
      'Total: 300,28 USD',
    ],
  },
};

function drawLogoPlaceholder(doc, x, y, size) {
  doc.setFillColor(240, 245, 236);
  doc.setDrawColor(...headerColor);
  doc.setLineWidth(1);
  doc.roundedRect(x, y, size, size, 4, 4, 'FD');
  doc.setTextColor(...headerColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LOGO', x + size / 2, y + size / 2 + 3, { align: 'center' });
}

const doc = new jsPDF({ format: 'letter', unit: 'pt', orientation: 'landscape' });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const marginX = 28;
const topMargin = 24;
const usableWidth = pageWidth - marginX * 2;
let cursorY = topMargin;

// Letterhead
const logoSize = 52;
const logoGap = 12;
const sectionPaddingY = 8;
const textX = marginX + logoSize + logoGap;
drawLogoPlaceholder(doc, marginX, cursorY + sectionPaddingY, logoSize);

doc.setTextColor(32, 32, 32);
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.text(data.enterpriseHeader.name, textX, cursorY + sectionPaddingY + 4);
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text(`RIF: ${data.enterpriseHeader.rif}`, textX, cursorY + sectionPaddingY + 19);
const addrLines = doc.splitTextToSize(data.enterpriseHeader.address, usableWidth - logoSize - logoGap);
doc.text(addrLines, textX, cursorY + sectionPaddingY + 32);

const letterheadHeight = 68;
doc.setDrawColor(...bodyBorderColor);
doc.setLineWidth(0.75);
doc.line(marginX, cursorY + letterheadHeight, marginX + usableWidth, cursorY + letterheadHeight);
cursorY += letterheadHeight + 12;

// Title bar — centrado vertical, texto a la izquierda
const headerHeight = 48;
const titleFontPt = 22;
doc.setFillColor(...headerColor);
doc.roundedRect(marginX, cursorY, usableWidth, headerHeight, 8, 8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(titleFontPt);
const titleY = cursorY + headerHeight / 2 + titleFontPt * 0.35;
doc.text(data.title, marginX + 16, titleY, { align: 'left' });
cursorY += headerHeight + 18;

// Meta (2 columns)
const metaGap = 14;
const metaWidth = (usableWidth - metaGap) / 2;
const labelWidth = 92;
for (let i = 0; i < data.meta.length; i += 2) {
  const row = [data.meta[i], data.meta[i + 1]];
  const metaRowHeight = 28;
  row.forEach((item, index) => {
    if (!item) return;
    const x = marginX + index * (metaWidth + metaGap);
    doc.setDrawColor(...bodyBorderColor);
    doc.setFillColor(251, 253, 249);
    doc.roundedRect(x, cursorY, metaWidth, metaRowHeight, 6, 6, 'FD');
    doc.setTextColor(47, 58, 47);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(item.label, x + 10, cursorY + 17);
    doc.setTextColor(32, 32, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, x + labelWidth, cursorY + 17);
  });
  cursorY += metaRowHeight + 10;
}

// Table header
const colWidths = data.columns.map((c) => (parseFloat(c.width) / 100) * usableWidth);
const tableHeaderHeight = 32;
let cellX = marginX;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
data.columns.forEach((col, index) => {
  const w = colWidths[index];
  doc.setFillColor(...headerColor);
  doc.setDrawColor(...headerBorderColor);
  doc.rect(cellX, cursorY, w, tableHeaderHeight, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.text(col.label, cellX + w / 2, cursorY + 20, { align: 'center' });
  cellX += w;
});
cursorY += tableHeaderHeight;

// Rows
data.rows.forEach((row, rowIndex) => {
  const cellHeights = row.map((cell, ci) => {
    const lines = String(cell).split('\n');
    return Math.max(28, lines.length * 12 + 16);
  });
  const rowHeight = Math.max(...cellHeights);
  cellX = marginX;
  row.forEach((cell, ci) => {
    const w = colWidths[ci];
    const fill = rowIndex % 2 === 1 ? altRowColor : [255, 255, 255];
    doc.setFillColor(...fill);
    doc.setDrawColor(...bodyBorderColor);
    doc.rect(cellX, cursorY, w, rowHeight, 'FD');
    doc.setTextColor(32, 32, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const align = data.columns[ci].align ?? 'left';
    const lines = String(cell).split('\n');
    let ty = cursorY + 14;
    lines.forEach((line) => {
      const tx = align === 'right' ? cellX + w - 10 : align === 'center' ? cellX + w / 2 : cellX + 10;
      doc.text(line, tx, ty, { align });
      ty += 12;
    });
    cellX += w;
  });
  cursorY += rowHeight;
});

// Totals row
const totalsHeight = 52;
cellX = marginX;
const spanWidth = colWidths[0] + colWidths[1];
doc.setFillColor(...totalColor);
doc.setDrawColor(...headerBorderColor);
doc.rect(cellX, cursorY, spanWidth, totalsHeight, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(47, 58, 47);
doc.text(data.summaryTotalsRow.leftLabel, cellX + spanWidth / 2, cursorY + 18, { align: 'center' });
cellX += spanWidth;

const detailWidth = usableWidth - spanWidth;
doc.rect(cellX, cursorY, detailWidth, totalsHeight, 'FD');
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
let dy = cursorY + 14;
data.summaryTotalsRow.detailLines.forEach((line) => {
  doc.text(line, cellX + detailWidth - 10, dy, { align: 'right' });
  dy += 12;
});

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
writeFileSync(outPath, pdfBuffer);
console.log('PDF generado:', outPath);
