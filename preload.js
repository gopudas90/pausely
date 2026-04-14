const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings:   () => ipcRenderer.invoke('get-settings'),
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  saveSettings:  (s) => ipcRenderer.invoke('save-settings', s),
  resetTimer:    (name) => ipcRenderer.invoke('reset-timer', name),

  onTimerUpdate: (cb) => {
    const handler = (_, state) => cb(state);
    ipcRenderer.on('timer-update', handler);
    return () => ipcRenderer.removeListener('timer-update', handler);
  },

  onReminderFired: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('reminder-fired', handler);
    return () => ipcRenderer.removeListener('reminder-fired', handler);
  },

  openExternal: (url) => ipcRenderer.send('open-external', url),
});
