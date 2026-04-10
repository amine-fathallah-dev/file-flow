import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { embedSignature } from '@/lib/pdf';
import { convertToPdfViaLibreOffice } from '@/lib/gotenberg';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const form = await req.formData();
  const pdfFile = form.get('pdf') as File | null;
  const signatureDataUrl = form.get('signatureDataUrl') as string | null;
  const page = parseInt(form.get('page') as string ?? '0', 10);
  const x = parseFloat(form.get('x') as string ?? '40');
  const y = parseFloat(form.get('y') as string ?? '40');
  const width = parseFloat(form.get('width') as string ?? '160');
  const height = parseFloat(form.get('height') as string ?? '60');
  const textAnnotationsRaw = form.get('textAnnotations') as string ?? '[]';
  const textAnnotations = JSON.parse(textAnnotationsRaw) as Array<{
    text: string; x: number; y: number; fontSize: number; page: number;
  }>;

  if (!pdfFile || !signatureDataUrl) {
    return NextResponse.json({ error: 'Fichier ou signature manquant.' }, { status: 400 });
  }

  const base64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const signatureBuffer = Buffer.from(base64, 'base64');

  let pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

  if (pdfFile.name.toLowerCase().endsWith('.docx')) {
    const converted = await convertToPdfViaLibreOffice(pdfBuffer, pdfFile.name);
    pdfBuffer = Buffer.from(converted);
  }

  try {
    const signedPdf = await embedSignature({
      pdfBuffer,
      signatureImageBuffer: signatureBuffer,
      page,
      x,
      y,
      width,
      height,
      textAnnotations,
    });

    return new NextResponse(signedPdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="signed_${pdfFile.name.replace('.docx', '.pdf')}"`,
      },
    });
  } catch (err: unknown) {
    console.error('[sign]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la signature.' },
      { status: 500 }
    );
  }
}
