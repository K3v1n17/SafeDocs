# 🔐 Migración de Autenticación al Backend

## 📋 ¿Qué hemos implementado?

### ✅ **Servicios de Autenticación Abstractos**
- `authService` - Maneja login/register/logout según el modo configurado
- **Modo Supabase**: Usa Supabase Auth directamente (como antes)
- **Modo Backend**: Tu backend maneja la lógica + Supabase Auth como motor

### ✅ **AuthContext Actualizado**
- Compatible con ambos modos (supabase/backend)
- Manejo automático de tokens
- Misma interfaz para el frontend

### ✅ **Endpoints para tu Backend**
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registro de usuario
- `GET /auth/me` - Obtener usuario actual
- `POST /auth/refresh` - Refrescar token
- `POST /auth/logout` - Cerrar sesión

## 🏗️ Arquitectura de Auth con Backend

```
Frontend (Login Form)
    ↓ { email, password }
Tu Backend NestJS (/auth/login)
    ↓ Validaciones + Lógica personalizada
Supabase Auth (signInWithPassword)
    ↓ Tokens + User Data
Tu Backend (formato response + rol)
    ↓ Respuesta estandarizada
Frontend (AuthContext)
```

## 🎯 Ventajas de esta Arquitectura

### ✅ **Control Total**
- **Validaciones personalizadas** en el backend
- **Lógica de negocio** centralizada
- **Formato de respuesta** consistente
- **Manejo de roles** desde tu base de datos

### ✅ **Flexibilidad**
- **Migración gradual**: Cambias con una variable
- **Rollback fácil**: Vuelves a `mode=supabase`
- **Misma interfaz**: Frontend no cambia

### ✅ **Seguridad**
- **Tokens validados** en el backend
- **Rate limiting** (puedes agregarlo)
- **Logs de seguridad** (puedes agregarlo)
- **Validaciones extras** antes de auth

## 🚀 Implementación en tu Backend

### 1. Crear el Auth Controller

```typescript
// En tu backend NestJS
@Controller('auth')
export class AuthController {
  
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // 1. Validaciones personalizadas
    if (await this.isUserBlocked(loginDto.email)) {
      return { success: false, error: 'Usuario bloqueado' };
    }
    
    // 2. Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword(loginDto);
    
    // 3. Obtener rol desde tu DB
    const role = await this.getUserRole(data.user.id);
    
    // 4. Respuesta estandarizada
    return {
      success: true,
      data: {
        user: { ...data.user, role },
        session: data.session
      }
    };
  }
  
  // Más endpoints...
}
```

### 2. Validaciones Personalizadas

Puedes agregar:

```typescript
// Validaciones antes de auth
- Verificar si el usuario está bloqueado
- Rate limiting por IP
- Validar formato de email personalizado
- Verificar intentos fallidos

// Lógica después de auth exitoso
- Registrar login en logs
- Actualizar último acceso
- Verificar si necesita cambiar contraseña
- Enviar notificación de login
```

### 3. Formato de Respuesta

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "usuario123",
      "name": "Usuario Test",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1234567890
    }
  }
}
```

## 🧪 Cómo Probar

### 1. **Implementar Auth Controller**
Copia el código de `BACKEND_EXAMPLES/auth.controller.ts` a tu backend

### 2. **Verificar que funciona en modo Supabase**
```bash
# .env
NEXT_PUBLIC_API_MODE=supabase
```
- ✅ Login debe funcionar igual que antes
- ✅ Register debe funcionar igual que antes

### 3. **Cambiar a modo Backend**
```bash
# .env
NEXT_PUBLIC_API_MODE=backend
```

### 4. **Probar Auth con Backend**
- ✅ Login: Debe ir a `POST http://localhost:3001/auth/login`
- ✅ Register: Debe ir a `POST http://localhost:3001/auth/register`
- ✅ Tokens: Se guardan en localStorage
- ✅ Navegación: Debe redirigir a `/overview`

## 🔍 Debug y Troubleshooting

### Ver Requests en Browser DevTools
```bash
# En Network tab buscar:
POST http://localhost:3001/auth/login
POST http://localhost:3001/auth/register
GET  http://localhost:3001/auth/me
```

### Headers que se envían
```bash
Content-Type: application/json
# Body:
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response esperado
```json
{
  "success": true,
  "data": {
    "user": { /* datos del usuario */ },
    "session": { /* tokens */ }
  }
}
```

## 🎯 Beneficios Específicos para SafeDocs

### 1. **Validaciones de Seguridad**
```typescript
// En tu backend
- Verificar que el email sea de dominio permitido
- Validar contraseñas según políticas específicas
- Verificar si el usuario tiene permisos para registrarse
- Rate limiting para prevenir ataques
```

### 2. **Integración con Roles**
```typescript
// Asignación automática de roles
if (email.endsWith('@admin.com')) {
  await this.assignRole(user.id, 'admin');
} else {
  await this.assignRole(user.id, 'owner');
}
```

### 3. **Logs y Auditoría**
```typescript
// Registrar todas las actividades de auth
await this.logAuthActivity({
  user_id: user.id,
  action: 'login',
  ip: req.ip,
  user_agent: req.headers['user-agent']
});
```

## 📞 Siguiente Paso

1. **Implementa el Auth Controller** en tu backend
2. **Prueba en modo supabase** que todo sigue funcionando
3. **Cambia a modo backend** y prueba login/register
4. **Verifica tokens** en localStorage y requests a `/documentos/*`

¿Quieres que te ayude implementando alguna validación específica en el auth controller? 🚀
