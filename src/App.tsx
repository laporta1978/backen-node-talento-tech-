import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ApiExplorer } from './components/ApiExplorer';
import { ArchitectureView } from './components/ArchitectureView';
import { AuthModal } from './components/AuthModal';
import { ProductModal } from './components/ProductModal';
import type { ApiLogEntry, AuthUser, Product } from './types/api';

type ActiveTab = 'catalog' | 'explorer' | 'architecture';
type StatusFilter = 'all' | 'active' | 'inactive';

const STORAGE_TOKEN_KEY = 'talentotech_jwt_token';
const STORAGE_USER_KEY = 'talentotech_auth_user';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastApiLog, setLastApiLog] = useState<ApiLogEntry | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const recordLog = useCallback(
    (method: string, endpoint: string, status: number, durationMs: number, response: unknown) => {
      setLastApiLog({
        id: `${Date.now()}`,
        method,
        endpoint,
        status,
        durationMs,
        timestamp: new Date().toLocaleTimeString('es-AR'),
        response,
      });
    },
    []
  );

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError(null);
    const started = performance.now();

    try {
      const res = await fetch('/api/products');
      const durationMs = Math.round(performance.now() - started);
      const json = await res.json();

      recordLog('GET', '/api/products', res.status, durationMs, json);

      if (!res.ok || !json.success) {
        setProductsError(json.message || 'No se pudieron cargar los productos');
        return;
      }

      setProducts(Array.isArray(json.data) ? json.data : []);
    } catch {
      setProductsError('No se pudo conectar con el servidor Express');
    } finally {
      setLoadingProducts(false);
    }
  }, [recordLog]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  function persistSession(nextToken: string | null, nextUser: AuthUser | null) {
    setToken(nextToken);
    setCurrentUser(nextUser);
    try {
      if (nextToken && nextUser) {
        localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // Ignorar si storage está bloqueado
    }
  }

  function handleLogout() {
    persistSession(null, null);
    setBannerMessage({ type: 'success', text: 'Sesión JWT cerrada.' });
  }

  async function handleVerifyToken() {
    if (!token) return;
    const started = performance.now();
    const res = await fetch('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const durationMs = Math.round(performance.now() - started);
    const json = await res.json();
    recordLog('GET', '/auth/verify', res.status, durationMs, json);

    if (res.ok && json.success) {
      setBannerMessage({
        type: 'success',
        text: `Token válido para ${json.data.user.email} (rol: ${json.data.user.role}).`,
      });
    } else {
      persistSession(null, null);
      setBannerMessage({
        type: 'error',
        text: json.message || 'Token inválido o expirado.',
      });
    }
  }

  async function handleRefreshToken() {
    if (!token) return;
    const started = performance.now();
    const res = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const durationMs = Math.round(performance.now() - started);
    const json = await res.json();
    recordLog('POST', '/auth/refresh', res.status, durationMs, json);

    if (res.ok && json.success && currentUser) {
      persistSession(json.data.token, currentUser);
      setBannerMessage({
        type: 'success',
        text: 'Token JWT renovado por 24 horas adicionales.',
      });
    } else {
      setBannerMessage({
        type: 'error',
        text: json.message || 'No se pudo refrescar el token.',
      });
    }
  }

  async function handleInspectProduct(id: string) {
    const started = performance.now();
    const endpoint = `/api/products/${id}`;
    const res = await fetch(endpoint);
    const durationMs = Math.round(performance.now() - started);
    const json = await res.json();
    recordLog('GET', endpoint, res.status, durationMs, json);

    if (res.ok && json.success) {
      setSelectedProduct(json.data as Product);
    } else {
      setBannerMessage({ type: 'error', text: json.message || 'Producto no encontrado' });
    }
  }

  async function handleDeleteProduct(product: Product) {
    const started = performance.now();
    const endpoint = `/api/products/${product.id}`;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });
    const durationMs = Math.round(performance.now() - started);
    const json = await res.json();
    recordLog('DELETE', endpoint, res.status, durationMs, json);

    if (!res.ok || !json.success) {
      setBannerMessage({
        type: 'error',
        text: `HTTP ${res.status}: ${json.message || 'Operación denegada'}`,
      });
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
    }
    setBannerMessage({
      type: 'success',
      text: `Producto "${product.nombre}" eliminado por ${json.deletedBy}.`,
    });
  }

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.activo) return false;
      if (statusFilter === 'inactive' && p.activo) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const inventoryValue = products.reduce((sum, p) => sum + p.precio * p.stock, 0);
    return { totalProducts, totalStock, inventoryValue };
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('catalog');
            }}
            className="whitespace-nowrap shrink-0 text-lg font-bold tracking-tight text-slate-900"
          >
            Talento Tech API
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'catalog'
                  ? 'text-slate-900 underline decoration-slate-900 underline-offset-8'
                  : 'hover:text-slate-900'
              }`}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'explorer'
                  ? 'text-slate-900 underline decoration-slate-900 underline-offset-8'
                  : 'hover:text-slate-900'
              }`}
            >
              Explorador API
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'architecture'
                  ? 'text-slate-900 underline decoration-slate-900 underline-offset-8'
                  : 'hover:text-slate-900'
              }`}
            >
              Arquitectura
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex whitespace-nowrap shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="whitespace-nowrap shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sistema de Gestión de Productos
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
              Backend RESTful en Node.js y Express con arquitectura en capas, validación multinivel y control de acceso JWT por roles.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 md:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Catálogo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'explorer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Explorador API
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'architecture' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Arquitectura
            </button>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-xs font-medium text-slate-500">Productos registrados</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {metrics.totalProducts}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-xs font-medium text-slate-500">Unidades en stock</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {metrics.totalStock}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-xs font-medium text-slate-500">Valor total en catálogo</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              ${metrics.inventoryValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-xs font-medium text-slate-500">Sesión JWT</div>
            {currentUser ? (
              <div className="mt-2">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {currentUser.nombre}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">{currentUser.email}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-blue-700">{currentUser.role}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <div className="text-sm font-semibold text-slate-700">Acceso público</div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="mt-0.5 text-xs font-medium text-blue-700 hover:underline"
                >
                  Autenticar con JWT
                </button>
              </div>
            )}
          </div>
        </section>

        {currentUser && token && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-slate-900">Token Bearer activo</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">{token.slice(0, 28)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleVerifyToken()}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Verificar token
              </button>
              <button
                type="button"
                onClick={() => void handleRefreshToken()}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Refrescar JWT
              </button>
            </div>
          </div>
        )}

        {bannerMessage && (
          <div
            role="status"
            className={`mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-xs font-medium ${
              bannerMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <span>{bannerMessage.text}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="shrink-0 text-xs underline opacity-80 hover:opacity-100"
            >
              Ocultar
            </button>
          </div>
        )}

        <div className="mt-6">
          {activeTab === 'catalog' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-xl border border-slate-200 bg-white lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative min-w-[200px] flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, descripción o ID..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition-colors focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      {(
                        [
                          { id: 'all', label: 'Todos' },
                          { id: 'active', label: 'Activos' },
                          { id: 'inactive', label: 'Inactivos' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setStatusFilter(opt.id)}
                          className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            statusFilter === opt.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void fetchProducts()}
                      aria-label="Recargar catálogo"
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductModalOpen(true);
                      }}
                      className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nuevo producto
                    </button>
                  </div>
                </div>

                {loadingProducts ? (
                  <div className="divide-y divide-slate-100 p-5">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="flex items-center justify-between py-3">
                        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : productsError ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-red-700">{productsError}</p>
                    <button
                      type="button"
                      onClick={() => void fetchProducts()}
                      className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-slate-800">
                      No hay productos que coincidan con el filtro actual
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Prueba limpiando la búsqueda o crea un nuevo registro en la API.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Crear producto
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
                          <th className="px-5 py-3">Producto</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                          <th className="px-4 py-3 text-right">Stock</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-5 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            onClick={() => void handleInspectProduct(product.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedProduct?.id === product.id
                                ? 'bg-slate-50'
                                : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <td className="px-5 py-3">
                              <div className="font-medium text-slate-900">{product.nombre}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-mono">{product.id}</span>
                                <span aria-hidden="true">·</span>
                                <span className="max-w-xs truncate">
                                  {product.descripcion || 'Sin descripción'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs font-medium tabular-nums text-slate-900">
                              ${product.precio.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                              {product.stock}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <span
                                className={
                                  product.activo
                                    ? 'font-medium text-emerald-700'
                                    : 'font-medium text-slate-500'
                                }
                              >
                                {product.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td
                              className="px-5 py-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setProductModalOpen(true);
                                  }}
                                  aria-label={`Editar ${product.nombre}`}
                                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteProduct(product)}
                                  aria-label={`Eliminar ${product.nombre}`}
                                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-6 lg:col-span-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Detalle de producto</h2>
                  {selectedProduct ? (
                    <div className="mt-4 space-y-3 text-xs">
                      <div>
                        <div className="text-slate-500">Nombre</div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-900">
                          {selectedProduct.nombre}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Identificador</div>
                        <div className="mt-0.5 font-mono text-slate-800">{selectedProduct.id}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
                        <div>
                          <div className="text-slate-500">Precio</div>
                          <div className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                            ${selectedProduct.precio.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Stock</div>
                          <div className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                            {selectedProduct.stock} u.
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Descripción</div>
                        <p className="mt-0.5 leading-relaxed text-slate-700">
                          {selectedProduct.descripcion || 'Sin descripción registrada.'}
                        </p>
                      </div>
                      <div className="border-t border-slate-100 pt-3 text-slate-500">
                        <div>Creado por: {selectedProduct.creadoPor}</div>
                        {selectedProduct.actualizadoPor && (
                          <div className="mt-0.5">
                            Actualizado por: {selectedProduct.actualizadoPor}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      Haz clic en cualquier fila del catálogo para ejecutar GET /api/products/:id y ver su detalle completo.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Última respuesta HTTP</h2>
                    {lastApiLog && (
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          lastApiLog.status >= 200 && lastApiLog.status < 300
                            ? 'text-emerald-700'
                            : 'text-red-700'
                        }`}
                      >
                        {lastApiLog.status} · {lastApiLog.durationMs}ms
                      </span>
                    )}
                  </div>
                  {lastApiLog ? (
                    <div className="mt-3">
                      <div className="font-mono text-xs text-slate-600">
                        {lastApiLog.method} {lastApiLog.endpoint}
                      </div>
                      <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-800">
                        {JSON.stringify(lastApiLog.response, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      Aquí aparecerá el payload real de cada operación CRUD o de autenticación.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explorer' && (
            <ApiExplorer
              token={token}
              products={products}
              onRefreshProducts={() => void fetchProducts()}
              onTokenReceived={(newToken, nextUser) => {
                if (nextUser) {
                  persistSession(newToken, nextUser);
                } else if (currentUser) {
                  persistSession(newToken, currentUser);
                }
              }}
            />
          )}

          {activeTab === 'architecture' && <ArchitectureView />}
        </div>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(newToken, user, rawResponse, status, durationMs, endpoint) => {
          persistSession(newToken, user);
          recordLog('POST', endpoint, status, durationMs, rawResponse);
          setBannerMessage({
            type: 'success',
            text: `Autenticado como ${user.nombre} (${user.role}).`,
          });
        }}
      />

      <ProductModal
        isOpen={productModalOpen}
        editingProduct={editingProduct}
        token={token}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={(saved, method, endpoint, rawResponse, status, durationMs) => {
          recordLog(method, endpoint, status, durationMs, rawResponse);
          if (method === 'POST') {
            setProducts((prev) => [saved, ...prev]);
            setBannerMessage({
              type: 'success',
              text: `Producto "${saved.nombre}" creado correctamente.`,
            });
          } else {
            setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            if (selectedProduct?.id === saved.id) {
              setSelectedProduct(saved);
            }
            setBannerMessage({
              type: 'success',
              text: `Producto "${saved.nombre}" actualizado correctamente.`,
            });
          }
        }}
        onApiError={(method, endpoint, status, durationMs, rawResponse) => {
          recordLog(method, endpoint, status, durationMs, rawResponse);
        }}
      />
    </div>
  );
}
