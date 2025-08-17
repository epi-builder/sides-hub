# SidesHub - Developer Project Showcase Platform

## Overview

SidesHub is a modern web application that allows developers to showcase their side projects, discover others' work, and engage with a community of creators. The platform features project submissions, community discussions, user profiles, and social interactions like likes, bookmarks, and comments. Built with a full-stack TypeScript architecture using React/Vite frontend and Express backend, the application emphasizes developer experience and community engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Bundler**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Framework**: Express.js with TypeScript for API development
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: OpenID Connect with Passport.js for secure user authentication
- **Session Management**: Express sessions with PostgreSQL store for persistent user sessions
- **File Upload**: Uppy integration for client-side file handling with direct cloud storage uploads

### Data Storage Solutions
- **Primary Database**: PostgreSQL (via Neon serverless) for relational data storage
- **Schema Management**: Drizzle migrations for version-controlled database schema changes
- **Object Storage**: Google Cloud Storage for file uploads and media assets
- **Connection Pooling**: Neon serverless connection pooling for efficient database connections

### Authentication and Authorization
- **Provider**: Replit OpenID Connect for seamless authentication in Replit environment
- **Session Strategy**: Server-side sessions with secure HTTP-only cookies
- **Access Control**: Object-level ACL system for fine-grained file access permissions
- **User Management**: Automatic user profile creation and management through OIDC claims

### API Design
- **REST Architecture**: RESTful endpoints for projects, community posts, comments, and user interactions
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Request Logging**: Comprehensive API request logging for debugging and monitoring
- **File Uploads**: Direct-to-cloud upload strategy using presigned URLs for scalability

### Key Features Implementation
- **Project Management**: CRUD operations for project submissions with metadata, tags, and tech stack
- **Community System**: Discussion posts with threaded comments and social interactions
- **User Dashboard**: Analytics and personal project management interface
- **Search and Filtering**: Multi-criteria project discovery with tags, tech stack, and keyword search
- **Social Features**: Like/unlike, bookmark, and comment systems with real-time updates

### Development Tools
- **Type Safety**: End-to-end TypeScript with shared schema validation between client and server
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Build System**: Separate build processes for client (Vite) and server (esbuild)
- **Development Server**: Hot module replacement with Vite dev server integration
- **Environment Configuration**: APP_ENV variable controls seeding behavior (dev/prod)

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Google Cloud Storage**: Object storage for user-uploaded files and media assets
- **Replit Authentication**: OpenID Connect provider for user authentication

### UI and Component Libraries
- **Radix UI**: Unstyled, accessible component primitives for building the user interface
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library providing consistent iconography throughout the application
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### File Upload and Management
- **Uppy**: Modular file uploader with dashboard interface and cloud storage integration
- **@uppy/aws-s3**: Direct-to-S3 upload functionality (adaptable to Google Cloud Storage)

### Form and Data Validation
- **Zod**: TypeScript-first schema validation library for runtime type checking
- **React Hook Form**: Performance-focused form library with minimal re-renders
- **@hookform/resolvers**: Integration layer between React Hook Form and Zod validation

### Development and Build Tools
- **Vite**: Fast build tool and development server with TypeScript support
- **esbuild**: Fast JavaScript bundler for server-side code compilation
- **PostCSS**: CSS post-processor for Tailwind CSS compilation

### Session and Authentication
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **express-session**: Session middleware with PostgreSQL storage backend
- **connect-pg-simple**: PostgreSQL session store for persistent user sessions

## Environment Configuration

The application uses an APP_ENV environment variable to control deployment behavior:

- **Development (APP_ENV=dev)**: Enables database seeding with mock data for local development
- **Production (APP_ENV=prod)**: Skips database seeding to prevent overwriting production data

Other key environment variables include DATABASE_URL, REPLIT_DOMAINS, REPL_ID, and SESSION_SECRET for core functionality, with optional variables for cloud storage integration.

## Recent Changes (2025-08-17)

### UI/UX Improvements
- **Button Handler Implementation**: All missing button handlers in Home.tsx have been implemented
  - "Submit Your Project" button now opens ProjectSubmissionModal
  - "Explore Projects" button smoothly scrolls to projects section  
  - "Load More Projects" button includes loading state and pagination placeholder
- **Accessibility Enhancement**: Added DialogDescription to ProjectSubmissionModal to resolve accessibility warnings
- **Testing Support**: Added data-testid attributes to all interactive buttons for testing

### Code Quality Improvements
- **TypeScript Fixes**: Resolved all TypeScript type errors in ProjectSubmissionModal
  - Fixed Input component null value handling for URL fields
  - Added proper null checking for Uppy upload results
- **Conditional Rendering**: Improved "Load More" button to only show when 6+ projects are available
- **Documentation**: Updated TODO.md to track completed tasks and remaining work

### Technical Debt Resolution
- **Form Validation**: Enhanced form field validation with proper null handling
- **Error Prevention**: Added defensive programming patterns to prevent runtime errors
- **User Feedback**: Improved loading states and user feedback for better UX