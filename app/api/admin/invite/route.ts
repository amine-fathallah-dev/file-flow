import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { sendInvitationEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  // Verify caller is admin
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Generate a Supabase magic-link invite
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${req.nextUrl.origin}/dashboard`,
    },
  });

  if (error || !data?.properties?.action_link) {
    console.error('[invite]', error);
    return NextResponse.json({ error: error?.message ?? 'Erreur lors de la création du lien.' }, { status: 500 });
  }

  // Send custom email via Resend
  await sendInvitationEmail({
    to: email,
    inviteUrl: data.properties.action_link,
    invitedByName: profile.full_name ?? profile.email ?? 'Admin',
  });

  return NextResponse.json({ ok: true });
}
