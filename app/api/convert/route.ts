import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CONVERSION_MATRIX, MIME_TYPES, type FileFormat } from '@/lib/formats';
import { convertToPdfViaLibreOffice, convertPdfToDocx } from '@/lib/gotenberg';
import { imagesToPdf } from '@/lib/pdf';
import { convertImage, type ImageFormat } from '@/lib/sharp';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const from = (form.get('from') as string)?.toUpperCase() as FileFormat;
  const to = (form.get('to') as string)?.toUpperCase() as FileFormat;

  if (!file || !from || !to) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  // Validate matrix
  if (!CONVERSION_MATRIX[from]?.includes(to)) {
    return NextResponse.json({ error: 'Conversion non supportée.' }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let outputBuffer: Buffer | Uint8Array;

  try {
    // --- Routing logic ---
    if ((from === 'DOCX' || from === 'XLSX') && to === 'PDF') {
      outputBuffer = await convertToPdfViaLibreOffice(inputBuffer, file.name);

    } else if (from === 'PDF' && to === 'DOCX') {
      outputBuffer = await convertPdfToDocx(inputBuffer, file.name);

    } else if (['JPG', 'PNG', 'WEBP'].includes(from) && to === 'PDF') {
      outputBuffer = await imagesToPdf([inputBuffer]);

    } else if (['JPG', 'PNG', 'WEBP'].includes(from) && ['JPG', 'PNG', 'WEBP'].includes(to)) {
      const fmt = to.toLowerCase().replace('jpg', 'jpeg') as ImageFormat;
      outputBuffer = await convertImage(inputBuffer, fmt);

    } else if (from === 'PDF' && ['JPG', 'PNG'].includes(to)) {
      // PDF → image: render via Gotenberg HTML route then post-process with sharp
      // For now, route through Gotenberg screenshot endpoint
      const { convertPdfToImage } = await import('@/lib/gotenberg');
      const pngBuf = await convertPdfToImage(inputBuffer, file.name);
      if (to === 'PNG') {
        outputBuffer = pngBuf;
      } else {
        outputBuffer = await convertImage(pngBuf, 'jpeg');
      }

    } else {
      return NextResponse.json({ error: 'Conversion non implémentée.' }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error('[convert]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur de conversion.' },
      { status: 500 }
    );
  }

  const mimeType = MIME_TYPES[to] ?? 'application/octet-stream';
  return new NextResponse(outputBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="converted.${to.toLowerCase()}"`,
    },
  });
}
