const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notifAPI', {
  onNotif:   (cb) => ipcRenderer.on('notif',         (_, data) => cb(data)),
  onDismiss: (cb) => ipcRenderer.on('notif-dismiss', (_, key)  => cb(key)),
  resize:    (h)  => ipcRenderer.send('notif-resize', h),
});
