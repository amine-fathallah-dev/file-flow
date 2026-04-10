import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';

export interface SignatureEmbedOptions {
  pdfBuffer: Buffer;
  signatureImageBuffer: Buffer;
  /** 0-indexed page number */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional text block */
  label?: string;
  signerName?: string;
  signedAt?: Date;
}

/** Embed a signature image into a PDF page and return the modified PDF bytes */
export async function embedSignature(opts: SignatureEmbedOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(opts.pdfBuffer);
  const pages = pdfDoc.getPages();
  const targetPage = pages[opts.page];

  const pngImage = await pdfDoc.embedPng(opts.signatureImageBuffer);

  targetPage.drawImage(pngImage, {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
  });

  if (opts.label || opts.signerName) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const text = [opts.signerName, opts.label].filter(Boolean).join(' — ');
    targetPage.drawText(text, {
      x: opts.x,
      y: opts.y - 14,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  return pdfDoc.save();
}

export interface AuditCertificateOptions {
  pdfBytes: Uint8Array;
  signerName: string;
  signerIp: string;
  signedAt: Date;
  sha256Hash: string;
  originalFilename: string;
}

/** Append an audit certificate page to the PDF */
export async function appendAuditCertificate(opts: AuditCertificateOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(opts.pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]); // A4
  const { height } = page.getSize();
  let y = height - 60;

  const draw = (text: string, size = 11, bold = false, indent = 40) => {
    page.drawText(text, { x: indent, y, size, font: bold ? boldFont : font, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 8;
  };

  draw('CERTIFICAT D\'AUDIT — FileFlow', 16, true);
  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  y -= 20;

  draw('Document', 10, true);
  draw(opts.originalFilename, 10);
  y -= 6;

  draw('Signataire', 10, true);
  draw(opts.signerName, 10);
  y -= 6;

  draw('Date et heure de signature (UTC)', 10, true);
  draw(opts.signedAt.toISOString(), 10);
  y -= 6;

  draw('Adresse IP du signataire', 10, true);
  draw(opts.signerIp, 10);
  y -= 6;

  draw('Empreinte SHA-256 du document signé', 10, true);
  draw(opts.sha256Hash, 9);
  y -= 12;

  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 14;
  draw('Ce certificat atteste de l\'intégrité et de l\'authenticité du document signé.', 9);

  return pdfDoc.save();
}

/** SHA-256 hash of a buffer, returned as hex string */
export function sha256(buffer: Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Convert an array of image Buffers to a single PDF */
export async function imagesToPdf(imageBuffers: Buffer[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (const buf of imageBuffers) {
    let img;
    // Attempt PNG first, fall back to JPEG
    try {
      img = await pdfDoc.embedPng(buf);
    } catch {
      img = await pdfDoc.embedJpg(buf);
    }
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return pdfDoc.save();
}
