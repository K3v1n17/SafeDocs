# Solución Completa para Problemas de Chat en Tiempo Real

## Problemas Identificados y Solucionados

### 1. **Mensajes no aparecen en tiempo real**
**Causa**: Configuración de realtime no habilitada en Supabase
**Solución**: Ejecutar el script SQL en Supabase

### 2. **Nombres de usuario no se muestran correctamente**
**Causa**: Perfiles de usuario no creados o consultas incorrectas
**Solución**: Mejorar hooks y crear perfiles faltantes

## Pasos para Solucionar

### Paso 1: Habilitar Realtime en Supabase
Ejecuta este script en la consola SQL de Supabase:

```sql
-- Habilitar realtime para las tablas necesarias
ALTER publication supabase_realtime ADD TABLE document_share_messages;
ALTER publication supabase_realtime ADD TABLE document_shares;
ALTER publication supabase_realtime ADD TABLE profiles;

-- Verificar que está habilitado
SELECT schemaname, tablename, pubname 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

### Paso 2: Crear Perfiles Faltantes
Ejecuta este script para crear perfiles para usuarios que no los tienen:

```sql
-- Crear perfiles faltantes
INSERT INTO public.profiles (user_id, full_name, avatar_url, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    split_part(au.email, '@', 1)
  ) as full_name,
  au.raw_user_meta_data ->> 'avatar_url' as avatar_url,
  now() as created_at,
  now() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;
```

### Paso 3: Verificar Funcionamiento
1. Ve a `/test-chat` en tu aplicación
2. Abre la consola de desarrollador (F12)
3. Envía un mensaje de prueba
4. Deberías ver logs en la consola indicando el estado

### Paso 4: Probar con Múltiples Usuarios
1. Abre la aplicación en dos navegadores diferentes
2. Inicia sesión con usuarios diferentes
3. Ve al mismo chat usando el mismo share_token
4. Envía mensajes desde ambos navegadores
5. Los mensajes deberían aparecer instantáneamente

## Mejoras Implementadas

### 1. Hook useShareChat Mejorado
- ✅ Carga nombres de usuario reales desde la tabla profiles
- ✅ Manejo de errores mejorado
- ✅ Logs de debug para troubleshooting
- ✅ Estado de conexión en tiempo real
- ✅ Prevención de mensajes duplicados

### 2. Hook useConnectedUsers Mejorado
- ✅ Obtiene información real de perfiles de usuario
- ✅ Manejo de casos donde no hay perfil
- ✅ Fallback a ID de usuario cuando no hay nombre

### 3. UI Mejorada
- ✅ Indicador de estado de conexión
- ✅ Mejor manejo de nombres de usuario
- ✅ Feedback visual del estado del chat

## Archivos Modificados

1. `src/hooks/useShareChat.ts` - Hook principal mejorado
2. `src/hooks/useConnectedUsers.ts` - Hook de usuarios conectados
3. `src/app/(dashboard)/share/[share_token]/page.tsx` - Página principal
4. `src/app/(dashboard)/test-chat/page.tsx` - Página de prueba (NUEVO)
5. `src/lib/enable_realtime.sql` - Script para habilitar realtime (NUEVO)
6. `src/lib/fix_profiles.sql` - Script para crear perfiles (NUEVO)
7. `src/lib/debug_chat.sql` - Script de debug (NUEVO)

## Debugging

Si los mensajes aún no aparecen:

1. **Verifica realtime**:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

2. **Verifica perfiles**:
   ```sql
   SELECT COUNT(*) FROM profiles;
   SELECT * FROM profiles LIMIT 5;
   ```

3. **Verifica mensajes**:
   ```sql
   SELECT m.*, p.full_name 
   FROM document_share_messages m
   LEFT JOIN profiles p ON m.sender_id = p.user_id
   ORDER BY m.created_at DESC LIMIT 10;
   ```

4. **Logs en consola**:
   - Abre F12 en el navegador
   - Ve a la pestaña Console
   - Deberías ver logs de conexión y mensajes

## Próximos Pasos

1. **Ejecutar los scripts SQL** en Supabase
2. **Probar en la página de test** (`/test-chat`)
3. **Verificar en el chat real** con múltiples usuarios
4. **Eliminar la página de test** una vez que funcione

¿Necesitas ayuda con algún paso específico?
