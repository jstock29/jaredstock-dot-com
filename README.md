# jaredstock.com

[![Deploy to Firebase Hosting](https://github.com/jstock29/jaredstock-dot-com/actions/workflows/deploy.yml/badge.svg?event=push)](https://github.com/jstock29/jaredstock-dot-com/actions/workflows/deploy.yml)

Jared Stock's personal site: a single-page React app whose content (projects, experience,
publications, skills) lives in Firestore and is edited through a small built-in CMS at `/admin`.

## Stack

| Layer | What |
|---|---|
| UI | React 19, React Router 7, Vite 6, SCSS (tokens in `src/styles/`), MUI v6, framer-motion, p5.js for the orbit and snow canvases |
| Content | Firestore collections `projects`, `work`, `publications`, `skills`, read client-side and sorted by their `order` field (skills alphabetically) |
| CMS | `/admin`: Firebase email/password sign-in, one table + form per collection (`src/components/Admin/`) |
| Hosting | Firebase Hosting site `jaredstock-dot-com`, every path rewritten to `index.html` |
| Infra | Terraform in `infra/` (GCP project `driven-binder-500400-c2`) |
| Deploys | GitHub Actions on push to `main`, keyless via Workload Identity Federation |

## Local development

```bash
cp .env.example .env    # fill in the Firebase web config
npm ci --legacy-peer-deps
npm run dev             # http://localhost:5173
```

Variables read by the app must start with `VITE_`. The dev server talks to the **live** Firestore
database, so edits made in a local `/admin` go straight to the real site.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test:rules` | Firestore security rules tests against the emulator (needs Java 21+) |

`scripts/seed.js` **deletes every document** in the four content collections and writes the
defaults back. It uses whatever database `.env` points at, which today is production.

## Security

- **Rules** live in [`firestore.rules`](firestore.rules): site content is public to read, and only an
  admin can write. An admin is a signed-in user whose UID has a document in the `admins`
  collection (created by hand in the Firebase console). Every other collection is closed.
- **Sign-up is disabled** in Terraform, so nobody can create an account with the site's public
  API key.
- `npm run test:rules` proves both: visitors and signed-in non-admins cannot write, the admin can,
  and nobody can add themselves to `admins`.

## Infrastructure

`infra/main.tf` enables the APIs and manages the Firestore database, the hosting site, the auth
settings (email/password, sign-up off) and the security rules. Rules changes reach production
only through `terraform apply`; the deploy workflow ships the site and nothing else.

```bash
gcloud auth application-default login
export USER_PROJECT_OVERRIDE=true GOOGLE_BILLING_PROJECT=driven-binder-500400-c2
cd infra
terraform init
terraform plan
terraform apply
```

State is local (not committed). On a fresh machine, import the existing resources before the
first apply, or Terraform will try to create them again:

```bash
terraform import google_firestore_database.default "projects/driven-binder-500400-c2/databases/(default)"
terraform import google_firebase_hosting_site.default projects/driven-binder-500400-c2/sites/jaredstock-dot-com
terraform import google_firebaserules_release.firestore projects/driven-binder-500400-c2/releases/cloud.firestore
```

The auth settings are adopted automatically by an `import` block in `main.tf`.

## CI/CD

- **Pull requests** (`.github/workflows/ci.yml`): install, build, and the rules tests.
- **Push to `main`** (`.github/workflows/deploy.yml`): build with the Firebase config from GitHub
  secrets, authenticate to GCP through Workload Identity Federation (no stored keys), and deploy
  `dist/` with `npx firebase-tools deploy --only hosting`.
