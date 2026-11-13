import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const configUrl = new URL('../firebase-applet-config.json', import.meta.url);
const fallbackPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const rawConfig = fs.existsSync(configUrl)
  ? fs.readFileSync(configUrl, 'utf-8')
  : fs.readFileSync(fallbackPath, 'utf-8');

export const firebaseConfig = JSON.parse(rawConfig);

const firebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId
);

export const firestoreRestBase = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;
