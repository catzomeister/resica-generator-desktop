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

    const fsItemName = fileList[0].name
    const fsItemPath = fileList[0].path
    console.log('f0 version: ', fsItemName)
    console.log('f0 path: ', fsItemPath)

    const root = path.parse(fsItemPath).root

    stat(fsItemPath).then(s => {
        if (s.isDirectory()) {
            // Version Directory
            validateResicaDirectory(fsItemPath, 'version')
                .then(info => {
                    console.log('*** VERSION BLOCK ***', info)
                    if (info) {
                        showPreviewInfo(info, fsItemName)
                        currentVersion = fsItemName
                        currentCatalogDirectory = path.dirname(fsItemPath)
                        return true
                    } /* else {
                    showNotification('El directorio seleccionado no es de tipo catálogo')
                    currentCatalogDirectory = ''
                    currentVersion = ''
                } */
                    return false
                })
                .then(isResicaDirectory => {
                    if (!isResicaDirectory) {
                        return validateResicaDirectory(fsItemPath, 'company').then(info => {
                            console.log('*** COMPANY BLOCK ***', info)
                            if (info) {
                                showGeneralConfiguration(info)
                                currentCatalogDirectory = fsItemPath
                                currentVersion = ''
                                return true
                            }

                            return false
                        })
                    } else {
                        return true
                    }
                })
                .then(isResicaDirectory => {
                    if (!isResicaDirectory) {
                        return validateResicaDirectory(fsItemPath, 'category', 0, root).then(info => {
                            console.log('*** CATEGORY BLOCK ***', info)
                            if (info) {
                                return readdir(fsItemPath).then(images => {
                                    currentCatalogDirectory = info.currentCatalogDirectory
                                    currentVersion = info.currentVersion
                                    showImagesList(images)
                                    return true
                                })
                            }

                            return false
                        })
                    } else {
                        return true
                    }
                })
                .then(isResicaDirectory => {
                    console.log('FINAL isResicaDirectory: ', isResicaDirectory)
                    if (!isResicaDirectory) {
                        console.log('its other file?')
                        showNotification('El elemento seleccionado no es un directorio o archivo Resica')
                        currentCatalogDirectory = ''
                        currentVersion = ''
                    }
                })
        } else if (s.isFile() && fsItemName === 'info.json') {
            const info = loadInfo(fsItemPath)
            console.log('INFO: ', info)
            showGeneralConfiguration(info)
            currentCatalogDirectory = ''
            currentVersion = ''
        } else if (s.isFile() && (fsItemName.endsWith('.jpg') || fsItemName.endsWith('.png'))) {
            // la imagen debe encontrarse dentro de un category directory
            validateResicaDirectory(fsItemPath, 'category', 0, root)
                .then(info => {
                    console.log('*** IMAGE BLOCK ***', info)
                    if (info) {
                        currentCatalogDirectory = info.currentCatalogDirectory
                        currentVersion = info.currentVersion
                        console.log('IMAGE PARTY: ', fsItemName)
                        showProductInfo(fsItemName, fsItemPath)
                        return true
                    }

                    return false
                })
                .then(isResicaDirectory => {
                    if (!isResicaDirectory) {
                        showNotification('El elemento seleccionado no es un directorio o archivo Resica')
                        currentCatalogDirectory = ''
                        currentVersion = ''
                    }
                })
        } else {
            showNotification('El elemento seleccionado no es un directorio o archivo Resica')
            currentCatalogDirectory = ''
            currentVersion = ''
        }
    })
})

function validateResicaDirectory(_path, type = 'category', currentDeep = 0, root = '') {
    if (root && root === _path) {
        console.log('reach root directory')
        return false
    }
    const targetDirectory = type === 'version' || type === 'category' ? path.dirname(_path) : _path
    console.log('path to evaluate: ', _path)
    console.log('target directory: ', targetDirectory)

    if (type !== 'category') {
        return readdir(targetDirectory).then(files => {
            console.log('files inside directory', files)
            if (files.includes('info.json') && files.includes('company-logo.png')) {
                console.log(`it is a ${type} directory!`)
                const info = loadInfo(path.resolve(targetDirectory, 'info.json'))
                info.logoPath = path.resolve(targetDirectory, 'company-logo.png')
                return info
            }
        })
    } else {
        return readdir(targetDirectory).then(files => {
            console.log('files inside directory', files)
            if (files.includes('info.json') && files.includes('company-logo.png') && currentDeep === 0) {
                console.log('error')
                return false
            } else if (files.includes('info.json') && files.includes('company-logo.png') && currentDeep > 0) {
                console.log('it is a category directory!')
                return {
                    currentCatalogDirectory: targetDirectory,
                    currentVersion: _path
                }
            } else {
                return validateResicaDirectory(path.dirname(_path), 'category', currentDeep + 1, root)
            }
        })
    }
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
    document.getElementById('catalog-form').style.display = 'none'
    document.getElementById('notification-area').style.display = 'flex'
    notifMsg.innerText = message
    notifAct.innerText = ''
    //notifAct.innerHTML = `Seleccione otro directorio o <a href="#">cree una estructura de ejemplo</a>`
}

function showImagesList(images) {
    console.log('showImagesList')
    console.log('images: ', images)
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
    document.getElementById('catalog-form').style.display = 'none'
    document.getElementById('notification-area').style.display = 'none'
}

function showGeneralConfiguration(info) {
    document.getElementById('workspace').style.display = 'block'
    document.getElementById('catalog-resume').style.display = 'none'
    document.getElementById('notification-area').style.display = 'none'
    document.getElementById('catalog-form').style.display = 'block'
    document.getElementById('title').value = info.title
    document.getElementById('company').value = info.company
    document.getElementById('whatsapp').value = info.whatsapp
    document.getElementById('instagram').value = info.instagram
    document.getElementById('showCode').checked = !!info.fields.showCode
    document.getElementById('showName').checked = !!info.fields.showName
    document.getElementById('showDescription').checked = !!info.fields.showDescription
    document.getElementById('showPrices').checked = !!info.fields.showPrices
    document.getElementById('showObservations').checked = !!info.fields.showObservations

    console.log('showPrices: ', document.getElementById('showPrices').value)
}

function showProductInfo(itemName, itemPath) {
    document.getElementById('uploaderFileName').style.display = 'flex'
    document.getElementById('uploaderWallArt').style.display = 'flex'
    document.getElementById('uploaderFileName').innerText = itemName
    document.getElementById('itemImg').scr = itemPath
}

window.saveConfiguration = () => {
    console.log('saveConfiguration()')
    const configuration = {
        title: document.getElementById('title').value,
        company: document.getElementById('company').value,
        whatsapp: document.getElementById('whatsapp').value,
        instagram: document.getElementById('instagram').value,
        fields: {
            showCode: !!document.getElementById('showCode').checked,
            showName: !!document.getElementById('showName').checked,
            showDescription: !!document.getElementById('showDescription').checked,
            showPrices: !!document.getElementById('showPrices').checked,
            showObservations: !!document.getElementById('showObservations').checked
        }
    }
    fs.writeFileSync(path.resolve(currentCatalogDirectory, 'info.json'), JSON.stringify(configuration, null, 2), {
        encoding: 'utf8',
        flag: 'w'
    })

    event.preventDefault()
    showNotification('La configuración se guardó exitosamente')
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
