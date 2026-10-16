# jaredstock.com

[![Deploy to Firebase Hosting](https://github.com/jstock29/jaredstock-dot-com/actions/workflows/deploy.yml/badge.svg?event=push)](https://github.com/jstock29/jaredstock-dot-com/actions/workflows/deploy.yml)

Jared Stock's personal site: a React app whose content lives in Firestore and Firebase Storage
and is edited through a built-in CMS at `/admin`. Everything a visitor reads, from the name in the
hero to the footer, can be changed there without a deploy.

## Stack

| Layer | What |
|---|---|
| UI | React 19, React Router 7, Vite 6, SCSS (tokens in `src/styles/`), MUI v6, framer-motion, p5.js for the orbit and snow canvases |
| Content | Firestore collections `projects`, `publications`, `pages`, `work`, `skills` and the `settings/site` doc, read client-side and sorted by their `order` field (skills alphabetically) |
| Media | Firebase Storage: images, GIFs and videos uploaded from the CMS, plus the resume PDF |
| CMS | `/admin`: Firebase email/password sign-in (`src/components/Admin/`) |
| Hosting | Firebase Hosting site `jaredstock-dot-com`, every path rewritten to `index.html` |
| Infra | Terraform in `infra/` (GCP project `driven-binder-500400-c2`) |
| Deploys | GitHub Actions on push to `main`, keyless via Workload Identity Federation |

## Site structure and the CMS

| Path | What | Edited in `/admin` under |
|---|---|---|
| `/` | Hero, about, experience + skills, projects, publications, footer | **Site** (copy, links, photo, resume, section titles and visibility), **Experience**, **Skills** |
| `/projects` | Every project in orbit | **Projects** |
| `/projects/:slug` | A project's own page | **Projects** |
| `/publications/:slug` | A publication's own page, once it has blocks; until then its card links to the article | **Publications** |
| `/:slug` | A custom page (e.g. `/uses`, `/now`), optionally linked from the home page menu | **Pages** |

Projects, publications and pages share one editor: basics (title, slug, summary, links, tags),
a hero image or video, and a body built from blocks (markdown text, image or GIF, video, gallery,
YouTube/Vimeo embed, pull quote). Each can be saved as a draft and previewed at its address with
`?preview=1` while signed in. Order is set with the arrows in each list.

Drafts are hidden by the site, not by the security rules: anyone who reads Firestore directly can
see them. Don't put anything in a draft that must stay private.

Uploads go to Storage under `projects/`, `publications/`, `pages/` and `site/`. Images and videos
can be up to 50 MB; for a long GIF, an MP4 in a video block (autoplay, muted, looping) is far
smaller and looks the same.

## Local development

```bash
cp .env.example .env    # fill in the Firebase web config
npm ci --legacy-peer-deps
npm run dev             # http://localhost:5173
```

Variables read by the app must start with `VITE_`. The dev server talks to the **live** Firestore
database, so edits made in a local `/admin` go straight to the real site. To try changes safely,
run `npm run emulators` and start the dev server with `VITE_FIREBASE_EMULATORS=true npm run dev`;
in the emulator UI, add a user under Authentication and an `admins/<that uid>` doc in Firestore,
then sign in to `/admin` with it.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run emulators` | Local Auth, Firestore and Storage emulators (UI at http://localhost:4000) |
| `npm run test:rules` | Firestore and Storage security rules tests against the emulators (needs Java 21+) |

`scripts/seed.js --wipe` **deletes every document** in `projects`, `publications`, `skills` and
`work` and writes the defaults back. It uses whatever database `.env` points at, which today is
production, and refuses to run without `--wipe`.

`scripts/migrate-media.js [--dry-run]` copies images and videos still hosted elsewhere (the old S3
bucket) into Storage and points the docs at the new copies.

## Security

- **Rules** live in [`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules): site
  content and media are public to read, and only an admin can write or upload. An admin is a
  signed-in user whose UID has a document in the `admins` collection (created by hand in the
  Firebase console). Every other collection and folder is closed, and uploads are limited to
  images and videos (plus PDFs in `site/`).
- **Sign-up is disabled** in Terraform, so nobody can create an account with the site's public
  API key.
- `npm run test:rules` proves it: visitors and signed-in non-admins cannot write or upload, the
  admin can, and nobody can add themselves to `admins`.

## Infrastructure

`infra/main.tf` enables the APIs and manages the Firestore database, the hosting site, the auth
settings (email/password, sign-up off), and the Firestore and Storage security rules. Rules changes reach production
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

### Storage

The default Storage bucket can't be created by Terraform, so it's made once in the console:
Firebase console → **Storage** → **Get started** (new buckets need the Blaze plan). That also
publishes default rules, so import that release before the first apply:

```bash
terraform import google_firebaserules_release.storage \
  "projects/driven-binder-500400-c2/releases/firebase.storage/driven-binder-500400-c2.firebasestorage.app"
```

If the bucket has a different name (older projects use `<project>.appspot.com`), pass it with
`-var storage_bucket=<name>` and use the same name in `VITE_FIREBASE_STORAGE_BUCKET`. Terraform also
lets Storage's rules read Firestore (the `admins` check) by granting its service agent
`roles/firebaserules.firestoreServiceAgent`.

## CI/CD

- **Pull requests** (`.github/workflows/ci.yml`): install, build, and the rules tests.
- **Push to `main`** (`.github/workflows/deploy.yml`): build with the Firebase config from GitHub
  secrets, authenticate to GCP through Workload Identity Federation (no stored keys), and deploy
  `dist/` with `npx firebase-tools deploy --only hosting`.
