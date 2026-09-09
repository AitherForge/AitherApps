const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aitherDesktop', {
  listApps: () => ipcRenderer.invoke('apps:list'),
  openApp: (name) => ipcRenderer.invoke('apps:open', name),
  openExternal: (url) => ipcRenderer.invoke('apps:external', url),
  version: () => ipcRenderer.invoke('app:version')
});
