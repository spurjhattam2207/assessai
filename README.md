# AssessAI

Assessment creation and student performance tracking for JEE educators, UPSC educators and college faculty.

Educators create and review questions (manually or from an AI draft), publish a join code, students attempt a timed paper, the server grades the attempt, and both sides see a durable log — not a dashboard of invented metrics.

## Implemented

- Educator and student roles, sign up, sign in, labelled demo accounts
- JEE / UPSC / College contexts with seeded papers
- Assessment CRUD, question editing, preview, publish, share link/code
- Student test-taking: palette, mark-for-review, autosave, timer, submit confirmation
- Server-side grading (single MCQ, exact-match multi-select, numerical tolerance, short-answer awaiting review)
- Results review, topic accuracy, mistake list, private student notes
- Educator results table, CSV export, short-answer grading
- AI generation adapter with a labelled demo fixture when no API key is set
- Marketing site: Home, Product, For educators, For students, Pricing (indicative), About, Contact, Sign in / Sign up

## Prerequisites

- Node.js 20+
- Docker **or** Homebrew PostgreSQL 16, or a hosted Postgres URL
- npm

## Local setup

```bash
cp .env.example .env
# AUTH_SECRET must be set. Local default in .env.example is fine for development.
npm install
npm run db:up
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` | yes in prod | Public site URL, e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` or `AI_API_KEY` | no | Live generation. If unset, a **demo fixture** is used and labelled as such |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |
| `AI_API_BASE_URL` | no | OpenAI-compatible base URL |
| `ALLOW_DEMO_RESET` | no | Unused by default; seed via CLI |

### Demo accounts (fictional)

| Role | Email | Password |
| --- | --- | --- |
| Educator | `educator@demo.assessai.app` | `DemoEducator!23` |
| Student | `student@demo.assessai.app` | `DemoStudent!23` |

Join codes: `JEECE1` (JEE Physics), `UPSFR1` (UPSC Polity), `COLDS1` (college DS).

Re-seed without duplicates:

```bash
npm run db:seed
```

## Tests

```bash
npm test
```

Covers grading (including negative marking and exact-match multi-select), answer-key stripping, lock rules and note privacy helpers.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), **Add New Project** and import the repo.
3. Create a Postgres database (Vercel Storage → Postgres, or [Neon](https://neon.tech) / [Supabase](https://supabase.com)).
4. Copy the connection string into the Vercel project:
   - `DATABASE_URL` — use the **pooled** URL if your host provides one (Neon: add `?sslmode=require`; Prisma on serverless often needs `pgbouncer=true` on the pooled URL).
5. Set:
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — `https://<your-project>.vercel.app` (update after the first deploy if the domain changes)
   - Optional: `OPENAI_API_KEY`
6. Override **Build Command** to:

```bash
prisma generate && prisma migrate deploy && next build
```

Install command can stay `npm install`. Output directory is the Next.js default (leave blank).

7. Deploy. After the first successful deploy, run seed once so demo pages are populated:

```bash
npx prisma db seed
```

From your laptop against production (only if you intend to load demo data into that database):

```bash
DATABASE_URL="your-production-url" npx prisma db seed
```

Or open Vercel → the project → Storage / database and run the seed in a one-off command. Do not seed production if you will use the project with real users.

8. Confirm:
   - `https://<domain>/` loads the marketing site
   - Sign in with the demo educator, then the demo student
   - `/educator` and `/student` are populated

### Prisma + pooled connections

If migrations fail on a pooled URL, add a second env var used only at build:

```
DATABASE_URL="postgresql://...pooled..."
DIRECT_URL="postgresql://...direct..."
```

and in `prisma/schema.prisma`:

```
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Then set both in Vercel.

## Demo recording checklist

1. Home → Explore the demo → educator.
2. Open **JEE Physics — Current Electricity**, copy the join code.
3. Create or generate a draft, flag an item, save, preview, publish.
4. Log out. Student demo → join `JEECE1` or a new code → answer, mark one, submit.
5. Review explanations and an incorrect item. Add a private note.
6. Open My Performance: history, topic accuracy, mistake list.
7. Educator assessment detail: results table / CSV.

## Known limits

- One attempt per student per assessment (no retake UI).
- Published papers with existing attempts cannot have their questions silently rewritten.
- File uploads store extracted text in Postgres (no S3 in this MVP).
- Pricing is indicative; there is no checkout, proctoring, live class or LMS.
- If `OPENAI_API_KEY` is missing, generation uses a labelled fixture and does not pretend a live model ran.

## Grading rules

- Single-correct MCQ: exact option.
- Multiple-select: **exact set match** (no partial credit).
- Numerical: absolute tolerance.
- Incorrect items subtract `negativeMarks` when configured; unanswered items score 0.
- Short answers stay **Awaiting educator review** until marked.
- Submit and timeout both grade once in a transaction.
