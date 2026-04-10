import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'FileFlow <noreply@fileflow.app>';

export async function sendInvitationEmail({
  to,
  inviteUrl,
  invitedByName,
}: {
  to: string;
  inviteUrl: string;
  invitedByName: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Vous êtes invité(e) sur FileFlow',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
        <h2 style="color: #3b55e6;">Bienvenue sur FileFlow</h2>
        <p><strong>${invitedByName}</strong> vous invite à rejoindre FileFlow, l'outil de conversion et signature de documents.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}"
             style="background:#3b55e6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            Accepter l'invitation
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Ce lien est valide 24 heures. Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
      </div>
    `,
  });
}

export async function sendSignatureNotificationEmail({
  to,
  documentName,
  signedAt,
}: {
  to: string;
  documentName: string;
  signedAt: Date;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Document signé : ${documentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
        <h2 style="color: #3b55e6;">Document signé avec succès</h2>
        <p>Le document <strong>${documentName}</strong> a été signé le ${signedAt.toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC.</p>
        <p>Retrouvez-le dans votre <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}" style="color:#3b55e6;">tableau de bord FileFlow</a>.</p>
      </div>
    `,
  });
}
