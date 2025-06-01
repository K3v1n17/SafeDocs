import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura';

// Registro e inicio de sesión
export async function POST(request: NextRequest) {
  try {
    const { action, email, password, username, name } = await request.json();

    console.log('Auth request:', { action, email, username }); // Para debug

    if (action === 'register') {
      // Validaciones
      if (!email || !password || !username || !name) {
        return NextResponse.json(
          { error: 'Todos los campos son requeridos' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'El usuario o email ya existe' },
          { status: 400 }
        );
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          createdAt: true,
        },
      });

      // Generar JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        message: 'Usuario creado exitosamente',
        user,
        token,
      });
    }

    if (action === 'login') {
      // Validaciones
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email y contraseña son requeridos' },
          { status: 400 }
        );
      }

      // Buscar usuario por email o username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: email } // Permitir login con username
          ]
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      // Generar JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
        token,
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Verificar token
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}