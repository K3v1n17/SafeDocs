# Guía de Migración de Supabase a Backend

Esta guía te ayudará a migrar de Supabase a tu backend de microservicios de manera sencilla y escalable.

## 🏗️ Arquitectura

El proyecto ahora cuenta con una **capa de abstracción de servicios** que permite cambiar fácilmente entre diferentes backends:

```
Frontend (React/Next.js)
    ↓
Capa de Servicios (Abstracción)
    ↓
Backend API (Supabase | Microservicios)
```

## 📁 Estructura de Servicios

```
src/
├── config/
│   └── api.ts              # Configuración de APIs
├── lib/
│   └── api-client.ts       # Cliente HTTP centralizado
├── services/
│   ├── index.ts            # Exportaciones principales
│   ├── types.ts            # Tipos compartidos
│   ├── document.service.ts # Servicio de documentos
│   └── history.service.ts  # Servicio de historial
└── hooks/
    └── useHistoryData.ts   # Hook personalizado para datos
```

## 🔧 Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
# Para usar Supabase
NEXT_PUBLIC_API_MODE=supabase

# Para usar tu backend
NEXT_PUBLIC_API_MODE=backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 2. Cambiar de Backend

Solo necesitas cambiar **una variable**:

```bash
# .env.local
NEXT_PUBLIC_API_MODE=backend  # o 'supabase'
```

## 🚀 Uso en Componentes

### Antes (Supabase directo)
```tsx
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('owner_id', userId)
```

### Después (Con servicios)
```tsx
// Usando el servicio
const documents = await documentService.getAll(userId)

// O usando el hook
const { documents, loading, error } = useHistoryData()
```

## 📋 APIs Requeridas en tu Backend

Para que funcione completamente, tu backend debe implementar estos endpoints:

### Documentos
```
GET    /api/documents?userId={userId}
GET    /api/documents/{id}?userId={userId}
POST   /api/documents
PUT    /api/documents/{id}
DELETE /api/documents/{id}?userId={userId}
```

### Historial
```
GET    /api/history?userId={userId}
POST   /api/history
GET    /api/history/document/{documentId}?userId={userId}
```

### Formato de Respuesta
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## 🔄 Migración Paso a Paso

### 1. Preparación
1. Asegúrate de que tu backend esté corriendo
2. Configura las variables de entorno
3. Testa los endpoints con Postman/Insomnia

### 2. Migración Gradual
```bash
# 1. Mantén Supabase como fallback
NEXT_PUBLIC_API_MODE=supabase

# 2. Testa tu backend
NEXT_PUBLIC_API_MODE=backend

# 3. Si todo funciona, mantén backend
```

### 3. Verificación
- ✅ Los documentos se cargan correctamente
- ✅ Se pueden crear/editar/eliminar documentos
- ✅ El historial se registra correctamente
- ✅ No hay errores en la consola

## 🎯 Ventajas de esta Arquitectura

### ✅ **Escalabilidad**
- Fácil agregar nuevos servicios
- Cambio de backend sin tocar componentes
- Reutilización de lógica

### ✅ **Mantenibilidad**
- Código centralizado
- Tipado fuerte con TypeScript
- Manejo de errores consistente

### ✅ **Flexibilidad**
- Múltiples backends soportados
- Configuración por variables de entorno
- Hooks personalizados reutilizables

## 🛠️ Agregar Nuevos Servicios

### 1. Crear el tipo de servicio
```typescript
// src/services/types.ts
export interface INewService {
  method(): Promise<Type>
}
```

### 2. Implementar el servicio
```typescript
// src/services/new.service.ts
class SupabaseNewService implements INewService {
  async method() { /* implementación */ }
}

class BackendNewService implements INewService {
  async method() { /* implementación */ }
}

export const newService = createNewService()
```

### 3. Crear hook personalizado (opcional)
```typescript
// src/hooks/useNewData.ts
export const useNewData = () => {
  // lógica del hook
}
```

### 4. Usar en componentes
```tsx
import { newService } from '@/services'
// o
import { useNewData } from '@/hooks/useNewData'
```

## 🔍 Troubleshooting

### Error: "Cannot find name 'supabase'"
✅ **Solución**: Ya estás usando los servicios, elimina cualquier import de supabase

### Error: "API_CONFIG.mode is undefined"
✅ **Solución**: Verifica que `NEXT_PUBLIC_API_MODE` esté configurado

### Error: "Connection failed"
✅ **Solución**: Verifica que tu backend esté corriendo y la URL sea correcta

### Error en tipos de Document
✅ **Solución**: Asegúrate de importar `Document` desde `@/services` no desde otras librerías

## 📞 Soporte

Si tienes problemas con la migración:
1. Verifica las variables de entorno
2. Revisa que tu backend implemente las APIs correctas
3. Usa el modo 'supabase' como fallback mientras solucionas
