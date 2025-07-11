# Apollo.io Company Search Application

A React application for searching companies using the Apollo.io API.

## Setup Instructions

### 1. Apollo.io API Key

1. Sign up for an Apollo.io account with a paid plan (API access requires a paid plan)
2. Go to your Apollo.io account settings → Integrations → API
3. Copy your API key
4. Enter the API key in the application when prompted

### 2. Running the Application

```bash
npm install
npm run dev
```

The application uses Vite's proxy configuration to handle CORS issues with the Apollo.io API.

## Features

- Search companies by name, location, and employee count
- View detailed company information including:
  - Company logo and basic info
  - Location and employee count
  - Founded year and revenue
  - Industry and keywords
  - Social media links
- Pagination support for large result sets
- Responsive design for mobile and desktop

## Technical Details

- Built with React, TypeScript, and Tailwind CSS
- Uses Vite proxy to handle CORS issues with Apollo.io API
- Implements proper error handling and loading states
- Stores API key securely in localStorage

## Troubleshooting

If you encounter CORS errors:
1. Make sure you're running the development server (`npm run dev`)
2. The Vite proxy should handle CORS automatically
3. Check that your Apollo.io API key is valid and has the necessary permissions

If you get authentication errors:
1. Verify your Apollo.io API key is correct
2. Ensure your Apollo.io account has a paid plan (free plans don't include API access)
3. Check that your API key has the necessary permissions in your Apollo.io account settings