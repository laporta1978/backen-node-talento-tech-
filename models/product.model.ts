import crypto from 'node:crypto';
import { readDatabase, writeDatabase, type StoredProduct } from '../config/database.config.ts';

export interface CreateProductInput {
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
  activo: boolean;
  creadoPor: string;
  creadoPorId: string;
}

export interface UpdateProductInput {
  nombre?: string;
  precio?: number;
  stock?: number;
  descripcion?: string;
  activo?: boolean;
  actualizadoPor: string;
}

export const ProductModel = {
  async findAll(): Promise<StoredProduct[]> {
    const db = await readDatabase();
    return db.products;
  },

  async findById(id: string): Promise<StoredProduct | undefined> {
    const db = await readDatabase();
    return db.products.find((p) => p.id === id);
  },

  async create(input: CreateProductInput): Promise<StoredProduct> {
    const now = new Date().toISOString();
    const newProduct: StoredProduct = {
      id: 'prod_' + crypto.randomBytes(4).toString('hex'),
      nombre: input.nombre,
      precio: input.precio,
      stock: input.stock,
      descripcion: input.descripcion,
      activo: input.activo,
      creadoPor: input.creadoPor,
      creadoPorId: input.creadoPorId,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    await writeDatabase((db) => ({
      ...db,
      products: [newProduct, ...db.products],
    }));

    return newProduct;
  },

  async update(id: string, input: UpdateProductInput): Promise<StoredProduct | undefined> {
    let updatedProduct: StoredProduct | undefined;

    await writeDatabase((db) => {
      const index = db.products.findIndex((p) => p.id === id);
      if (index === -1) {
        return db;
      }

      const existing = db.products[index];
      updatedProduct = {
        ...existing,
        nombre: input.nombre !== undefined ? input.nombre : existing.nombre,
        precio: input.precio !== undefined ? input.precio : existing.precio,
        stock: input.stock !== undefined ? input.stock : existing.stock,
        descripcion: input.descripcion !== undefined ? input.descripcion : existing.descripcion,
        activo: input.activo !== undefined ? input.activo : existing.activo,
        actualizadoPor: input.actualizadoPor,
        fechaActualizacion: new Date().toISOString(),
      };

      const nextProducts = [...db.products];
      nextProducts[index] = updatedProduct;
      return {
        ...db,
        products: nextProducts,
      };
    });

    return updatedProduct;
  },

  async remove(id: string): Promise<StoredProduct | undefined> {
    let deletedProduct: StoredProduct | undefined;

    await writeDatabase((db) => {
      const target = db.products.find((p) => p.id === id);
      if (!target) {
        return db;
      }
      deletedProduct = target;
      return {
        ...db,
        products: db.products.filter((p) => p.id !== id),
      };
    });

    return deletedProduct;
  },
};
