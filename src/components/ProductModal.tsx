import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { auth } from '../firebase';
import type { Product } from '../types/api';

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  token: string | null;
  firebaseToken: string | null;
  onClose: () => void;
  onSaved: (
    product: Product,
    method: 'POST' | 'PUT',
    endpoint: string,
    rawResponse: unknown,
    status: number,
    durationMs: number
  ) => void;
  onApiError: (
    method: string,
    endpoint: string,
    status: number,
    durationMs: number,
    rawResponse: unknown
  ) => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  token,
  firebaseToken,
  onClose,
  onSaved,
  onApiError,
}: ProductModalProps) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setNombre(editingProduct.nombre);
        setPrecio(String(editingProduct.precio));
        setStock(String(editingProduct.stock));
        setDescripcion(editingProduct.descripcion);
        setActivo(editingProduct.activo);
      } else {
        setNombre('');
        setPrecio('');
        setStock('0');
        setDescripcion('');
        setActivo(true);
      }
      setError(null);
      setDetails([]);
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails([]);
    setSaving(true);

    const isEdit = Boolean(editingProduct);
    const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/products/${editingProduct!.id}` : '/api/products/create';
    const started = performance.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const freshFirebaseToken = auth.currentUser
        ? await auth.currentUser.getIdToken()
        : firebaseToken;
      if (freshFirebaseToken) {
        headers['X-Firebase-Token'] = freshFirebaseToken;
      }

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({
          nombre,
          precio: Number(precio),
          stock: Number(stock),
          descripcion,
          activo,
        }),
      });

      const durationMs = Math.round(performance.now() - started);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || 'Error al guardar el producto');
        if (Array.isArray(json.errors)) {
          setDetails(json.errors);
        }
        onApiError(method, endpoint, res.status, durationMs, json);
        return;
      }

      onSaved(json.data as Product, method, endpoint, json, res.status, durationMs);
      onClose();
    } catch {
      setError('No se pudo conectar con el backend');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 id="product-modal-title" className="text-lg font-semibold text-slate-900">
              {editingProduct ? 'Editar producto en Firestore' : 'Crear producto en Firestore'}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {editingProduct
                ? `PUT /api/products/${editingProduct.id}`
                : 'POST /api/products/create'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {(!token || !firebaseToken) && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {!token
              ? 'No hay sesión JWT iniciada. El backend devolverá HTTP 401 Unauthorized.'
              : 'No iniciaste con Google (Firebase Auth). Las reglas seguras de Firestore devolverán 401/403 si escribes sin X-Firebase-Token.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="prod-nombre" className="block text-xs font-medium text-slate-700">
              Nombre del producto
            </label>
            <input
              id="prod-nombre"
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Mouse Logitech MX Master"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-precio" className="block text-xs font-medium text-slate-700">
                Precio (USD / ARS)
              </label>
              <input
                id="prod-precio"
                type="number"
                step="0.01"
                min="0"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="99.99"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 outline-none transition-colors focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="prod-stock" className="block text-xs font-medium text-slate-700">
                Stock disponible
              </label>
              <input
                id="prod-stock"
                type="number"
                step="1"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="15"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 outline-none transition-colors focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-xs font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              maxLength={500}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción técnica o comercial del producto"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Producto activo en catálogo</span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <div className="font-medium">{error}</div>
              {details.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {details.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
