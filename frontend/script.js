// ===== CONFIGURATION =====
const DEFAULT_FRIEND_NAME = "Nivi";
let activeData = {};
let isMusicPlaying = false;
let currentSlide = 0;
let carouselInterval = null;
let currentTimelineIdCounter = 0;
let currentPhotoIdCounter = 0;

// Track active audio elements
const bgMusic = document.getElementById('bg-music');
const photoMusic = document.getElementById('photo-music');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDB();
    await loadAndRenderSite();
  } catch (err) {
    console.error("Failed to initialize site database", err);
  }

  // Check login state
  if (await isAdminLoggedIn()) {
    document.body.classList.add('admin-mode');
  }

  createLandingParticles();
  setupVisitorRestrictions();
});

// ===== VISITOR RESTRICTIONS =====
function setupVisitorRestrictions() {
  // Prevent context menu and dragging on images
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG' || e.target.closest('.gallery-item') || e.target.closest('.lightbox')) {
      e.preventDefault();
    }
  });

  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });
}

// ===== DATABASE LOAD AND RENDER =====
async function loadAndRenderSite() {
  // Check if database is empty by checking if friendName setting is present
  const dbFriendName = await getSetting("friendName", null);
  if (dbFriendName === null && window.BIRTHDAY_PRESETS) {
    await loadPresetsIntoDB(window.BIRTHDAY_PRESETS);
  }

  activeData.friendName = await getSetting("friendName", DEFAULT_FRIEND_NAME);
  activeData.landingSubtitle = await getSetting("landingSubtitle", "A little surprise made just for you ✨");
  activeData.mainQuote = await getSetting("mainQuote", "The world became a little more beautiful the day you were born. Happy Birthday!");
  activeData.personalMessage = await getSetting("personalMessage", "Write your personalized message here...");
  activeData.specialMemories = await getSetting("specialMemories", "Write your special memories here...");
  activeData.futureWishes = await getSetting("futureWishes", "Write your future wishes here...");
  activeData.giftText = await getSetting("giftText", "Write your surprise gift message here...");
  activeData.finalMessage = await getSetting("finalMessage", "Write your final emotional birthday message here...");
  activeData.bgMusicData = await getSetting("bgMusicData", "");
  activeData.bgMusicName = await getSetting("bgMusicName", "");

  // About Section Cards
  activeData.about = await getSetting("about", [
    { icon: "💫", title: "Her Personality", text: "Write about her personality..." },
    { icon: "🏆", title: "Her Achievements", text: "Write about her achievements..." },
    { icon: "😂", title: "Funny Moments", text: "Write about funny moments..." },
    { icon: "💖", title: "Why She Is Special", text: "Write why she is special..." },
    { icon: "🌸", title: "Favorite Memories Together", text: "Write favorite memories..." },
    { icon: "🙏", title: "Things I Thank Her For", text: "Write things to thank her for..." }
  ]);

  // Wishes List
  activeData.wishes = await getSetting("wishes", [
    "May your birthday be filled with happiness and love.",
    "Wishing you a year of success and good health.",
    "May all your dreams and aspirations come true."
  ]);

  // Gallery Photos
  activeData.photos = await getAllPhotos();
  
  // Timeline Events
  activeData.timeline = await getAllTimeline();

  // Update DOM values
  document.title = `Happy Birthday, ${activeData.friendName}! 🎂❤️`;
  document.getElementById('landing-title').textContent = `Happy Birthday, ${activeData.friendName} 🎂❤️`;
  document.getElementById('landing-subtitle').textContent = activeData.landingSubtitle;
  document.getElementById('main-quote').textContent = activeData.mainQuote;
  document.getElementById('personal-msg').textContent = activeData.personalMessage;
  document.getElementById('special-memories').textContent = activeData.specialMemories;
  document.getElementById('future-wishes').textContent = activeData.futureWishes;
  document.getElementById('gift-text').textContent = activeData.giftText;
  document.getElementById('final-message').textContent = activeData.finalMessage;
  document.getElementById('footer-text').textContent = `Made with ❤️ for ${activeData.friendName}`;

  // Populate Background audio source if a custom one was uploaded
  if (activeData.bgMusicData) {
    bgMusic.src = activeData.bgMusicData;
  }
  // If no bgMusicData, the Web Audio API synth will play as fallback (see playBirthdayMelody)

  renderAboutCards();
  renderGalleryGrid();
  renderTimeline();
  renderWishesCarousel();
}

// ===== RENDER PAGE SECTIONS =====
function renderAboutCards() {
  const container = document.getElementById('about-grid');
  container.innerHTML = '';
  activeData.about.forEach(item => {
    const card = document.createElement('div');
    card.className = 'glass-card about-card reveal visible';
    card.innerHTML = `
      <div class="icon">${item.icon}</div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    `;
    container.appendChild(card);
  });
}

function renderGalleryGrid() {
  const grid = document.getElementById('gallery-grid');
  const emptyState = document.getElementById('gallery-empty');
  const featuredContainer = document.getElementById('featured-photo-container');
  const featuredImg = document.getElementById('featured-img');
  
  grid.innerHTML = '';

  if (activeData.photos.length === 0) {
    emptyState.style.display = 'block';
    featuredContainer.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  // Sort photos so we can display them deterministically
  const sortedPhotos = [...activeData.photos];

  // Set the first photo as featured
  featuredContainer.style.display = 'block';
  featuredImg.src = sortedPhotos[0].photoData;

  sortedPhotos.forEach((photo) => {
    const item = document.createElement('div');
    item.className = 'gallery-item reveal visible';
    item.onclick = (e) => {
      // Glow and floating hearts effect on click
      createClickEffects(e, item);
      setTimeout(() => {
        openLightbox(photo);
      }, 300);
    };
    item.innerHTML = `
      <img src="${photo.photoData}" alt="${photo.caption || 'Memory'}" oncontextmenu="return false;" ondragstart="return false;">
      <div class="overlay"><span>${photo.caption || '✨ Memory'}</span></div>
    `;
    grid.appendChild(item);
  });
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  const emptyState = document.getElementById('timeline-empty');
  
  timeline.innerHTML = '';

  if (activeData.timeline.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  activeData.timeline.forEach(event => {
    const item = document.createElement('div');
    item.className = 'timeline-item reveal visible';
    
    let imgHTML = '';
    if (event.photoData) {
      imgHTML = `<img src="${event.photoData}" alt="Timeline Event" oncontextmenu="return false;" ondragstart="return false;">`;
    }

    item.innerHTML = `
      <div class="glass-card content">
        <div class="date">${event.date}</div>
        ${imgHTML}
        <p>${event.description}</p>
      </div>
    `;
    timeline.appendChild(item);
  });
}

function renderWishesCarousel() {
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  
  track.innerHTML = '';
  dotsContainer.innerHTML = '';

  if (activeData.wishes.length === 0) {
    track.innerHTML = `
      <div class="carousel-slide">
        <div class="wish-card">No wishes added yet.</div>
      </div>
    `;
    return;
  }

  activeData.wishes.forEach((wish, idx) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.innerHTML = `
      <div class="wish-card">
        "${wish}"
        <div class="wish-number">WISH ${idx + 1} OF ${activeData.wishes.length}</div>
      </div>
    `;
    track.appendChild(slide);

    // Carousel dots
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (idx === 0 ? ' active' : '');
    dot.onclick = () => goToSlide(idx);
    dotsContainer.appendChild(dot);
  });

  currentSlide = 0;
  updateCarousel();
}

// ===== CLICK GLOW & HEARTS EFFECT =====
function createClickEffects(e, element) {
  // Add temporary glow class
  element.style.boxShadow = '0 0 40px rgba(255, 107, 157, 0.8)';
  setTimeout(() => {
    element.style.boxShadow = '';
  }, 1000);

  // Spawn click hearts
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 8; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart-particle';
    heart.textContent = ['💖', '💕', '💗', '✨'][Math.floor(Math.random() * 4)];
    heart.style.left = `${centerX + (Math.random() - 0.5) * 60}px`;
    heart.style.top = `${centerY + (Math.random() - 0.5) * 60}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
  }
}

// ===== LANDING SURPRISE ANIMATION =====
function createLandingParticles() {
  const container = document.getElementById('particles-bg');
  if (!container) return;
  const symbols = ['✨', '💖', '🌸', '⭐', '💫', '🎀'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('span');
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    p.style.cssText = `
      position:absolute;
      font-size:${Math.random() * 20 + 10}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      opacity:${Math.random() * 0.4 + 0.2};
      animation: floatParticle ${Math.random() * 8 + 5}s ease-in-out infinite;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(p);
  }
}

function openSurprise() {
  const landing = document.getElementById('landing');
  const main = document.getElementById('main-content');
  const musicBtn = document.getElementById('music-btn');

  landing.classList.add('hidden');
  setTimeout(() => {
    landing.style.display = 'none';
    main.classList.add('visible');
    musicBtn.style.display = 'flex';
    
    // Automatically start background music on surprise opening
    if (!isMusicPlaying) {
      toggleMusic();
    }

    startBalloons();
    launchFireworks();
    initScrollReveal();
    startCarouselAuto();
  }, 1000);
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// ===== CAROUSEL MOVEMENT =====
function moveCarousel(dir) {
  if (activeData.wishes.length <= 1) return;
  currentSlide = (currentSlide + dir + activeData.wishes.length) % activeData.wishes.length;
  updateCarousel();
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
}

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  if (track) {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
  }
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function startCarouselAuto() {
  if (carouselInterval) clearInterval(carouselInterval);
  if (activeData.wishes.length > 1) {
    carouselInterval = setInterval(() => moveCarousel(1), 5000);
  }
}

// ===== MUSIC SYSTEM WITH FADE INTEGRATION =====
function toggleMusic() {
  const btn = document.getElementById('music-btn');
  if (isMusicPlaying) {
    if (activeData.bgMusicData) {
      fadeAudioOut(bgMusic);
    } else {
      stopBirthdayMelody();
    }
    btn.textContent = '🎵';
    btn.classList.remove('playing');
    isMusicPlaying = false;
  } else {
    // If playing dedicated photo music, pause it first
    if (!photoMusic.paused) {
      fadeAudioOut(photoMusic);
    }
    
    btn.textContent = '⏸️';
    btn.classList.add('playing');
    isMusicPlaying = true;

    if (activeData.bgMusicData) {
      bgMusic.volume = 0;
      bgMusic.play().then(() => {
        fadeAudioIn(bgMusic);
      }).catch(err => {
        console.log("Audio play blocked, falling back to synth", err);
        playBirthdayMelody();
      });
    } else {
      playBirthdayMelody();
    }
  }
}

function fadeAudioIn(audio, duration = 1000) {
  audio.volume = 0;
  const interval = 50;
  const step = interval / duration;
  let val = 0;
  const timer = setInterval(() => {
    val = Math.min(1, val + step);
    audio.volume = val;
    if (val >= 1) clearInterval(timer);
  }, interval);
}

function fadeAudioOut(audio, duration = 800) {
  const interval = 50;
  const step = interval / duration;
  let val = audio.volume;
  const timer = setInterval(() => {
    val = Math.max(0, val - step);
    audio.volume = val;
    if (val <= 0) {
      clearInterval(timer);
      audio.pause();
    }
  }, interval);
}

// ===== PHOTOPLAY DEDICATED SONG PAIRING =====
function openLightbox(photo) {
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const songInfo = document.getElementById('lightbox-info');
  const songName = document.getElementById('lightbox-song-name');

  lbImg.src = photo.photoData;
  lightbox.classList.add('active');

  // Pause main bgMusic and fade in the custom song if mapped
  if (photo.songData) {
    if (activeData.bgMusicData) {
      fadeAudioOut(bgMusic);
    } else {
      stopBirthdayMelody();
    }
    
    photoMusic.src = photo.songData;
    photoMusic.volume = 0;
    photoMusic.play().then(() => {
      fadeAudioIn(photoMusic);
    }).catch(err => console.log("Custom song play blocked", err));

    songInfo.style.display = 'flex';
    songName.textContent = photo.songName || "Assigned Memory Song";
  } else {
    songInfo.style.display = 'none';
  }
}

function closeLightbox(event) {
  if (event) event.stopPropagation();
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');

  // Stop custom photo music and fade main music back in if it was active
  if (!photoMusic.paused) {
    fadeAudioOut(photoMusic);
    if (isMusicPlaying) {
      if (activeData.bgMusicData) {
        bgMusic.play().then(() => {
          fadeAudioIn(bgMusic);
        }).catch(e => console.log(e));
      } else {
        playBirthdayMelody();
      }
    }
  }
}

// ===== SURPRISE GIFT ACTION =====
let giftOpened = false;
function openGift() {
  if (giftOpened) return;
  giftOpened = true;
  const box = document.getElementById('gift-box');
  const msg = document.getElementById('gift-message');
  box.classList.add('opened');
  setTimeout(() => {
    msg.classList.add('visible');
    launchConfetti();
  }, 600);
}

// ===== VISUAL FX PARTICLES =====
function startBalloons() {
  setInterval(() => {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.textContent = '🎈';
    const size = Math.random() * 1.5 + 1.5;
    balloon.style.cssText = `
      left: ${Math.random() * 100}vw;
      font-size: ${size}rem;
      animation-duration: ${Math.random() * 5 + 8}s;
      filter: hue-rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(balloon);
    setTimeout(() => balloon.remove(), 14000);
  }, 3000);
}

function launchFireworks() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => createFirework(), i * 600);
  }
}

function createFirework() {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * (window.innerHeight * 0.5);
  const colors = ['#ff6b9d', '#c4b5fd', '#a855f7', '#f5c542', '#ffa3c4'];

  for (let i = 0; i < 20; i++) {
    const spark = document.createElement('div');
    spark.className = 'sparkle';
    const angle = (i / 20) * Math.PI * 2;
    const dist = Math.random() * 80 + 40;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    spark.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${Math.random() * 4 + 3}px;
      height: ${Math.random() * 4 + 3}px;
      animation: firework-spark 1.2s ease-out forwards;
      --dx: ${dx}px;
      --dy: ${dy}px;
    `;
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 1400);
  }
}

function launchConfetti() {
  const colors = ['#ff6b9d', '#c4b5fd', '#a855f7', '#f5c542', '#ffa3c4', '#fde68a', '#7c3aed', '#fff'];
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 5;
      piece.style.cssText = `
        left: ${Math.random() * 100}vw;
        width: ${size}px;
        height: ${size * 1.5}px;
        background: ${color};
        animation-duration: ${Math.random() * 2 + 2}s;
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3500);
    }, i * 15);
  }
}

// Mouse movement hearts
let lastHeartTime = 0;
document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastHeartTime < 180) return;
  lastHeartTime = now;

  const heart = document.createElement('div');
  heart.className = 'heart-particle';
  heart.textContent = ['💖', '💕', '💗', '✨', '🌸'][Math.floor(Math.random() * 5)];
  heart.style.left = e.clientX + 'px';
  heart.style.top = e.clientY + 'px';
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 1000);
});

// ===== ADMIN SECURITY & LOGIN FUNCTIONS =====
function showAdminLogin() {
  document.getElementById('admin-login-overlay').classList.add('active');
  document.getElementById('admin-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function hideAdminLogin() {
  document.getElementById('admin-login-overlay').classList.remove('active');
}

async function submitAdminLogin() {
  const pass = document.getElementById('admin-password').value;
  try {
    await adminLogin(pass); // calls API, stores JWT via db.js
    document.body.classList.add('admin-mode');
    hideAdminLogin();
    openAdminPanel();
  } catch (err) {
    document.getElementById('login-error').style.display = 'block';
  }
}

async function isAdminLoggedIn() {
  return await verifyAdminToken(); // verifies JWT with backend
}

function logoutAdmin() {
  adminLogout(); // clears JWT token
  document.body.classList.remove('admin-mode');
  window.location.reload();
}

// ===== ADMIN CONFIG PANEL CONTROL =====
function openAdminPanel() {
  if (!isAdminLoggedIn()) return;
  document.getElementById('admin-panel-overlay').classList.add('active');
  populateConfigFields();
}

function closeAdminPanel() {
  document.getElementById('admin-panel-overlay').classList.remove('active');
}

// Populate Admin Modal Inputs
function populateConfigFields() {
  document.getElementById('cfg-friend-name').value = activeData.friendName;
  document.getElementById('cfg-landing-subtitle').value = activeData.landingSubtitle;
  
  document.getElementById('cfg-main-quote').value = activeData.mainQuote;
  document.getElementById('cfg-personal-msg').value = activeData.personalMessage;
  document.getElementById('cfg-special-memories').value = activeData.specialMemories;
  document.getElementById('cfg-future-wishes').value = activeData.futureWishes;
  document.getElementById('cfg-gift-text').value = activeData.giftText;
  document.getElementById('cfg-final-message').value = activeData.finalMessage;

  // Background Audio metadata label
  document.getElementById('cfg-bg-music-info').textContent = activeData.bgMusicName 
    ? `Currently loaded: ${activeData.bgMusicName}` 
    : "No song uploaded — a built-in birthday melody will play 🎵";

  // Populate About Section
  const aboutContainer = document.getElementById('cfg-about-container');
  aboutContainer.innerHTML = '';
  activeData.about.forEach((item, index) => {
    const cardField = document.createElement('div');
    cardField.className = 'admin-field';
    cardField.style.padding = '0.5rem 0';
    cardField.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <input type="text" value="${item.icon}" style="width:50px;text-align:center;" id="cfg-about-icon-${index}">
        <input type="text" value="${item.title}" style="font-weight:bold;" id="cfg-about-title-${index}">
      </div>
      <textarea id="cfg-about-text-${index}" style="margin-top:0.4rem;">${item.text}</textarea>
    `;
    aboutContainer.appendChild(cardField);
  });

  // Populate Wishes Carousel
  populateWishesConfigList();

  // Populate Timeline Events
  populateTimelineConfigList();

  // Populate Photo/Song Mappings
  populatePhotosConfigGrid();
}

// Wishes Carousel management in admin
function populateWishesConfigList() {
  const container = document.getElementById('cfg-wishes-list');
  container.innerHTML = '';
  activeData.wishes.forEach((wish, idx) => {
    const item = document.createElement('div');
    item.className = 'admin-field';
    item.style.display = 'flex';
    item.style.gap = '0.5rem';
    item.style.alignItems = 'center';
    item.innerHTML = `
      <span style="color:var(--pink);">${idx + 1}.</span>
      <textarea id="cfg-wish-text-${idx}" style="flex:1;">${wish}</textarea>
      <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="removeWishConfigItem(${idx})">Delete</button>
    `;
    container.appendChild(item);
  });
}

function addNewWishConfigItem() {
  activeData.wishes.push("Write wish content here...");
  populateWishesConfigList();
}

function removeWishConfigItem(index) {
  activeData.wishes.splice(index, 1);
  populateWishesConfigList();
}

// Timeline Management in admin
function populateTimelineConfigList() {
  const container = document.getElementById('cfg-timeline-list');
  container.innerHTML = '';
  
  if (activeData.timeline.length === 0) {
    container.innerHTML = `<p style="font-style:italic;color:var(--text-muted);">No timeline events configured.</p>`;
    return;
  }

  activeData.timeline.forEach((event, idx) => {
    const item = document.createElement('div');
    item.className = 'admin-timeline-item';
    
    let imgPreview = '';
    if (event.photoData) {
      imgPreview = `<img src="${event.photoData}" style="width:100px;height:55px;object-fit:cover;border-radius:6px;margin-top:0.5rem;display:block;">`;
    }

    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
        <strong>Event #${idx + 1}</strong>
        <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="removeTimelineConfigItem(${idx})">Remove</button>
      </div>
      <div class="admin-field">
        <label>Date or Label</label>
        <input type="text" id="cfg-timeline-date-${idx}" value="${event.date || ''}">
      </div>
      <div class="admin-field">
        <label>Description</label>
        <textarea id="cfg-timeline-desc-${idx}">${event.description || ''}</textarea>
      </div>
      <div class="admin-field">
        <label>Upload Event Image</label>
        <input type="file" accept="image/*" onchange="uploadTimelineImage(event, ${idx})">
        ${imgPreview}
      </div>
    `;
    container.appendChild(item);
  });
}

function addNewTimelineConfigItem() {
  activeData.timeline.push({ date: "New Date", description: "Memory description...", photoData: "" });
  populateTimelineConfigList();
}

function removeTimelineConfigItem(index) {
  activeData.timeline.splice(index, 1);
  populateTimelineConfigList();
}

async function uploadTimelineImage(e, index) {
  const file = e.target.files[0];
  if (!file) return;
  const dataUrl = await fileToDataURL(file);
  activeData.timeline[index].photoData = dataUrl;
  populateTimelineConfigList();
}

// Bg music upload helper
async function uploadBgMusic(e) {
  const file = e.target.files[0];
  if (!file) return;
  activeData.bgMusicName = file.name;
  activeData.bgMusicData = await fileToDataURL(file);
  document.getElementById('cfg-bg-music-info').textContent = `Loaded to save: ${file.name}`;
}

// Photos Grid Config
function populatePhotosConfigGrid() {
  const container = document.getElementById('cfg-photo-grid');
  container.innerHTML = '';

  if (activeData.photos.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;" class="empty-state">No photos uploaded.</div>`;
    return;
  }

  activeData.photos.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-photo-card';
    card.innerHTML = `
      <button class="delete-photo" onclick="deleteConfigPhoto(${idx})" title="Delete photo">&times;</button>
      <img src="${photo.photoData}">
      <div class="card-body">
        <input type="text" placeholder="Caption/Title" value="${photo.caption || ''}" id="cfg-photo-caption-${idx}">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-top:0.3rem;">Dedicated Song:</label>
        <input type="file" accept="audio/*" onchange="uploadPhotoSong(event, ${idx})" style="font-size:0.7rem;">
        <span style="font-size:0.75rem;color:var(--gold);word-break:break-all;display:block;">
          ${photo.songName ? `🎵 ${photo.songName}` : 'No paired song'}
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Helper utility to chain promises for multi-file reader loops
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

async function uploadGalleryPhotos(e) {
  const files = e.target.files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    try {
      const dataUrl = await fileToDataURL(files[i]);
      activeData.photos.push({
        id: Date.now() + i, // Generate unique numeric keys for IndexedDB
        photoData: dataUrl,
        caption: '',
        songData: '',
        songName: ''
      });
    } catch (err) {
      console.error(err);
    }
  }
  populatePhotosConfigGrid();
}

async function uploadPhotoSong(e, index) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await fileToDataURL(file);
    activeData.photos[index].songData = dataUrl;
    activeData.photos[index].songName = file.name;
    populatePhotosConfigGrid();
  } catch (err) {
    console.error(err);
  }
}

function deleteConfigPhoto(index) {
  // Mark for deletion from DB during saving, or remove from local working array
  activeData.photos.splice(index, 1);
  populatePhotosConfigGrid();
}

// ===== SAVE ALL SETTINGS =====
async function saveAllConfig() {
  try {
    // 1. Collect general text fields
    activeData.friendName       = document.getElementById('cfg-friend-name').value;
    activeData.landingSubtitle  = document.getElementById('cfg-landing-subtitle').value;
    activeData.mainQuote        = document.getElementById('cfg-main-quote').value;
    activeData.personalMessage  = document.getElementById('cfg-personal-msg').value;
    activeData.specialMemories  = document.getElementById('cfg-special-memories').value;
    activeData.futureWishes     = document.getElementById('cfg-future-wishes').value;
    activeData.giftText         = document.getElementById('cfg-gift-text').value;
    activeData.finalMessage     = document.getElementById('cfg-final-message').value;

    // 2. About cards
    for (let i = 0; i < 6; i++) {
      activeData.about[i].icon  = document.getElementById(`cfg-about-icon-${i}`).value;
      activeData.about[i].title = document.getElementById(`cfg-about-title-${i}`).value;
      activeData.about[i].text  = document.getElementById(`cfg-about-text-${i}`).value;
    }

    // 3. Wishes
    activeData.wishes = [];
    document.querySelectorAll('[id^="cfg-wish-text-"]').forEach((textarea) => {
      activeData.wishes.push(textarea.value);
    });

    // 4. Save all settings in ONE API call
    await saveAllSettings({
      friendName:      activeData.friendName,
      landingSubtitle: activeData.landingSubtitle,
      mainQuote:       activeData.mainQuote,
      personalMessage: activeData.personalMessage,
      specialMemories: activeData.specialMemories,
      futureWishes:    activeData.futureWishes,
      giftText:        activeData.giftText,
      finalMessage:    activeData.finalMessage,
      bgMusicData:     activeData.bgMusicData,
      bgMusicName:     activeData.bgMusicName,
      about:           activeData.about,
      wishes:          activeData.wishes
    });

    // 5. Sync timeline fields and bulk save
    for (let i = 0; i < activeData.timeline.length; i++) {
      activeData.timeline[i].date        = document.getElementById(`cfg-timeline-date-${i}`).value;
      activeData.timeline[i].description = document.getElementById(`cfg-timeline-desc-${i}`).value;
    }
    await bulkSaveTimeline(activeData.timeline);

    // 6. Sync photo captions and bulk save
    for (let i = 0; i < activeData.photos.length; i++) {
      activeData.photos[i].caption = document.getElementById(`cfg-photo-caption-${i}`).value;
    }
    await bulkSavePhotos(activeData.photos);

    closeAdminPanel();
    alert("Surprise Content Saved successfully!");
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Error saving: " + err.message);
  }
}

// ===== EXPORT CONFIGURATION (Static Presets data.js) =====
function exportConfig() {
  try {
    // Sync general fields from admin panel to activeData first so they are exported
    activeData.friendName = document.getElementById('cfg-friend-name').value;
    activeData.landingSubtitle = document.getElementById('cfg-landing-subtitle').value;
    activeData.mainQuote = document.getElementById('cfg-main-quote').value;
    activeData.personalMessage = document.getElementById('cfg-personal-msg').value;
    activeData.specialMemories = document.getElementById('cfg-special-memories').value;
    activeData.futureWishes = document.getElementById('cfg-future-wishes').value;
    activeData.giftText = document.getElementById('cfg-gift-text').value;
    activeData.finalMessage = document.getElementById('cfg-final-message').value;

    // Sync about cards
    for (let i = 0; i < 6; i++) {
      activeData.about[i].icon = document.getElementById(`cfg-about-icon-${i}`).value;
      activeData.about[i].title = document.getElementById(`cfg-about-title-${i}`).value;
      activeData.about[i].text = document.getElementById(`cfg-about-text-${i}`).value;
    }

    // Sync wishes
    activeData.wishes = [];
    document.querySelectorAll('[id^="cfg-wish-text-"]').forEach((textarea) => {
      activeData.wishes.push(textarea.value);
    });

    // Sync timeline date and description fields
    for (let i = 0; i < activeData.timeline.length; i++) {
      const dateVal = document.getElementById(`cfg-timeline-date-${i}`).value;
      const descVal = document.getElementById(`cfg-timeline-desc-${i}`).value;
      activeData.timeline[i].date = dateVal;
      activeData.timeline[i].description = descVal;
    }

    // Sync photos captions
    for (let i = 0; i < activeData.photos.length; i++) {
      const captionVal = document.getElementById(`cfg-photo-caption-${i}`).value;
      activeData.photos[i].caption = captionVal;
    }

    const configToExport = {
      friendName: activeData.friendName,
      landingSubtitle: activeData.landingSubtitle,
      mainQuote: activeData.mainQuote,
      personalMessage: activeData.personalMessage,
      specialMemories: activeData.specialMemories,
      futureWishes: activeData.futureWishes,
      giftText: activeData.giftText,
      finalMessage: activeData.finalMessage,
      bgMusicData: activeData.bgMusicData,
      bgMusicName: activeData.bgMusicName,
      about: activeData.about,
      wishes: activeData.wishes,
      photos: activeData.photos,
      timeline: activeData.timeline
    };
    
    const fileContent = `// ===== BIRTHDAY PRESET CONFIGURATION =====\n// Overwrite this file with your exported configuration from the Admin Panel.\nwindow.BIRTHDAY_PRESETS = ${JSON.stringify(configToExport, null, 2)};\n`;
    
    const blob = new Blob([fileContent], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export configuration.");
  }
}

// ===== IMPORT CONFIGURATION =====
function importConfig(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const content = event.target.result;
      const match = content.match(/window\.BIRTHDAY_PRESETS\s*=\s*([\s\S]+);/);
      let presetsObj;
      if (match && match[1]) {
        presetsObj = JSON.parse(match[1].trim());
      } else {
        presetsObj = JSON.parse(content);
      }
      
      if (presetsObj) {
        if (confirm("Are you sure you want to import this configuration? This will overwrite your current unsaved admin edits.")) {
          activeData.friendName = presetsObj.friendName || activeData.friendName;
          activeData.landingSubtitle = presetsObj.landingSubtitle || activeData.landingSubtitle;
          activeData.mainQuote = presetsObj.mainQuote || activeData.mainQuote;
          activeData.personalMessage = presetsObj.personalMessage || activeData.personalMessage;
          activeData.specialMemories = presetsObj.specialMemories || activeData.specialMemories;
          activeData.futureWishes = presetsObj.futureWishes || activeData.futureWishes;
          activeData.giftText = presetsObj.giftText || activeData.giftText;
          activeData.finalMessage = presetsObj.finalMessage || activeData.finalMessage;
          activeData.bgMusicData = presetsObj.bgMusicData || activeData.bgMusicData;
          activeData.bgMusicName = presetsObj.bgMusicName || activeData.bgMusicName;
          activeData.about = presetsObj.about || activeData.about;
          activeData.wishes = presetsObj.wishes || activeData.wishes;
          activeData.photos = presetsObj.photos || activeData.photos;
          activeData.timeline = presetsObj.timeline || activeData.timeline;
          
          populateConfigFields();
          alert("Configuration imported successfully! Remember to click 'Save All Changes' to write it to the database.");
        }
      } else {
        alert("Invalid configuration file format.");
      }
    } catch (err) {
      console.error("Import parsing failed:", err);
      alert("Failed to parse the configuration file. Make sure it is a valid data.js file.");
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ===== PRESETS LOADER =====
async function loadPresetsIntoDB(presets) {
  if (!presets) return;
  try {
    if (presets.friendName) await setSetting("friendName", presets.friendName);
    if (presets.landingSubtitle) await setSetting("landingSubtitle", presets.landingSubtitle);
    if (presets.mainQuote) await setSetting("mainQuote", presets.mainQuote);
    if (presets.personalMessage) await setSetting("personalMessage", presets.personalMessage);
    if (presets.specialMemories) await setSetting("specialMemories", presets.specialMemories);
    if (presets.futureWishes) await setSetting("futureWishes", presets.futureWishes);
    if (presets.giftText) await setSetting("giftText", presets.giftText);
    if (presets.finalMessage) await setSetting("finalMessage", presets.finalMessage);
    if (presets.bgMusicData) await setSetting("bgMusicData", presets.bgMusicData);
    if (presets.bgMusicName) await setSetting("bgMusicName", presets.bgMusicName);
    if (presets.about) await setSetting("about", presets.about);
    if (presets.wishes) await setSetting("wishes", presets.wishes);
    
    if (presets.photos && Array.isArray(presets.photos)) {
      for (const photo of presets.photos) {
        await savePhoto(photo);
      }
    }
    
    if (presets.timeline && Array.isArray(presets.timeline)) {
      for (const item of presets.timeline) {
        await saveTimelineItem(item);
      }
    }
  } catch (err) {
    console.error("Failed to load presets into IndexedDB:", err);
  }
}

// ===== WEB AUDIO API BACKGROUND MELODY SYNTH FALLBACK =====
let synthInterval = null;
let audioCtx = null;
let synthRunning = false;
let synthNoteIndex = 0;

const SYNTH_NOTES = (() => {
  const G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25,
        D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
  return [
    [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
    [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
    [G4, 0.75], [G4, 0.25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
    [F5, 0.75], [F5, 0.25], [E5, 1], [C5, 1], [D5, 1], [C5, 2]
  ];
})();

function playBirthdayMelody() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    synthRunning = true;
    const tempo = 110;
    const beatDuration = 60 / tempo;

    function playNextNote() {
      if (!synthRunning) return;

      const [freq, duration] = SYNTH_NOTES[synthNoteIndex];
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + duration * beatDuration - 0.05
      );

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration * beatDuration);

      synthNoteIndex = (synthNoteIndex + 1) % SYNTH_NOTES.length;
      synthInterval = setTimeout(playNextNote, duration * beatDuration * 1000);
    }

    playNextNote();
  } catch (err) {
    console.error("Failed to start synthesizer:", err);
  }
}

function stopBirthdayMelody() {
  synthRunning = false;
  if (synthInterval) {
    clearTimeout(synthInterval);
    synthInterval = null;
  }
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend();
  }
}
