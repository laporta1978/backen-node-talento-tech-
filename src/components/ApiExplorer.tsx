import { useMemo, useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';
import type { Product } from '../types/api';

interface EndpointSpec {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  access: 'Pública' | 'Autenticado' | 'Admin';
  needsId?: boolean;
  defaultBody?: string;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    id: 'login',
    method: 'POST',
    path: '/auth/login',
    title: 'Autenticar usuario y emitir JWT',
    access: 'Pública',
    defaultBody: JSON.stringify(
      { email: 'admin@talentotech.com', password: 'admin123' },
      null,
      2
    ),
  },
  {
    id: 'register',
    method: 'POST',
    path: '/auth/register',
    title: 'Registrar nuevo usuario estándar',
    access: 'Pública',
    defaultBody: JSON.stringify(
      {
        nombre: 'Sofía Martínez',
        email: 'sofia@talentotech.com',
        password: 'password123',
      },
      null,
      2
    ),
  },
  {
    id: 'verify',
    method: 'GET',
    path: '/auth/verify',
    title: 'Verificar validez del token JWT',
    access: 'Autenticado',
  },
  {
    id: 'refresh',
    method: 'POST',
    path: '/auth/refresh',
    title: 'Refrescar token JWT vigente',
    access: 'Autenticado',
  },
  {
    id: 'me',
    method: 'GET',
    path: '/auth/me',
    title: 'Obtener perfil del usuario autenticado',
    access: 'Autenticado',
  },
  {
    id: 'products-list',
    method: 'GET',
    path: '/api/products',
    title: 'Listar todos los productos',
    access: 'Pública',
  },
  {
    id: 'products-get',
    method: 'GET',
    path: '/api/products/:id',
    title: 'Obtener un producto por ID',
    access: 'Pública',
    needsId: true,
  },
  {
    id: 'products-create',
    method: 'POST',
    path: '/api/products/create',
    title: 'Crear un nuevo producto',
    access: 'Autenticado',
    defaultBody: JSON.stringify(
      {
        nombre: 'Auriculares Sony WH-1000XM5',
        precio: 329.99,
        stock: 12,
        descripcion: 'Auriculares inalámbricos con cancelación activa de ruido',
        activo: true,
      },
      null,
      2
    ),
  },
  {
    id: 'products-update',
    method: 'PUT',
    path: '/api/products/:id',
    title: 'Actualizar producto existente',
    access: 'Autenticado',
    needsId: true,
    defaultBody: JSON.stringify(
      {
        nombre: 'Mouse Logitech MX Master 3S',
        precio: 109.99,
        stock: 20,
      },
      null,
      2
    ),
  },
  {
    id: 'products-delete',
    method: 'DELETE',
    path: '/api/products/:id',
    title: 'Eliminar producto (sin rol admin)',
    access: 'Autenticado',
    needsId: true,
  },
];

interface ApiExplorerProps {
  token: string | null;
  firebaseToken: string | null;
  products: Product[];
  onRefreshProducts: () => void;
  onTokenReceived: (newToken: string, user?: { id: string; email: string; nombre: string; role: 'admin' | 'user' }) => void;
}

const METHOD_COLOR: Record<EndpointSpec['method'], string> = {
  GET: 'text-emerald-700',
  POST: 'text-blue-700',
  PUT: 'text-amber-700',
  DELETE: 'text-red-700',
};

export function ApiExplorer({
  token,
  firebaseToken,
  products,
  onRefreshProducts,
  onTokenReceived,
}: ApiExplorerProps) {
  const [selectedId, setSelectedId] = useState<string>('products-list');
  const [paramId, setParamId] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');
  const [includeAuth, setIncludeAuth] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [result, setResult] = useState<{
    status: number;
    durationMs: number;
    endpoint: string;
    method: string;
    json: unknown;
  } | null>(null);

  const selected = useMemo(
    () => ENDPOINTS.find((e) => e.id === selectedId) ?? ENDPOINTS[0],
    [selectedId]
  );

  function selectEndpoint(spec: EndpointSpec) {
    setSelectedId(spec.id);
    setBodyText(spec.defaultBody ?? '');
    if (spec.needsId && !paramId && products.length > 0) {
      setParamId(products[0].id);
    }
    setIncludeAuth(spec.access !== 'Pública');
    setResult(null);
  }

  const resolvedPath = useMemo(() => {
    if (!selected.needsId) return selected.path;
    const cleanId = paramId.trim() || (products[0]?.id ?? 'product_id');
    return selected.path.replace(':id', encodeURIComponent(cleanId));
  }, [selected, paramId, products]);

  const curlSnippet = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const parts = [`curl -X ${selected.method} ${origin}${resolvedPath}`];
    if (selected.defaultBody !== undefined) {
      parts.push(`-H "Content-Type: application/json"`);
    }
    if (includeAuth && token) {
      parts.push(`-H "Authorization: Bearer ${token.slice(0, 24)}..."`);
    }
    if (includeAuth && firebaseToken) {
      parts.push(`-H "X-Firebase-Token: ${firebaseToken.slice(0, 20)}..."`);
    }
    if (selected.defaultBody !== undefined && bodyText.trim()) {
      parts.push(`-d '${bodyText.replace(/\s+/g, ' ').trim()}'`);
    }
    return parts.join(' \\\n  ');
  }, [selected, resolvedPath, includeAuth, token, firebaseToken, bodyText]);

  async function executeRequest() {
    setLoading(true);
    const started = performance.now();

    try {
      const headers: Record<string, string> = {};
      if (includeAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }
      if (includeAuth && firebaseToken) {
        headers['X-Firebase-Token'] = firebaseToken;
      }

      const init: RequestInit = {
        method: selected.method,
        headers,
      };

      if (selected.method === 'POST' || selected.method === 'PUT') {
        if (selected.defaultBody !== undefined) {
          headers['Content-Type'] = 'application/json';
          init.body = bodyText;
        }
      }

      const res = await fetch(resolvedPath, init);
      const durationMs = Math.round(performance.now() - started);
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        json = { message: 'Respuesta sin contenido JSON' };
      }

      setResult({
        status: res.status,
        durationMs,
        endpoint: resolvedPath,
        method: selected.method,
        json,
      });

      if (res.ok && json && typeof json === 'object' && 'data' in json) {
        const dataObj = (json as { data?: Record<string, unknown> }).data;
        if (
          (selected.id === 'login' || selected.id === 'register' || selected.id === 'refresh') &&
          dataObj &&
          typeof dataObj.token === 'string'
        ) {
          onTokenReceived(
            dataObj.token,
            dataObj.user as { id: string; email: string; nombre: string; role: 'admin' | 'user' } | undefined
          );
        }
        if (selected.path.startsWith('/api/products') && selected.method !== 'GET') {
          onRefreshProducts();
        }
      }
    } catch {
      const durationMs = Math.round(performance.now() - started);
      setResult({
        status: 0,
        durationMs,
        endpoint: resolvedPath,
        method: selected.method,
        json: { success: false, message: 'Error de red al conectar con el servidor Express' },
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCurl() {
    void navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="rounded-xl border border-slate-200 bg-white lg:col-span-5">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Endpoints de la API</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Selecciona una ruta para inspeccionar headers, payload y respuesta real.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {ENDPOINTS.map((ep) => {
            const active = ep.id === selected.id;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => selectEndpoint(ep)}
                className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${
                  active ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-12 shrink-0 font-mono text-xs font-semibold ${METHOD_COLOR[ep.method]}`}>
                      {ep.method}
                    </span>
                    <span className="truncate font-mono text-xs font-medium text-slate-900">
                      {ep.path}
                    </span>
                  </div>
                  <div className="mt-0.5 pl-[3.625rem] text-xs text-slate-500 truncate">
                    {ep.title}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{ep.access}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6 lg:col-span-7">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className={`font-mono text-xs font-semibold ${METHOD_COLOR[selected.method]}`}>
                  {selected.method}
                </span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {resolvedPath}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {selected.title} · Acceso: {selected.access}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void executeRequest()}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {loading ? 'Enviando...' : 'Enviar petición'}
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {selected.needsId && (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="explorer-id" className="text-xs font-medium text-slate-700">
                    Parámetro de ruta (:id)
                  </label>
                  {products.length > 0 && (
                    <select
                      aria-label="Seleccionar producto existente"
                      value={paramId}
                      onChange={(e) => setParamId(e.target.value)}
                      className="max-w-xs rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="">Elegir ID del catálogo...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  id="explorer-id"
                  type="text"
                  value={paramId}
                  onChange={(e) => setParamId(e.target.value)}
                  placeholder="Ej. prod_a1b2c3d4"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-y border-slate-100 py-3">
              <div>
                <div className="text-xs font-medium text-slate-800">Header Authorization Bearer</div>
                <div className="text-xs text-slate-500">
                  {token
                    ? 'Envía el token JWT de tu sesión actual.'
                    : 'Sin token activo (puedes probar la respuesta 401 en rutas protegidas).'}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeAuth}
                  onChange={(e) => setIncludeAuth(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Incluir token
              </label>
            </div>

            {selected.defaultBody !== undefined && (
              <div>
                <label htmlFor="explorer-body" className="block text-xs font-medium text-slate-700">
                  Cuerpo JSON (Request Body)
                </label>
                <textarea
                  id="explorer-body"
                  rows={7}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  spellCheck={false}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Ejemplo cURL</span>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <pre className="mt-1.5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100">
                {curlSnippet}
              </pre>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">Respuesta del servidor</h3>
            {result ? (
              <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                <span
                  className={
                    result.status >= 200 && result.status < 300
                      ? 'font-semibold text-emerald-700'
                      : result.status >= 400
                      ? 'font-semibold text-red-700'
                      : 'font-semibold text-slate-700'
                  }
                >
                  HTTP {result.status}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{result.durationMs} ms</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Sin ejecutar</span>
            )}
          </div>

          {result ? (
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs leading-relaxed text-slate-800">
              {JSON.stringify(result.json, null, 2)}
            </pre>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
              Pulsa «Enviar petición» para ejecutar una llamada real contra el backend Express.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
