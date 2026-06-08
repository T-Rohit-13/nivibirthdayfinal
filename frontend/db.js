// ===== API DATABASE MANAGER =====
// Replaces IndexedDB. All data is now fetched from / saved to the backend API.
// Set API_BASE to your Railway backend URL after deploying.

const API_BASE = window.BIRTHDAY_CONFIG?.apiBase || "http://localhost:3000/api";

// ── Auth token helpers ──────────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem("adminToken") || "";
}

function setToken(token) {
  sessionStorage.setItem("adminToken", token);
}

function clearToken() {
  sessionStorage.removeItem("adminToken");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}

// ── initDB (kept for compatibility — nothing to init with REST API) ─────────
function initDB() {
  return Promise.resolve();
}

// ── Settings ────────────────────────────────────────────────────────────────

// Cache fetched settings so we don't hit the API on every getSetting() call
let _settingsCache = null;

async function _fetchSettings() {
  if (_settingsCache) return _settingsCache;
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  _settingsCache = await res.json();
  return _settingsCache;
}

async function getSetting(key, defaultValue) {
  try {
    const settings = await _fetchSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (err) {
    console.error("getSetting error:", err);
    return defaultValue;
  }
}

// setSetting batches into a single object on the caller side (saveAllConfig),
// so here we just accept key/value and PATCH incrementally.
// For bulk saves, use saveAllSettings() below.
async function setSetting(key, value) {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ [key]: value })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save setting");
    }
    // Invalidate cache so next read is fresh
    _settingsCache = null;
  } catch (err) {
    console.error("setSetting error:", err);
    throw err;
  }
}

// Save all settings in one request (used by saveAllConfig for efficiency)
async function saveAllSettings(settingsObj) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(settingsObj)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save settings");
  }
  _settingsCache = null;
}

// ── Photos ──────────────────────────────────────────────────────────────────

async function getAllPhotos() {
  try {
    const res = await fetch(`${API_BASE}/photos`);
    if (!res.ok) throw new Error("Failed to fetch photos");
    return await res.json();
  } catch (err) {
    console.error("getAllPhotos error:", err);
    return [];
  }
}

async function savePhoto(photo) {
  try {
    const method = photo._id ? "PUT" : "POST";
    const url = photo._id ? `${API_BASE}/photos/${photo._id}` : `${API_BASE}/photos`;
    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(photo)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save photo");
    }
    return await res.json();
  } catch (err) {
    console.error("savePhoto error:", err);
    throw err;
  }
}

async function deletePhoto(id) {
  try {
    const res = await fetch(`${API_BASE}/photos/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete photo");
    }
  } catch (err) {
    console.error("deletePhoto error:", err);
    throw err;
  }
}

async function bulkSavePhotos(photos) {
  const res = await fetch(`${API_BASE}/photos/bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ photos })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to bulk save photos");
  }
  return await res.json();
}

// ── Timeline ────────────────────────────────────────────────────────────────

async function getAllTimeline() {
  try {
    const res = await fetch(`${API_BASE}/timeline`);
    if (!res.ok) throw new Error("Failed to fetch timeline");
    return await res.json();
  } catch (err) {
    console.error("getAllTimeline error:", err);
    return [];
  }
}

async function saveTimelineItem(item) {
  try {
    const method = item._id ? "PUT" : "POST";
    const url = item._id ? `${API_BASE}/timeline/${item._id}` : `${API_BASE}/timeline`;
    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save timeline item");
    }
    return await res.json();
  } catch (err) {
    console.error("saveTimelineItem error:", err);
    throw err;
  }
}

async function deleteTimelineItem(id) {
  try {
    const res = await fetch(`${API_BASE}/timeline/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete timeline item");
    }
  } catch (err) {
    console.error("deleteTimelineItem error:", err);
    throw err;
  }
}

async function bulkSaveTimeline(events) {
  const res = await fetch(`${API_BASE}/timeline/bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ events })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to bulk save timeline");
  }
  return await res.json();
}

// ── Auth helpers (called by script.js) ─────────────────────────────────────

async function adminLogin(password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  setToken(data.token);
  return data;
}

async function verifyAdminToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

function adminLogout() {
  clearToken();
}
