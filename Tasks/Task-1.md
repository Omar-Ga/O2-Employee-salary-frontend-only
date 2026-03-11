# Task 1: Supabase Foundation — Install SDK, Initialize Client & Configure Auth

## Goal
Get the Supabase JS SDK installed, create a shared Supabase client instance, and wire up the existing `auth.store.ts` to perform **real login/logout** against Supabase Auth — replacing the current dummy user bypass.

## Status: `COMPLETED`
## Complexity: 🔴 Hard

---

## Why This Is First
Everything — every service file, every query, every mutation — depends on having a configured Supabase client and a working auth token. Without this, nothing else can be tested.

---

## Scope

### 1.1 — Install `@supabase/supabase-js`
```bash
npm install @supabase/supabase-js
```

### 1.2 — Create `src/lib/supabase.ts`
- Initialize the Supabase client with the project URL and **anon (publishable) key**.
- Export the client instance as a named export: `export const supabase = createClient(...)`.
- Store the URL and key in environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Create a `.env.local` file with the values (add `.env.local` to `.gitignore` if not already).

### 1.3 — Create a Test User in Supabase Auth
- Use the Supabase Dashboard or SQL to create at least one user (e.g., `admin@o2mation.com` / a secure password).

### 1.4 — Rewrite `src/store/auth.store.ts`
Replace the dummy/mock user with real Supabase Auth calls:

- `authenticate(email, password)` → calls `supabase.auth.signInWithPassword(...)`.
- `logout()` → calls `supabase.auth.signOut()`.
- On app boot, call `supabase.auth.getSession()` to restore a persisted session.
- Listen to `supabase.auth.onAuthStateChange()` to keep the store in sync.
- The `user` object shape in the store may need to be adapted from the PocketBase `UsersResponse` type to the Supabase `User` type.

### 1.5 — Verify Login Page Works
- The existing `src/pages/Login.tsx` already has a form calling `authenticate()`.
- After this task, typing real credentials should log the user in and redirect to the Dashboard.
- Typing wrong credentials should show an error toast (not a blank failure).

---

## Files Touched
| File | Action |
|---|---|
| `package.json` | Add `@supabase/supabase-js` |
| `.env.local` (new) | Supabase URL + anon key |
| `src/lib/supabase.ts` (new) | Supabase client init |
| `src/store/auth.store.ts` | Rewrite with real auth |
| `src/types/index.ts` | May need to update `UsersResponse` type |

---

## Acceptance Criteria
- [x] `npm run dev` starts without errors.
- [x] Navigating to `/login` shows the login form.
- [x] Submitting valid credentials logs the user in and redirects to `/`.
- [x] Submitting invalid credentials shows a visible error message (toast/alert).
- [x] Refreshing the page after login does NOT log the user out (session persisted).
- [x] Clicking "Logout" clears the session and redirects to `/login`.
- [x] No `any` types are used.

---

## Dependencies
None — this is the foundation task.
