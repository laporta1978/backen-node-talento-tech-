import { AppError, type AuthTokenPayload } from '../middlewares/auth.middleware.ts';
import { ProductModel } from '../models/product.model.ts';

export interface ProductPayload {
  nombre?: unknown;
  precio?: unknown;
  stock?: unknown;
  descripcion?: unknown;
  activo?: unknown;
}

function validateCreatePayload(payload: ProductPayload) {
  const errors: string[] = [];

  if (typeof payload.nombre !== 'string' || payload.nombre.trim().length < 2) {
    errors.push('El nombre es obligatorio y debe tener al menos 2 caracteres');
  } else if (payload.nombre.trim().length > 120) {
    errors.push('El nombre no puede superar los 120 caracteres');
  }

  const precio = Number(payload.precio);
  if (payload.precio === undefined || payload.precio === null || Number.isNaN(precio) || precio < 0) {
    errors.push('El precio es obligatorio y debe ser un número mayor o igual a 0');
  }

  const stock = Number(payload.stock);
  if (
    payload.stock === undefined ||
    payload.stock === null ||
    Number.isNaN(stock) ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    errors.push('El stock es obligatorio y debe ser un número entero mayor o igual a 0');
  }

  if (payload.descripcion !== undefined && typeof payload.descripcion !== 'string') {
    errors.push('La descripción debe ser una cadena de texto');
  } else if (typeof payload.descripcion === 'string' && payload.descripcion.trim().length > 500) {
    errors.push('La descripción no puede superar los 500 caracteres');
  }

  if (payload.activo !== undefined && typeof payload.activo !== 'boolean') {
    errors.push('El campo activo debe ser booleano');
  }

  if (errors.length > 0) {
    throw new AppError('Datos de producto inválidos', 400, errors);
  }

  return {
    nombre: (payload.nombre as string).trim(),
    precio: Number(precio.toFixed(2)),
    stock,
    descripcion: typeof payload.descripcion === 'string' ? payload.descripcion.trim() : '',
    activo: typeof payload.activo === 'boolean' ? payload.activo : true,
  };
}

function validateUpdatePayload(payload: ProductPayload) {
  const errors: string[] = [];
  const updateFields: {
    nombre?: string;
    precio?: number;
    stock?: number;
    descripcion?: string;
    activo?: boolean;
  } = {};

  if (payload.nombre !== undefined) {
    if (typeof payload.nombre !== 'string' || payload.nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (payload.nombre.trim().length > 120) {
      errors.push('El nombre no puede superar los 120 caracteres');
    } else {
      updateFields.nombre = payload.nombre.trim();
    }
  }

  if (payload.precio !== undefined) {
    const precio = Number(payload.precio);
    if (Number.isNaN(precio) || precio < 0) {
      errors.push('El precio debe ser un número mayor o igual a 0');
    } else {
      updateFields.precio = Number(precio.toFixed(2));
    }
  }

  if (payload.stock !== undefined) {
    const stock = Number(payload.stock);
    if (Number.isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      errors.push('El stock debe ser un número entero mayor o igual a 0');
    } else {
      updateFields.stock = stock;
    }
  }

  if (payload.descripcion !== undefined) {
    if (typeof payload.descripcion !== 'string') {
      errors.push('La descripción debe ser una cadena de texto');
    } else if (payload.descripcion.trim().length > 500) {
      errors.push('La descripción no puede superar los 500 caracteres');
    } else {
      updateFields.descripcion = payload.descripcion.trim();
    }
  }

  if (payload.activo !== undefined) {
    if (typeof payload.activo !== 'boolean') {
      errors.push('El campo activo debe ser booleano');
    } else {
      updateFields.activo = payload.activo;
    }
  }

  if (Object.keys(updateFields).length === 0 && errors.length === 0) {
    errors.push('Debe enviar al menos un campo válido para actualizar');
  }

  if (errors.length > 0) {
    throw new AppError('Datos de actualización inválidos', 400, errors);
  }

  return updateFields;
}

export const ProductsService = {
  async getAllProducts(search?: string, onlyActive?: boolean) {
    let products = await ProductModel.findAll();

    if (onlyActive) {
      products = products.filter((p) => p.activo);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    return products;
  },

  async getProductById(id: string) {
    if (!id || !id.trim()) {
      throw new AppError('ID de producto inválido', 400);
    }
    const product = await ProductModel.findById(id.trim());
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }
    return product;
  },

  async createProduct(payload: ProductPayload, user: AuthTokenPayload) {
    const validated = validateCreatePayload(payload);
    return ProductModel.create({
      ...validated,
      creadoPor: user.email,
      creadoPorId: user.userId,
    });
  },

  async updateProduct(id: string, payload: ProductPayload, user: AuthTokenPayload) {
    const existing = await ProductModel.findById(id);
    if (!existing) {
      throw new AppError('Producto no encontrado', 404);
    }

    const validated = validateUpdatePayload(payload);
    const updated = await ProductModel.update(id, {
      ...validated,
      actualizadoPor: user.email,
    });

    if (!updated) {
      throw new AppError('Producto no encontrado', 404);
    }

    return updated;
  },

  async deleteProduct(id: string, user: AuthTokenPayload) {
    const deleted = await ProductModel.remove(id);
    if (!deleted) {
      throw new AppError('Producto no encontrado', 404);
    }

    return {
      deleted: {
        id: deleted.id,
        nombre: deleted.nombre,
      },
      deletedBy: user.email,
    };
  },
};
