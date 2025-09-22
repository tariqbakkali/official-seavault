# SeaVault

SeaVault is a marine life tracking application built with React Native and Expo. It allows users to log marine creature sightings, track their discoveries, and explore marine biodiversity.

## Features

- **Creature Catalog**: Browse and search marine creatures organized by categories
- **Sighting Logging**: Log your marine creature sightings with photos and details
- **Profile Management**: User profiles with achievement tracking
- **Wishlist**: Keep track of creatures you want to see
- **Statistics**: View your discovery progress and points
- **SQL Editor**: Query database tables directly from the app (admin feature)

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (Database, Authentication, Storage)
- **Navigation**: Expo Router
- **UI Components**: React Native Paper, Custom Components

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
official-seavault/
├── app/                 # App screens and routing
├── components/          # Reusable UI components
├── constants/           # Application constants
├── screens/             # Screen components
├── services/            # Business logic and API services
├── styles/              # Global styles
├── supabase/            # Supabase configuration and migrations
├── types/               # TypeScript types
├── utils/               # Utility functions
└── docs/                # Documentation
```

## SQL Editor

The application includes an SQL Editor feature that allows administrators to query database tables directly from the app. This feature is accessible through the "SQL Editor" tab in the main navigation.

For more information about using the SQL Editor, see [SQL Editor Documentation](docs/SQL_EDITOR.md).

## Supabase Setup

The application uses Supabase for backend services. To set up Supabase:

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations` directory
3. Configure authentication settings
4. Set up storage buckets if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.