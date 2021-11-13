'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
require('@electron/remote/main').initialize()
const path = require('path')
const { createDocumentComponents } = require('./main/pdf/printers')

// open a window
const openWindow = () => {
    const win = new BrowserWindow({
        width: 1600,
        height: 800,
        //resizable: false
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    // load `index.html` file
    win.setMenuBarVisibility(false)
    win.loadFile(path.resolve(__dirname, 'render/html/index.html'))

    win.webContents.openDevTools()

    return win
}

// when app is ready, open a window
app.on('ready', () => {
    openWindow()
})

// when all windows are closed, quit the app
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// when app activates, open a window
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        openWindow()
    }
})

ipcMain.handle('app:generate-pdf-catalog', (event, catalogDirectory, selectedVersion) => {
    const { printCoverPage, printCatalogBody, printEof } = createDocumentComponents(catalogDirectory, selectedVersion)
    printCoverPage()
    printCatalogBody()
    printEof()

    return true
})
