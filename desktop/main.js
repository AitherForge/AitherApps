const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');

const APPS = {
  Weather: 'https://aitherforge.github.io/AitherWeather/',
  Clock: 'https://aitherforge.github.io/AitherClock/',
  Notes: 'https://aitherforge.github.io/AitherNotes/',
  Maps: 'https://aitherforge.github.io/AitherMaps/',
  Calculator: 'https://aitherforge.github.io/AitherCalculator/',
  Files: 'https://aitherforge.github.io/AitherFiles/',
  Mail: 'https://aitherforge.github.io/AitherMail/',
  Gaming: 'https://aitherforge.github.io/AitherGaming/',
  AI: 'https://aitherforge.github.io/AitherAI/',
  Web: 'https://aitherforge.github.io/AitherWeb/',
  Dashboard: 'https://aitherforge.github.io/AitherDashboard/'
};

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
  if (!url) return;
  const existing = windows.get(name);
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    title: `Aither ${name}`,
    backgroundColor: '#070b14',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  windows.set(name, win);
  win.loadURL(url);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, next) => {
    if (!next.startsWith('https://aitherforge.github.io/')) {
      event.preventDefault();
      shell.openExternal(next);
    }
  });
  win.on('closed', () => windows.delete(name));
}

function openExternal(url) {
  if (typeof url === 'string' && /^https:\/\//.test(url)) shell.openExternal(url);
}

ipcMain.handle('apps:list', () => APPS);
ipcMain.handle('apps:open', (_event, name) => { openApp(name); return true; });
ipcMain.handle('apps:external', (_event, url) => { openExternal(url); return true; });
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

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
