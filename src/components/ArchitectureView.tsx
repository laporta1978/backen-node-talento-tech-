const LAYERS = [
  {
    step: '01. Routes',
    folder: 'routes/',
    files: 'auth.routes.ts · products.routes.ts',
    responsibility:
      'Define los endpoints HTTP, aplica middlewares de autenticación JWT y valida roles antes de delegar al controlador.',
  },
  {
    step: '02. Middlewares',
    folder: 'middlewares/',
    files: 'auth.middleware.ts',
    responsibility:
      'Verifica Bearer tokens con jsonwebtoken, restringe operaciones por rol (requireRole) y centraliza errores HTTP (400, 401, 403, 404, 500).',
  },
  {
    step: '03. Controllers',
    folder: 'controllers/',
    files: 'auth.controller.ts · products.controller.ts',
    responsibility:
      'Extrae parámetros, headers (Authorization y X-Firebase-Token) y body JSON; invoca los servicios y formatea respuestas estándar.',
  },
  {
    step: '04. Services',
    folder: 'services/',
    files: 'auth.service.ts · products.service.ts',
    responsibility:
      'Contiene la lógica de negocio: verificación con Firebase Identity Toolkit, hashing con bcryptjs, emisión de JWT y validaciones multinivel de productos.',
  },
  {
    step: '05. Models & Config',
    folder: 'models/ · config/',
    files: 'product.model.ts · user.model.ts · firebase.config.ts',
    responsibility:
      'Conecta directamente con Cloud Firestore para leer y escribir la colección products bajo las reglas de seguridad desplegadas en firestore.rules.',
  },
];

const RBAC_MATRIX = [
  { method: 'GET', path: '/api/products', access: 'Pública', role: 'Ninguno (Firestore public read)' },
  { method: 'GET', path: '/api/products/:id', access: 'Pública', role: 'Ninguno (Firestore public get)' },
  { method: 'POST', path: '/api/products/create', access: 'Protegida', role: 'JWT + Firebase Auth verificado' },
  { method: 'PUT', path: '/api/products/:id', access: 'Protegida', role: 'Propietario o Admin en Firestore' },
  { method: 'DELETE', path: '/api/products/:id', access: 'Protegida', role: 'Admin exclusivamente' },
  { method: 'POST', path: '/auth/login', access: 'Pública', role: 'Ninguno' },
  { method: 'POST', path: '/auth/firebase', access: 'Pública', role: 'Firebase ID Token verificado' },
  { method: 'POST', path: '/auth/register', access: 'Pública', role: 'Ninguno' },
  { method: 'GET', path: '/auth/verify', access: 'Protegida', role: 'Autenticado' },
  { method: 'POST', path: '/auth/refresh', access: 'Protegida', role: 'Autenticado' },
  { method: 'GET', path: '/auth/me', access: 'Protegida', role: 'Autenticado' },
];

export function ArchitectureView() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h2 className="text-base font-semibold text-slate-900">
            Arquitectura en capas con Firebase Firestore
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Separación estricta de responsabilidades entre enrutamiento, controladores, lógica de negocio y Cloud Firestore.
          </p>

          <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
            {LAYERS.map((layer) => (
              <div key={layer.step} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{layer.step}</span>
                  <span className="font-mono text-xs text-slate-500">
                    {layer.folder} · {layer.files}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {layer.responsibility}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h2 className="text-base font-semibold text-slate-900">Estructura de archivos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Organización modular integrada con Cloud Firestore y reglas de seguridad.
          </p>

          <pre className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
{`├── config/
│   ├── firebase.config.ts
│   ├── database.config.ts
│   └── env.config.ts
├── controllers/
│   ├── auth.controller.ts
│   └── products.controller.ts
├── middlewares/
│   └── auth.middleware.ts
├── models/
│   ├── product.model.ts
│   └── user.model.ts
├── routes/
│   ├── auth.routes.ts
│   └── products.routes.ts
├── services/
│   ├── auth.service.ts
│   └── products.service.ts
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
└── server.ts`}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Matriz de autenticación y autorización por roles
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Niveles de acceso aplicados por middlewares JWT y reglas de seguridad en Cloud Firestore.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3">Endpoint</th>
                <th className="px-6 py-3">Protección</th>
                <th className="px-6 py-3">Rol requerido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RBAC_MATRIX.map((row) => (
                <tr key={`${row.method}-${row.path}`} className="hover:bg-slate-50/60">
                  <td className="px-6 py-2.5 font-mono text-xs font-semibold text-slate-900">
                    {row.method}
                  </td>
                  <td className="px-6 py-2.5 font-mono text-xs text-slate-700">{row.path}</td>
                  <td className="px-6 py-2.5 text-xs text-slate-700">{row.access}</td>
                  <td className="px-6 py-2.5 text-xs text-slate-600">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
