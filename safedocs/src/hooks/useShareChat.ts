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
}

export const useShareChat = (shareUuid: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  /* 1 — histórico */
  useEffect(() => {
    if (!shareUuid) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('document_share_messages')
        .select('*')
        .eq('share_id', shareUuid)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data as ChatMessage[]);
      setLoading(false);
    };

    fetchHistory();
  }, [shareUuid]);

  /* 2 — realtime */
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

  /* 3 — enviar */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      await supabase.from('document_share_messages').insert({
        share_id: shareUuid,
        content,
        msg_type: 'text',
      });
    },
    [shareUuid]
  );

  return { messages, loading, sendMessage };
};
