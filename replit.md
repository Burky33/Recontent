# Recontent

## Overview

Recontent is a content repurposing platform that transforms webinar transcripts into social media content. Users create workspaces for different clients/brands, configure tone settings, and generate platform-specific content (LinkedIn posts, X/Twitter threads, blog outlines) from transcript input using AI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled using Vite
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build**: esbuild for server bundling, Vite for client
- **API Pattern**: REST endpoints defined in `shared/routes.ts` with Zod schemas for type-safe request/response validation

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for shared types, `shared/models/` for domain models
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

### Authentication
- **Provider**: Replit Auth via OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Implementation**: Passport.js with custom OIDC strategy in `server/replit_integrations/auth/`

### AI Integration
- **Provider**: OpenAI API (configured via Replit AI Integrations)
- **Features**: Chat completions for content generation, image generation
- **Utilities**: Batch processing with rate limiting in `server/replit_integrations/batch/`

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory are imported by both client and server
- **Storage Interface**: `IStorage` interface abstracts database operations for testability
- **Route Organization**: API routes defined declaratively in `shared/routes.ts` with path, method, input/output schemas
- **Path Aliases**: `@/` for client source, `@shared/` for shared code

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for queries and schema management

### Authentication
- Replit OIDC provider (`ISSUER_URL` defaults to `https://replit.com/oidc`)
- Requires `SESSION_SECRET` and `REPL_ID` environment variables

### AI Services
- OpenAI API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Third-Party Libraries
- Radix UI primitives for accessible components
- TanStack Query for data fetching
- date-fns for date formatting
- Zod for runtime validation