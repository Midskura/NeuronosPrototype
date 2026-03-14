# Neuron OS Security Audit

**Date:** 2026-03-14
**Scope:** Server-side API (`/supabase/functions/server/`) and relational schema (`/supabase/migrations/`)
**Auditor:** AI-assisted review
**Status:** Findings logged, no changes applied yet

---

## Executive Summary

The Neuron OS backend has **12 security issues** across 4 severity levels. The 3 critical findings all stem from the same root cause: the app uses a **custom authentication system** (plaintext passwords, no tokens, no middleware) instead of Supabase's built-in Auth. Adopting Supabase Auth would resolve or mitigate 7 of the 12 issues in one architectural change.

---

## KV Store Remnant Sweep (Clean)

As of this audit date, **zero live KV calls remain** in any server file. The only remnants are:

| Location | What | Status |
|---|---|---|
| `index.tsx` line 5 | `import * as kv from "./kv_store_robust.tsx"` | Dangling import -- only referenced inside commented-out block |
| `index.tsx` lines 5090-5219 | 8x `kv.getByPrefix()`, `kv.set()`, `kv.del()` | Inside `/* LEGACY KV CLEANUP CODE */` block comment. Dead code. |
| `kv_store.tsx` | Legacy KV store module | Orphan file -- nothing imports it |
| `kv_store_robust.tsx` | Robust KV store module | Orphan file -- only the dangling line-5 import references it |
| `accounting-handlers.tsx` | 2 comment-only mentions | Documentation references only |
| `db.ts` | 4 comment-only mentions | Documentation references only |
| `catalog-handlers.tsx` | Zero | Fully clean |
| `accounting-new-api.ts` | Zero | Fully clean |
| `seed_data.tsx` | Zero | Fully clean |

**Action items:**
- [ ] Remove `import * as kv from "./kv_store_robust.tsx"` from `index.tsx` line 5
- [ ] Delete commented-out legacy block (lines 5090-5219) in `index.tsx`
- [ ] Delete `/supabase/functions/server/kv_store.tsx`
- [ ] Delete `/supabase/functions/server/kv_store_robust.tsx`

---

## Supabase Auth Status: NOT USED

The application does **not** use Supabase Auth (`supabase.auth.*`). Instead, it implements a fully custom authentication system:

- **Login:** `POST /auth/login` accepts `{ email, password }`, does a plaintext `===` comparison against the `users` table, and returns the user object directly (no token).
- **Session check:** `GET /auth/me?user_id=XXX` takes a user ID as a query parameter and returns the matching user row. No session validation.
- **No tokens:** No JWT generation, no refresh tokens, no session cookies. The frontend presumably stores the user object in memory/localStorage.
- **No middleware:** No request interceptor verifies identity before hitting any endpoint.

**Recommendation:** Migrate to Supabase Auth. This would immediately provide:
- Bcrypt password hashing (resolves Issue #1)
- JWT-based sessions with `supabase.auth.getUser()` verification (resolves Issue #2)
- RLS policies that use `auth.uid()` instead of service-role bypass (resolves Issue #3)
- Built-in rate limiting on auth endpoints (partially resolves Issue #11)
- User identity derived from JWT, not query params (resolves Issue #9)

---

## Findings

### CRITICAL

#### Issue #1: Plaintext Password Storage & Comparison

- **Location:** `index.tsx` lines 91-104
- **Severity:** CRITICAL
- **Description:** Passwords are stored as plaintext strings in the `users` table and compared with `===`. No hashing, no salting.
- **Impact:** Anyone with database read access, backup access, or query log access can see every user's password. A single data breach exposes all credentials.
- **Evidence:**
  ```typescript
  const { email, password } = await c.req.json();
  const { data: user } = await db.from("users").select("*").eq("email", email).maybeSingle();
  if (user.password !== password) { // plaintext comparison
    return c.json({ success: false, error: "Invalid email or password" }, 401);
  }
  ```
- **Remediation:** Use Supabase Auth (which uses bcrypt internally) or, at minimum, hash passwords with bcrypt/argon2 before storage and use `bcrypt.compare()` at login.

#### Issue #2: No Authentication Middleware -- Every Endpoint is Open

- **Location:** `index.tsx` lines 66-79 (middleware section -- only CORS and logger exist)
- **Severity:** CRITICAL
- **Description:** There is zero auth middleware. No JWT verification, no session tokens, no Bearer header checks. Every one of the 100+ API endpoints is accessible to anyone who knows the URL.
- **Impact:** Full unauthorized access to all data and all destructive operations.
- **Affected endpoints (sample):**
  - `DELETE /auth/clear-users` -- wipes all users
  - `DELETE /seed/clear` -- wipes all operational data
  - `DELETE /customers/clear` -- wipes all customers
  - `GET /quotations` -- full financial data access
  - `POST /bookings` -- create fraudulent bookings
  - All 40+ DELETE endpoints, all PUT/PATCH endpoints
- **Remediation:** Add Hono middleware that extracts the Supabase JWT from the `Authorization: Bearer <token>` header, validates it via `supabase.auth.getUser(token)`, and attaches the authenticated user to the request context. Reject unauthenticated requests with 401.

#### Issue #3: Service Role Key Used for ALL Queries (Bypasses RLS)

- **Location:** `db.ts` lines 22-27
- **Severity:** CRITICAL
- **Description:** The shared `db` client uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses all Row Level Security policies. Even though RLS is enabled on all 35 tables, the permissive `USING (true)` policies combined with the service role key means there is effectively zero row-level access control.
- **Evidence:**
  ```typescript
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  _client = createClient(url, key);
  ```
- **Impact:** If any endpoint is exploited, the attacker has full unrestricted access to every row in every table.
- **Remediation:** For user-facing queries, create a per-request Supabase client using the user's JWT (anon key + `Authorization` header). Reserve the service role client for server-only admin operations (seeding, migrations, background jobs). Write proper RLS policies scoped to `auth.uid()`.

---

### HIGH

#### Issue #4: CORS Allows All Origins

- **Location:** `index.tsx` line 73
- **Severity:** HIGH
- **Description:** `origin: "*"` allows any website to make cross-origin requests to the API.
- **Evidence:**
  ```typescript
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
  ```
- **Impact:** An attacker can create a malicious webpage that calls Neuron OS endpoints from a victim's browser. If the victim is on the same network or has cached credentials, this enables CSRF-like attacks.
- **Remediation:** Restrict `origin` to the actual Neuron OS frontend domain(s). Example:
  ```typescript
  origin: ["https://neuronos.example.com", "http://localhost:5173"]
  ```

#### Issue #5: Destructive Admin Endpoints with No Protection

- **Location:** `index.tsx` lines 787, 5063, 5472
- **Severity:** HIGH
- **Description:** Three endpoints can wipe entire tables with a single unauthenticated HTTP call:
  - `DELETE /auth/clear-users` -- deletes all users
  - `DELETE /seed/clear` -- deletes evouchers, expenses, bookings, projects, quotations
  - `DELETE /customers/clear` -- deletes all customers
- **Impact:** Complete data loss from a single curl command.
- **Remediation:** Either remove these endpoints entirely (they're dev/seed utilities) or gate them behind admin role checks + a confirmation token. Consider restricting them to specific environments (e.g., only when `NODE_ENV=development`).

#### Issue #6: File Upload Has No Content-Type Validation

- **Location:** `index.tsx` lines 7526-7556
- **Severity:** HIGH
- **Description:** The `/comments/upload` endpoint accepts any file type. It trusts the client-provided `file.type` and has no server-side allowlist. Only file size is validated (50MB).
- **Evidence:**
  ```typescript
  const { data, error } = await supabase.storage
    .from(COMMENT_ATTACHMENTS_BUCKET)
    .upload(fileName, uint8Array, {
      contentType: file.type, // trusts client
      upsert: false,
    });
  ```
- **Impact:** Attackers can upload `.html` files (XSS via signed URL), `.svg` files (script injection), executable files, or other malicious content.
- **Remediation:** Add a server-side allowlist of permitted MIME types and file extensions:
  ```typescript
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv", "text/plain"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ success: false, error: "File type not allowed" }, 400);
  }
  ```
  Also validate the file extension independently of `file.type`.

#### Issue #7: Signed URLs Valid for 1 Year

- **Location:** `index.tsx` line 7566
- **Severity:** HIGH
- **Description:** Signed URLs for uploaded attachments are valid for 31,536,000 seconds (1 year).
- **Evidence:**
  ```typescript
  const { data: signedUrlData } = await supabase.storage
    .from(COMMENT_ATTACHMENTS_BUCKET)
    .createSignedUrl(fileName, 31536000); // 1 year
  ```
- **Impact:** If a signed URL is leaked (shared, logged, bookmarked, intercepted), it provides access to the file for an entire year. For a freight business handling commercial invoices, bills of lading, and financial documents, this is a significant exposure window.
- **Remediation:** Reduce to 1-24 hours and generate fresh signed URLs on demand when the user views a comment. Alternatively, use short-lived URLs (e.g., 3600 seconds / 1 hour) and refresh them client-side.

---

### MEDIUM

#### Issue #8: No Input Validation / Sanitization

- **Location:** Throughout all POST/PUT/PATCH handlers
- **Severity:** MEDIUM
- **Description:** Request bodies are destructured and passed to Supabase `upsert()`/`insert()` with no schema validation. While the Supabase JS client parameterizes queries (preventing SQL injection), there is no validation of field types, required fields, or field allowlists.
- **Impact:** An attacker could:
  - Inject unexpected fields (e.g., set `role: "admin"` on a user update)
  - Overwrite system fields (`created_at`, `created_by`, `status`)
  - Send malformed data that causes downstream errors
- **Remediation:** Add input validation using a schema library like `zod`:
  ```typescript
  const CreateBookingSchema = z.object({
    customer_id: z.string().uuid(),
    service_type: z.enum(["forwarding", "brokerage", "trucking", "marine_insurance", "others"]),
    // ...
  });
  const body = CreateBookingSchema.parse(await c.req.json());
  ```

#### Issue #9: User Identity from Query Parameter, Not Verified Session

- **Location:** `index.tsx` line 124, and various other endpoints
- **Severity:** MEDIUM
- **Description:** The `/auth/me` endpoint determines the "current user" from a `user_id` query parameter. There is no session verification -- any client can request any user's profile by changing the ID.
- **Evidence:**
  ```typescript
  app.get("/make-server-c142e950/auth/me", async (c) => {
    const userId = c.req.query("user_id");
    // ... fetches user by ID, no verification that caller IS this user
  });
  ```
- **Impact:** Any user can impersonate any other user. Horizontal privilege escalation is trivial.
- **Remediation:** Derive user identity from a verified JWT (`supabase.auth.getUser(token)`) rather than a client-supplied parameter.

#### Issue #10: Error Messages Leak Internal Details

- **Location:** Every `catch` block across all server files
- **Severity:** MEDIUM
- **Description:** Raw error messages (including Postgres column names, constraint names, table names, and stack traces) are returned to the client via `String(error)`.
- **Evidence:**
  ```typescript
  } catch (error) {
    console.error("Error creating quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
  ```
- **Impact:** Gives attackers detailed information about the database schema, constraint names, column types, and internal logic -- useful for crafting targeted attacks.
- **Remediation:** Log the full error server-side but return a generic message to the client:
  ```typescript
  return c.json({ success: false, error: "An internal error occurred" }, 500);
  ```
  Optionally include a correlation ID so support can look up the full error in logs.

---

### LOW

#### Issue #11: No Rate Limiting

- **Location:** Global -- no rate limiting middleware exists
- **Severity:** LOW
- **Description:** No rate limiting on any endpoint including login, data creation, and file upload.
- **Impact:** Enables brute-force password attacks, data flooding, storage abuse, and denial-of-service.
- **Remediation:** Add Hono rate limiting middleware. At minimum, rate-limit the login endpoint:
  ```typescript
  import { rateLimiter } from "hono/rate-limiter";
  app.use("/make-server-c142e950/auth/login", rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }));
  ```

#### Issue #12: PII in Console Logs

- **Location:** `index.tsx` lines 97, 102, 112, 167, and others
- **Severity:** LOW
- **Description:** Login attempts (including email addresses), user lists, and operation details are logged to console with identifiable information.
- **Evidence:**
  ```typescript
  console.log(`Login failed: User not found for email ${email}`);
  console.log(`Login successful: ${user.email} (${user.department} ${user.role})`);
  console.log(`Fetched ${usersWithoutPasswords.length} users (department: ...)`);
  ```
- **Impact:** Depending on where Supabase Edge Function logs are stored and who has access, this could constitute PII exposure. Under Philippine Data Privacy Act (RA 10173), personal data must be protected.
- **Remediation:** Redact or hash email addresses in logs. Use structured logging with severity levels and avoid logging PII at INFO level.

---

## Remediation Priority

### Phase 1: Quick Wins (1-2 hours)
- [ ] **Issue #4:** Restrict CORS origin to actual frontend domain
- [ ] **Issue #5:** Gate destructive endpoints behind environment check or remove
- [ ] **Issue #6:** Add file type allowlist to upload endpoint
- [ ] **Issue #7:** Reduce signed URL TTL to 1-4 hours
- [ ] **Issue #10:** Replace raw error messages with generic responses
- [ ] **Issue #12:** Redact PII from console logs

### Phase 2: Supabase Auth Migration (4-8 hours)
This single change resolves or mitigates Issues #1, #2, #3, #9, and partially #11:
- [ ] Enable Supabase Auth on the project
- [ ] Run migration `003_supabase_auth.sql` (adds `auth_id` column, helper functions, auth-scoped RLS policies, new-user trigger)
- [ ] Create Supabase Auth accounts for each seed user (via dashboard or migration endpoint)
- [ ] Run `SELECT public.link_existing_users_to_auth();` to link existing users to auth accounts
- [ ] Deploy updated server code with JWT verification middleware
- [ ] Update login endpoint to use `supabase.auth.signInWithPassword()`
- [ ] Create per-request Supabase client using user's JWT (anon key)
- [ ] Update frontend to use Supabase Auth client and store session tokens
- [ ] Keep service-role client only for admin/background operations
- [ ] Verify E2E, then `ALTER TABLE users DROP COLUMN password`

### Phase 3: Hardening (2-4 hours)
- [ ] **Issue #8:** Add zod input validation schemas for all POST/PUT/PATCH endpoints
- [ ] **Issue #11:** Add rate limiting middleware (login, upload, create endpoints)
- [ ] Add request logging with correlation IDs (replace console.log)
- [ ] Add CSP headers
- [ ] Implement role-based access control (admin vs operations vs accounting vs sales)

---

## Notes

- The service role key bypass of RLS is by design during development but must be removed before production.
- The current RLS policies (`USING (true) WITH CHECK (true)`) are placeholder -- they need to be replaced with `auth.uid()`-scoped policies per table.
- The `users` table will likely still be needed as a "profiles" table alongside Supabase Auth's `auth.users`, to store department, role, service_type, operations_role, and other app-specific fields.
- Philippine Data Privacy Act (RA 10173) compliance should be reviewed once auth is in place, particularly around data retention, consent, and breach notification procedures.