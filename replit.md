# Replit.md

## Overview
This is a comprehensive **Farmer Management System (FMS)** web application designed to help Indian farmers register their profiles, manage farming data, and discover personalized government schemes. The system integrates AI-powered scheme recommendations using Google Gemini API and provides multilingual support for accessibility. It features a modern React frontend with TypeScript, a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and various external service integrations for weather, market prices, and notifications.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development builds
- **UI Framework**: Shadcn/UI components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **State Management**: TanStack React Query for server state and React Context for auth/language
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Voice Integration**: Custom voice service with Web Speech API for accessibility

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **API Design**: RESTful APIs with JWT-based authentication
- **Middleware**: Request logging, error handling, and token verification
- **File Structure**: Modular routes with separate service layers for business logic
- **Development**: TSX for TypeScript execution in development mode

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Schema Design**: 
  - User authentication with role-based access
  - Comprehensive farmer profiles with personal and agricultural data
  - Land, crop, and livestock management entities
  - Government scheme catalog with eligibility criteria
  - Application tracking and bookmark system
  - Notification and translation caching

### Authentication & Authorization
- **Strategy**: JWT tokens with bcrypt password hashing
- **Storage**: Tokens stored in localStorage with automatic refresh
- **Roles**: Farmer, admin, and agent roles with different access levels
- **Session Management**: Custom React context provider for auth state

### AI Integration
- **Provider**: Google Gemini API for intelligent scheme recommendations
- **Features**: 
  - Personalized scheme matching based on farmer profiles
  - Multilingual content translation
  - Smart eligibility analysis
  - Natural language processing for voice commands

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Gemini API**: AI-powered scheme analysis and multilingual translation
- **OpenWeather API**: Weather data and agricultural forecasts
- **Government APIs**: Integration with AGMARKNET and eNAM for market prices

### Development & Deployment
- **Replit Integration**: Development environment with runtime error overlay
- **Vite Plugins**: React support, cartographer for debugging, and HMR
- **Font Loading**: Google Fonts for Inter and Noto Sans Devanagari

### Third-party Libraries
- **UI Components**: Extensive Radix UI component library for accessibility
- **Validation**: Zod for runtime type checking and form validation
- **HTTP Client**: Native fetch with custom wrapper for API requests
- **Encryption**: bcryptjs for secure password hashing
- **Date Handling**: date-fns for date manipulation and formatting
- **Voice Processing**: Web Speech API with custom service wrapper

### Browser APIs
- **Geolocation**: For automatic location detection
- **Web Speech**: Voice recognition and text-to-speech capabilities
- **Local Storage**: Client-side data persistence for auth and preferences
- **Service Workers**: Offline functionality and background sync (planned)

The architecture prioritizes accessibility with multilingual support, voice interactions, and mobile-responsive design while maintaining strong type safety throughout the application stack.