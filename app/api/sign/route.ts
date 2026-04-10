import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { embedSignature, appendAuditCertificate, sha256 } from '@/lib/pdf';
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
  const label = form.get('label') as string ?? '';

  if (!pdfFile || !signatureDataUrl) {
    return NextResponse.json({ error: 'Fichier ou signature manquant.' }, { status: 400 });
  }

  // Signature data URL → Buffer (PNG)
  const base64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const signatureBuffer = Buffer.from(base64, 'base64');

  let pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

  // If DOCX uploaded, convert to PDF first
  if (pdfFile.name.toLowerCase().endsWith('.docx')) {
    const converted = await convertToPdfViaLibreOffice(pdfBuffer, pdfFile.name);
    pdfBuffer = Buffer.from(converted);
  }

  // Get signer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const signerName = profile?.full_name ?? profile?.email ?? user.email ?? 'Inconnu';
  const signerIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'inconnue';

  const signedAt = new Date();

  try {
    // 1. Embed signature
    const withSignature = await embedSignature({
      pdfBuffer,
      signatureImageBuffer: signatureBuffer,
      page,
      x,
      y,
      width,
      height,
      label,
      signerName,
      signedAt,
    });

    // 2. Compute hash before appending audit page
    const hash = sha256(Buffer.from(withSignature));

    // 3. Append audit certificate
    const finalPdf = await appendAuditCertificate({
      pdfBytes: withSignature,
      signerName,
      signerIp,
      signedAt,
      sha256Hash: hash,
      originalFilename: pdfFile.name,
    });

    // 4. Upload to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}_${pdfFile.name.replace('.docx', '.pdf')}`;
    await supabase.storage
      .from('signed-documents')
      .upload(storagePath, Buffer.from(finalPdf), {
        contentType: 'application/pdf',
        upsert: false,
      });

    // 5. Record in DB
    await supabase.from('signed_documents').insert({
      user_id: user.id,
      original_filename: pdfFile.name,
      signed_at: signedAt.toISOString(),
      sha256_hash: hash,
      signer_ip: signerIp,
      storage_path: storagePath,
    });

    return new NextResponse(finalPdf, {
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
