'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopAPI', {
  proxyImage: (url) => ipcRenderer.invoke('proxy-image', url),
  archive: {
    getRoot: () => ipcRenderer.invoke('archive:get-root'),
    load: () => ipcRenderer.invoke('archive:load'),
    save: (payload) => ipcRenderer.invoke('archive:save', payload),
    removeSave: (payload) => ipcRenderer.invoke('archive:remove-save', payload),
    removeUser: (payload) => ipcRenderer.invoke('archive:remove-user', payload),
  },
  exportFile: (payload) => ipcRenderer.invoke('export:save-file', payload),
})
