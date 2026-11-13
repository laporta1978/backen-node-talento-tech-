import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { AuthUser } from '../types/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (token: string, user: AuthUser, rawResponse: unknown, status: number, durationMs: number, endpoint: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@talentotech.com');
  const [password, setPassword] = useState('admin123');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function submitAuth(targetMode: 'login' | 'register', customEmail?: string, customPassword?: string) {
    setError(null);
    setDetails([]);
    setLoading(true);
    const endpoint = targetMode === 'login' ? '/auth/login' : '/auth/register';
    const started = performance.now();

    try {
      const payload =
        targetMode === 'login'
          ? { email: customEmail ?? email, password: customPassword ?? password }
          : { email, password, nombre };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const durationMs = Math.round(performance.now() - started);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || 'No se pudo autenticar');
        if (Array.isArray(json.errors)) {
          setDetails(json.errors);
        }
        return;
      }

      onAuthenticated(json.data.token, json.data.user, json, res.status, durationMs, endpoint);
      onClose();
    } catch {
      setError('Error de conexión con el servidor Express');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitAuth(mode);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 id="auth-modal-title" className="text-lg font-semibold text-slate-900">
              {mode === 'login' ? 'Iniciar sesión JWT' : 'Registrar nueva cuenta'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login'
                ? 'Obtiene un token Bearer con vigencia de 24 horas.'
                : 'Crea una cuenta con rol estándar para gestionar productos.'}
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

        <div className="mt-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setDetails([]);
            }}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setDetails([]);
            }}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {mode === 'login' && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-700">Accesos de prueba precargados</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail('admin@talentotech.com');
                  setPassword('admin123');
                  void submitAuth('login', 'admin@talentotech.com', 'admin123');
                }}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-100"
              >
                Admin (admin@talentotech.com)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail('usuario@talentotech.com');
                  setPassword('user123');
                  void submitAuth('login', 'usuario@talentotech.com', 'user123');
                }}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-100"
              >
                Usuario (usuario@talentotech.com)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-nombre" className="block text-xs font-medium text-slate-700">
                Nombre completo
              </label>
              <input
                id="auth-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Lucía Fernández"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@talentotech.com"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
            />
          </div>

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
              disabled={loading}
              className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Obtener token JWT' : 'Registrar y entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
