'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: number;
  share_id: string;
  sender_id: string | null;
  content: string;
  msg_type: 'text' | 'document' | 'system';
  created_at: string;
  // Campos adicionales para mostrar información del usuario
  sender_email?: string;
  sender_name?: string;
}

export const useShareChat = (shareUuid: string, currentUserId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);  /* 1 — histórico */
  useEffect(() => {
    if (!shareUuid) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('document_share_messages')
        .select('*')
        .eq('share_id', shareUuid)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Por ahora usar datos básicos, más tarde podemos mejorar con info de usuario
        setMessages(data as ChatMessage[]);
      } else {
        console.error('Error fetching chat history:', error);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [shareUuid]);

 {/* 2 — realtime       
  
  
   useEffect(() => {
    if (!shareUuid) return;

    const channel = supabase
      .channel(`share:${shareUuid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_share_messages',
          filter: `share_id=eq.${shareUuid}`,
        },
        (payload) =>
          setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [shareUuid]);

  
  
  
  */ }  

  useEffect(() => {
    if (!shareUuid) return;

    const channel = supabase
      .channel(`share:${shareUuid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_share_messages',
          filter: `share_id=eq.${shareUuid}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          setMessages((prev) => {
            // Evitar mensajes duplicados por id
            if (prev.find((msg) => msg.id === newMsg.id)) {
              return prev;
            }

            // Insertar y ordenar por created_at
            const updated = [...prev, newMsg].sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareUuid]);
   /* 3 — enviar */  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      
      // Insertar el mensaje con sender_id
      const { error } = await supabase.from('document_share_messages').insert({
        share_id: shareUuid,
        sender_id: currentUserId,
        content,
        msg_type: 'text',
      });
      
      if (error) {
        console.error('Error enviando mensaje:', error);
      }
    },
    [shareUuid, currentUserId]
  );

  return { messages, loading, sendMessage };
};
