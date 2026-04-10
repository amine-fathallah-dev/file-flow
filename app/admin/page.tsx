import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';
import InviteForm from '@/components/admin/InviteForm';
import UserTable from '@/components/admin/UserTable';

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server-side role guard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez les accès à FileFlow.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <InviteForm />
        </div>
        <div className="lg:col-span-2">
          <UserTable users={users ?? []} />
        </div>
      </div>
    </AppShell>
  );
}
