This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database migrations (Prisma)

Migrations live in `prisma/migrations/`. Prisma reads the database URL from **`DB_POSTGRES_PRISMA_URL`** (see `prisma/schema.prisma` and `prisma.config.ts`). Load the correct `.env` file before running any Prisma command so that variable is set.

### Local development

Create or update the schema and generate a migration (interactive; uses your dev database):

```bash
dotenv -e .env -- npx prisma migrate dev
```

There is also an npm script that loads `.env.development.local`:

```bash
npm run prismaVer
```

After pulling changes that include new migrations, apply them without prompting:

```bash
dotenv -e .env -- npx prisma migrate deploy
```

Check whether anything is pending:

```bash
dotenv -e .env -- npx prisma migrate status
```

Regenerate the Prisma client after schema changes (also runs automatically on `npm run build`):

```bash
npx prisma generate
```

### Production (or any remote database)

Use **`migrate deploy`**, not `migrate dev`. Point `DB_POSTGRES_PRISMA_URL` at the **production** database (never use a development `.env` file by mistake).

Example with a gitignored file you populate from your host or secrets:

```bash
dotenv -e .env.production.local -- npx prisma migrate deploy
```

On **Vercel**, production credentials are usually under Project **Settings → Environment Variables**. To copy them locally for a one-off deploy, you can use the Vercel CLI (from a linked project directory):

```bash
vercel link
vercel env pull .env.production.local --environment=production
dotenv -e .env.production.local -- npx prisma migrate deploy
```

Treat any file containing production URLs as a secret; keep it out of version control.

### After deploying schema changes

1. Merge migrations to the branch Vercel builds from.
2. Run `prisma migrate deploy` against production (CI job or manual step as above).
3. Ensure `npx prisma generate` runs in the build (this repo’s `npm run build` already runs `prisma generate` first).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
