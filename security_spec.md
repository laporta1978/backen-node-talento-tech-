# Security Specification (Firestore Rules)

## 1. Data Invariants
1. **Product Ownership & Integrity**: Every document in `/products/{productId}` must have a valid ID (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), `nombre` (`2..120` chars), `precio >= 0`, `stock >= 0` (integer), `descripcion` (`<= 500` chars), `activo` (boolean), `creadoPorId == request.auth.uid` on create, and server-verified timestamps (`fechaCreacion == request.time`, `fechaActualizacion == request.time`).
2. **Immutable Provenance**: On product update, `creadoPorId` and `fechaCreacion` are strictly immutable. Only `nombre`, `precio`, `stock`, `descripcion`, `activo`, `actualizadoPor`, and `fechaActualizacion` may be modified.
3. **Admin-Only Deletion**: Only verified admins (`damianmataderos78@gmail.com` with `email_verified == true` or existence in `/admins/{uid}`) can delete products.
4. **PII Isolation & Role Hardening**: Documents in `/users/{userId}` contain PII (`email`) and are strictly readable only by the owner (`request.auth.uid == userId`) or an admin. Self-registration forces `role == 'user'`, preventing privilege escalation.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Product Create**: `auth: null`, `create /products/prod_1` -> DENIED.
2. **Unverified Email Create**: `auth: { uid: 'u1', token: { email_verified: false } }`, `create /products/prod_1` -> DENIED.
3. **Identity Spoofing on Product Create**: `auth.uid = 'u1'`, payload `creadoPorId: 'u2'` -> DENIED.
4. **Shadow Field Injection on Product Create**: payload includes extra field `isAdminApproved: true` -> DENIED (`hasOnly` blocks unknown keys).
5. **Resource Poisoning (Oversized ID)**: `create /products/${'a'.repeat(200)}` -> DENIED (`isValidId` blocks IDs > 128 chars).
6. **Type/Range Poisoning on Product Update**: `update /products/prod_1` with `precio: -50` or `nombre: ''` -> DENIED (`isValidProduct`).
7. **Timestamp Forgery on Create**: payload sets `fechaCreacion` to client timestamp instead of `request.time` -> DENIED.
8. **Immutable Field Tampering on Update**: non-admin attempts to change `creadoPorId` or `fechaCreacion` -> DENIED.
9. **Unauthorized Product Delete by Standard User**: standard user (`role: 'user'`) calls `delete /products/prod_1` -> DENIED.
10. **PII Blanket Read / Scrape on `/users`**: standard user attempts `get /users/other_uid` or `list /users` without `uid == request.auth.uid` -> DENIED.
11. **Privilege Escalation on User Registration**: user creates `/users/u1` with `role: 'admin'` -> DENIED (`incoming().role == 'user'`).
12. **Email Spoofing Admin Bypass**: user with `token.email == 'damianmataderos78@gmail.com'` and `token.email_verified == false` attempts admin delete -> DENIED.
