# Turborepo Frontend Scaffold

This is a monorepo project scaffold using Turborepo with two applications (admin and platform) and shared packages.

## Project Structure

```
├── apps/
│   ├── admin/                 # Admin management application
│   │   ├── src/
│   │   │   ├── components/   # Reusable components
│   │   │   ├── App.tsx       # Main application component
│   │   │   └── main.tsx      # Application entry point
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── platform/              # Platform user-facing application
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── App.tsx       # Main application component
│       │   └── main.tsx      # Application entry point
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   ├── ui/                   # Shared UI components
│   │   ├── Button.tsx
│   │   └── index.tsx
│   └── utils/                # Shared utilities and stores
│       ├── index.ts
│       └── store.ts
├── package.json             # Root package.json with turborepo config
├── turbo.json               # Turborepo configuration
└── README.md
```

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/)
- **Framework**: [React](https://reactjs.org/) (v18+)
- **Runtime**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: CSS Modules (can be extended with Tailwind, Styled Components, etc.)

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development servers:
   ```bash
   pnpm dev
   ```

   This will start both the admin (port 3000) and platform (port 3001) applications.

3. Build for production:
   ```bash
   pnpm build
   ```

## Scripts

- `pnpm dev` - Start development servers for all apps
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps
- `pnpm format` - Format all code

## Applications

### Admin Application (`apps/admin`)
- Port: 3000
- Purpose: Administrative dashboard and management tools
- Features example components for managing users, content, and settings

### Platform Application (`apps/platform`)
- Port: 3001
- Purpose: User-facing application
- Features example components for user interaction and content consumption

## Shared Packages

### UI Package (`packages/ui`)
Reusable UI components that can be used across both applications.

### Utils Package (`packages/utils`)
Shared utility functions and state management stores using Zustand.

## Development

- Code in `packages/*` is shared between applications
- Changes to shared packages automatically trigger rebuilds of dependent apps
- Each application maintains its own dependencies while sharing common components
- Use the same coding standards across all packages and applications# ai_monorepo
