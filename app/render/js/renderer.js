const dragDrop = require('drag-drop')
const { ipcRenderer } = require('electron')
const { stat, readdir, readFile } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const dom = require('./resicaDom')

displayInitialScreen()

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
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'catalog-form'])
        .setStyleDisplay(dom.DISPLAY_FLEX, ['notification-area'])

    notifMsg.innerText = message
    notifAct.innerText = ''
    //notifAct.innerHTML = `Seleccione otro directorio o <a href="#">cree una estructura de ejemplo</a>`
}

function showImagesList(images) {
    console.log('showImagesList')
    console.log('images: ', images)
}

function displayInitialScreen() {
    dom.setStyleDisplay(dom.DISPLAY_NONE, dom.INITIAL_STATUS)
}

function showPreviewInfo(info, version) {
    console.log('info: ', info)
    dom.setInnerText(info.title, ['title'])
        .setInnerText(info.company, ['company-text'])
        .setInnerText(version, ['version-text'])
        .setScr(info.logoPath, ['logo-img'])
        .setScr(`© ${info.company} ${new Date().getFullYear()}`, ['copyright-text'])
        .setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
        .setStyleDisplay(dom.DISPLAY_FLEX, ['catalog-resume'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['notification-area', 'catalog-form'])
}

function showGeneralConfiguration(info) {
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'catalog-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'notification-area'])
        .setValue(info.title, ['title'])
        .setValue(info.company, ['company'])
        .setValue(info.whatsapp, ['whatsapp'])
        .setValue(info.instagram, ['instagram'])
        .setChecked(!!info.fields.showCode, ['showCode'])
        .setChecked(!!info.fields.showName, ['showName'])
        .setChecked(!!info.fields.showDescription, ['showDescription'])
        .setChecked(!!info.fields.showPrices, ['showPrices'])
        .setChecked(!!info.fields.showObservations, ['showObservations'])
    console.log('showPrices: ', document.getElementById('showPrices').value)
}

function showProductInfo(itemName, itemPath) {
    dom.setStyleDisplay(dom.DISPLAY_FLEX, ['uploaderFileName', 'uploaderWallArt'])
        .setInnerText(itemName, ['uploaderFileName'])
        .setScr(itemPath, ['itemImg'])
}

window.saveConfiguration = () => {
    console.log('saveConfiguration()')
    const configuration = {
        title: dom.getValue('title'), 
        company: dom.getValue('company'), 
        whatsapp: dom.getValue('whatsapp'), 
        instagram: dom.getValue('instagram'), 
        fields: {
            showCode: !!dom.getChecked('showCode'), 
            showName: !!dom.getChecked('showName'), 
            showDescription: !!dom.getChecked('showDescription'), 
            showPrices: !!dom.getChecked('showPrices'), 
            showObservations: !!dom.getChecked('showObservations') 
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

        dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
            .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume'])
            .setStyleDisplay(dom.DISPLAY_FLEX, ['notification-area'])

        if (success) {
            notifMsg.innerText = 'Catálogo PDF generado exitosamente'
        } else {
            notifMsg.innerText = 'Catálogo PDF no generado'
        }
    })
}
