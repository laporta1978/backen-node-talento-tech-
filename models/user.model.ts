import crypto from 'node:crypto';
import { readDatabase, writeDatabase, type StoredUser } from '../config/database.config.ts';

export type UserRole = 'admin' | 'user';

export interface CreateUserInput {
  email: string;
  password: string;
  nombre: string;
  role?: UserRole;
}

export const UserModel = {
  async findAll(): Promise<StoredUser[]> {
    const db = await readDatabase();
    return db.users;
  },

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const db = await readDatabase();
    const normalized = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === normalized);
  },

  async findById(id: string): Promise<StoredUser | undefined> {
    const db = await readDatabase();
    return db.users.find((u) => u.id === id);
  },

  async create(input: CreateUserInput): Promise<StoredUser> {
    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      nombre: input.nombre.trim(),
      role: input.role === 'admin' ? 'admin' : 'user',
      activo: true,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    await writeDatabase((db) => ({
      ...db,
      users: [...db.users, newUser],
    }));

    return newUser;
  },
};
