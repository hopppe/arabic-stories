# Arabic Stories Reader

An interactive web application for learning Arabic through stories. This app displays stories in Arabic, allowing users to click on individual words to see their English translations.

## Features

- Interactive stories in Arabic with clickable words
- Word translations shown in real-time
- Learned words tracking
- Multiple stories to choose from
- Mobile-responsive design
- Create your own Arabic stories with custom vocabulary
- Select difficulty level and Arabic dialect for your stories

## Technical Overview

The app is built using:
- Next.js (React framework)
- TypeScript
- Tailwind CSS for styling

## How It Works

1. The app displays Arabic text with each word made clickable
2. When a user clicks on a word, its translation appears in a popup
3. Clicked words are highlighted and added to a "Learned Words" panel
4. Users can clear their learned words list or switch between stories

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- (Optional) Supabase account for the story creation feature

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. (Optional) For the story creation feature, copy the `.env.local.example` file to `.env.local` and add your Supabase credentials:
   ```
   cp .env.local.example .env.local
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/components` - React components
- `/src/data` - Story data and translation mappings
- `/src/pages` - Next.js pages
- `/src/lib` - Utility functions and services
- `/src/styles` - CSS modules for styling

## Adding More Stories

### Built-in Stories
To add more built-in stories, edit the `stories.ts` file in the `/src/data` directory, following the existing format with parallel Arabic and English content.

### User-Generated Stories
Users can create their own stories through the "Create Story" feature, which allows them to:
1. Select a difficulty level (simple, easy, normal)
2. Choose an Arabic dialect (hijazi, saudi, jordanian, egyptian)
3. Enter Arabic vocabulary words they want to include in the story
4. Generate a custom story that incorporates those words

User-generated stories are stored in Supabase, and require proper setup of the database as described in the `.env.local.example` file.

## License

MIT
