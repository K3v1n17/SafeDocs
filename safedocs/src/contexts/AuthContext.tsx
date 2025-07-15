"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser, AuthResponse, AuthSession } from '@/services/auth.service';
import { API_CONFIG } from '@/config/api';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────────── */
interface AuthContextProps {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: AuthUser | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, username: string) => Promise<{ user: AuthUser | null }>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* 1️⃣  Cargar sesión al montar */
  useEffect(() => {
    const loadSession = async () => {
      console.log('🔐 Cargando sesión inicial (con cookies)...');
      
      // 🧹 SEGURIDAD: Limpiar cualquier token inseguro antes de cargar la sesión
      if (typeof window !== 'undefined') {
        const insecureKeys = [
          'access_token', 'refresh_token', 'expires_at', 'expires_in', 'token_type', 'user',
          'safedocs_access_token', 'safedocs_refresh_token', 'safedocs_expires_at',
          'sb-access-token', 'sb-refresh-token', 'supabase.auth.token'
        ];
        
        let foundInsecureTokens = false;
        insecureKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            console.warn(`🚨 SEGURIDAD: Eliminando token inseguro "${key}" de localStorage`);
            localStorage.removeItem(key);
            foundInsecureTokens = true;
          }
        });
        
        if (foundInsecureTokens) {
          console.log('🔒 Tokens inseguros eliminados, usando solo cookies HttpOnly seguras');
        }
      }
      
      try {
        const currentUser = await authService.getCurrentUser();
        console.log('🔐 Usuario actual del backend:', currentUser);
        
        if (currentUser) {
          setUser(currentUser);
          
          // Con cookies HttpOnly, la "sesión" es solo indicativa
          const fakeSession = {
            access_token: 'managed_by_cookies',
            refresh_token: 'managed_by_cookies',
            expires_at: undefined
          };
          console.log('🔐 Sesión activa (cookies HttpOnly)');
          setSession(fakeSession);
        } else {
          // Si no se puede obtener el usuario, la sesión no es válida
          console.log('🔐 No hay sesión válida');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        // En caso de error, limpiar la sesión local
        authService.logout();
        setUser(null);
        setSession(null);
      } finally {
        console.log('🔐 Finalizando carga de sesión');
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  /* 2️⃣  Google Sign In (no disponible en modo backend) */
  const signInWithGoogle = async () => {
    console.warn('Google Sign In no está disponible cuando se usa el backend NestJS');
    return;
  };
  
  /* 3️⃣  Login con Email y Contraseña */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 AuthContext - Iniciando login (cookies)...');
      
      const response: AuthResponse = await authService.login({ email, password });
      console.log('🔐 AuthContext - Respuesta del authService:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Los datos ya están en la estructura correcta desde authService
      const user = response.user;
      const session = response.session;
      
      console.log('🔐 AuthContext - Usuario extraído:', user);
      console.log('🔐 AuthContext - Sesión extraída (cookies):', session);
      
      if (user) {
        setUser(user);
        
        // Con cookies HttpOnly, la sesión es solo indicativa
        const fakeSession = {
          access_token: 'managed_by_cookies',
          refresh_token: 'managed_by_cookies',
          expires_at: undefined
        };
        setSession(fakeSession);
        console.log('🔐 AuthContext - Estados actualizados correctamente');
        
        return { user };
      } else {
        console.error('🔐 AuthContext - No se pudo extraer usuario');
        throw new Error('Error en la autenticación: datos incompletos');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error.message);
      // Limpiar estados en caso de error
      setUser(null);
      setSession(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /* 4️⃣  Registro con Email y Contraseña */
  const signUpWithEmail = async (email: string, password: string, fullName: string, username: string = '') => {
    try {
      setLoading(true);
      const response: AuthResponse = await authService.register({ 
        email, 
        password, 
        name: fullName,
        username: username || email.split('@')[0] // Usar parte del email como username por defecto
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Los datos ya están en la estructura correcta desde authService
      const user = response.user;
      
      if (user) {
        setUser(user);
        
        // Con cookies HttpOnly, la sesión se maneja automáticamente
        const fakeSession = {
          access_token: 'managed_by_cookies',
          refresh_token: 'managed_by_cookies',
          expires_at: undefined
        };
        setSession(fakeSession);
      }
      
      return { user: user || null };
    } catch (error: any) {
      console.error('Error al registrarse:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* 5️⃣  Logout */
  const signOut = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
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
