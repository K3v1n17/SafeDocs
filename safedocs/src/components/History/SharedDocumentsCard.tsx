"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, Calendar, User, ExternalLink, Eye, Share2 } from "lucide-react";
import { SharedWithMe } from "@/services/documentShare.service";

interface SharedDocumentsCardProps {
  sharedDocument: SharedWithMe;
  onViewDocument: (shareToken: string) => void;
}

export function SharedDocumentsCard({
  sharedDocument,
  onViewDocument,
}: SharedDocumentsCardProps) {
  const isExpired = sharedDocument.expires_at
    ? new Date(sharedDocument.expires_at) < new Date()
    : false;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'documento':
      case 'doc':
      case 'docx':
        return '📝';
      case 'imagen':
      case 'image':
        return '🖼️';
      case 'excel':
      case 'xls':
      case 'xlsx':
        return '📊';
      default:
        return '📁';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${isExpired ? 'opacity-60' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header con título y documento */}
            <div className="flex items-start gap-3 mb-4">
              <div className="text-2xl">{getFileIcon(sharedDocument.documents.tipo)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {sharedDocument.title || 'Documento compartido'}
                </h3>
                <p className="text-gray-600 font-medium">
                  {sharedDocument.documents.titulo}
                </p>
                {sharedDocument.message && (
                  <p className="text-sm text-gray-500 mt-1">
                    {sharedDocument.message}
                  </p>
                )}
              </div>
              
              {/* Badge de estado */}
              <div className="flex flex-col gap-2">
                {isExpired ? (
                  <Badge variant="destructive" className="text-xs">
                    Expirado
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    Activo
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Solo lectura
                </Badge>
              </div>
            </div>

            {/* Información adicional */}
            {sharedDocument.documents.contenido && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Descripción:</strong> {sharedDocument.documents.contenido}
                </p>
              </div>
            )}

            {/* Metadatos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  <strong>Compartido:</strong> {formatDate(sharedDocument.created_at)}
                </span>
              </div>
              {sharedDocument.expires_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    <strong>Expira:</strong> {formatDate(sharedDocument.expires_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Botón de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                onClick={() => onViewDocument(sharedDocument.share_token)}
                disabled={isExpired}
                className="flex items-center gap-2"
              >
                {isExpired ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Expirado
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Ver Documento
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
