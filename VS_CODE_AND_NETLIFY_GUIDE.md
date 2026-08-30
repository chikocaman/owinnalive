# FootyScores Pro: VS Code Installation and Netlify Hosting

## Important hosting note

FootyScores Pro is not currently a static-only Vite site. The frontend is React/Vite, but live score requests also use the project’s Express server for `/api/espn/*`, Malawi source handling, and push-related endpoints. Netlify can host the frontend, but it will not run the existing Express server simply by uploading the Vite output. A Netlify deployment therefore requires either converting the server routes into Netlify Functions or hosting the backend separately. Netlify’s official Vite guidance uses a Vite build and a `dist`-style output directory [1], while its Express guidance deploys Express through serverless functions [2].

For the least risky deployment, use the project’s managed hosting checkpoint. If Netlify is required, follow the static-frontend route below first and then migrate the backend routes before expecting live proxying and push features to work.

## 1. Install the project in VS Code on Windows

Install **Node.js 22 LTS or newer**, Git, and [Visual Studio Code](https://code.visualstudio.com/). Open VS Code, choose **Terminal → New Terminal**, and confirm that Node and the package manager are available:

```powershell
node --version
npm --version
pnpm --version
```

If `pnpm` is not installed, enable it through Corepack:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

Download the project source from the FootyScores Pro project checkpoint or export the project as a ZIP from the project management interface. Extract it to a normal working folder, for example `C:\Users\YourName\Projects\footyscores-react`, then open that folder in VS Code with **File → Open Folder**.

In the VS Code terminal, install dependencies:

```powershell
cd C:\Users\YourName\Projects\footyscores-react
pnpm install
```

Do not run `npm install` in the same folder after `pnpm install`; mixing package managers can create conflicting lockfiles and dependency resolutions.

## 2. Configure local environment variables

Create a local `.env` file only if your exported project does not already provide the required environment values. Never commit `.env` or private VAPID keys to GitHub. The server-side values normally include the database/auth variables and push credentials used by this project:

```env
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_long_random_session_secret
VAPID_PUBLIC_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key
VAPID_SUBJECT=mailto:you@example.com
```

For a local frontend-only test, the ESPN browser proxy still needs the project’s server process. Do not replace the `/api/espn/*` calls with direct browser calls unless you intentionally accept CORS, rate-limit, and caching problems.

## 3. Run and test locally

Start the development server from the VS Code terminal:

```powershell
pnpm dev
```

Open the local URL printed by Vite, normally `http://localhost:3000`. Keep that terminal running. The live score desk may take several seconds to receive the first source response because the app loads competition windows and optional event enrichment.

Run the project checks in a second terminal:

```powershell
pnpm check
pnpm test
pnpm build
```

The expected test command is `pnpm test`; the project’s Vitest suite should pass before deployment. Stop the development server with `Ctrl+C`.

## 4. Deploy the frontend to Netlify

Push the project to a GitHub repository, then in Netlify choose **Add new project → Import an existing project → GitHub**. Use these settings for the current Vite output:

| Netlify setting | Value |
|---|---|
| Base directory | Leave empty unless the repository is nested inside another folder |
| Build command | `pnpm build` |
| Publish directory | `dist/public` |
| Node version | `22` or the version used locally |
| Package manager | `pnpm` |

Netlify’s Vite documentation describes the standard Vite build workflow and publish-directory configuration [1]. If Netlify does not automatically select pnpm, commit the existing `pnpm-lock.yaml` and set the package manager in the site build settings.

Add a `netlify.toml` file at the repository root if you want the settings stored with the project:

```toml
[build]
  command = "pnpm build"
  publish = "dist/public"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The SPA redirect is needed so direct navigation to Wouter routes such as match detail, team pages, or competition pages does not return a Netlify 404.

## 5. What will and will not work on a static Netlify deploy

The visual React interface and client-side formatting can be deployed as static files. However, the current Express server is separate from the Vite output. A static Netlify deploy will not automatically provide these backend capabilities:

| Feature | Static Netlify frontend | Required for production |
|---|---:|---|
| React Matchday interface | Works | Vite build and SPA redirect |
| Direct `/api/espn/*` proxy | Does not work by itself | Netlify Function or separate backend |
| Malawi server adapter | Does not work by itself | Netlify Function or separate backend |
| Push subscription persistence | Does not work by itself | Server/database deployment |
| Background push delivery | Does not work by itself | Scheduled serverless callback or managed scheduler |
| Database-backed preferences | Does not work by itself | Database API and authenticated backend |

For a Netlify-compatible architecture, move each Express route into a Netlify Function under `netlify/functions`, or deploy the Express API separately and configure the frontend to use its public API URL. Netlify’s Express documentation explains the serverless-function approach [2]. The ESPN proxy must remain server-side; exposing upstream requests directly from the browser is not the recommended production path.

## 6. Environment variables in Netlify

Open **Site configuration → Environment variables** and add only the values required by the deployed backend. Use separate values for production where appropriate. Do not commit private values to the repository.

For a static-only frontend, do not place private server secrets in `VITE_*` variables because Vite embeds frontend variables into the browser bundle. Public configuration may use a `VITE_API_BASE_URL`, for example:

```env
VITE_API_BASE_URL=https://your-api.example.com
```

The API server should hold `DATABASE_URL`, `JWT_SECRET`, `VAPID_PRIVATE_KEY`, and other private values. If the frontend remains hardcoded to relative `/api/espn/*` paths, the Netlify site must provide matching Netlify Functions or a reverse proxy; otherwise those requests will fail.

## Recommended deployment choice

For the current FootyScores Pro codebase, the safest route is to keep the full React-plus-Express application on a hosting environment that runs the existing Node server, and use Netlify only after the Express routes have been converted to Functions or separated into an API deployment. A static Netlify deployment is useful for checking the interface, but it is not sufficient for reliable live scores, server-side source proxying, push subscriptions, or background notifications.

## References

[1]: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/ "Netlify: Vite on Netlify"

[2]: https://docs.netlify.com/build/frameworks/framework-setup-guides/express/ "Netlify: Express on Netlify"

[3]: https://code.visualstudio.com/docs/nodejs/nodejs-tutorial "Visual Studio Code: Node.js tutorial"

## 7. Deploy the full app on Render

The repository includes `render.yaml`, a Render Blueprint for the current Node/Express application. It uses the existing production scripts, pins Node 22 and pnpm 10.4.1, sets `NODE_ENV=production`, and declares private values as manual environment variables.

To use the Blueprint, push the repository to GitHub, open Render, choose **New → Blueprint**, select the repository, review the service, and enter values for each variable marked `sync: false`. Render will then run the build and start commands from `render.yaml`. The final deployment must still be approved in the user's Render account.

The Blueprint declares `DATABASE_URL`, `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`. Supply only real values from the relevant service; never invent credentials or commit them to GitHub. Keep the VAPID private key, JWT secret, and database URL server-only.
