'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {

      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {user.email}</h1>
      <p>Esta es tu área de dashboard.</p>
      
      <button
        onClick={() => signOut()}
        className="mt-6 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}
