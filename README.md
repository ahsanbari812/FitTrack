# FitTrack Pro

1-on-1 Fitness Coaching & Performance Tracking app for iOS and Android, built with React Native (Expo).

## Features

- **Coach Dashboard** — Manage client roster, assign diet/exercise plans, send reminders, leave feedback on daily logs
- **Client Dashboard** — View assigned plans, track meals & workouts, log daily metrics (weight, water, sleep, energy), view progress history
- **Google OAuth** — Secure sign-in via Supabase Auth
- **Row Level Security** — Full database-level access control (clients see only their own data, coach sees all assigned clients)

## Tech Stack

- **React Native** (Expo SDK 54)
- **Supabase** (Auth, PostgreSQL, RLS)
- **Zustand** (State management)
- **TanStack React Query** (Data fetching & caching)
- **Zod + React Hook Form** (Form validation)
- **Lucide React Native** (Icons)

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project

## Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run [`schema.sql`](./schema.sql) in your Supabase SQL Editor to create tables and RLS policies
   - Enable **Google** as an Auth provider in Authentication → Providers
   - Configure the redirect URL for your Expo app

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and anon key in `.env`

5. Start the development server:
   ```bash
   npx expo start
   ```

6. Scan the QR code with Expo Go (iOS/Android) or press `i`/`a` to open in a simulator

## Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── ProgressRing.tsx
│   ├── RestTimerModal.tsx
│   └── ThemeToggle.tsx
├── config/
│   └── auth.ts          # Coach email configuration
├── lib/
│   ├── queries/         # TanStack Query hooks (Supabase CRUD)
│   │   ├── dietPlans.ts
│   │   ├── exercisePlans.ts
│   │   ├── logs.ts
│   │   ├── profiles.ts
│   │   └── reminders.ts
│   ├── store.ts         # Zustand UI store
│   └── supabase.ts      # Supabase client
├── navigation/
│   ├── RootNavigator.tsx
│   ├── ClientNavigator.tsx
│   └── CoachNavigator.tsx
├── screens/
│   ├── auth/LoginScreen.tsx
│   ├── client/           # Client-facing screens
│   └── coach/            # Coach-facing screens
├── theme/theme.ts        # Design tokens
└── types/database.ts     # TypeScript interfaces
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## License

Proprietary — All rights reserved.
