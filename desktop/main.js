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

// Clock gets its own desktop-first presentation while the hosted app keeps
// its mobile-first design. We reuse existing Clock controls rather than
// creating a second clock implementation.
function enhanceClockWindow(win) {
  const desktopCss = `
    :root { --aither-desktop-gap: 18px; }
    body { min-width: 1100px !important; }
    .app { width: min(1600px, calc(100vw - 48px)) !important; max-width: none !important; }
    .topbar { position: sticky; top: 0; z-index: 100; padding: 12px 0; backdrop-filter: blur(20px); }
    .clock-card { display: grid !important; grid-template-columns: minmax(420px, 1fr) minmax(430px, 1fr) !important; align-items: center; gap: 28px; padding: 34px !important; }
    .clock-card .date, .clock-card .digital, .clock-card .period { grid-column: 1; }
    .clock-card .analog { grid-column: 2; grid-row: 1 / span 3; width: min(520px, 34vw) !important; margin: 0 auto !important; }
    .digital { font-size: clamp(64px, 7vw, 120px) !important; }
    .tabs { position: sticky !important; top: 72px !important; z-index: 90; max-width: none !important; }
    .panel { padding: 24px !important; }
    .settings-grid { grid-template-columns: repeat(4, minmax(180px, 1fr)) !important; }
    .world-grid { grid-template-columns: repeat(4, minmax(210px, 1fr)) !important; }
    .sound-box, .update-box, .backend-box { grid-template-columns: minmax(0, 1fr) auto !important; }
    .tool-display { font-size: clamp(64px, 7vw, 110px) !important; }
    .timer-inputs input { width: 140px !important; font-size: 28px !important; }
    .alarms { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    footer { padding-bottom: 24px; }
    @media (max-width: 1200px) {
      body { min-width: 900px !important; }
      .clock-card { grid-template-columns: 1fr !important; }
      .clock-card .analog { grid-column: 1; grid-row: auto; width: min(430px, 45vw) !important; }
      .settings-grid { grid-template-columns: repeat(3, minmax(160px, 1fr)) !important; }
      .world-grid { grid-template-columns: repeat(3, minmax(190px, 1fr)) !important; }
    }
  `;
  const script = `
    (() => {
      document.documentElement.dataset.aitherDesktop = 'true';
      const style = document.createElement('style');
      style.id = 'aither-desktop-clock-style';
      style.textContent = ${JSON.stringify(desktopCss)};
      document.head.appendChild(style);

      const shortcuts = {
        '1': 'clockPanel', '2': 'worldPanel', '3': 'stopwatchPanel',
        '4': 'timerPanel', '5': 'alarmPanel'
      };
      document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) return;
        const tag = event.target && event.target.tagName;
        const editing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable;
        const mod = event.ctrlKey || event.metaKey;
        if (!editing && !mod && shortcuts[event.key]) {
          const tab = document.querySelector('.tab[data-panel="' + shortcuts[event.key] + '"]');
          if (tab) { event.preventDefault(); tab.click(); }
        }
        if (!editing && !mod && event.key.toLowerCase() === 'f') {
          const button = document.getElementById('fullscreenBtn');
          if (button) { event.preventDefault(); button.click(); }
        }
        if (mod && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          const search = document.getElementById('worldSearch');
          if (search) { search.focus(); search.select(); }
        }
      });

      const title = document.querySelector('.brand strong');
      if (title && !document.getElementById('aither-desktop-badge')) {
        const badge = document.createElement('span');
        badge.id = 'aither-desktop-badge';
        badge.textContent = 'DESKTOP';
        badge.style.cssText = 'display:inline-block;margin-left:8px;padding:3px 7px;border:1px solid currentColor;border-radius:999px;font-size:10px;letter-spacing:.12em;vertical-align:middle;opacity:.72';
        title.appendChild(badge);
      }
    })();
  `;
  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(script, true).catch(() => {});
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

  const isClock = name === 'Clock';
  const isWeather = name === 'Weather';
  const win = new BrowserWindow({
    width: isClock || isWeather ? 1600 : 1440,
    height: isClock || isWeather ? 1000 : 900,
    minWidth: isClock || isWeather ? 1100 : 900,
    minHeight: 650,
    title: `Aither ${name}`,
    backgroundColor: '#070b14',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });

  windows.set(name, win);
  if (isClock) enhanceClockWindow(win);
  // Weather's desktop treatment remains installed from the previous build.
  if (isWeather) {
    // Keep Weather as a large native window; its dedicated layout is applied
    // by the hosted app's own desktop enhancements.
  }
  win.loadURL(url);

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
    if (launcher) { launcher.show(); launcher.focus(); }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createLauncher();
    app.on('activate', () => {
      if (!launcher || launcher.isDestroyed()) createLauncher();
      else { launcher.show(); launcher.focus(); }
    });
  });
}
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
