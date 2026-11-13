import crypto from 'node:crypto';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import {
  db,
  firebaseConfig,
  firestoreRestBase,
} from '../config/firebase.config.js';
import { AppError } from '../middlewares/auth.middleware.js';

function toIsoDate(value) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value && typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function mapSnapshotToProduct(id, data) {
  return {
    id,
    nombre: String(data.nombre ?? ''),
    precio: Number(data.precio ?? 0),
    stock: Number(data.stock ?? 0),
    descripcion: String(data.descripcion ?? ''),
    activo: Boolean(data.activo ?? true),
    creadoPor: String(data.creadoPor ?? ''),
    creadoPorId: String(data.creadoPorId ?? ''),
    ...(data.actualizadoPor ? { actualizadoPor: String(data.actualizadoPor) } : {}),
    fechaCreacion: toIsoDate(data.fechaCreacion),
    fechaActualizacion: toIsoDate(data.fechaActualizacion),
  };
}

function toFirestoreField(value, forceInt = false) {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (forceInt && Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }
  return { stringValue: value };
}

async function handleFirestoreRestError(res, fallbackMsg) {
  let message = fallbackMsg;
  try {
    const errJson = await res.json();
    if (errJson?.error?.message) {
      message = errJson.error.message;
    }
  } catch {
    // Usar mensaje por defecto
  }

  if (res.status === 401) {
    throw new AppError(`Firebase Auth inválido o expirado: ${message}`, 401);
  }
  if (res.status === 403) {
    throw new AppError(`Permiso denegado por reglas de Firestore: ${message}`, 403);
  }
  if (res.status === 404) {
    throw new AppError('Producto no encontrado en Firestore', 404);
  }
  if (res.status === 400) {
    throw new AppError(`Datos rechazados por Firestore: ${message}`, 400);
  }
  throw new AppError(`Error en Firestore (${res.status}): ${message}`, 500);
}

const commitEndpoint = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:commit`;
const documentPrefix = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;

export const ProductModel = {
  async findAll() {
    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map((d) =>
      mapSnapshotToProduct(d.id, d.data())
    );
    return products.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
  },

  async findById(id) {
    const docRef = doc(db, 'products', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return undefined;
    }
    return mapSnapshotToProduct(snap.id, snap.data());
  },

  async create(input, firebaseIdToken) {
    if (!firebaseIdToken) {
      throw new AppError(
        'Se requiere autenticación Firebase (Google) en el header X-Firebase-Token para escribir en Cloud Firestore.',
        401
      );
    }

    const productId = 'prod_' + crypto.randomBytes(4).toString('hex');
    const docName = `${documentPrefix}/products/${productId}`;

    const res = await fetch(commitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firebaseIdToken}`,
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: docName,
              fields: {
                nombre: toFirestoreField(input.nombre),
                precio: { doubleValue: input.precio },
                stock: toFirestoreField(input.stock, true),
                descripcion: toFirestoreField(input.descripcion),
                activo: toFirestoreField(input.activo),
                creadoPor: toFirestoreField(input.creadoPor),
                creadoPorId: toFirestoreField(input.creadoPorId),
              },
            },
            updateTransforms: [
              { fieldPath: 'fechaCreacion', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'fechaActualizacion', setToServerValue: 'REQUEST_TIME' },
            ],
            currentDocument: { exists: false },
          },
        ],
      }),
    });

    if (!res.ok) {
      await handleFirestoreRestError(res, 'No se pudo crear el producto en Firestore');
    }

    const created = await this.findById(productId);
    if (created) return created;

    const now = new Date().toISOString();
    return {
      id: productId,
      ...input,
      fechaCreacion: now,
      fechaActualizacion: now,
    };
  },

  async update(id, input, firebaseIdToken) {
    if (!firebaseIdToken) {
      throw new AppError(
        'Se requiere autenticación Firebase (Google) en el header X-Firebase-Token para actualizar en Cloud Firestore.',
        401
      );
    }

    const existing = await this.findById(id);
    if (!existing) {
      return undefined;
    }

    const fields = {
      actualizadoPor: toFirestoreField(input.actualizadoPor),
    };
    const fieldPaths = ['actualizadoPor', 'fechaActualizacion'];

    if (input.nombre !== undefined) {
      fields.nombre = toFirestoreField(input.nombre);
      fieldPaths.push('nombre');
    }
    if (input.precio !== undefined) {
      fields.precio = { doubleValue: input.precio };
      fieldPaths.push('precio');
    }
    if (input.stock !== undefined) {
      fields.stock = toFirestoreField(input.stock, true);
      fieldPaths.push('stock');
    }
    if (input.descripcion !== undefined) {
      fields.descripcion = toFirestoreField(input.descripcion);
      fieldPaths.push('descripcion');
    }
    if (input.activo !== undefined) {
      fields.activo = toFirestoreField(input.activo);
      fieldPaths.push('activo');
    }

    const docName = `${documentPrefix}/products/${id}`;
    const res = await fetch(commitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firebaseIdToken}`,
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: docName,
              fields,
            },
            updateMask: {
              fieldPaths,
            },
            updateTransforms: [
              { fieldPath: 'fechaActualizacion', setToServerValue: 'REQUEST_TIME' },
            ],
            currentDocument: { exists: true },
          },
        ],
      }),
    });

    if (!res.ok) {
      await handleFirestoreRestError(res, 'No se pudo actualizar el producto en Firestore');
    }

    return this.findById(id);
  },

  async remove(id, firebaseIdToken) {
    if (!firebaseIdToken) {
      throw new AppError(
        'Se requiere autenticación Firebase (Google) en el header X-Firebase-Token para eliminar en Cloud Firestore.',
        401
      );
    }

    const existing = await this.findById(id);
    if (!existing) {
      return undefined;
    }

    const res = await fetch(`${firestoreRestBase}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
      },
    });

    if (!res.ok) {
      await handleFirestoreRestError(res, 'No se pudo eliminar el producto en Firestore');
    }

    return existing;
  },
};
