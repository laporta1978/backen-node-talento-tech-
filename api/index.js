import { createApiApp } from '../app.js';

const app = createApiApp({ mountNotFoundFallback: true });

export default app;
