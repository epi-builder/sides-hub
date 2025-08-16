# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server with hot reload (client + server)
- `npm run build` - Build for production (client + server)
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle Kit

### Database Management
- Database migrations are managed through Drizzle Kit
- Schema is defined in `shared/schema.ts`
- Configuration in `drizzle.config.ts`
- Seeding occurs automatically in development (controlled by APP_ENV)

## Architecture Overview

### Project Structure
- `client/` - React frontend with Vite bundling
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types between client/server
- `attached_assets/` - Static assets like images

### Key Technologies
- **Frontend**: React 18 + TypeScript, Vite, Wouter (routing), TanStack Query, shadcn/ui + Radix UI
- **Backend**: Express.js + TypeScript, Drizzle ORM, Passport.js (OpenID Connect)
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **File Storage**: Google Cloud Storage with Uppy for uploads
- **Authentication**: Replit OpenID Connect with server-side sessions

### Database Schema
The application uses Drizzle ORM with the following main entities:
- `users` - User profiles from OpenID Connect
- `projects` - User-submitted side projects with metadata, tags, tech stack
- `communityPosts` - Discussion posts
- `comments` - Comments on projects and posts
- `projectLikes`, `postLikes` - Social interaction tracking
- `projectBookmarks` - User bookmarking system
- `projectViews` - Analytics tracking

### Environment Configuration
Critical environment variables:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `REPLIT_DOMAINS` - Allowed domains for CORS (required)
- `REPL_ID` - Replit application identifier (required)
- `SESSION_SECRET` - Session encryption key (required)
- `APP_ENV` - Controls seeding behavior: 'dev' enables seeding, 'prod' disables it
- `GOOGLE_CLOUD_BUCKET_NAME`, `GOOGLE_CLOUD_PROJECT_ID` - For file uploads (optional)

### API Architecture
- RESTful endpoints in `server/routes.ts`
- Centralized error handling middleware
- Session-based authentication with PostgreSQL storage
- File upload uses direct-to-cloud strategy with presigned URLs

### Frontend Architecture
- Component library: shadcn/ui components in `client/src/components/ui/`
- Page components in `client/src/pages/`
- Custom hooks in `client/src/hooks/`
- TanStack Query for server state management and caching
- Wouter for lightweight client-side routing

### Development Notes
- Server runs on port 5000 (configurable via PORT env var)
- Development mode includes Vite dev server integration
- Type safety enforced end-to-end with shared schemas
- Database seeding only runs in development (APP_ENV !== 'prod')
- Build process: Vite for client, esbuild for server