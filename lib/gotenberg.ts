const GOTENBERG_URL = process.env.GOTENBERG_URL!;

type GotenbergRoute =
  | '/forms/libreoffice/convert'
  | '/forms/chromium/convert/html'
  | '/forms/pdfengines/convert';

async function callGotenberg(
  route: GotenbergRoute,
  form: FormData
): Promise<Buffer> {
  const res = await fetch(`${GOTENBERG_URL}${route}`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gotenberg error ${res.status}: ${text}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** DOCX or XLSX → PDF via LibreOffice */
export async function convertToPdfViaLibreOffice(
  fileBuffer: Buffer,
  filename: string
): Promise<Buffer> {
  const form = new FormData();
  const blob = new Blob([fileBuffer]);
  form.append('files', blob, filename);
  return callGotenberg('/forms/libreoffice/convert', form);
}

/** PDF → DOCX via LibreOffice */
export async function convertPdfToDocx(
  pdfBuffer: Buffer,
  filename: string
): Promise<Buffer> {
  const form = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  form.append('files', blob, filename);
  // Gotenberg uses the output-filename to infer desired format
  form.append('nativePdfFormats', 'false');
  return callGotenberg('/forms/libreoffice/convert', form);
}

/** PDF → PNG image (first page) via Gotenberg LibreOffice screenshot */
export async function convertPdfToImage(
  pdfBuffer: Buffer,
  filename: string
): Promise<Buffer> {
  const form = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  // Rename to .png so Gotenberg outputs a PNG
  const outputName = filename.replace(/\.pdf$/i, '.png');
  form.append('files', blob, outputName);
  return callGotenberg('/forms/libreoffice/convert', form);
}

/** Health-check: resolves true if Gotenberg responds, false on timeout */
export async function pingGotenberg(timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${GOTENBERG_URL}/health`, { signal: controller.signal });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}
