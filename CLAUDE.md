# CLAUDE.md - Project Rules for BankrAI Mobile

## Security Rules

- **NEVER read, open, or access `.env`, `.env.*`, or any environment variable files.** These contain secrets (API keys, Supabase credentials, Stripe keys, etc.) and must not be read under any circumstances.
- **NEVER read or access `*.keystore`, `*.pem`, or credential files.**
- Do not hardcode secrets, API keys, tokens, or sensitive values anywhere in the codebase. Always reference them via `process.env`.
- Do not commit `.env` files or secrets to git.

## Project Overview

- **App**: BankrAI - a React Native / Expo mobile app (SDK 52)
- **Language**: TypeScript
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State management**: Zustand (stores in `Store/`)
- **Data fetching**: TanStack React Query + Axios
- **Navigation**: React Navigation (stack + bottom tabs)
- **Forms**: React Hook Form + Yup validation
- **Payments**: Stripe (`@stripe/stripe-react-native`)
- **Backend**: Supabase (`@supabase/supabase-js`)
- **Package manager**: npm

## Project Structure

```
screens/        — Screen components
components/     — Reusable UI components
services/       — API service layer (Axios calls)
Store/          — Zustand state stores
navigation/     — React Navigation config
contexts/       — React context providers
config/         — App configuration
types/          — TypeScript type definitions
src/utils/      — Utility functions
assets/         — Images, fonts, static assets
```

## Commands

- `npm start` — Start Expo dev server
- `npm run android` — Run on Android
- `npm run ios` — Run on iOS
- `npm run lint` — Run ESLint + Prettier check
- `npm run format` — Auto-fix lint + format issues

## Code Conventions

- Use TypeScript for all new files (`.ts` / `.tsx`)
- Use NativeWind/Tailwind classes for styling via `className` prop
- Follow existing patterns in the codebase for new screens, components, and services
- Use Zustand stores (in `Store/`) for global state; React Query for server state
- Use `react-hook-form` with `yup` schemas for form handling
- Keep screen components in `screens/`, reusable components in `components/`
- Use the existing Axios instance from `services/` for API calls
- Do not install new dependencies without discussing first
