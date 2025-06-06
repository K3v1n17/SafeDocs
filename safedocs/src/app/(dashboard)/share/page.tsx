// app/share/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Página índice de /share
 * 1. Espera a que AuthProvider tenga el usuario.
 * 2. Busca el enlace más reciente del usuario en Supabase.
 * 3. Redirige a /share/<share_token> o a /share/new si no tiene ninguno.
 */
export default function ShareIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;             // aún no sabemos si hay sesión

    if (!user) {
      router.replace('/');           // sin login → inicio
      return;
    }

    const go = async () => {
      const { data, error } = await supabase
        .from('document_shares')
        .select('share_token')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);
        router.replace('/share/new');
        return;
      }

      if (data) {
        router.replace(`/share/${data.share_token}`);
      } else {
        router.replace('/share/new'); // aún no tiene enlaces
      }
    };

    go();
  }, [user, loading, router]);

  return (
    <div className="p-8 text-center text-muted-foreground">
      Redirigiendo…
    </div>
  );
}
