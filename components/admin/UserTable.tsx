'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { formatDistanceToNow } from '@/lib/dateUtils';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface UserTableProps {
  users: UserRow[];
}

export default function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleRevoke(userId: string) {
    if (!confirm('Révoquer l\'accès de cet utilisateur ?')) return;
    setRevoking(userId);

    const res = await fetch('/api/admin/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    setRevoking(null);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      const { error } = await res.json();
      alert(error ?? 'Erreur lors de la révocation.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900">Utilisateurs ({users.length})</h2>
      </CardHeader>
      <CardBody className="p-0">
        {users.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Aucun utilisateur.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Rôle</th>
                  <th className="px-6 py-3">Membre depuis</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-800">{user.email}</div>
                      {user.full_name && (
                        <div className="text-xs text-gray-400">{user.full_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {formatDistanceToNow(user.created_at)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {user.role !== 'admin' && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={revoking === user.id}
                          onClick={() => handleRevoke(user.id)}
                        >
                          Révoquer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
