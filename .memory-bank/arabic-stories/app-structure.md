# App Structure & Data Flow

## Directory Structure
```
arabic-stories/
├── .memory-bank/          # Project documentation
│   └── arabic-stories/    # Project-specific notes
├── .next/                 # Next.js build output
├── node_modules/          # Dependencies
├── public/                # Static assets
│   ├── images/            # Image assets
│   └── stories/           # Static story files (if any)
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── ArabicText.tsx             # Core Arabic text display
│   │   ├── LearnedWords.tsx           # Vocabulary tracking
│   │   ├── LearnedWordsList.tsx       # Words list display
│   │   ├── StoryList.tsx              # Story browsing
│   │   ├── StoryReader.tsx            # Story reading interface
│   │   ├── StoryView.tsx              # Story display
│   │   ├── TranslationPopup.tsx       # Word translation UI
│   │   └── ...                        # Other components
│   ├── pages/             # Next.js pages
│   │   ├── api/           # API routes
│   │   │   ├── generate-story.ts      # OpenAI story generation
│   │   │   ├── create-checkout-session.ts # Stripe payment
│   │   │   └── ...                    # Other API endpoints
│   │   ├── auth/          # Auth pages
│   │   │   └── callback.tsx           # OAuth callback handling
│   │   ├── stories/       # Story-related pages
│   │   │   ├── [id].tsx               # Individual story view
│   │   │   ├── create.tsx             # Story creation
│   │   │   └── index.tsx              # Story listing
│   │   ├── _app.tsx                   # Global app wrapper
│   │   ├── index.tsx                  # Homepage
│   │   └── ...                        # Other pages
│   ├── lib/               # Utility functions/libraries
│   │   ├── auth.tsx                   # Authentication logic
│   │   ├── supabase.ts                # Supabase client
│   │   └── ...                        # Other utilities
│   ├── data/              # Static data
│   │   ├── stories.ts                 # Predefined stories
│   │   ├── mappings.ts                # Word translations
│   │   └── ...                        # Other data files
│   ├── hooks/             # Custom React hooks
│   │   ├── useLocalStorage.ts         # Persistent storage hook
│   │   ├── useMediaQuery.ts           # Responsive design hook
│   │   └── ...                        # Other hooks
│   ├── styles/            # CSS and styling
│   │   ├── globals.css                # Global styles
│   │   └── ...                        # Component styles
│   └── types/             # TypeScript type definitions
│       └── index.ts                   # Common types
├── .env.local             # Environment variables
├── package.json           # Project dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── postcss.config.mjs     # PostCSS configuration
```

## Application Architecture

### Frontend Architecture
- **Component Structure**: Follows a modular component-based architecture with:
  - **Layout Components**: Handle page structure and navigation
  - **Feature Components**: Implement specific functionality (story reader, word lists)
  - **UI Components**: Reusable visual elements with consistent styling
  - **Container Components**: Handle data fetching and state management
  - **Presentational Components**: Focused on UI rendering with props

- **State Management**:
  - React Context for global state (auth, preferences)
  - Local component state for UI elements
  - Custom hooks for shared behaviors
  - LocalStorage for persistent user preferences
  - URL state for shareable page configuration

- **Rendering Strategy**:
  - Server-Side Rendering (SSR) for initial page load and SEO
  - Client-side navigation for fast page transitions
  - Static Generation for fixed content pages
  - Incremental Static Regeneration for story content

### Backend Architecture
- **Supabase Integration**:
  - Authentication service with JWT tokens
  - PostgreSQL database with Row Level Security
  - Storage buckets for user-generated content
  - Real-time subscriptions for collaborative features

- **API Routes**:
  - RESTful Next.js API routes for server-side operations
  - Serverless function architecture on Vercel
  - Connection to third-party services (OpenAI, Stripe)

## Data Flow Overview

1. **User Authentication Flow**
   - User initiates login/signup via UI
   - Client calls Supabase auth API (PKCE flow for OAuth)
   - Server validates credentials and returns JWT
   - JWT stored in localStorage and HTTP-only cookies
   - Auth provider context updates global state
   - Protected routes check auth status on navigation
   - Periodic token refresh for extended sessions
   - Connection recovery mechanism handles disruptions

2. **Story Reading Flow**
   - User selects story from StoryList component
   - URL updated with story ID parameter
   - StoryReader loads story data:
     - For predefined stories: from static data
     - For user stories: from Supabase database
   - Word mappings loaded or generated for translations
   - ArabicText component renders paragraphs with interactive words
   - Word clicks trigger translation popup and update learned words
   - Reading progress tracked for authenticated users
   - Learned words persisted to localStorage and database (if logged in)

3. **Story Creation Flow**
   - Authenticated user accesses creation page
   - User selects parameters:
     - Difficulty level (simple, easy, normal, advanced)
     - Dialect preference (hijazi, saudi, jordanian, egyptian)
     - Topics and required vocabulary
   - Premium features checked against subscription status
   - Form data sent to OpenAI via API route
   - Generated content structured into Story format
   - Preview shown to user with option to edit
   - Final story saved to Supabase database
   - User redirected to new story or collection page

4. **Vocabulary Learning Flow**
   - User interacts with Arabic words during reading
   - TranslationPopup shows word meaning on click/hover
   - LearnedWords component tracks vocabulary progress:
     - First click: word added to learned list
     - Subsequent clicks: review count incremented
   - Words displayed with visual indicators of familiarity
   - Statistics calculated for learning progress
   - Data synced between localStorage and database for logged-in users
   - Potential for spaced repetition in future development

## Database Schema in Detail

### Supabase Tables

**users (auth.users)** - Managed by Supabase Auth
```sql
id uuid primary key
email text unique
encrypted_password text
email_confirmed_at timestamp with time zone
invited_at timestamp with time zone
confirmation_token text
confirmation_sent_at timestamp with time zone
recovery_token text
recovery_sent_at timestamp with time zone
last_sign_in_at timestamp with time zone
raw_app_meta_data jsonb
raw_user_meta_data jsonb
created_at timestamp with time zone
updated_at timestamp with time zone
```

**profiles**
```sql
id uuid primary key references auth.users(id)
display_name text
has_paid boolean default false
preferences jsonb
created_at timestamp with time zone default now()
updated_at timestamp with time zone default now()
```

**stories**
```sql
id uuid primary key default uuid_generate_v4()
title jsonb not null -- {english: string, arabic: string}
content jsonb not null -- {english: string[], arabic: string[]}
user_id uuid references auth.users(id)
dialect text
difficulty text
word_mappings jsonb
is_public boolean default false
created_at timestamp with time zone default now()
updated_at timestamp with time zone default now()
```

**learned_words**
```sql
id uuid primary key default uuid_generate_v4()
user_id uuid references auth.users(id)
word text not null
translation text
review_count integer default 1
last_reviewed timestamp with time zone default now()
created_at timestamp with time zone default now()
```

**subscriptions**
```sql
id uuid primary key default uuid_generate_v4()
user_id uuid references auth.users(id)
stripe_customer_id text
stripe_subscription_id text
status text
current_period_end timestamp with time zone
created_at timestamp with time zone default now()
updated_at timestamp with time zone default now()
```

## Security Considerations

- **Authentication**: JWT-based auth with PKCE flow for enhanced security
- **Data Access**: Row Level Security (RLS) policies in Supabase:
  - Users can only access their own data
  - Public stories accessible to all
  - Admin-only operations restricted by role
- **API Protection**:
  - Rate limiting to prevent abuse
  - Input validation for all API endpoints
  - Error handling that doesn't expose sensitive information
- **Frontend Security**:
  - XSS protection through proper content sanitization
  - CSRF protection for form submissions
  - Content Security Policy headers

## Performance Optimizations

- **Code Splitting**: Dynamically loaded components for faster initial load
- **Image Optimization**: Next.js Image component for optimized delivery
- **Caching Strategy**:
  - Static story content cached at build time
  - API responses cached where appropriate
  - Browser caching for assets
- **Database Optimization**:
  - Indexed queries for faster story retrieval
  - Connection pooling for efficient database access
- **Frontend Performance**:
  - Memoized components to prevent unnecessary re-renders
  - Virtualized lists for large data sets
  - Lazy loading for offscreen content
  - Arabic text rendering optimizations

## Deployment Architecture

- **Hosting**: Vercel for Next.js deployment
- **Database**: Supabase PostgreSQL instances
- **Media Storage**: Supabase Storage or external CDN
- **CI/CD Pipeline**:
  - GitHub integration for automated deployments
  - Environment-specific configuration
  - Preview deployments for pull requests
- **Monitoring**:
  - Error tracking with Sentry
  - Performance monitoring with Vercel Analytics
  - Usage metrics for subscription features

## Future Technical Considerations

- **Progressive Web App Features**:
  - Offline reading capability
  - Installation on mobile devices
  - Background sync for learned words
- **Advanced AI Integration**:
  - Custom embeddings for better translation accuracy
  - User-specific learning model based on progress
  - Speech synthesis for pronunciation
- **Performance Enhancements**:
  - Edge caching for global performance
  - WebSocket integration for real-time features
  - Web Workers for intensive processing
- **Mobile Experience**:
  - Native-like animations for interactions
  - Gesture-based navigation
  - Optimized touch targets for Arabic text 