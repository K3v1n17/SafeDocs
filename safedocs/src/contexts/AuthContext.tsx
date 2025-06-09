'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; /* <-- usa el mismo cliente */
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────────── */
interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ user: null }),
  signUpWithEmail: async () => ({ user: null }),
  signOut: async () => {}
});

/* ─────────────────────────────────────────────────── */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* 1️⃣  Sesión al montar */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
      }
      setLoading(false);
    });

    /* 2️⃣  Suscripción a cambios */
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* 3️⃣  Login Google */
  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://safe-docs-gray.vercel.app/overview` }
    });
    if (error) console.error('Error al iniciar con Google:', error.message);
    setLoading(false);
  };
  
  /* 4️⃣  Login con Email y Contraseña */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.user) {
        router.push('/overview');
      }
      
      return { user: data?.user || null };
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error.message);
      throw error;
    }
  };
  
  /* 5️⃣  Registro con Email y Contraseña */
  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Si las identidades están vacías, puede indicar que el correo ya existe
      if (!data.user || data.user.identities?.length === 0) {
        throw new Error('Este correo ya podría estar registrado. Intenta iniciar sesión o usar otro correo.');
      }
      
      return { user: data.user };
    } catch (error: any) {
      console.error('Error al registrarse:', error.message);
      throw error;
    }
  };

  /* 6️⃣  Logout */
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      router.push('/');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/* Hook auxiliar */
export const useAuth = () => useContext(AuthContext);
