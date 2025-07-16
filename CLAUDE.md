# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Match-CV2 is an AI-powered recruitment tool that automates the hiring process by providing intelligent resume analysis and candidate-job matching. The system focuses on improving early-stage recruitment efficiency through automated resume parsing, multi-dimensional matching scores, and intelligent candidate filtering.

### Core Features
1. **Resume Parsing**: Extract structured information from PDF, Word, and text format resumes
2. **Job-Candidate Matching**: AI-powered scoring engine with explanations and multi-dimensional analysis
3. **Smart Filtering**: Batch processing with priority recommendations and elimination suggestions
4. **Intelligent Tagging**: Automated candidate labels and decision support
5. **Custom Scoring**: Enterprise-configurable evaluation strategies

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js 5.0 (configured for email/password auth)
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS 4.0 with PostCSS
- **Database**: To be integrated (Prisma/Drizzle ORM planned)
- **AI Integration**: OpenAI/Claude API for resume analysis and matching

## Development Commands

```bash
# Development
npm run dev --turbo     # Start development server with Turbo
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run typecheck       # Run TypeScript compiler check
npm run check           # Run both lint and typecheck

# Formatting
npm run format:check    # Check Prettier formatting
npm run format:write    # Apply Prettier formatting
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth.js authentication
│   ├── dashboard/         # Main application dashboard
│   ├── auth/             # Authentication pages
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form components
│   └── charts/          # Data visualization
├── lib/                 # Utility functions and configurations
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts           # Database connection
│   ├── ai.ts           # AI service integrations
│   └── utils.ts        # General utilities
├── server/             # Server-side logic
│   ├── auth/           # Authentication configuration
│   ├── api/            # API layer
│   └── services/       # Business logic services
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Architecture Patterns

### Authentication Flow
- Uses NextAuth.js with email/password provider
- Session management with JWT tokens
- Protected routes via middleware
- User session accessible via `auth()` function

### Database Layer
- Schema designed for users, jobs, resumes, and evaluation records
- Relationship modeling for candidate-job matching
- Optimized for bulk operations and filtering

### AI Integration
- Resume parsing service with structured data extraction
- Matching engine with configurable scoring weights
- Batch processing capabilities for large candidate pools
- Explanatory scoring with reasoning

### API Design
- RESTful endpoints for CRUD operations
- File upload handling for resume documents
- Batch processing endpoints for multiple candidates
- Real-time progress tracking for long-running operations

## Key Development Guidelines

### File Upload & Processing
- Support PDF, Word (.docx), and plain text formats
- Implement streaming for large file uploads
- Use background jobs for AI processing
- Store processed data in structured format

### AI Service Integration
- Abstract AI providers behind service interfaces
- Implement retry logic and error handling
- Cache frequently accessed AI results
- Provide fallback mechanisms for service failures

### Performance Considerations
- Implement pagination for large datasets
- Use server-side filtering and sorting
- Optimize database queries with proper indexing
- Implement caching strategies for AI results

### Security Requirements
- Validate all file uploads and types
- Sanitize user inputs and AI responses
- Implement rate limiting for AI API calls
- Secure sensitive data with proper encryption

## Testing Strategy

- Unit tests for utility functions and services
- Integration tests for API endpoints
- Component tests for UI interactions
- End-to-end tests for critical user flows

## Environment Configuration

Required environment variables:
- `AUTH_SECRET`: NextAuth.js secret key
- `DATABASE_URL`: Database connection string
- `OPENAI_API_KEY`: OpenAI API key for AI services
- `UPLOAD_SECRET`: File upload security key

## Common Patterns

### Error Handling
```typescript
// Use standard error boundaries and try-catch blocks
// Provide user-friendly error messages
// Log detailed errors for debugging
```

### Data Validation
```typescript
// Use Zod for runtime validation
// Validate both client and server-side
// Type-safe form handling
```

### State Management
```typescript
// Use React Server Components where possible
// Manage client state with React hooks
// Cache server data appropriately
```

## Development Workflow

1. Always run `npm run check` before committing
2. Use TypeScript strict mode - no `any` types
3. Follow existing code patterns and conventions
4. Test AI integrations thoroughly with mock data
5. Implement proper error handling for all user interactions
6. Commit after each completed feature with descriptive messages

## AI Integration Notes

The system integrates with external AI services for:
- Resume text extraction and parsing
- Semantic matching between job requirements and candidate skills
- Automated candidate scoring with explanations
- Intelligent filtering and ranking

When working with AI features, always implement proper error handling, rate limiting, and fallback mechanisms to ensure system reliability.