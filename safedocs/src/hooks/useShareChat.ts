'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Función para forzar re-render
  const triggerUpdate = useCallback(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  /* 1 — histórico */
  useEffect(() => {
    if (!shareUuid) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('document_share_messages')
        .select('*')
        .eq('share_id', shareUuid)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const chatMessages = data as ChatMessage[];
        messagesRef.current = chatMessages;
        setMessages(chatMessages);
        triggerUpdate();
      } else {
        console.error('Error fetching chat history:', error);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [shareUuid, triggerUpdate]);

  /* 2 — realtime */
  useEffect(() => {
    if (!shareUuid) return;

    const channel = supabase
      .channel(`share-chat-${shareUuid}`)
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

          // Actualizar la referencia
          const currentMessages = messagesRef.current;
          const messageExists = currentMessages.some((msg) => msg.id === newMsg.id);

          if (!messageExists) {
            const updatedMessages = [...currentMessages, newMsg];
            messagesRef.current = updatedMessages;

            // Forzar actualización del estado
            setMessages([...updatedMessages]);
            triggerUpdate();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareUuid, triggerUpdate]);

  /* 3 — enviar */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !shareUuid || !currentUserId) return;

      try {
        const { error } = await supabase
          .from('document_share_messages')
          .insert({
            share_id: shareUuid,
            sender_id: currentUserId,
            content: content.trim(),
            msg_type: 'text',
          });

        if (error) {
          console.error('Error enviando mensaje:', error);
        }
      } catch (error) {
        console.error('Error enviando mensaje:', error);
      }
    },
    [shareUuid, currentUserId]
  );

  return { messages, loading, sendMessage, forceUpdate };
};
