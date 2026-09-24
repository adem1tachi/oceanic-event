# Forma Tak — Trade Event Voting & Prize Draw Platform

A production-grade, mobile-first web application built for the **Forma Tak** trade event stand. Visitors (1) vote for one of three intensive course topics, then (2) enter a prize draw by registering their contact details. At the end of the day, winners are randomly drawn from registered visitors to win a free one-day course on the topic that received the most votes.

---

## 1. Architectural Assumptions & Design Choices

Before implementation, the following architectural choices were made in strict alignment with the specification:
1. **No Deduplication on Anonymous Votes**: As specified, voting in this MVP is anonymous and does not deduplicate across sessions. Re-voting is explicitly permitted. Schema includes a nullable `device_id` column to easily accommodate device fingerprinting in future iterations.
2. **Returning Visitor UX**: To optimize the stand flow, the visitor's latest vote is preserved in client `localStorage` under key `forma_tech_voted_topic`. When returning, visitors immediately see live results and the prominent registration CTA without being blocked from voting again.
3. **Live Results Polling vs. Realtime**: We chose **5-second SWR-style client polling** with exponential backoff on inactive tabs over WebSockets. At crowded trade event venues, mobile networks experience packet drops and firewalls often terminate persistent WebSocket connections. Polling provides rock-solid fault tolerance, automatic network recovery, zero WebSocket connection overhead on Supabase, and automatic re-sync.
4. **Algerian Phone Number Standardization**: Algerian mobile phone numbers belong to operators Mobilis (`06`), Ooredoo (`05`), and Djezzy (`07`). We accept all common visitor input variations (`05XX XX XX XX`, `+213 5...`, `00213 6...`, `213 7...`, with spaces or hyphens) and normalize them into canonical E.164 format `+213[5-7]XXXXXXXX` before database persistence.
5. **Excel Arabic Compatibility**: The participants CSV export route injects the UTF-8 Byte Order Mark (`\uFEFF`) at the start of the file stream so that Microsoft Excel (on both Windows and macOS) natively parses and renders Arabic names and text without character encoding corruption.
6. **Design System & Zero Decorative Branding**: All theme colors, surface backgrounds, borders, and corner radii are abstracted into semantic tokens in `src/app/globals.css` and mapped in `tailwind.config.ts`. Logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`, `text-start`) are used exclusively for native RTL/LTR parity.

---

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript in strict mode
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth email+password, Row Level Security, RPCs)
- **Internationalization (i18n)**: `next-intl` (English default + native Arabic with RTL layout)
- **Styling**: Tailwind CSS with design tokens defined via CSS variables
- **Validation**: Zod (mirrored client-side and server-side)
- **Testing**: Vitest (unit tests for phone normalization and form validation)
- **Deployment Target**: Vercel

---

## 3. Repository Structure

```
FormaTech/
├── .env.example                       # Documented environment variable template
├── .eslintrc.json                     # ESLint configuration
├── .gitignore                         # Git ignore patterns
├── .prettierrc                        # Prettier code formatting rules
├── messages/                          # Localized string dictionaries
│   ├── en.json                        # English (default)
│   └── ar.json                        # Native Arabic with real translations
├── next.config.mjs                    # Next.js config with next-intl plugin
├── package.json                       # Scripts and dependencies
├── postcss.config.js                  # PostCSS plugins for Tailwind
├── tailwind.config.ts                 # Design token configuration
├── tsconfig.json                      # Strict TypeScript compiler options
├── vitest.config.mjs                  # Vitest unit test runner config
├── supabase/
│   ├── migrations/
│   │   └── 20260924000000_init_schema.sql  # Database tables, RLS, view & RPCs
│   └── seed.sql                       # Topic seeds & Admin creation guide
└── src/
    ├── middleware.ts                  # next-intl routing + Supabase admin session guard
    ├── types/
    │   └── declarations.d.ts          # Ambient CSS declarations
    ├── i18n/
    │   ├── routing.ts                 # Locale definitions ('en', 'ar')
    │   ├── request.ts                 # Request-scoped message bundle loader
    │   └── navigation.ts              # Localized navigation helpers (Link, useRouter)
    ├── lib/
    │   ├── phone.ts                   # Algerian phone normalization & validation
    │   ├── phone.test.ts              # Phone normalization unit tests
    │   ├── validators.ts              # Zod validation schemas
    │   ├── validators.test.ts         # Validation schemas unit tests
    │   └── supabase/
    │       ├── client.ts              # Browser Supabase client (anon key)
    │       ├── server.ts              # Server Supabase client with cookies
    │       ├── admin.ts               # Server-only privileged client (service-role key)
    │       ├── middleware.ts          # Middleware auth session updater
    │       └── database.types.ts      # Generated database schema types
    ├── components/
    │   ├── Header.tsx                 # Header with title, language switcher, admin link
    │   ├── LanguageSwitcher.tsx       # EN / العربية toggle preserving path
    │   ├── OfflineBanner.tsx          # Real-time offline network detector
    │   ├── HowItWorks.tsx             # 3-step event stand flow explainer
    │   ├── TopicCard.tsx              # Large touch cards with optimistic voting & live bars
    │   ├── VotingSection.tsx          # Voting logic, 5s polling, returning visitor support
    │   ├── RegisterCta.tsx            # Slide-in CTA linking winning topic to register form
    │   ├── RegisterForm.tsx           # Single-column mobile form with honeypot & zod validation
    │   ├── admin/
    │   │   ├── AdminHeader.tsx        # Portal header with logout & projector trigger
    │   │   ├── ResultsOverview.tsx    # Live votes total and winning course highlight
    │   │   ├── ParticipantsTable.tsx  # Searchable & paginated participants table
    │   │   ├── RaffleManager.tsx      # Draw, Draw Again, and Reset confirmation modal
    │   │   └── ProjectorMode.tsx      # Full-screen projector view with reveal animations
    │   └── ui/
    │       ├── Button.tsx             # Accessible button with loading states
    │       ├── Input.tsx              # Large mobile input with inline errors
    │       ├── Card.tsx               # Design token card surface
    │       ├── Badge.tsx              # Semantic badge tokens
    │       └── Modal.tsx              # Accessible dialog with focus trap
    └── app/
        ├── layout.tsx                 # Minimal root passthrough layout
        ├── globals.css                # Semantic CSS tokens & accessibility styles
        ├── page.tsx                   # Root redirect to /[locale]
        ├── api/
        │   ├── vote/route.ts          # Anonymous vote recording
        │   ├── results/route.ts       # Public vote counts fetcher
        │   ├── register/route.ts      # Validated participant registration
        │   └── admin/
        │       ├── export/route.ts    # UTF-8 BOM CSV export for Excel
        │       ├── draw/route.ts      # Server-side draw_winners execution
        │       └── reset/route.ts     # Server-side reset_draw execution
        └── [locale]/
            ├── layout.tsx             # Localized layout setting <html lang dir>
            ├── page.tsx               # Public landing page with voting & live results
            ├── register/page.tsx      # Registration form page
            ├── success/page.tsx       # Entry confirmation & end-of-day draw details
            └── admin/
                ├── page.tsx           # Protected admin dashboard
                ├── login/page.tsx     # Admin authentication portal
                └── projector/page.tsx # Full-screen stage projector view
```

---

## 4. Local Setup & Installation

### Prerequisites
- Node.js `v18.18+` or `v20+`
- npm `v9+` or `v10+`

### Step 1: Clone the repository and install dependencies
```bash
git clone <your-repo-url> formatech
cd formatech
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys (see Section 5 below):
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application automatically redirects to `/en` or `/ar`.

---

## 5. Setting Up Supabase

### 1. Create a Supabase Project
1. Log into your [Supabase Dashboard](https://database.new) and create a new project (e.g. `formatech-event`).
2. Choose a region close to your target audience (e.g., Frankfurt/Paris for Algeria/North Africa).

### 2. Run Database Migrations
1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Click **New query**, paste the entire content of [supabase/migrations/20260924000000_init_schema.sql](file:///home/adem/Documents/My%20Projects/FormaTech/supabase/migrations/20260924000000_init_schema.sql), and click **Run**.
3. This creates:
   - Tables: `topics`, `votes`, `participants`, `winners`, `admins`
   - Public view: `vote_counts`
   - Atomic Stored Procedures: `draw_winners(n int)` and `reset_draw()`
   - Strict Row Level Security (RLS) policies and permissions

### 3. Seed Initial Topics
In the **SQL Editor**, run the topic seed queries from [supabase/seed.sql](file:///home/adem/Documents/My%20Projects/FormaTech/supabase/seed.sql):
```sql
INSERT INTO public.topics (slug, position, is_active)
VALUES
    ('topic-a', 1, true),
    ('topic-b', 2, true),
    ('topic-c', 3, true)
ON CONFLICT (slug) DO UPDATE
SET position = EXCLUDED.position,
    is_active = EXCLUDED.is_active;
```

---

## 6. Creating the First Admin User

Admin access is guarded by Supabase Auth and restricted to user IDs explicitly registered in the `public.admins` allowlist table.

### Option A: Via Supabase Dashboard (Recommended)
1. Go to **Authentication** -> **Users** -> Click **Add user** -> **Create user**.
2. Enter an email (e.g., `admin@formatech.dz`) and a secure password.
3. Once created, click on the user to copy their **User UID** (e.g., `d3b07384-d113-4a6c-9c3f-5d4c82b9b210`).
4. Go to **SQL Editor** and run:
   ```sql
   INSERT INTO public.admins (user_id)
   VALUES ('d3b07384-d113-4a6c-9c3f-5d4c82b9b210')
   ON CONFLICT (user_id) DO NOTHING;
   ```

### Option B: Via SQL Script
Run the automated block in `supabase/seed.sql`:
```sql
DO $$
DECLARE
  new_admin_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  VALUES (
    '00000000-0000-00-0000-000000000000',
    new_admin_id,
    'authenticated',
    'authenticated',
    'admin@formatech.dz',
    crypt('FormaTak2026AdminPass!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"FormaTech Lead Admin"}',
    now(),
    now()
  );

  INSERT INTO public.admins (user_id)
  VALUES (new_admin_id);
END $$;
```

Now you can log into `http://localhost:3000/en/admin/login` using `admin@formatech.dz` and the configured password.

---

## 7. Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. Under **Environment Variables**, add the four required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://<project-ref>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public `anon` API key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase private `service_role` API key (*Never exposed to client bundles*)
   - `NEXT_PUBLIC_SITE_URL`: Your production URL (`https://formatech.vercel.app`)
4. Click **Deploy**. Vercel will build the Next.js application and deploy it globally to its edge network.

---

## 8. Development & Quality Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server on port 3000 |
| `npm run build` | Builds production bundle and validates types |
| `npm start` | Starts production server |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run typecheck` | Runs strict TypeScript compiler check (`tsc --noEmit`) |
| `npm test` | Runs Vitest unit tests for phone normalization & validators |

---

## 9. Comprehensive Manual Test Checklist

Follow these steps to verify every user flow, edge case, and administrative feature:

### 1. Vote Flow (Instant Optimistic UI)
- [ ] Visit `/en` on a mobile or simulated mobile viewport (e.g. 390px width).
- [ ] Observe the three large topic cards showing titles, taglines, and descriptions.
- [ ] Tap any topic card (e.g. Topic 1).
- [ ] **Verification**: The card is immediately highlighted with a "Your Choice" badge, live results progress bars appear with percentage breakdown, and the vote count increments without any page reload or confirmation modal.

### 2. Returning Visitor UX
- [ ] After voting on Topic 1, refresh the browser window or close and re-open the tab.
- [ ] **Verification**: The landing page immediately restores the live results and displays the "Your Choice" badge on Topic 1 and reveals the slide-in registration CTA.
- [ ] Tap Topic 2 to cast an additional vote.
- [ ] **Verification**: Re-voting is **not blocked**; the vote count increments and the selection updates.

### 3. Registration Flow
- [ ] From the live results, tap **"Register for the Prize Draw"** on the slide-in CTA.
- [ ] Verify URL navigates to `/en/register`.
- [ ] Fill in:
  - Full Name: `Karim Belkacem`
  - Phone: `0550123456`
  - Email: `karim@example.com`
  - Check the consent checkbox.
- [ ] Tap **"Submit Registration"**.
- [ ] **Verification**: The button displays a loading spinner and disabled state, then redirects smoothly to `/en/success` showing registration confirmation and end-of-day draw details.

### 4. Duplicate Phone Handling
- [ ] Navigate back to `/en/register`.
- [ ] Fill in the form again with the **same phone number** (`0550123456` or `+213 550 12 34 56`).
- [ ] Tap **"Submit Registration"**.
- [ ] **Verification**: The form does NOT crash or show raw SQL error codes (e.g. 23505). A friendly banner appears: *"This mobile number is already registered for today's draw. Good luck!"*

### 5. Invalid Phone Validation
- [ ] Enter an invalid phone number such as:
  - `021998877` (Algiers landline) -> inline error: *"Please enter a valid Algerian mobile number"*
  - `0550123` (too short) -> inline error
  - `0123456789` (invalid prefix) -> inline error
  - `+33612345678` (French mobile) -> inline error
- [ ] Try submitting -> Form submission is blocked inline.

### 6. RTL Layout & Arabic Language Switching
- [ ] In the header, tap **"العربية"**.
- [ ] **Verification**:
  - The URL changes to `/ar`.
  - The `<html>` element has `lang="ar"` and `dir="rtl"`.
  - The entire layout mirrors smoothly (margins, paddings, badge positions, arrows flip direction).
  - All text is rendered in natural Arabic (titles, buttons, step explainers, field labels).

### 7. Admin Login & Logout Guard
- [ ] Open an incognito browser window and attempt to visit `/en/admin`.
- [ ] **Verification**: Next.js middleware immediately redirects you to `/en/admin/login?redirect=%2Fen%2Fadmin`.
- [ ] Enter non-admin credentials -> Access is rejected.
- [ ] Enter your admin credentials (`admin@formatech.dz`) -> Successfully redirected to `/en/admin`.
- [ ] In the admin header, tap **"Sign Out"** -> Session is invalidated and you are returned to `/en/admin/login`.

### 8. CSV Export Opens Correctly in Microsoft Excel
- [ ] Log in as admin at `/en/admin`.
- [ ] In the **Participants** section, tap **"Export Participants (CSV)"**.
- [ ] Download the generated CSV file.
- [ ] Open the CSV in Microsoft Excel.
- [ ] **Verification**: Because the export route prepends the UTF-8 BOM (`\uFEFF`), Arabic letters (e.g., `كريم بلقاسم`) display clearly without corrupted characters or question marks.

### 9. Raffle Draw with Fewer Participants than Winners
- [ ] In the Admin Raffle section, if you have 2 registered participants, enter `5` in the **Number of Winners to Draw** input.
- [ ] Tap **"Draw Winners"**.
- [ ] **Verification**: The system does not crash or throw an out-of-bounds error. It draws both remaining eligible participants (2) and displays a notification: *"Notice: Only 2 eligible participants remained. All remaining participants were drawn."*

### 10. Draw Again (Additional Rounds)
- [ ] Register 2 new participants via `/en/register`.
- [ ] Return to `/en/admin`.
- [ ] The Raffle Manager displays **"Draw Additional Winners"** (Round 2).
- [ ] Tap **"Draw Additional Winners"**.
- [ ] **Verification**: New winners are added under a dedicated **"Round 2"** section, keeping existing Round 1 winners intact.

### 11. Reset Draw (Confirmation Modal)
- [ ] In the Raffle Manager, tap **"Reset Draw"**.
- [ ] **Verification**: An accessible confirmation modal appears warning that all drawn winners will be cleared.
- [ ] Tap **"Cancel"** -> Modal closes without changing data.
- [ ] Tap **"Reset Draw"** again, then tap **"Yes, Clear All Winners"**.
- [ ] **Verification**: Winners table is cleared atomically in the database and the raffle resets to Round 1.

### 12. Full-Screen Projector Display
- [ ] From `/en/admin`, tap **"Launch Projector Screen"** (or visit `/en/admin/projector`).
- [ ] **Verification**: A dark, high-contrast display loads showcasing the grand prize badge, winning topic title, and winner cards.
- [ ] Tap individual cards or tap **"Reveal All"** -> Winner cards flip/reveal with smooth animations and phone numbers are safely masked (e.g., `0550 •• •• 56`).
