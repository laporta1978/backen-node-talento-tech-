import crypto from 'node:crypto';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const runtimeFallbackSecret = crypto.randomBytes(32).toString('hex');

export const envConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'MY_JWT_SECRET'
    ? process.env.JWT_SECRET
    : runtimeFallbackSecret,
  jwtExpiresIn: '24h' as const,
  dataDir: path.resolve(process.cwd(), 'data'),
  dbFilePath: path.resolve(process.cwd(), 'data', 'db.json'),
};
