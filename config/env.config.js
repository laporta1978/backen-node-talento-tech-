import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel
  ? path.join(os.tmpdir(), 'talento-tech-data')
  : path.resolve(process.cwd(), 'data');
const secretFilePath = path.join(dataDir, '.jwt_secret');

function loadOrCreateJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'MY_JWT_SECRET') {
    return process.env.JWT_SECRET;
  }

  if (isVercel) {
    console.warn(
      'Advertencia: JWT_SECRET no está definida en Vercel. Configura JWT_SECRET en Environment Variables para mantener sesiones estables.'
    );
  }

  try {
    fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(secretFilePath)) {
      const saved = fs.readFileSync(secretFilePath, 'utf-8').trim();
      if (saved.length >= 32) {
        return saved;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFilePath, generated, 'utf-8');
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const envConfig = {
  isVercel,
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: loadOrCreateJwtSecret(),
  jwtExpiresIn: '24h',
  dataDir,
  dbFilePath: path.join(dataDir, 'db.json'),
};
