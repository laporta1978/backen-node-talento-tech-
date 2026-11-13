import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { envConfig } from './env.config.js';

let writeQueue = Promise.resolve();
let memoryFallbackDb = null;

async function createInitialSeed() {
  const now = new Date().toISOString();
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  return {
    users: [
      {
        id: 'usr_admin_01',
        email: 'admin@talentotech.com',
        password: adminPasswordHash,
        nombre: 'Administrador Talento Tech',
        role: 'admin',
        activo: true,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        id: 'usr_std_02',
        email: 'usuario@talentotech.com',
        password: userPasswordHash,
        nombre: 'Operador de Catálogo',
        role: 'user',
        activo: true,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
    ],
    products: [],
  };
}

export async function initDatabase() {
  try {
    await fs.mkdir(envConfig.dataDir, { recursive: true });
    try {
      await fs.access(envConfig.dbFilePath);
    } catch {
      const seed = await createInitialSeed();
      await fs.writeFile(envConfig.dbFilePath, JSON.stringify(seed, null, 2), 'utf-8');
    }
  } catch {
    if (!memoryFallbackDb) {
      memoryFallbackDb = await createInitialSeed();
    }
  }
}

export async function readDatabase() {
  await writeQueue;
  await initDatabase();
  if (memoryFallbackDb) {
    return memoryFallbackDb;
  }
  const raw = await fs.readFile(envConfig.dbFilePath, 'utf-8');
  return JSON.parse(raw);
}

export async function writeDatabase(updater) {
  let resultSchema;

  const task = writeQueue.then(async () => {
    await initDatabase();
    if (memoryFallbackDb) {
      memoryFallbackDb = await updater(memoryFallbackDb);
      resultSchema = memoryFallbackDb;
      return;
    }
    const raw = await fs.readFile(envConfig.dbFilePath, 'utf-8');
    const current = JSON.parse(raw);
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
