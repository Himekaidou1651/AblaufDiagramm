'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { proxyImage } = require('./proxy.cjs')
const {
  readArchive,
  saveArchive,
  removeSave,
  removeUser,
  getArchiveDirectory,
  saveExportFile,
} = require('./archive.cjs')

let mainWindow
let buildWatcher
let distWatcher
let reloadTimer

function startDebugBuildWatcher() {
  if (process.env.ELECTRON_WATCH !== '1') return

  const appRoot = path.resolve(app.getAppPath())
  const viteCli = path.join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!fs.existsSync(viteCli)) return

  buildWatcher = spawn(process.env.DEBUG_NODE_PATH || 'node', [viteCli, 'build', '--watch'], {
    cwd: appRoot,
    stdio: 'inherit',
    windowsHide: true,
  })

  const distDirectory = path.join(appRoot, 'dist')
  if (!fs.existsSync(distDirectory)) return

  distWatcher = fs.watch(distDirectory, { recursive: true }, () => {
    if (reloadTimer) clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reloadIgnoringCache()
      }
    }, 250)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  mainWindow.setMenuBarVisibility(false)

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.once('did-finish-load', () => {
    if (process.env.ELECTRON_DEBUG === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  const devServerUrl = process.env.ELECTRON_DEV_SERVER_URL
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
    mainWindow.loadFile(indexPath)
  }
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  ipcMain.handle('proxy-image', (_event, url) => proxyImage(url))
  ipcMain.handle('archive:get-root', () => ({ rootPath: getArchiveDirectory() }))
  ipcMain.handle('archive:load', () => readArchive())
  ipcMain.handle('archive:save', (_event, payload) => saveArchive(payload))
  ipcMain.handle('archive:remove-save', (_event, payload) => removeSave(payload))
  ipcMain.handle('archive:remove-user', (_event, payload) => removeUser(payload))
  ipcMain.handle('export:save-file', (_event, payload) => saveExportFile(payload))
  createWindow()
  startDebugBuildWatcher()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (reloadTimer) clearTimeout(reloadTimer)
  distWatcher?.close()
  if (buildWatcher && !buildWatcher.killed) buildWatcher.kill()
})
