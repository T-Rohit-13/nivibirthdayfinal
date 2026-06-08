# 🎂 Birthday Surprise — Backend + Frontend

Full-stack birthday website with Node.js/Express backend and MongoDB database,
hosted on Railway. Every visitor sees the same content configured by the admin.

---

## Project Structure

```
/
├── server.js          ← Express entry point
├── railway.toml       ← Railway deploy config
├── package.json
├── .env.example       ← Copy to .env and fill in values
├── middleware/
│   └── auth.js        ← JWT auth middleware
├── models/
│   ├── Settings.js    ← Site text content, music, about cards, wishes
│   ├── Photo.js       ← Gallery photos
│   └── Timeline.js    ← Timeline events
├── routes/
│   ├── auth.js        ← POST /api/auth/login
│   ├── settings.js    ← GET/PUT /api/settings
│   ├── photos.js      ← GET/POST/PUT/DELETE /api/photos
│   └── timeline.js    ← GET/POST/PUT/DELETE /api/timeline
│
│   ── FRONTEND FILES (upload to Antigravity) ──
├── index.html
├── config.js          ← SET YOUR RAILWAY URL HERE
├── db.js              ← API client (replaces IndexedDB)
├── script.js
├── styles.css
└── data.js            ← Static presets (first-run seed)
```

---

## 🚀 Deploy Backend to Railway

### Step 1 — Push backend files to GitHub
Create a new GitHub repo and push these backend files:
`server.js`, `railway.toml`, `package.json`, `.gitignore`,
`middleware/`, `models/`, `routes/`

**Do NOT push:** `.env`, `node_modules/`

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → New Project
2. Click **Deploy from GitHub repo** → select your repo
3. Railway auto-detects Node.js and runs `npm start`

### Step 3 — Add MongoDB
1. In your Railway project → click **+ New** → **Database** → **MongoDB**
2. Click the MongoDB service → **Variables** tab
3. Copy the `MONGODB_URL` value

### Step 4 — Set environment variables
In your Railway backend service → **Variables** tab, add:

| Variable         | Value                                      |
|------------------|--------------------------------------------|
| `MONGODB_URI`    | Paste the MongoDB URL from Step 3          |
| `ADMIN_PASSWORD` | Your chosen admin password                 |
| `JWT_SECRET`     | A long random string (min 32 characters)   |
| `JWT_EXPIRES_IN` | `8h`                                       |
| `FRONTEND_URL`   | Your Antigravity site URL (or `*` for now) |

### Step 5 — Get your Railway URL
After deploy succeeds, click your service → **Settings** → copy the public URL.
It looks like: `https://birthday-backend-production.up.railway.app`

---

## 🌐 Deploy Frontend to Antigravity

### Step 1 — Set your API URL
Open `config.js` and replace the placeholder:
```js
window.BIRTHDAY_CONFIG = {
  apiBase: "https://YOUR-RAILWAY-APP.up.railway.app/api"
  //        ^^^^ paste your Railway URL here
};
```

### Step 2 — Upload to Antigravity
Upload these 6 files to Antigravity:
- `index.html`
- `config.js`
- `db.js`
- `script.js`
- `styles.css`
- `data.js`

### Step 3 — Update FRONTEND_URL on Railway
Go back to Railway → Variables → set `FRONTEND_URL` to your Antigravity URL.

---

## 🔐 Admin Panel

1. Open your website
2. Click the **hidden trigger** in the bottom-right corner of the page
3. Enter your `ADMIN_PASSWORD`
4. Configure everything → click **Save All Changes**

All changes are saved to MongoDB and immediately visible to everyone who visits.

---

## API Reference

| Method | Endpoint              | Auth?  | Description                  |
|--------|-----------------------|--------|------------------------------|
| POST   | /api/auth/login       | No     | Login, returns JWT token     |
| GET    | /api/auth/verify      | No     | Check if token is valid      |
| GET    | /api/settings         | No     | Get all site content         |
| PUT    | /api/settings         | ✅ Yes | Update site content          |
| GET    | /api/photos           | No     | Get all photos               |
| POST   | /api/photos           | ✅ Yes | Add a photo                  |
| PUT    | /api/photos/:id       | ✅ Yes | Update a photo               |
| DELETE | /api/photos/:id       | ✅ Yes | Delete a photo               |
| POST   | /api/photos/bulk      | ✅ Yes | Replace all photos at once   |
| GET    | /api/timeline         | No     | Get all timeline events      |
| POST   | /api/timeline         | ✅ Yes | Add a timeline event         |
| PUT    | /api/timeline/:id     | ✅ Yes | Update a timeline event      |
| DELETE | /api/timeline/:id     | ✅ Yes | Delete a timeline event      |
| POST   | /api/timeline/bulk    | ✅ Yes | Replace all events at once   |
| GET    | /api/health           | No     | Health check                 |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in env vars
cp .env.example .env

# 3. Start server
npm run dev   # uses nodemon for auto-reload

# Server runs at http://localhost:3000
```
