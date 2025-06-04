# Full-Stack JavaScript Project

A complete full-stack JavaScript application built with React frontend, Express backend, and Supabase PostgreSQL database.

## Project Structure

```
my-fullstack-app/
├── api/                    # Backend API routes
│   ├── routes/            # Express route handlers
│   │   ├── auth.js       # Authentication routes
│   │   ├── users.js      # User management routes
│   │   └── data.js       # Data CRUD routes
│   ├── middleware/        # Express middleware
│   │   └── auth.js       # Authentication middleware
│   └── index.js          # Main server file
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.jsx    # Button component
│   │   ├── Input.jsx     # Input component
│   │   └── Card.jsx      # Card component
│   ├── layout/           # Layout components
│   │   ├── Layout.jsx    # Main layout wrapper
│   │   ├── Header.jsx    # Header component
│   │   └── Footer.jsx    # Footer component
│   └── App.jsx           # Main App component
├── services/             # API and external service integrations
│   ├── api.js           # HTTP API service
│   └── supabase.js      # Supabase client and database services
├── utils/               # Utility functions and helpers
│   ├── helpers.js       # Common utility functions
│   └── constants.js     # Application constants
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Tech Stack

### Frontend
- **React.js 18.2.0** - UI library
- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **Vite 4.4.0** - Build tool and dev server
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.18.0** - Web framework
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Database
- **Supabase** - PostgreSQL database with real-time features
- **Drizzle ORM** - Type-safe database toolkit

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, or pnpm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-fullstack-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your actual values:
   - `DATABASE_URL`: Your Supabase database connection string
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `JWT_SECRET`: A secure secret for JWT tokens
   - `SESSION_SECRET`: A secure secret for sessions

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:push` - Push database schema changes

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_supabase_database_url

# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API
VITE_API_URL=http://localhost:3001/api
PORT=3001

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Environment
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Data
- `GET /api/data` - Get all data
- `POST /api/data` - Create new data
- `PUT /api/data/:id` - Update data
- `DELETE /api/data/:id` - Delete data

## Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your database URL from the project settings
3. Update your `.env` file with the connection details
4. Run database migrations:
   ```bash
   npm run db:push
   ```

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Set environment variables in your hosting dashboard

### Backend (Railway/Heroku)
1. Deploy your backend code to your preferred platform
2. Set environment variables
3. Update frontend API URL to point to your deployed backend

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.