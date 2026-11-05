# Shri Shyam Bricks & Building Materials

A deliberately simplified single-business supply register and own-fleet P&L application.

## Active application modules
1. Dashboard & P&L
2. Customer Orders & Supply Book
3. Vehicle Expenses
4. Own Fleet Vehicles
5. Drivers
6. Customers & Materials

Legacy trip dispatch, LR/Bilty, vendor hiring, invoices, loans, office expenses, and reporting routes are not mounted in the active API and are redirected out of the active UI.

## Stack
- Frontend: Next.js App Router, React, Tailwind CSS, Axios, Lucide, Sonner, SheetJS
- Backend: Express, MongoDB, Mongoose, JWT

## Run locally
### Backend
Copy `.env.example` to `.env` and set:
- `MONGODB_URI`
- `JWT_SECRET` (minimum 32 characters)
- `PORT` (default 5000)
- `CORS_ORIGIN` (comma-separated frontend origins; configure in production)

Install dependencies and run `npm install && npm run dev`.

### Frontend
Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_URL` to the backend API base ending in `/api`, then run `npm install && npm run dev`.

## Business rules
- Only company-owned vehicles are accepted by the vehicle master, supply-order, and vehicle-expense flows.
- Supply-order amounts are recalculated by the backend; the browser preview is only a convenience.
- GST rates are limited to 0%, 5%, 12%, and 18%.
- Vehicle P&L uses taxable supply revenue (GST excluded) minus recorded vehicle expenses.
- Monthly driver salary, material purchase cost, office overhead, depreciation, and customer collections are not included in net profit unless separately captured as vehicle expenses. This is an operating P&L estimate, not a statutory accounting statement.
- The seven required material records are seeded per company on first GET `/api/materials`.

## Legacy data migration
The previous app stored supplies, fuel, maintenance, tyres, and vehicle expenses in different schemas. Back up MongoDB first. Then run from the backend directory:
- Dry run: `node src/scripts/migrateSimpleData.js`
- Apply: `node src/scripts/migrateSimpleData.js --apply`

The migration only converts legacy supply orders that already have a customer, an own-fleet vehicle, and a valid customer reference. Orders without those references are reported as skipped for manual review. Fuel, maintenance, tyre purchase, and vehicle-linked expense records are copied to the new vehicle-expense collection. The script is designed to avoid re-copying migrated expense rows.

## Email automation
The old daily compliance email scheduler is no longer started by the backend. This simplified product does not require scheduled email alerts or bulk email. The old mail utility source file is retained but is not called by the active app routes or server startup.
