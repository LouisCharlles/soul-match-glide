# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Companion Repository

This is the **frontend** for the Bonding dating app. The **backend** lives at `/home/luis/Documentos/bonding/` (Django + DRF + Channels). Both must be running for full functionality.

---

## Commands

```bash
# Dev server — http://localhost:8080
npm run dev

# Production build
npm run build

# Lint (ESLint)
npm run lint

# Run all tests (Vitest, one-shot)
npm run test

# Run tests in watch mode
npm run test:watch
```

Environment variables (`.env`):
- `VITE_API_BASE_URL` — defaults to `http://127.0.0.1:8000`
- `VITE_STRIPE_PUBLISHABLE_KEY` — required for payment UI

Path alias `@/` resolves to `src/`.

---

## Architecture

### Contexts (Global State)

Two React Contexts are composed at the root in `App.tsx`:

**`AuthContext`** (`src/lib/auth.tsx`)
- Holds `user: UserSummary | null` and `isAuthenticated`
- Bootstraps by calling `GET /auth/me/` on app load
- `login` / `logout` / `signUp` methods

**`AppExperienceContext`** (`src/contexts/AppExperienceContext.tsx`)
- Source of truth for `ribbons`, `hearts`, `rewindsAvailable`, `isPremium`, discovery filters, and UI customization
- Persisted to `localStorage` under key `bonding_app_experience` — the backend wallet is authoritative. Always call `refreshWallet()` after any server action that changes currency (like, video watch, payment)
- Currency rule: 100 ribbons auto-converts to 1 heart; `_normalize_balances` applies this on every mutation
- `consumeRewind()` — premium: free; non-premium: costs 1 heart, returns 2 rewinds
- `unlockHiddenProfile(profileId)` — costs 50 ribbons, grants 2h Likes session

**`RealtimeContext`** (`src/contexts/RealtimeContext.tsx`)
- Manages two persistent WebSockets: `ws/presence/` and `ws/stories/`
- Exposes `presenceByUserId: Record<number, boolean>` and `subscribeToStoryEvents(listener)`
- Reconnects with exponential backoff (1s → 2s → 5s → 10s); does **not** reconnect on close codes 4001/4003
- Conversation WebSocket (`ws/conversations/<id>/`) is opened per-chat inside `Messages.tsx`, not here

### Route Guards

```
ProtectedRoute           checks AuthContext.isAuthenticated
  ProfileCompletionRoute  fetches /profiles/me/, redirects to /app/profile-setup if incomplete,
                          redirects to /app/verify if !profile.verified
    MainLayout (app shell)
```

`isProfileComplete()` (in `src/lib/profile.ts`) requires: ≥2 photos, occupation, education, city, state.

### API Layer (`src/lib/api.ts`)

- Single `request()` helper; attaches `Authorization: Bearer <token>`; on 401 it refreshes the token via `POST /api/token/refresh/` and retries once
- `ApiXxx` interfaces = raw backend shape (snake_case); `AppXxx` types = mapped frontend shape (camelCase)
- Every `ApiMessage` is mapped through `mapApiMessageToAppMessage(message, currentUserId)` before use
- `sendMessage()` uses FormData; `provider_payload` is JSON-stringified before appending
- `fetchDateSuggestions(matchId, radiusKm)` appends `?radius=<km>` to the request

### Payment Flow (`src/components/PaymentModal.tsx`)

1. Opens via `Dialog` (shadcn/ui); lazy-loads `https://js.stripe.com/v3/` only on first open
2. `startPayment()` → `POST /payments/intents/` → receives `client_secret`
3. Stripe `Payment Element` is mounted into a `ref`-tracked `<div>`; element destroyed on modal close
4. `confirmPayment()` → on success calls `grantPremium()` + `refreshWallet()`
5. Pix tab is one of the three tabs (credit / debit / pix) — Stripe's Payment Element handles the UI

### Webcam / Identity Verification (`src/hooks/useCamera.ts`)

- `startCamera()` calls `navigator.mediaDevices.getUserMedia()`, sets `video.srcObject`, then calls `.play()`
- `<video>` elements using this hook **must** have `autoPlay playsInline muted` attributes
- `capturePhoto()` draws to a canvas and returns a `File` object (`selfie.jpg`)
- Friendly error mapping for AWS Rekognition responses lives in `src/lib/verificationErrors.ts`

### Key Patterns

- **Infinite scroll**: use `IntersectionObserver` on a sentinel element + `useRef(false)` (not state) to prevent double-fetch while awaiting a response
- **Message types**: `"text" | "image" | "video" | "story_reply" | "date_suggestion"` — `date_suggestion` renders a venue card using `message.providerPayload`
- **Match model fields**: `user1` / `user2` (not `user_1` / `user_2`), `conversationId: number | null`
- **Accent colors**: `src/lib/colors.ts` exports `DEFAULT_ACCENT_COLOR`, `getContrastTextColor`, `hexToRgba`, `normalizeAccentColor`; each profile has its own `accentColor` used for chat bubbles and borders
- **Profile completeness**: `isProfileComplete()` + `profileToFormValues()` in `src/lib/profile.ts` are used by `ProfileCompletionRoute` and `ProfileSetup`
