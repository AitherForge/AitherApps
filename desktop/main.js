const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');

// One Aither Apps desktop install is the only desktop install users need.
// Every user-facing Aither app is opened from this launcher using its
// existing GitHub Pages deployment. No per-app desktop downloads are used.
// AitherBackend is infrastructure, AitherTech is excluded, and Aither Admin
// stays intentionally hidden from the launcher.
const APPS = Object.freeze({
  Weather: 'https://aitherforge.github.io/AitherWeather/',
  Clock: 'https://aitherforge.github.io/AitherClock/',
  Notes: 'https://aitherforge.github.io/AitherNotes/',
  Maps: 'https://aitherforge.github.io/AitherMaps/',
  Calculator: 'https://aitherforge.github.io/AitherCalculator/',
  Dashboard: 'https://aitherforge.github.io/AitherDashboard/',
  Files: 'https://aitherforge.github.io/AitherFiles/',
  Mail: 'https://aitherforge.github.io/AitherMail/',
  Gaming: 'https://aitherforge.github.io/AitherGaming/',
  AI: 'https://aitherforge.github.io/AitherAI/',
  Web: 'https://aitherforge.github.io/AitherWeb/'
});

const AITHER_ORIGIN = 'https://aitherforge.github.io/';
let launcher;
const windows = new Map();

function createLauncher() {
  launcher = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 680,
    title: 'Aither Apps',
    backgroundColor: '#070b14',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  launcher.loadFile(path.join(__dirname, 'index.html'));
}

// Weather is the first app to receive the new desktop-first treatment.
// The web build remains untouched for phones/tablets; these styles and
// shortcuts are applied only to the native Aither Apps window.
function enhanceWeatherWindow(win) {
  const desktopCss = `
    :root { --aither-desktop-gap: 18px; }
    body { min-width: 1100px; }
    .app-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 1000 !important;
      backdrop-filter: blur(24px);
    }
    .app-main {
      width: min(1600px, calc(100vw - 48px)) !important;
      margin: 0 auto !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1.7fr) minmax(360px, 0.8fr) !important;
      gap: var(--aither-desktop-gap) !important;
      align-items: start !important;
    }
    .hero, .alerts-panel, .offline-banner, .hourly-card, .forecast-card-panel,
    .current-card, .radar-card, .locations-card, .air-card, .roast-card,
    .nowcast-card { min-width: 0; }
    .hero, .alerts-panel, .offline-banner, .hourly-card, .forecast-card-panel,
    .current-card, .radar-card, .locations-card, .air-card, .roast-card,
    .nowcast-card { grid-column: 1; }
    .hero { grid-row: 1; }
    .alerts-panel { grid-row: 2; }
    .hourly-card { grid-row: 3; }
    .forecast-card-panel { grid-row: 4; }
    .current-card { grid-row: 5; }
    .radar-card, .locations-card, .air-card, .roast-card, .nowcast-card {
      grid-column: 2;
      grid-row: auto;
    }
    .tile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .forecast-row { overflow-x: auto; }
    .hour-strip-wrap { overflow-x: auto; }
    .radar-card canvas { max-height: 72vh; }
    @media (max-width: 1200px) {
      body { min-width: 900px; }
      .app-main { grid-template-columns: 1fr !important; }
      .radar-card, .locations-card, .air-card, .roast-card, .nowcast-card,
      .hero, .alerts-panel, .offline-banner, .hourly-card, .forecast-card-panel,
      .current-card { grid-column: 1 !important; }
    }
  `;

  const desktopScript = `
    (() => {
      document.documentElement.dataset.aitherDesktop = 'true';
      const style = document.createElement('style');
      style.id = 'aither-desktop-weather-style';
      style.textContent = ${JSON.stringify(desktopCss)};
      document.head.appendChild(style);

      // Desktop-only keyboard shortcuts. They map to controls already
      // present in the weather app, so there is no duplicate app logic.
      document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) return;
        const mod = event.ctrlKey || event.metaKey;
        if (mod && event.shiftKey && event.key.toLowerCase() === 'l') {
          event.preventDefault();
          const input = document.getElementById('searchInput');
          if (input) { input.focus(); input.select(); }
        }
        if (mod && event.shiftKey && event.key.toLowerCase() === 'r') {
          event.preventDefault();
          const button = document.getElementById('refreshBtn');
          if (button) button.click();
        }
        if (event.key === 'Escape') {
          const results = document.getElementById('searchResults');
          if (results) results.hidden = true;
        }
      });

      const heading = document.querySelector('.brand h1');
      if (heading && !document.getElementById('aither-desktop-badge')) {
        const badge = document.createElement('span');
        badge.id = 'aither-desktop-badge';
        badge.textContent = 'DESKTOP';
        badge.style.cssText = 'display:inline-block;margin-left:8px;padding:3px 7px;border:1px solid currentColor;border-radius:999px;font-size:10px;letter-spacing:.12em;vertical-align:middle;opacity:.72';
        heading.appendChild(badge);
      }
    })();
  `;

  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(desktopScript, true).catch(() => {});
  });
}

function openApp(name) {
  const url = APPS[name];
  if (!url) return false;

  const existing = windows.get(name);
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return true;
  }

  const isWeather = name === 'Weather';
  const win = new BrowserWindow({
    width: isWeather ? 1600 : 1440,
    height: isWeather ? 1000 : 900,
    minWidth: isWeather ? 1100 : 900,
    minHeight: 650,
    title: `Aither ${name}`,
    backgroundColor: '#070b14',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  windows.set(name, win);
  if (isWeather) enhanceWeatherWindow(win);
  win.loadURL(url);

  // Links opened by an Aither app go to the normal browser. The Aither
  // app itself remains inside this single desktop installation.
  win.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
    if (nextUrl.startsWith(AITHER_ORIGIN)) return { action: 'allow' };
    shell.openExternal(nextUrl);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, nextUrl) => {
    if (!nextUrl.startsWith(AITHER_ORIGIN)) {
      event.preventDefault();
      shell.openExternal(nextUrl);
    }
  });

  win.on('closed', () => windows.delete(name));
  return true;
}

function openExternal(url) {
  if (typeof url === 'string' && /^https:\/\//.test(url)) {
    shell.openExternal(url);
    return true;
  }
  return false;
}

ipcMain.handle('apps:list', () => APPS);
ipcMain.handle('apps:open', (_event, name) => openApp(name));
ipcMain.handle('apps:external', (_event, url) => openExternal(url));
ipcMain.handle('app:version', () => app.getVersion());

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => {
    if (launcher) {
      launcher.show();
      launcher.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createLauncher();
    app.on('activate', () => {
      if (!launcher || launcher.isDestroyed()) createLauncher();
      else {
        launcher.show();
        launcher.focus();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
