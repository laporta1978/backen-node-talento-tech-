import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { envConfig } from './env.config.ts';

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  nombre: string;
  role: 'admin' | 'user';
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface StoredProduct {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
  activo: boolean;
  creadoPor: string;
  creadoPorId: string;
  actualizadoPor?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  products: StoredProduct[];
}

let writeQueue: Promise<void> = Promise.resolve();

async function createInitialSeed(): Promise<DatabaseSchema> {
  const now = new Date().toISOString();
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  const adminId = 'usr_admin_01';
  const userId = 'usr_std_02';

  return {
    users: [
      {
        id: adminId,
        email: 'admin@talentotech.com',
        password: adminPasswordHash,
        nombre: 'Administrador Talento Tech',
        role: 'admin',
        activo: true,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        id: userId,
        email: 'usuario@talentotech.com',
        password: userPasswordHash,
        nombre: 'Operador de Catálogo',
        role: 'user',
        activo: true,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
    ],
    products: [
      {
        id: 'prod_' + crypto.randomBytes(4).toString('hex'),
        nombre: 'Mouse Logitech MX Master 3S',
        precio: 119.99,
        stock: 24,
        descripcion: 'Mouse ergonómico inalámbrico con sensor de 8000 DPI y desplazamiento MagSpeed.',
        activo: true,
        creadoPor: 'admin@talentotech.com',
        creadoPorId: adminId,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        id: 'prod_' + crypto.randomBytes(4).toString('hex'),
        nombre: 'Teclado Mecánico Keychron K2',
        precio: 149.5,
        stock: 14,
        descripcion: 'Teclado mecánico compacto 75% con switches táctiles y conectividad Bluetooth.',
        activo: true,
        creadoPor: 'admin@talentotech.com',
        creadoPorId: adminId,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        id: 'prod_' + crypto.randomBytes(4).toString('hex'),
        nombre: 'Monitor Samsung Odyssey 27"',
        precio: 349.0,
        stock: 8,
        descripcion: 'Monitor QHD 27 pulgadas con panel IPS de alta precisión cromática.',
        activo: true,
        creadoPor: 'usuario@talentotech.com',
        creadoPorId: userId,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        id: 'prod_' + crypto.randomBytes(4).toString('hex'),
        nombre: 'Agua Mineral Sin Gas 1.5L',
        precio: 1500,
        stock: 36,
        descripcion: 'Botella de agua mineral natural de manantial para oficina y eventos.',
        activo: true,
        creadoPor: 'usuario@talentotech.com',
        creadoPorId: userId,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
    ],
  };
}

export async function initDatabase(): Promise<void> {
  await fs.mkdir(envConfig.dataDir, { recursive: true });
  try {
    await fs.access(envConfig.dbFilePath);
  } catch {
    const seed = await createInitialSeed();
    await fs.writeFile(envConfig.dbFilePath, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

export async function readDatabase(): Promise<DatabaseSchema> {
  await writeQueue;
  await initDatabase();
  const raw = await fs.readFile(envConfig.dbFilePath, 'utf-8');
  return JSON.parse(raw) as DatabaseSchema;
}

export async function writeDatabase(
  updater: (current: DatabaseSchema) => DatabaseSchema | Promise<DatabaseSchema>
): Promise<DatabaseSchema> {
  let resultSchema: DatabaseSchema | undefined;

  const task = writeQueue.then(async () => {
    await initDatabase();
    const raw = await fs.readFile(envConfig.dbFilePath, 'utf-8');
    const current = JSON.parse(raw) as DatabaseSchema;
    const updated = await updater(current);
    await fs.writeFile(envConfig.dbFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    resultSchema = updated;
  });

  writeQueue = task.catch(() => undefined);
  await task;

  if (!resultSchema) {
    throw new Error('Error al persistir los datos en la base de datos.');
  }

  return resultSchema;
}
