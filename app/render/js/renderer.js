const dragDrop = require('drag-drop')
const { ipcRenderer } = require('electron')
const { stat, readdir, readFile } = require('fs/promises')
const fs = require('fs')
const path = require('path')

document.getElementById('workspace').style.display = 'none'
document.getElementById('uploaderFileName').style.display = 'none'
document.getElementById('uploaderWallArt').style.display = 'none'

let currentCatalogDirectory = ''
let currentVersion = ''

dragDrop('#uploader', (files, pos, fileList, directories) => {
    console.log('fileList', fileList)
    console.log('directories', directories)

    const _fsItemName = fileList[0].name
    const _path = fileList[0].path
    console.log('f0 version: ', _fsItemName)
    console.log('f0 path: ', _path)

    stat(_path).then(s => {
        if (s.isDirectory()) {
            validateCatagenDirectory(_path).then(info => {
                if (info) {
                    showPreviewInfo(info, _fsItemName)
                    currentVersion = _fsItemName
                    currentCatalogDirectory = path.dirname(_path)
                } else {
                    showNotification('El directorio seleccionado no es de tipo catálogo')
                    currentCatalogDirectory = ''
                    currentVersion = ''
                }
            })
        } else if (s.isFile()  && _fsItemName === 'info.json') {
            showNotification('El elemento seleccionado es un archivo de configuración')
            currentCatalogDirectory = ''
            currentVersion = ''
        } else {
            showNotification('El elemento seleccionado no es un directorio o archivo Resica')
            currentCatalogDirectory = ''
            currentVersion = ''
        }
    })
})

function validateCatagenDirectory(_path) {
    const parentDirectory = path.dirname(_path)
    console.log('parent directory: ', parentDirectory)
    return readdir(parentDirectory).then(files => {
        console.log('files inside directory', files)
        if (files.includes('info.json') && files.includes('company-logo.png')) {
            const info = loadInfo(path.resolve(parentDirectory, 'info.json'))
            info.logoPath = path.resolve(parentDirectory, 'company-logo.png')
            return info
        }
    })
}

function loadInfo(infoPath) {
    if (infoPath) {
        const infoRaw = fs.readFileSync(infoPath)
        return JSON.parse(infoRaw)
    }
}

function showNotification(message) {
    const notifMsg = document.getElementById('notification-text')
    const notifAct = document.getElementById('notification-action')
    document.getElementById('workspace').style.display = 'block'
    document.getElementById('catalog-resume').style.display = 'none'
    document.getElementById('notification-area').style.display = 'flex'
    notifMsg.innerText = message
    notifAct.innerText = ''
    //notifAct.innerHTML = `Seleccione otro directorio o <a href="#">cree una estructura de ejemplo</a>`
}

function showPreviewInfo(info, version) {
    console.log('info: ', info)
    document.getElementById('title-text').innerText = info.title
    document.getElementById('company-text').innerText = info.company
    document.getElementById('version-text').innerText = version
    document.getElementById('logo-img').src = info.logoPath
    document.getElementById('copyright-text').src = `© ${info.company} ${new Date().getFullYear()}`
    document.getElementById('workspace').style.display = 'block'
    document.getElementById('catalog-resume').style.display = 'flex'
    document.getElementById('notification-area').style.display = 'none'
}

window.printPdf = () => {
    console.log('Generando PDF')

    ipcRenderer.invoke('app:generate-pdf-catalog', currentCatalogDirectory, currentVersion).then(success => {
        const notifMsg = document.getElementById('notification-text')
        document.getElementById('workspace').style.display = 'block'
        document.getElementById('catalog-resume').style.display = 'none'
        document.getElementById('notification-area').style.display = 'flex'
        if (success) {
            notifMsg.innerText = 'Catálogo PDF generado exitosamente'
        } else {
            notifMsg.innerText = 'Catálogo PDF no generado'
        }
    })
}
