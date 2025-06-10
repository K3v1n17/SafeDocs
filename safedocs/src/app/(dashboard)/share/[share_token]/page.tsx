'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Send,
  Share2,
  Users,
  Clock,
  Copy,
  //Eye,
  MessageCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useShareChat } from '@/hooks/useShareChat';
import { useConnectedUsers } from '@/hooks/useConnectedUsers';

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
//import { Badge } from '@/components/ui/badge';
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
        .select('id, title, message, created_by')
        .eq('share_token', share_token)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        setShareUuid(data.id);
        // Opcional: establecer información adicional del chat
      } else {
        console.error('Error fetching share:', error);
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
  } = useShareChat(shareUuid ?? '', user?.id);

  /* Hook para usuarios conectados */
  const { users: connectedUsers, loading: loadingUsers } = useConnectedUsers(shareUuid ?? '');

  /** UI State */
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  /** Helpers */
  const handleSend = () => {
    sendMessage(draft);
    setDraft('');
  };
  
  const copyShareLink = () => {
    const link = `${window.location.origin}/share/${share_token}`;
    navigator.clipboard.writeText(link).then(() => {
      // Podrías agregar una notificación aquí
      console.log('Enlace copiado al portapapeles');
    });
  };
  /* Carga inicial / token incorrecto */
  if (loading || !lookupDone) return null;
  if (!shareUuid) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Chat no encontrado</h1>
        <p className="text-muted-foreground mb-4">
          Este enlace de chat no existe, ha expirado o no está activo.
        </p>
        <div className="space-x-4">
          <Button onClick={() => router.push('/share')}>
            Ir al Chat Principal
          </Button>
          <Button variant="outline" onClick={() => router.push('/share/new')}>
            Crear Nuevo Chat
          </Button>
        </div>
      </div>
    );
  }

  /* --- UI --- */
  return (
    <>
      <DashboardTitle>Chat Grupal</DashboardTitle>

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
                  </CardTitle>                  <CardDescription>
                    {connectedUsers.length} usuarios activos en las últimas 24h
                  </CardDescription>
                </div>                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600">En línea</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyShareLink}
                    className="ml-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Compartir
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {loadingChat && (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                )}                {messages.map((msg) => (
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
                          {/* Mostrar nombre del usuario si no es el remitente actual */}
                          {msg.sender_id !== user?.id && msg.sender_id && (
                            <p className="text-xs font-medium opacity-70 mb-1">
                              {msg.sender_name || msg.sender_email || 'Usuario'}
                            </p>
                          )}
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
          <Card>            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios Activos
              </CardTitle>
            </CardHeader><CardContent className="space-y-2">
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
              ) : connectedUsers.length > 0 ? (
                connectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                      <AvatarImage src={user.avatar_url || ""} />
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.last_seen ? 
                          `Último mensaje: ${new Date(user.last_seen).toLocaleTimeString()}` :
                          'En línea'
                        }
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay usuarios recientes</p>
              )}
            </CardContent>
          </Card>          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Información del Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <p className="font-medium">Token del Chat:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{share_token}</code>
              </div>
              <div className="text-sm">
                <p className="font-medium">Total de mensajes:</p>
                <p className="text-muted-foreground">{messages.length}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyShareLink}
                className="w-full"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copiar Enlace
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cómo Invitar Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Comparte el enlace del chat con otros usuarios</p>
                <p>• Solo usuarios registrados pueden participar</p>
                <p>• Los mensajes son en tiempo real</p>
                <p>• El historial se mantiene para todos los participantes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
