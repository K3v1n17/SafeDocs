# 🚀 Guía de Testing y Migración - SafeDocs

## 📋 Estado Actual

✅ **Backend NestJS configurado** con:
- Autenticación Supabase
- CRUD de documentos seguro
- RLS (Row Level Security)
- Endpoints: `/documentos/*`

✅ **Frontend Next.js actualizado** con:
- Capa de servicios abstracta
- Configuración por variables de entorno
- Hooks personalizados

## 🔧 Configuración para Testing

### 1. Variables de Entorno

Tu `.env` actual debe tener:
```bash
# Modo actual - cambiar a 'backend' para probar
NEXT_PUBLIC_API_MODE=supabase

# URL de tu backend NestJS  
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Supabase (SIEMPRE necesario para auth)
NEXT_PUBLIC_SUPABASE_URL=https://glamqdgflrqnnbiwuxnq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Endpoints Actualizados

Frontend → Backend:
```
GET    /documentos/my-documents     → Mis documentos
GET    /documentos/:id              → Documento específico  
POST   /documentos                  → Crear documento
PATCH  /documentos/:id              → Actualizar documento
DELETE /documentos/:id              → Eliminar documento
```

## 🧪 Plan de Testing

### Paso 1: Verificar Backend
```bash
# 1. Asegúrate de que tu backend esté corriendo
npm run start:dev  # o el comando que uses

# 2. Testa con curl/Postman
curl -H "Authorization: Bearer <supabase-token>" \
     http://localhost:3001/documentos/my-documents
```

### Paso 2: Cambiar al Backend
```bash
# En .env
NEXT_PUBLIC_API_MODE=backend
```

### Paso 3: Verificar Frontend
1. **Login** en la app (sigue usando Supabase)
2. **Ir a History** página
3. **Verificar** que los documentos se cargan
4. **Probar CRUD**: crear, editar, eliminar

### Paso 4: Debugging
```bash
# Ver en consola del navegador
# Las requests van a: http://localhost:3001/documentos/*
```

## 🔍 Posibles Problemas y Soluciones

### ❌ Error: "Network Error" o "CORS"
**Causa**: Tu backend NestJS no tiene CORS configurado
**Solución**:
```typescript
// En tu main.ts de NestJS
app.enableCors({
  origin: 'http://localhost:3000', // Tu frontend
  credentials: true,
});
```

### ❌ Error: "401 Unauthorized"
**Causa**: Token de Supabase no se está enviando correctamente
**Verificar**:
1. Usuario logueado en frontend
2. Token presente en `session.access_token`
3. Header `Authorization: Bearer <token>` en request

### ❌ Error: "Cannot find documents"
**Causa**: Diferencia en estructura de datos
**Verificar**:
1. Tu backend retorna `{ success: true, data: [...] }`
2. Campos coinciden: `owner_id`, `created_at`, etc.

### ❌ Error: "TypeError: Cannot read property"
**Causa**: Estructura de Document diferente
**Solución**: Verificar tipos en `src/services/types.ts`

## 📊 Monitoreo

### Backend (NestJS Console)
```bash
# Deberías ver logs como:
[Nest] LOG  Getting role for user: xxx-xxx-xxx
[Nest] LOG  Using authenticated client with token
[Nest] LOG  Current authenticated user: { id: 'xxx', email: 'xxx' }
```

### Frontend (Browser Console)
```bash
# Requests a tu backend:
GET http://localhost:3001/documentos/my-documents
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Network Tab
- ✅ Status 200/201 = Éxito
- ❌ Status 401 = Problema de auth
- ❌ Status 403 = Problema de permisos
- ❌ Status 500 = Error en backend

## 🚀 Rollback Plan

Si algo sale mal:
```bash
# Volver a Supabase inmediatamente
NEXT_PUBLIC_API_MODE=supabase
```

## 📈 Siguientes Pasos

1. **Implementar History Controller** (ejemplo en `BACKEND_EXAMPLES/`)
2. **Agregar más endpoints** según necesites
3. **Testing de carga** para verificar performance
4. **Configurar CI/CD** para deploy automático

## 🎯 Checklist de Migración

- [ ] Backend corriendo en puerto 3001
- [ ] CORS configurado en backend
- [ ] Variable `NEXT_PUBLIC_API_MODE=backend`
- [ ] Login funciona (Supabase)
- [ ] Documentos se cargan desde backend
- [ ] CRUD funciona (crear/editar/eliminar)
- [ ] Historial funciona (si tienes el controller)
- [ ] Sin errores en consola
- [ ] Performance aceptable

¿Todo listo para hacer el switch? 🚀
