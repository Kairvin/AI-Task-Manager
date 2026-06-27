# Deadline Hero

A modern, AI-powered task management and team collaboration app featuring real-time workspaces, workload tracking, and daily habit monitoring.

## Features
- **Dynamic Team Workspaces**: Seamlessly switch between personal and team workloads.
- **AI Task Prioritization**: Get intelligent suggestions on which tasks to tackle first.
- **Daily Habit Tracking**: Monitor your recurring daily goals alongside your one-off tasks.
- **Instant Invites**: Generate secure links to easily onboard new team members.
- **Beautiful UI**: Glassmorphism design and smooth animations for a premium user experience.

## Tech Stack
- **Frontend**: React, Vite
- **Styling**: Custom Vanilla CSS with CSS Variables
- **Backend/Database**: Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **Authentication**: Supabase Auth

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/deadlinehero-app.git
   cd deadlinehero-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Rename `.env.example` to `.env` and fill in your Supabase and Gemini keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.
