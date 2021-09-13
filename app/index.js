const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

const { createDocumentComponents } = require('./main/pdf/printers')

// open a window
const openWindow = () => {
    const win = new BrowserWindow({
        width: 1600,
        height: 600,
        //resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    // load `index.html` file
    win.setMenuBarVisibility(false)
    win.loadFile(path.resolve(__dirname, 'render/html/index.html'))

    //win.webContents.session.clearCache()
    //win.webContents.reloadIgnoringCache()
    win.webContents.openDevTools()

    return win
}

// when app is ready, open a window
app.on('ready', () => {
    openWindow()

    // watch files
    //io.watchFiles(win)
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

/* 
ipcMain.handle('app:get-files', () => {
    return io.getFiles()
})

ipcMain.handle('app:on-file-add', (event, files = []) => {
    io.addFiles(files)
})

ipcMain.on('app:on-file-delete', (event, file) => {
    io.deleteFile(file.filepath)
})

ipcMain.on('app:on-file-open', (event, file) => {
    io.openFile(file.filepath)
})

ipcMain.on('app:on-file-copy', (event, file) => {
    event.sender.startDrag({
        file: file.filepath,
        icon: path.resolve(__dirname, './resources/paper.png')
    })
})
 */

ipcMain.handle('app:generate-pdf-catalog', (event, catalogDirectory, selectedVersion) => {
    console.log('catalogDirectory: ', catalogDirectory)
    console.log('selectedVersion: ', selectedVersion)
    const { printCoverPage, printCatalogBody, printEof } = createDocumentComponents(catalogDirectory, selectedVersion)
    printCoverPage()
    printCatalogBody()
    printEof()

    return true
})
