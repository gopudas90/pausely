const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('modalAPI', {
  onData:  (cb)  => ipcRenderer.on('modal-data', (_, data) => cb(data)),
  restart: (type) => ipcRenderer.send('modal-restart', type),
  close:   ()    => ipcRenderer.send('modal-close'),
});
