export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  activo?: boolean;
  fechaCreacion?: string;
}

export interface Product {
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  deletedBy?: string;
  errors?: string[];
}

export interface ApiLogEntry {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  timestamp: string;
  response: unknown;
}
