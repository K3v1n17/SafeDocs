'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Send,
  Share2,
  Users,
  Clock,
  Copy,
  Eye,
  MessageCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useShareChat } from '@/hooks/useShareChat';

import { DashboardTitle } from '@/components/Sliderbar/DashboardTitle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SharePage() {
  /* Auth */
  const { user, loading } = useAuth();
  const router = useRouter();
  const { share_token } = useParams<{ share_token: string }>();

  /** UUID real */
  const [shareUuid, setShareUuid] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  /* Buscar uuid una sola vez */
  useEffect(() => {
    if (!share_token) return;

    const fetchUuid = async () => {
      const { data, error } = await supabase
        .from('document_shares')
        .select('id')
        .eq('share_token', share_token)
        .maybeSingle();

      if (!error && data) {
        setShareUuid(data.id);
      }
      setLookupDone(true);
    };

    fetchUuid();
  }, [share_token]);

  /* Proteger si no login */
  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  /* Hook realtime (solo cuando ya sabemos uuid) */
  const {
    messages,
    loading: loadingChat,
    sendMessage,
  } = useShareChat(shareUuid ?? '');

  /** UI State */
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Placeholder lateral (mock) */
  const connectedUsers = ['Usuario Safedocs', 'Ana García', 'Carlos López'];

  /** Helpers */
  const handleSend = () => {
    sendMessage(draft);
    setDraft('');
  };
  const copyShareLink = (link: string) => navigator.clipboard.writeText(link);

  /* Carga inicial / token incorrecto */
  if (loading || !lookupDone) return null;
  if (!shareUuid) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Enlace inválido o caducado</h1>
        <p className="text-muted-foreground">
          Verifica que tu enlace sea correcto o crea uno nuevo.
        </p>
      </div>
    );
  }

  /* --- UI --- */
  return (
    <>
      <DashboardTitle>Compartir Documentos</DashboardTitle>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* CHAT */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat Seguro
                  </CardTitle>
                  <CardDescription>
                    {connectedUsers.length} usuarios conectados
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600">En línea</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {loadingChat && (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_id === user?.id
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div className="max-w-[70%]">
                      {msg.msg_type === 'system' ? (
                        <Alert>
                          <AlertDescription className="text-center">
                            {msg.content}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div
                          className={`rounded-lg p-3 ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <span className="block text-[10px] mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje…"
                />
                <Button onClick={handleSend} disabled={!draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR — solo mock simplificado */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios Conectados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {connectedUsers.map((u) => (
                <div key={u} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{u[0]}</AvatarFallback>
                    <AvatarImage src="" />
                  </Avatar>
                  <p className="text-sm">{u}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Documentos Compartidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Aquí irá tu lista real de documentos compartidos */}
              <p className="text-sm text-muted-foreground">
                (UI mock; conecta tu consulta real más adelante)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
