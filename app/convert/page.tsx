import AppShell from '@/components/layout/AppShell';
import ConvertTool from '@/components/convert/ConvertTool';

export default function ConvertPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Convertir un fichier</h1>
        <p className="mt-1 text-sm text-gray-500">Transformez vos documents en quelques secondes.</p>
      </div>
      <ConvertTool />
    </AppShell>
  );
}
