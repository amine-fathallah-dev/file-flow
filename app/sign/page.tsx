import AppShell from '@/components/layout/AppShell';
import SignTool from '@/components/sign/SignTool';

export default function SignPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Signer un document</h1>
        <p className="mt-1 text-sm text-gray-500">Apposez votre signature sur un PDF en 3 étapes.</p>
      </div>
      <SignTool />
    </AppShell>
  );
}
