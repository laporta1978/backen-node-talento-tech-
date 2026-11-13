import crypto from 'node:crypto';
import { readDatabase, writeDatabase } from '../config/database.config.js';

export const UserModel = {
  async findAll() {
    const db = await readDatabase();
    return db.users;
  },

  async findByEmail(email) {
    const db = await readDatabase();
    const normalized = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === normalized);
  },

  async findById(id) {
    const db = await readDatabase();
    return db.users.find((u) => u.id === id);
  },

  async create(input) {
    const now = new Date().toISOString();
    const newUser = {
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
