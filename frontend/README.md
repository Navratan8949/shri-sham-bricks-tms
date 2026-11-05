# Shri Shyam Bricks — Frontend

Next.js App Router frontend for the simplified building-material supply and own-fleet P&L system.

## Active pages
- `/dashboard` — business and vehicle-wise P&L
- `/supply-orders` — direct supply register with GST and Excel export
- `/expenses` — own-fleet expenses with Excel export
- `/vehicles` — own fleet master
- `/drivers` — driver master and assignment
- `/masters` — customer and material tabs

Other legacy application module URLs redirect to `/dashboard`.

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_URL` to the backend API base URL, including `/api`.
3. Run `npm install`.
4. Run `npm run dev` for development or `npm run build && npm start` for production.

All source files use JavaScript / JSX.
