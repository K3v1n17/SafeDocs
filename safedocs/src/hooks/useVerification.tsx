import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { VerificationResult, VerificationStatus } from "../types/verify.types"
import { User } from "@supabase/auth-helpers-nextjs"

export function useVerification(user: User | null) {
  const [verifying, setVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [results, setResults] = useState<VerificationResult[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [lastVerification, setLastVerification] = useState<Date | null>(null)

  const loadDocumentsAndVerifications = async () => {
    if (!user) return

    try {
      setLoadingData(true)

      // Obtener documentos del usuario
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (docsError) {
        console.error('Error loading documents:', docsError)
        return
      }

      // Obtener verificaciones para cada documento
      const { data: verifications, error: verificationsError } = await supabase
        .from('document_verifications')
        .select('*')
        .in('document_id', documents?.map(doc => doc.id) || [])
        .order('created_at', { ascending: false })

      if (verificationsError) {
        console.error('Error loading verifications:', verificationsError)
        return
      }

      // Combinar documentos con sus verificaciones más recientes
      const combinedResults: VerificationResult[] = documents?.map(doc => {
        const docVerifications = verifications?.filter(v => v.document_id === doc.id) || []
        const latestVerification = docVerifications[0] // Ya están ordenados por fecha descendente

        return {
          id: doc.id,
          document_id: doc.id,
          fileName: doc.title,
          file_path: doc.file_path,
          status: latestVerification?.status || 'unknown',
          uploadDate: new Date(doc.created_at),
          lastModified: new Date(doc.updated_at),
          hash: doc.checksum_sha256,
          size: doc.file_size,
          integrity: latestVerification?.integrity_pct || 0,
          details: latestVerification?.details 
            ? Array.isArray(latestVerification.details) 
              ? latestVerification.details 
              : generateDetails(latestVerification.status)
            : generateDetails('unknown')
        }
      }) || []

      setResults(combinedResults)

      // Establecer fecha de última verificación
      if (verifications && verifications.length > 0) {
        const mostRecentVerification = verifications.reduce((latest, current) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        )
        setLastVerification(new Date(mostRecentVerification.created_at))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  /**
   * Calcula el % de coincidencia entre dos hashes hex (0-100).
   * 100  → idéntico (archivo íntegro)
   * <95 → lo marcamos como “modified”
   * <80 → “corrupted”
   */
  function hexSimilarity(a: string, b: string): number {
    if (a.length !== b.length) return 0;
    let equal = 0;
    for (let i = 0; i < a.length; i++) if (a[i] === b[i]) equal++;
    return +(equal * 100 / a.length).toFixed(2);
  }

  // lib/crypto.ts
  async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', buffer)
    return [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleVerification = async () => {
    if (!user) return;

    setVerifying(true);
    setVerificationProgress(0);

    try {
      const total = results.length;
      let finished = 0;

      for (const doc of results) {

        // ✅ Validar file_path antes de continuar
        if (!doc.file_path || typeof doc.file_path !== 'string') {
        console.warn(`file_path inválido para el documento ${doc.id}`);
        continue;
        }


        /* ── 1. Descargar archivo desde Supabase Storage ─────────────── */
        // file_path fue guardado como "<bucket>/<carpeta>/archivo.ext"
        const bucket = "archivos"; // puedes hacer esto fijo si no guardas bucket en la base
        const fileKey = doc.file_path;

        const { data: file, error: dlError } = await supabase
          .storage
          .from(bucket)
          .download(fileKey)

        /* ── 2. Si no se puede descargar, se marca “corrupted” ───────── */
        if (dlError || !file) {
          await supabase.from('document_verifications').insert({
            document_id: doc.document_id,
            run_by: user.id,
            status: 'corrupted',
            integrity_pct: 0,
            hash_checked: '',
            details: { error: 'no-download' }
          });
          setResults(prev => prev.map(r =>
            r.id === doc.id
              ? { ...r, status: 'corrupted', integrity: 0, details: ['Error al descargar'] }
              : r
          ));
          continue; // pasa al siguiente documento
        }

        /* ── 3. Calcular SHA-256 del archivo descargado ──────────────── */
        const fileBuffer = await file.arrayBuffer();
        const newHash   = await sha256Hex(fileBuffer);
        console.log(`Nuevo hash para ${doc.fileName}: ${newHash}`);

        /* ── 4. Comparar con el hash almacenado ─────────────────────── */
        const integrity = hexSimilarity(newHash, doc.hash);   // 0-100
        let status: 'verified' | 'modified' | 'corrupted';

        if (integrity === 100)      status = 'verified';
        else if (integrity >= 80)   status = 'modified';
        else                        status = 'corrupted';

        /* ── 5. Guardar registro de verificación ────────────────────── */
        await supabase.from('document_verifications').insert({
          document_id   : doc.document_id,
          run_by        : user.id,
          status,
          integrity_pct : integrity,
          hash_checked  : newHash,
          details       : { similarity: integrity }
        });

        /* ── 6. Actualizar estado en pantalla ───────────────────────── */
        setResults(prev => prev.map(r =>
          r.id === doc.id
            ? {
                ...r,
                status,
                integrity,
                details : [
                  status === 'verified'
                    ? 'Hash coincide con el original'
                    : `Coincidencia de hash: ${integrity}%`,
                  `SHA256: ${newHash.slice(0, 20)}…`
                ]
              }
            : r
        ));

        /* ── 7. Progreso visual ─────────────────────────────────────── */
        finished++;
        setVerificationProgress(Math.floor((finished / total) * 100));
      }

      setLastVerification(new Date());
    } catch (err) {
      console.error('Verification error', err);
    } finally {
      setVerifying(false);
      setVerificationProgress(0);
    }
  };

  // Función auxiliar para generar detalles basados en el estado
  const generateDetails = (status: string): string[] => {
    switch (status) {
      case 'verified':
        return [
          'Firma digital válida',
          'Hash coincide con el original',
          'No se detectaron modificaciones',
          'Metadatos intactos'
        ]
      case 'modified':
        return [
          'Se detectaron modificaciones menores',
          'Cambios en metadatos detectados',
          'Contenido principal intacto',
          'Posible edición de contenido'
        ]
      case 'corrupted':
        return [
          'Archivo dañado detectado',
          'Hash no coincide',
          'Posible corrupción de datos',
          'Se recomienda volver a subir'
        ]
      default:
        return ['Sin verificación previa', 'Ejecute una verificación para obtener detalles']
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minutos`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `Hace ${hours} horas`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `Hace ${days} días`
    }
  }

  useEffect(() => {
    if (user) {
      loadDocumentsAndVerifications()
    }
  }, [user])

  return {
    verifying,
    verificationProgress,
    results,
    loadingData,
    lastVerification,
    handleVerification,
    formatTimeAgo
  }
}
