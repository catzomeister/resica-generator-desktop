const dragDrop = require('drag-drop')
const { ipcRenderer } = require('electron')
const { stat, readdir, readFile } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const dom = require('./dom')

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

    const _path = fileList[0].path
    console.log('f0: ', _path)

    stat(_path).then(s => {
        console.log('isDirectory? ', s.isDirectory())

        const notifMsg = document.getElementById('notif-msg')

        if (s.isDirectory()) {
            notifMsg.innerText = 'Its a directory'

            validateCatagenDirectory(_path).then(valid => {
                if (valid) {
                    notifMsg.innerText = 'Its a valid directory'
                } else {
                    notifMsg.innerText = 'Its a invalid directory'
                }
            })
        } else {
            //new Notification('Error', { body: 'Its not a directory' })

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
            if (info) {
                showInfo(info)
                return true
            }
        }
        return false
    })
}

function loadInfo(infoPath) {
    if (infoPath) {
        const infoRaw = fs.readFileSync(infoPath)
        return JSON.parse(infoRaw)
    }
}

function showInfo(info) {
    console.log('info: ', info)
}
