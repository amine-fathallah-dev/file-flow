import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Paramètre path manquant.' }, { status: 400 });
  }

  // Verify ownership: path starts with user.id/
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { data, error } = await supabase.storage
    .from('signed-documents')
    .download(path);

  if (error || !data) {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }

  const arrayBuffer = await data.arrayBuffer();
  const filename = path.split('/').pop() ?? 'document.pdf';

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
