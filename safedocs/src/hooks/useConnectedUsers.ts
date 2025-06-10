import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ConnectedUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  last_seen?: string;
}

export const useConnectedUsers = (shareUuid: string) => {
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener usuarios
  const fetchUsers = async () => {
    if (!shareUuid) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      // Obtener los últimos usuarios que han enviado mensajes
      const { data: messages, error } = await supabase
        .from('document_share_messages')
        .select('sender_id, created_at')
        .eq('share_id', shareUuid)
        .not('sender_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        setUsers([]);
        return;
      }

      if (!messages || messages.length === 0) {
        setUsers([]);
        return;
      }

      // Crear usuarios únicos con datos básicos
      const uniqueUserIds = [...new Set(messages.map(msg => msg.sender_id))];
      const basicUsers: ConnectedUser[] = uniqueUserIds.map(userId => {
        const lastMessage = messages.find(msg => msg.sender_id === userId);
        return {
          id: userId,
          email: `usuario-${userId.substring(0, 8)}`,
          name: `Usuario ${userId.substring(0, 8)}`,
          last_seen: lastMessage?.created_at
        };
      });

      setUsers(basicUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial para cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, [shareUuid]);

  // Suscripción en tiempo real para actualizar usuarios cuando lleguen nuevos mensajes
  useEffect(() => {
    if (!shareUuid) return;

    const channel = supabase
      .channel(`connected-users-${shareUuid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_share_messages',
          filter: `share_id=eq.${shareUuid}`,
        },
        () => {
          // Actualizar la lista de usuarios cuando llegue un nuevo mensaje
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareUuid]);

  return { users, loading };
};
