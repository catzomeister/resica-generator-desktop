const dragDrop = require('drag-drop')
const { ipcRenderer } = require('electron')
const { stat, readdir, readFile } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const dom = require('./dom')

document.getElementById('preview').style.display = 'none'

// get list of files from the `main` process
ipcRenderer.invoke('app:get-files').then((files = []) => {
    dom.displayFiles(files)
})

// handle file delete event
ipcRenderer.on('app:delete-file', (event, filename) => {
    document.getElementById(filename).remove()
})

// add files drop listener
dragDrop('#uploader', (files, pos, fileList, directories) => {
    console.log('fileList', fileList)
    console.log('directories', directories)

    const _version = fileList[0].name
    const _path = fileList[0].path
    console.log('f0: ', _path)

    stat(_path).then(s => {
        console.log('isDirectory? ', s.isDirectory())

        const notifMsg = document.getElementById('notification-text')

        if (s.isDirectory()) {
            validateCatagenDirectory(_path).then(info => {
                if (info) {
                    showPreviewInfo(info, _version)
                } else {
                    document.getElementById('preview').style.display = 'block'
                    document.getElementById('catalog-resume').style.display = 'none'
                    document.getElementById('notification-area').style.display = 'block'
                    notifMsg.innerText = 'Its a invalid directory'
                }
            })
        } else {
            document.getElementById('preview').style.display = 'block'
            document.getElementById('catalog-resume').style.display = 'none'
            document.getElementById('notification-area').style.display = 'block'
            notifMsg.innerText = 'Its not a directory'
        }
    })

    // send file(s) add event to the `main` process
    /*
    ipcRenderer.invoke('app:on-file-add', _files).then(() => {
        ipcRenderer.invoke('app:get-files').then((__files = []) => {
            dom.displayFiles(__files)
        })
    })
    */
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
            /* if (info) {
                showInfo(info)
                return true
            } */
        }
        //return false
    })
}

function loadInfo(infoPath) {
    if (infoPath) {
        const infoRaw = fs.readFileSync(infoPath)
        return JSON.parse(infoRaw)
    }
}

function showPreviewInfo(info, version) {
    console.log('info: ', info)
    document.getElementById('title-text').innerText = info.title
    document.getElementById('company-text').innerText = info.company
    document.getElementById('version-text').innerText = version
    document.getElementById('logo-img').src = info.logoPath
    document.getElementById('copyright-text').src = `© ${info.company} ${new Date().getFullYear()}`
    document.getElementById('preview').style.display = 'block'
    document.getElementById('catalog-resume').style.display = 'flex'
    document.getElementById('notification-area').style.display = 'none'
}
