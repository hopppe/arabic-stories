# Arabic Stories Project Notes

This file contains important notes and information about the Arabic Stories project.

## Project Overview
The Arabic Stories app is an interactive platform for learning Arabic through stories. Users can read stories with word-by-word translations, create custom stories, and track their vocabulary progress. The application supports multiple dialects of Arabic and offers stories at various difficulty levels.

## Project Goals
- Create a platform for Arabic language learning through stories
- Provide interactive reading experiences with word-by-word translations
- Support vocabulary building and tracking
- Allow users to generate and customize their own stories with AI
- Support multiple Arabic dialects (Hijazi, Saudi, Jordanian, Egyptian)
- Create an intuitive, modern UI with responsive design
- Implement a sustainable business model with premium content

## Current Stories
- Little Red Riding Hood (ذات الرداء الأحمر)
- The Lost Phone (الجوال الضايع)
- The Three Little Pigs (الخنازير الثلاثة)
- The Story of Adam (قصة آدم)
- The Story of Jesus (قصة يسوع)
- 2nd Timothy 1 (تيموثاوس الثانية ١)

## Story Format
Each story is structured with:
- Unique identifier (slug)
- Title in both English and Arabic
- Content as an array of paragraphs in both languages
- Optional word mappings dictionary for translations
- Difficulty level (simple, easy, normal, advanced)
- Dialect information (hijazi, saudi, jordanian, egyptian)

## Technical Stack
- **Frontend**: Next.js 15.3.1 with React 19
- **Backend**: Supabase for authentication and database (v2.49.4)
- **AI Integration**: OpenAI API (v4.96.0) for story generation
- **Payments**: Stripe for subscription handling (v18.0.0)
- **Styling**: Tailwind CSS v4 with custom CSS modules
- **Development**: TypeScript for type safety
- **Deployment**: Vercel for hosting

## Key Features
- User authentication (email/password and Google OAuth)
- Interactive story reader with word translations
- Vocabulary tracking and learning progress
- AI-powered story creation and customization
  - Custom topic selection
  - Difficulty level adjustment
  - Dialect selection
  - Required vocabulary inclusion
- Premium content access via Stripe subscription
- Responsive design for desktop and mobile devices
- Connection recovery mechanism for improved reliability

## User Flow
1. Users arrive at the homepage with featured stories
2. They can browse available stories without an account
3. For story creation and vocabulary tracking, users must register/login
4. Premium features require a subscription via Stripe
5. Users can create personalized stories with specific vocabulary needs
6. Word translations are displayed on hover/click during reading
7. Vocabulary learning is tracked across sessions

## Data Storage
- Stories are stored in:
  - Static files for predefined stories
  - Supabase database for user-generated content
- User data includes:
  - Authentication information
  - Subscription status
  - Created stories
  - Vocabulary progress
  - Reading history

## TODO
- Implement advanced vocabulary features and tracking
- Enhance mobile responsiveness for better user experience
- Add audio support for pronunciation
- Implement user story sharing capabilities
- Add spaced repetition for vocabulary practice
- Create more curated content for different proficiency levels
- Implement analytics for learning progress
- Optimize performance for larger stories 