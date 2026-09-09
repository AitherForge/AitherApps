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

function openApp(name) {
  const url = APPS[name];
  if (!url) return false;

  const existing = windows.get(name);
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return true;
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    title: `Aither ${name}`,
    backgroundColor: '#070b14',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  windows.set(name, win);
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
