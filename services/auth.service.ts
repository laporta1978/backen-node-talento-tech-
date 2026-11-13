import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.config.ts';
import { firebaseConfig } from '../config/firebase.config.ts';
import { AppError, type AuthTokenPayload } from '../middlewares/auth.middleware.ts';
import { UserModel } from '../models/user.model.ts';

export interface LoginPayload {
  email?: unknown;
  password?: unknown;
}

export interface RegisterPayload {
  email?: unknown;
  password?: unknown;
  nombre?: unknown;
}

function signAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, envConfig.jwtSecret, {
    expiresIn: envConfig.jwtExpiresIn,
  });
}

export const AuthService = {
  async login(payload: LoginPayload) {
    const errors: string[] = [];

    if (typeof payload.email !== 'string' || !payload.email.trim()) {
      errors.push('El email es obligatorio');
    }
    if (typeof payload.password !== 'string' || !payload.password) {
      errors.push('La contraseña es obligatoria');
    }

    if (errors.length > 0) {
      throw new AppError('Datos de entrada inválidos', 400, errors);
    }

    const email = (payload.email as string).trim().toLowerCase();
    const password = payload.password as string;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (!user.activo) {
      throw new AppError('La cuenta de usuario se encuentra inactiva', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      type: 'Bearer',
      expiresIn: envConfig.jwtExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
      },
    };
  },

  async loginWithFirebase(idToken: unknown) {
    if (typeof idToken !== 'string' || !idToken.trim()) {
      throw new AppError('El token de Firebase (idToken) es obligatorio', 400);
    }

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idToken.trim() }),
      }
    );

    if (!lookupRes.ok) {
      throw new AppError('Token de Firebase inválido o expirado', 401);
    }

    const lookupData = (await lookupRes.json()) as {
      users?: Array<{
        localId: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
      }>;
    };

    const fbUser = lookupData.users?.[0];
    if (!fbUser || !fbUser.email) {
      throw new AppError('No se pudo verificar el usuario de Firebase', 401);
    }

    if (!fbUser.emailVerified) {
      throw new AppError('El correo de Firebase debe estar verificado', 403);
    }

    const normalizedEmail = fbUser.email.toLowerCase();
    const role = normalizedEmail === 'damianmataderos78@gmail.com' ? 'admin' : 'user';
    const nombre = fbUser.displayName || normalizedEmail.split('@')[0];

    const token = signAccessToken({
      userId: fbUser.localId,
      email: normalizedEmail,
      role,
    });

    return {
      token,
      type: 'Bearer',
      expiresIn: envConfig.jwtExpiresIn,
      user: {
        id: fbUser.localId,
        email: normalizedEmail,
        nombre,
        role,
      },
    };
  },

  async register(payload: RegisterPayload) {
    const errors: string[] = [];

    if (typeof payload.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      errors.push('Debe ingresar un email válido');
    }
    if (typeof payload.password !== 'string' || payload.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    if (typeof payload.nombre !== 'string' || payload.nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (errors.length > 0) {
      throw new AppError('Datos de registro inválidos', 400, errors);
    }

    const email = (payload.email as string).trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw new AppError('Ya existe una cuenta registrada con ese email', 400);
    }

    const passwordHash = await bcrypt.hash(payload.password as string, 10);
    const createdUser = await UserModel.create({
      email,
      password: passwordHash,
      nombre: (payload.nombre as string).trim(),
      role: 'user',
    });

    const token = signAccessToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    return {
      token,
      type: 'Bearer',
      expiresIn: envConfig.jwtExpiresIn,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        nombre: createdUser.nombre,
        role: createdUser.role,
      },
    };
  },

  async refresh(token: string | null) {
    if (!token) {
      throw new AppError('Token no proporcionado. Usa el formato: Bearer {token}', 401);
    }

    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(token, envConfig.jwtSecret) as AuthTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('El token ha expirado y no puede refrescarse', 401);
      }
      throw new AppError('Token inválido', 401);
    }

    const user = await UserModel.findById(decoded.userId);
    const role = user?.role ?? decoded.role;

    const freshToken = signAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role,
    });

    return {
      token: freshToken,
      type: 'Bearer',
      expiresIn: envConfig.jwtExpiresIn,
    };
  },

  async getMe(userId: string, fallbackEmail?: string, fallbackRole?: 'admin' | 'user') {
    const user = await UserModel.findById(userId);
    if (!user) {
      if (fallbackEmail) {
        return {
          id: userId,
          email: fallbackEmail,
          nombre: fallbackEmail.split('@')[0],
          role: fallbackRole || 'user',
          activo: true,
        };
      }
      throw new AppError('Usuario no encontrado', 404);
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      activo: user.activo,
      fechaCreacion: user.fechaCreacion,
    };
  },
};
