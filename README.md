# Bene's Beef & Cutlets — Website

Node/Express + SQLite site for Bene's Beef & Cutlets (990 Lisbon St, Lewiston, ME). Built by Real Easy Sites.

## What's in it
- One-page site: live open/closed status, The Bene's Rules (how ordering works), full current menu, story, The Nephilim challenge, reviews/press, social (Facebook feed embed + IG + DoorDash), gallery, big orders/catering, hours + map.
- Sticky mobile bar: Call / Menu / DoorDash / Directions.
- **Owner dashboard** at `/admin` (password only):
  - **SOLD OUT switch** — one tap flips the site's status to "Sold out today." Resets itself the next day.
  - **Announcement banner** — e.g. "Closed Saturday for a private event."
  - **Big Orders & Inquiries** and **Nephilim Challengers** tabs with status tracking (new / contacted / booked / done), tap-to-call / tap-to-text, and Delete on every entry.

## Folder layout
```
server.js          thin entry point
db/database.js     SQLite schema (inquiries, challengers, settings)
lib/auth.js        password-only admin session
lib/mailer.js      optional email alerts
routes/public.js   /api/status, /api/inquiry, /api/challenge
routes/admin.js    /admin login, dashboard, CRUD, settings
views/             admin + login pages (served only through /admin)
public/            the website
```

## Deploy on Render (Web Service)
- Build: `npm install` · Start: `npm start` · Node is pinned to 20.x (`.node-version` + engines).
- Add a persistent disk mounted at e.g. `/var/data` and set `DATA_DIR=/var/data` so leads survive deploys.

### Environment variables
| Var | Required | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | yes | Dashboard login. Login is disabled until set. |
| `SESSION_SECRET` | recommended | Any long random string. |
| `DATA_DIR` | recommended | Path to the persistent disk. |
| `NOTIFY_EMAIL` | optional | Where new-lead alerts go. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | optional | e.g. Gmail: smtp.gmail.com / 465 / address / app password. |

## Updating content
- **Logo:** `public/images/logo.svg` is an interim wordmark. Drop the real logo in and update the `src` references (header, hero, footer, login, admin), then regenerate `public/images/og-image.png` (1200×630) from it.
- **Photos:** put files in `public/images/gallery/` and set `src` in `public/js/gallery-data.js`. The story photo slot is the `#storyPhoto` block in `index.html`.
- **Menu:** edit the menu section in `public/index.html`.
- **Domain:** replace `https://www.benesbeef.com` in the `<head>` meta tags once the client picks a domain.
