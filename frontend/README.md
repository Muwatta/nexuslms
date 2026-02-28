# NexusLMS Frontend

This directory contains a React + Vite + TypeScript frontend for the NexusLMS API.

## Setup

You will need **Node.js (18 or later)** installed on your machine. From a
terminal run:

```bash
cd frontend
# install dependencies defined in package.json
npm install        # or yarn install
# if you encounter a missing plugin error, install the Vite react plugin:
# npm install -D @vitejs/plugin-react

# start development server (default http://localhost:3000)
npm run dev
```

The following packages are pulled in automatically:

- **runtime dependencies** (`dependencies` in package.json):
  - `react`, `react-dom`, `react-router-dom`
  - `axios` for HTTP requests
- **development dependencies** (`devDependencies`):
  - `vite` (bundler/dev server)
  - `typescript` plus `@types/react` and `@types/react-dom`
  - `tailwindcss`, `postcss`, `autoprefixer` for styling

Once `npm install` finishes, you can open the project in your editor; the
red squiggles (unused React import, missing types) should go away.

Set `VITE_API_URL` in `.env` (or in your shell) to point at the backend API, e.g.

```
VITE_API_URL=http://localhost:8000/api
```

## Structure

- `src/` – application source
  - `api.ts` – axios instance preconfigured with base URL and token header
  - `pages/` – React pages (Login, Signup, Dashboard, Courses, Enrollments, Assignments, Payments, Analytics)
  - `App.tsx` – top‑level routing
- Tailwind CSS configured via `tailwind.config.js` and PostCSS

## Next Steps

- Build login/signup flow, store JWT tokens
- Fetch and display courses, enrollments, assignments, quizzes, payments
- Create forms for submissions/payments
- Protect routes and handle token refresh
