# Baby Bath Ease

Independent Next.js website for https://babybathease.com.

- Repository: https://github.com/leoguo008-collab/babybathease
- Node.js 24, npm, Next.js 16, React 19, SQLite.
- Build: `npm ci` then `npm run build`. Start: `npm start`.
- Public catalogue: 58 published products and four categories captured on 2026-10-26. Images, videos, audio, posters, and PDF catalogue are served from this repository's own `public` directory.
- All 14 languages and the original layouts and product interactions are retained.

## Configuration

Copy `.env.example` to `.env.local` for local work and choose local storage directories. Configure the production values separately in Hostinger. Never commit passwords or API tokens.

`ADMIN_INITIAL_PASSWORD` creates `admineric` on the first initialization of a new database. The administration page is `/admin-eric`. Passwords are hashed; sessions, inquiries, analytics, and uploads belong only to this website.

Production persistent directories:

- Data: `/home/u501518061/domains/babybathease.com/private/data`
- Uploads: `/home/u501518061/domains/babybathease.com/private/uploads`

On a fresh database, `src/lib/catalogue-seed.ts` imports the one-time public content snapshot in `config/catalogue-seed.json`. Existing databases are never overwritten. New inquiries and analytics begin empty. The application does not fetch content or data from another website at runtime.

Hostinger deploys only this repository's `main` branch to the `babybathease.com` website. Keep these settings scoped to that website. DNS must point the apex domain and `www` to its Hostinger hosting service. The displayed contact address is `official@babybathease.com`; mailbox provisioning is separate from website deployment.
