# Overview

A full-stack quote/booking form application built with React frontend and Express backend. The system allows users to submit quote requests by providing their details and selecting hours, with dynamic cost calculation based on configurable hourly rates. An admin dashboard provides protected access to view submissions and manage pricing settings.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables
- **Animations**: Framer Motion for step transitions and smooth animations
- **Build Tool**: Vite with custom path aliases (@/, @shared/, @assets/)

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: Shared schema in `shared/schema.ts` for type safety across frontend/backend
- **API Design**: Type-safe API contracts defined in `shared/routes.ts` using Zod validation
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

## Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL sessions table
- **Protected Routes**: Admin dashboard requires authentication via `isAuthenticated` middleware
- **User Storage**: Users table with Replit profile data (id, email, name, profile image)

## Data Model
- **formSettings**: Stores configurable base rate and hourly rates (JSONB for flexible pricing tiers)
- **submissions**: Stores user quote submissions with name, mobile, hours, calculated cost, and status
- **sessions**: Auth session storage (required for Replit Auth)
- **users**: User profile storage (required for Replit Auth)

## API Structure
All API routes are prefixed with `/api/`:
- `GET /api/settings` - Public: Fetch current pricing settings
- `POST /api/settings` - Protected: Update pricing settings
- `POST /api/submissions` - Public: Create new submission
- `GET /api/submissions` - Protected: List all submissions
- `GET /api/auth/user` - Protected: Get current user info

## Build System
- **Development**: `tsx` for TypeScript execution with Vite dev server
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Database Migrations**: Drizzle Kit with `db:push` command

# External Dependencies

## Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

## Authentication
- **Replit Auth**: OpenID Connect provider at `https://replit.com/oidc`
- **Required Environment Variables**: `REPL_ID`, `SESSION_SECRET`, `ISSUER_URL`

## Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `express-session` / `connect-pg-simple`: Session handling with PostgreSQL
- `passport` / `openid-client`: Authentication flow
- `zod` / `drizzle-zod`: Schema validation and type generation
- `framer-motion`: UI animations
- Radix UI primitives: Accessible component foundations