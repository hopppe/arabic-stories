# Arabic Stories Reader

An interactive web application for learning Arabic through stories. This app displays stories in Arabic, allowing users to click on individual words to see their English translations.

## Features

- Interactive stories in Arabic with clickable words
- Word translations shown in real-time
- Learned words tracking
- Multiple stories to choose from
- Mobile-responsive design

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

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/components` - React components
- `/src/data` - Story data and translation mappings
- `/src/app` - Next.js app router pages

## Adding More Stories

To add more stories, edit the `stories.ts` file in the `/src/data` directory, following the existing format with parallel Arabic and English content.

## License

MIT
