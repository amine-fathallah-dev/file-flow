import { createServerSupabaseClient } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNow } from '@/lib/dateUtils';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: conversions }, { data: signedDocs }] = await Promise.all([
    supabase
      .from('conversions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('signed_documents')
      .select('*')
      .eq('user_id', user!.id)
      .order('signed_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Vos dernières activités</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent conversions */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Conversions récentes</h2>
          </CardHeader>
          <CardBody className="p-0">
            {!conversions?.length ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune conversion pour l'instant.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {conversions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{c.original_filename}</p>
                      <p className="text-xs text-gray-400">{formatDistanceToNow(c.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge>{c.original_format}</Badge>
                      <span>→</span>
                      <Badge variant="info">{c.output_format}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Signed documents */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Documents signés</h2>
          </CardHeader>
          <CardBody className="p-0">
            {!signedDocs?.length ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Aucun document signé pour l'instant.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {signedDocs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{doc.original_filename}</p>
                      <p className="text-xs text-gray-400">{formatDistanceToNow(doc.signed_at)}</p>
                    </div>
                    <DownloadSignedDoc storagePath={doc.storage_path} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function DownloadSignedDoc({ storagePath }: { storagePath: string }) {
  return (
    <form action={`/api/download?path=${encodeURIComponent(storagePath)}`} method="GET">
      <button
        type="submit"
        className="rounded-md px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
      >
        Télécharger
      </button>
    </form>
  );
}
