const dragDrop = require('drag-drop')
const { ipcRenderer, remote } = require('electron')
const { stat, readdir, readFile } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const dom = require('./resicaDom')
const _ = require('lodash')

displayInitialScreen()

let currentCatalogDirectory = ''
let currentVersion = ''
let currentCategoryDirectory = ''

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
                                    currentCategoryDirectory = fsItemPath
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
            currentCatalogDirectory = path.dirname(fsItemPath)
            currentVersion = ''
        } else if (s.isFile() && (fsItemName.endsWith('.jpg') || fsItemName.endsWith('.png'))) {
            // la imagen debe encontrarse dentro de un category directory
            validateResicaDirectory(fsItemPath, 'category', 0, root)
                .then(info => {
                    console.log('*** IMAGE BLOCK ***', info)
                    if (info) {
                        currentCatalogDirectory = info.currentCatalogDirectory
                        currentVersion = info.currentVersion
                        currentCategoryDirectory = path.dirname(fsItemPath)
                        console.log('IMAGE PARTY: ', fsItemName)
                        //////////////
                        const descriptor =
                            loadDescriptor(path.resolve(currentCategoryDirectory, 'descriptor.json')) || []
                        const product = descriptor.find(p => p.code === path.parse(fsItemName).name)
                        /////////////
                        showProductInfo(fsItemName, fsItemPath, product)
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
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'catalog-form', 'item-form'])
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
        .setStyleDisplay(dom.DISPLAY_NONE, ['notification-area', 'catalog-form', 'item-form'])
}

function showGeneralConfiguration(info) {
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'catalog-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'notification-area', 'item-form'])
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

function showProductInfo(itemName, itemPath, product) {
    dom.setStyleDisplay(dom.DISPLAY_FLEX, ['uploaderFileName', 'uploaderWallArt'])
        .setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'item-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'notification-area', 'catalog-form'])
        .setInnerText(itemName, ['uploaderFileName'])
        .setScr(itemPath, ['itemImg'])

    if (product) {
        dom.setValue(product.code, ['code'])
            .setValue(product.name, ['name'])
            .setValue(product.description, ['description'])
            .setValue(product.observations, ['observations'])
            .setChecked(product.status === 'ACT' ? true : false, ['active'])

        const pricesTable = document.getElementById('pricesTable')
        console.log('*pricesTable: ', pricesTable.rows)
        const pricesTableLength = pricesTable.rows.length
        for (let i = 1; i < pricesTableLength; i++) {
            console.log('index: ', i, pricesTableLength)
            pricesTable.deleteRow(-1)
        }
        console.log('product.prices: ', JSON.stringify(product.prices, null, 2))
        product?.prices?.forEach(p => {
            window.addPrice({ value: p.size }, { value: p.price })
        })
    }
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

window.addPrice = (size = document.getElementById('size'), price = document.getElementById('price')) => {
    if (!size.value || !price.value) {
        remote.dialog.showErrorBox('Datos incorrectos', 'Debe ingresar el tamaño y el precio')
        return
    }

    const pricesTable = document.getElementById('pricesTable')
    //console.log('pricesTable: ', pricesTable.rows)
    const newPriceRow = pricesTable.insertRow(-1)
    const newSize = newPriceRow.insertCell(0)
    const newPrice = newPriceRow.insertCell(1)
    const newRemove = newPriceRow.insertCell(2)
    newSize.innerHTML = size.value
    newPrice.innerHTML = price.value
    newRemove.innerHTML = `<input type="button" value="Remover" style="background-color: #f44336" onclick="removePrice(${newPriceRow.rowIndex})" />`

    /* const pricesData = []
    for (let i = 1; i < pricesTable.rows.length; i++) {
        const element = pricesTable.rows[i]
        pricesData.push({
            size: element.cells[0].innerText,
            price: element.cells[1].innerText
        })
    }
    console.log('pricesData: ', pricesData) */
}

window.removePrice = index => {
    const pricesTable = document.getElementById('pricesTable')
    pricesTable.deleteRow(index)
}

window.saveProduct = () => {
    const pricesTable = document.getElementById('pricesTable')
    const pricesData = []
    for (let i = 1; i < pricesTable.rows.length; i++) {
        const element = pricesTable.rows[i]
        pricesData.push({
            size: element.cells[0].innerText,
            price: element.cells[1].innerText
        })
    }

    pricesData.sort()

    const formProduct = {
        code: dom.getValue('code'),
        name: dom.getValue('name'),
        description: dom.getValue('description'),
        prices: pricesData,
        observations: dom.getValue('observations'),
        status: dom.getChecked('active') ? 'ACT' : 'INA'
    }

    console.log('***** --- *****')
    console.log('saving product: ', formProduct)
    console.log('currentCatalogDirectory', currentCatalogDirectory)
    console.log('currentVersion', currentVersion)
    console.log('currentCategoryDirectory', currentCategoryDirectory)
    //read the file
    const existingDescriptor = loadDescriptor(path.resolve(currentCategoryDirectory, 'descriptor.json')) || []
    const newDescriptor = existingDescriptor.filter(p => p.code !== formProduct.code)
    //find the code
    const existingProduct = existingDescriptor.find(p => p.code === formProduct.code) || {}
    const newProduct = _.merge({}, existingProduct, formProduct)
    //save the new product
    newDescriptor.push(newProduct)
    //order by name

    //save the file
    fs.writeFileSync(
        path.resolve(currentCategoryDirectory, 'descriptor.json'),
        JSON.stringify(newDescriptor, null, 2),
        {
            encoding: 'utf8',
            flag: 'w'
        }
    )

    event.preventDefault()
    showNotification('El producto se guardó exitosamente')
}

function loadDescriptor(descriptorPath) {
    if (descriptorPath) {
        const descriptorRaw = fs.readFileSync(descriptorPath)
        return JSON.parse(descriptorRaw)
    }
}
