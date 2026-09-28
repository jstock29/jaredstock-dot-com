# jaredstock.com

[![Deploy to Firebase Hosting](https://github.com/jstock29/jaredstock-dot-com/actions/workflows/deploy.yml/badge.svg?event=push)](https://github.com/jstock29/jaredstock-dot-com/actions/workflows/deploy.yml)

# Architectural Standards & Deployment Practices

This document establishes the foundational architecture, engineering conventions, security standards, and deployment patterns for this project. It serves as a direct instruction set for all AI agents and developers working within this codebase and the Google Cloud Platform (GCP) / Firebase ecosystem.

---

## 1. System Architecture & Tech Stack

This project is built as a **Serverless Single Page Application (SPA)** with a client-first, BaaS (Backend-as-a-Service) architecture. This decoupled design removes the need for custom web servers or custom API layers, improving security, scalability, and performance while reducing operational costs to near-zero.

```
                  +-----------------------------------+
                  |        Client Browser             |
                  |  (React 19, Router 7, MUI v6)     |
                  +-------+--------------------+------+
                          |                    |
          Firebase Auth   |                    |   Firestore SDK
            Operations    |                    |   (Direct Data Access)
                          v                    v
                  +-------+-------+    +-------+-------+
                  | Firebase Auth |    | GCP Firestore |
                  | (Email/Pass)  |    |  (Database)   |
                  +---------------+    +---------------+
```

### Core Stack Components:
- **Frontend Framework:** React 19 + React Router 7 (for client-side routing and protected admin sub-paths).
- **Bundler & Build Tool:** Vite 6 (replaces legacy Webpack/Create React App for faster compilation and optimized module bundling).
- **Styling & Theme:** SCSS (Sass, utilizing the "modern-compiler" API) with centralized custom design tokens ("src/styles/_variables.scss"), complemented by Material-UI (MUI v6) on the Admin dashboard.
- **Backend-as-a-Service (BaaS):** Firebase SDK v12, providing high-speed direct client connections to Firestore (NoSQL database) and Firebase Authentication.
- **Asset Hosting:** Firebase Hosting (Google's global CDN, providing built-in SSL/HTTPS, asset caching, and atomic, zero-downtime rollbacks).
- **Infrastructure as Code (IaC):** Terraform, ensuring programmatic, declarative configuration of Google Cloud and Firebase resources.
- **CI/CD Pipeline:** GitHub Actions with Workload Identity Federation (WIF).

---

## 2. Codebase Conventions & Frontend Architecture

### 2.1 File & Module Organization
The project organizes code by functional concerns to enforce a modular, scalable structure:
- `src/components/`: Reusable, atomic components (e.g., `Signature`, `ResponsiveImage`, `Scroll`).
- `src/components/About/`, `src/components/Project/`, `src/components/Publication/`, `src/components/Skill/`: Scoped component directories, each containing its corresponding `.js` implementation and `.scss` styling stylesheet.
- `src/components/Admin/`: Contains the admin dashboard (`Admin.js`) and login form (`Login.js`) for data management.
- `src/styles/`: Shared, global style tokens and utility mixins (e.g., `_variables.scss`, `colors.scss`).
- `scripts/`: Operational tools, such as local seed scripts (`seed.js`).

### 2.2 Vite 6 Configuration Patterns
Vite 6 requires specific configuration details to support modern and legacy React integrations cleanly:
1. **Sass Modern Compiler:** SCSS processing is configured in `vite.config.js` to use the modern Sass compiler:
   ```javascript
   css: {
     preprocessorOptions: {
       scss: {
         api: "modern-compiler",
       },
     },
   }
   ```
2. **Implicit JSX in `.js` Files:** To allow the use of JSX syntax in files with standard `.js` extensions without forcing mass renaming to `.jsx`, Vite's esbuild loader is customized:
   ```javascript
   esbuild: {
     loader: "jsx",
     include: /src\/.*\.js$/,
     exclude: [],
   }
   ```
3. **Path Aliasing:** Use defined alias paths to prevent brittle, relative imports (e.g., `@styles` pointing directly to `src/styles`).

### 2.3 State Management & Data Fetching
- **Client-Direct Fetching:** Instead of a server API, the frontend queries Firestore directly via the Firebase SDK.
- **Query Optimization:** Data is retrieved inside React components utilizing standard React hooks (`useState`, `useEffect`). Collections (e.g., `projects`, `publications`, `skills`, `work`) are queried with deterministic ordering (using an `order` field) to ensure consistent layout rendering.
- **Reactive Updates:** For sections requiring real-time updates (like the admin panel status), use Firebase's `onSnapshot` listener. For standard portfolio items, prefer resolved promises via `getDocs` to minimize continuous database read charges.

---

## 3. Authentication & Security Architecture

Direct client-to-database architectures (BaaS) shift the burden of security from custom API code to **database-level rules** and identity controls.

```
    Client App  =======[ Unauthenticated Public Query ]========>  Allow Read (True)
    Client App  =======[ Authenticated Query (No Token) ]=======>  Block Write (403)
    Client App  =======[ Authenticated Admin Query ]============>  Allow Write (Verified)
```

### 3.1 Authentication Strategy
- **Identity Provider:** Firebase Authentication utilizing the standard **Email/Password** sign-in method.
- **Persistence:** Session persistence is configured to use `browserLocalPersistence` via `setPersistence(auth, browserLocalPersistence)`. This securely stores the JSON Web Token (JWT) in local storage, managing auto-refresh states without manual developer intervention.
- **Client Security Guard:** Protected admin routes verify the active auth user (`auth.currentUser`) on page transition. Unauthenticated requests are immediately blocked and redirected to `/login`.

### 3.2 Cloud Firestore Security Rules (Least-Privilege)
Database security rules enforce authorization at the database boundary, ensuring that even if a malicious user bypasses frontend UI controls, they cannot modify data.

Rules live in `firestore.rules` and `storage.rules` (wired up in `firebase.json`). Content collections and project media are public to read; writes require an **admin**, meaning a signed-in user whose uid has a document at `admins/{uid}`. Being merely signed in is not enough, because Email/Password sign-up is open to anyone who has the web API key.

The deploy workflow ships hosting only, so deploy rule changes by hand:
```bash
npx firebase-tools deploy --only firestore:rules,storage --project driven-binder-500400-c2
```

---

## 4. Local Development, Tooling & Verification

A robust, predictable local environment ensures development consistency and avoids "works on my machine" issues.

### 4.1 Local Setup Workflow
1. **Dependency Installation:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   - Copy `.env.example` to a local `.env` file (which is git-ignored).
   - Populate `.env` with client-side Firebase credentials.
   - All client environment variables MUST be prefixed with `VITE_` to be parsed by Vite's bundler.
3. **Execution:**
   - Start the local dev server: `npm run dev`
   - Access the site locally via `http://localhost:5173`.

### 4.2 Database Seeding & Testing Data
- **Seeding Script:** The script `scripts/seed.js` uses Node.js ES Modules to connect directly to the Firestore instance. Running `node scripts/seed.js` (with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set once rules are deployed) completely resets the active collections (`projects`, `publications`, `skills`, `work`) and seeds them with predefined high-fidelity default data. That includes any project page content written in the admin editor, so don't run it against production.
- **Environment Context:** The seed script uses `dotenv` to load the target environment variables, allowing safe database clearing/seeding across staging or production databases by swapping the `.env` targets.

### 4.3 Engineering Validation Mandates
- **Empirical Bug Fixes:** When resolving code or configuration issues, always write automated tests or scripts that reproduce the failure state *before* applying the fix.
- **Post-Change Verification:** After implementing features or applying updates, execute standard linting and build commands locally (`npm run build`) to ensure the bundle compiles successfully prior to staging.

---

## 5. Project Pages & Media

- **Routes:** `/projects` is the orbit index (`ProjectsOrbit`), `/projects/:slug` is a project page (`ProjectPage`), and `/admin/projects/:id` is the block editor (`ProjectEditor`). All three are lazy-loaded.
- **Data:** all project reads go through `src/data/projects.js`. A project doc keeps its card fields (`title`, `text`, `image`, `link`, `github`, `order`) and adds `slug`, `published`, `tagline`, `year`, `role`, `tags`, `hero` (`{ type, src, poster, alt }`) and `blocks`. Docs without a `slug` fall back to a slug of their title, and docs without `published` count as published.
- **Blocks:** `text` (markdown), `image`, `video`, `gallery`, `embed` (YouTube/Vimeo) and `quote`, rendered by `src/components/ProjectPage/blocks/Blocks.js`. Store GIFs as looping `video` blocks: an MP4 is usually far smaller than the GIF.
- **Media:** uploads from the editor go to Firebase Storage under `projects/{slug}/`. `scripts/migrate-media.js` copies older externally hosted images (e.g. S3) into Storage and rewrites the docs; run it with `--dry-run` first. It needs `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
- **Drafts:** unpublished projects are hidden from the site. A signed-in admin can view one at `/projects/:slug?preview=1`.

---

## 6. Infrastructure as Code (IaC) with Terraform

All cloud-level backend configurations (GCP APIs, database creation, hosting sites) must be managed programmatically using **Terraform** within the `infra/` folder. This guarantees environment reproducibility and prevents manual state drift.

```
                  +--------------------------------+
                  |      Terraform (IaC)           |
                  +---------------+----------------+
                                  |
            Applies State         |  (Configures GCP APIs)
                                  v
                  +---------------+----------------+
                  |  Google Cloud Platform (GCP)   |
                  |                                |
                  |   +- Enable Firestore API      |
                  |   +- Enable Identity Toolkit   |
                  |   +- Provision Firestore DB    |
                  |   +- Setup Firebase Hosting    |
                  +--------------------------------+
```

### 6.1 Configuration Standards:
- **Provider Standardization:** Leverage both `google` and `google-beta` providers pinned to the correct GCP project (e.g., "driven-binder-500400-c2") and region (e.g., "us-central1").
- **Declarative Services:** Explicitly declare all required GCP service enablement resources (like `firestore.googleapis.com` and `identitytoolkit.googleapis.com`) as `google_project_service` blocks.
- **Resource Dependency Management:** Declare explicit resource relationships to ensure execution order safety. For example, the Firestore database resource must explicitly depend on the enablement of the firestore service:
  ```hcl
  resource "google_firestore_database" "default" {
    project     = "driven-binder-500400-c2"
    name        = "(default)"
    location_id = "us-central1"
    type        = "FIRESTORE_NATIVE"
    depends_on  = [google_project_service.firestore]
  }
  ```

---

## 7. Secure CI/CD Pipeline (GitHub Actions)

This project utilizes a secure, zero-downtime automated delivery pipeline. 

### 7.1 Workload Identity Federation (WIF)
To ensure state-of-the-art security compliance, **no static, long-lived GCP Service Account JSON keys are stored as GitHub secrets.** 

Instead, the workflow uses Google's **Workload Identity Federation (WIF)**. This establishes a trust relationship between GitHub Actions and Google Cloud Platform, exchanging a short-lived, environment-bound OpenID Connect (OIDC) token for temporary GCP deployment credentials.

#### WIF Requirements in `.github/workflows/deploy.yml`:
1. **GitHub Job Permissions:** The job must declare write access to the ID token:
   ```yaml
   permissions:
     contents: read
     id-token: write  # Crucial for exchanging OIDC token with GCP WIF
   ```
2. **Authentication Action:** Utilize `google-github-actions/auth@v2` targeting the custom identity pool and service account:
   ```yaml
   - name: Authenticate to Google Cloud
     uses: google-github-actions/auth@v2
     with:
       project_id: "${{ secrets.GCLOUD_PROJECT_ID }}"
       workload_identity_provider: "projects/${{ secrets.GCLOUD_PROJECT_NUMBER }}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
       service_account: "github-deployer@${{ secrets.GCLOUD_PROJECT_ID }}.iam.gserviceaccount.com"
   ```

### 7.2 Deployment Pipeline Steps:
1. **Trigger:** Automated trigger on a `push` to the `main` branch.
2. **Checkout & Runtime Setup:** Code checkout followed by Node.js setup (utilizing Node.js v24).
3. **Reproducible Install:** Dependencies are installed with `npm ci --legacy-peer-deps` to enforce strict lockfile matching and bypass legacy peer dependency blocks.
4. **Build Compilation:** Client-side Firebase credentials (from secure GitHub Secrets) are injected as build-time `VITE_` environment variables, and the static web bundle is compiled via `npm run build`.
5. **GCP Auth:** Short-lived credentials are authenticated via WIF.
6. **CDN Deployment:** The CLI tools are invoked via `npx firebase-tools` (avoiding global package installation overhead) to deploy compiled files from the `/dist` directory to Firebase Hosting.

---

## 8. Containerization & Docker Best Practices

### 8.1 Static Hosting vs. Containerization
This React application utilizes **Firebase Hosting** directly, deliberately omitting Docker containers for the frontend. 

**Architectural Rationale:**
- **Zero Runtime Overhead:** SPAs compiled down to static html, css, and js do not require continuous CPU runtimes. Hosting them via an edge CDN like Firebase Hosting ensures sub-millisecond response times, global caching, and completely eliminates container cold starts.
- **Cost Efficiency:** CDN file delivery has near-zero operational costs, scaling to millions of hits without invoking billing thresholds that accompany dedicated web-server runtimes.
- **Security:** Static hosting has no operating system layer or server runtime to patch, significantly reducing the attack surface area.

### 8.2 Docker Patterns for GCP Compute Runtimes (Cloud Run / GKE)
For backend services, microservices, or custom API layers requiring server-side runtimes in a Google Cloud environment, containerization is mandatory. The standard container platform for serverless GCP microservices is **Google Cloud Run**.

When designing Dockerfiles and container configurations for Google Cloud, developers and agents must adhere to the following strict best practices:

#### 1. Multi-Stage Builds (Size & Security Optimization)
Isolate development-only tooling (like compilers, lints, and test dependencies) from the final production runtime to minimize container image sizes and reduce vulnerabilities.
```dockerfile
# --- Stage 1: Build & Compilation ---
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Minimal Production Runtime ---
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy package definitions and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production
# Copy only the compiled build output from Stage 1
COPY --from=builder /app/dist ./dist
```

#### 2. Least Privilege Execution (Non-Root User)
Never run application code inside a container as the default `root` user. This limits the blast radius of remote code execution exploits.
```dockerfile
# Declare and switch to the pre-existing non-privileged node user
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

#### 3. Efficient Layer Caching
Order Docker commands sequentially from least-frequently-changed to most-frequently-changed to optimize Docker layer reuse during consecutive builds.
- **Incorrect:** Copying all files (`COPY . .`) *before* running dependency installation forces a full, slow re-download of packages on every line of code change.
- **Correct:** Copy package files first, run installation, and only *then* copy the remaining source directory.

#### 4. Environment Variables & Runtime Port Binding
- **Dynamic Port Injection:** Google Cloud Run dynamically injects a `$PORT` environment variable (defaults to `8080`). The container runtime must dynamically bind to this port (e.g., listening on `0.0.0.0:${PORT}` or `0.0.0.0:8080`). Do not hardcode static ports.
- **Secret Configuration:** Never bake API keys, GCP credentials, or service passwords directly into Docker images. Use Google Cloud **Secret Manager** and mount secrets dynamically as environment variables or volume mounts during Cloud Run deployment.
