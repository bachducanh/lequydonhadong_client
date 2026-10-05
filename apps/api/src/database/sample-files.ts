/**
 * Sinh tệp mẫu hợp lệ (PDF, DOCX, XLSX, SVG) cho dữ liệu demo — không cần thư viện ngoài.
 * Thay bằng tệp thật trong trang quản trị.
 */

const ascii = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\x20-\x7E]/g, '-');

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function samplePdf(title: string): Buffer {
  const text = ascii(title).replace(/[()\\]/g, '');
  const content = [
    'BT /F1 18 Tf 60 770 Td',
    `(${text}) Tj`,
    '0 -28 Td /F1 11 Tf',
    '(Truong THPT Le Quy Don - Ha Dong) Tj',
    '0 -18 Td',
    '(Tai lieu mau - quan tri vien thay bang tep that trong trang quan tri.) Tj',
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

/* ---------- ZIP (store, không nén) cho DOCX/XLSX ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, 'utf8');
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  const count = Object.keys(files).length;
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

export function sampleDocx(title: string): Buffer {
  const para = (t: string, bold = false) =>
    `<w:p><w:r>${bold ? '<w:rPr><w:b/><w:sz w:val="32"/></w:rPr>' : ''}<w:t xml:space="preserve">${xml(t)}</w:t></w:r></w:p>`;
  return zip({
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${para('TRƯỜNG THPT LÊ QUÝ ĐÔN – HÀ ĐÔNG')}${para(title, true)}${para('Biểu mẫu mẫu — quản trị viên thay bằng tệp thật trong trang quản trị.')}${para('Họ và tên: ........................................................')}${para('Lớp: ................   Ngày: ....../....../..........')}</w:body></w:document>`,
  });
}

export function sampleXlsx(title: string): Buffer {
  const cell = (ref: string, t: string) => `<c r="${ref}" t="inlineStr"><is><t>${xml(t)}</t></is></c>`;
  const rows = [
    `<row r="1">${cell('A1', title)}</row>`,
    `<row r="3">${cell('A3', 'STT')}${cell('B3', 'Họ và tên')}${cell('C3', 'Lớp')}${cell('D3', 'Câu lạc bộ đăng ký')}</row>`,
    `<row r="4">${cell('A4', '1')}</row>`,
  ].join('');
  return zip({
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Dang ky" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`,
  });
}

/** Ảnh minh hoạ dạng khối hình học màu thương hiệu (giống LQD.Thumb trong thiết kế). */
export function sampleSvg(seed: number, label: string): Buffer {
  const palettes = [
    ['#E3F2FD', '#90CAF9', '#2196F3', '#0D47A1'],
    ['#E3F2FD', '#2196F3', '#90CAF9', '#DC241C'],
    ['#E3F2FD', '#0D47A1', '#90CAF9', '#2196F3'],
    ['#E3F2FD', '#90CAF9', '#2196F3', '#0D47A1'],
  ];
  const [bg, a, b, c] = palettes[seed % palettes.length];
  const x = (n: number) => ((seed * 37 + n * 53) % 70) + 15;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
<rect width="1200" height="900" fill="${bg}"/>
<circle cx="${x(1) * 12}" cy="${x(2) * 9}" r="250" fill="${a}"/>
<circle cx="${x(3) * 12}" cy="${x(4) * 9}" r="150" fill="${b}"/>
<rect x="${x(5) * 10}" y="${x(6) * 8}" width="320" height="100" rx="50" fill="${c}"/>
<text x="48" y="852" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="600" fill="#0B1F3A">${xml(label)}</text>
</svg>`;
  return Buffer.from(svg, 'utf8');
}
