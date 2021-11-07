'use strict'

const dragDrop = require('drag-drop')
const { ipcRenderer } = require('electron')
const remote = require('@electron/remote')
const { stat, readdir } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const dom = require('./resicaDom')
const _ = require('lodash')
const exampleCatalog = require('./exampleCatalog')
const { log } = require('../../utils/logger')
const { loadInfo, loadDescriptor } = require('../../utils/filesystem')

displayInitialScreen()

let currentCatalogDirectory = ''
let currentVersion = ''
let currentCategoryDirectory = ''
let currentDirectory = ''
const idGenerator = ids()

dragDrop('#uploader', (files, pos, fileList, directories) => {
    log.debug('dragDrop()')
    log.debug('$fileList', fileList)
    log.debug('$directories: ', directories)
    const fsItemName = fileList[0].name
    const fsItemPath = fileList[0].path
    log.debug('$fsItemName', fsItemName)
    log.debug('$fsItemPath', fsItemPath)
    const root = path.parse(fsItemPath).root

    stat(fsItemPath).then(s => {
        if (s.isDirectory()) {
            validateResicaDirectory(fsItemPath, 'version')
                .then(info => {
                    log.debug('*** VERSION BLOCK *** $info', info)
                    if (info) {
                        showPreviewInfo(info, fsItemName)
                        currentVersion = fsItemName
                        currentCatalogDirectory = path.dirname(fsItemPath)
                        return true
                    }
                    return false
                })
                .then(isResicaDirectory => {
                    if (!isResicaDirectory) {
                        return validateResicaDirectory(fsItemPath, 'company').then(info => {
                            log.debug('*** COMPANY BLOCK *** $info', info)
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
                        log.debug('$fsItemPath category block: ', fsItemPath)
                        return validateResicaDirectory(fsItemPath, 'category', 0, root).then(info => {
                            log.debug('*** CATEGORY BLOCK *** $info', info)
                            if (info) {
                                return readdir(fsItemPath).then(images => {
                                    currentCatalogDirectory = info.currentCatalogDirectory
                                    currentVersion = info.currentVersion
                                    currentCategoryDirectory = fsItemPath
                                    const descriptor =
                                        loadDescriptor(currentCategoryDirectory)
                                    if (!_.isEmpty(descriptor)) {
                                        showImagesList(images, descriptor)
                                    } else {
                                        showNotification(
                                            'El elemento seleccionado no es un directorio o archivo Resica',
                                            false
                                        )
                                    }
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
                    log.debug('FINAL $isResicaDirectory', isResicaDirectory)
                    if (!isResicaDirectory) {
                        log.debug('its other file?')
                        showNotification('El elemento seleccionado no es un directorio o archivo Resica', true)
                        currentCatalogDirectory = ''
                        currentVersion = ''
                        currentCategoryDirectory = ''
                        currentDirectory = fsItemPath
                    }
                })
        } else if (s.isFile() && fsItemName === 'info.json') {
            const info = loadInfo(fsItemPath)
            log.debug('*** is info.json?  *** $info: ', info)
            showGeneralConfiguration(info)
            currentCatalogDirectory = path.dirname(fsItemPath)
            currentVersion = ''
        } else if (s.isFile() && fsItemName === 'descriptor.json') {
            log.debug('$fsItemPath descriptor block: ', fsItemPath)
            const descriptorDirectory = path.dirname(fsItemPath)
            return validateResicaDirectory(descriptorDirectory, 'category', 0, root).then(info => {
                log.debug('*** DESCRIPTOR BLOCK *** $info', info)
                if (info) {
                    return readdir(descriptorDirectory).then(images => {
                        currentCatalogDirectory = info.currentCatalogDirectory
                        currentVersion = info.currentVersion
                        currentCategoryDirectory = descriptorDirectory
                        const descriptor = loadDescriptor(fsItemPath)
                        if (!_.isEmpty(descriptor)) {
                            showImagesList(images, descriptor)
                            return true
                        } else {
                            showNotification('El elemento seleccionado no es un directorio o archivo Resica')
                            currentCatalogDirectory = ''
                            currentVersion = ''
                            currentCategoryDirectory = ''
                            return false
                        }
                    })
                }

                return false
            })
        } else if (s.isFile() && (fsItemName.endsWith('.jpg') || fsItemName.endsWith('.png'))) {
            // the image must be located inside a category directory
            validateResicaDirectory(fsItemPath, 'category', 0, root)
                .then(info => {
                    log.debug('*** IMAGE BLOCK ***', info)
                    if (info) {
                        currentCatalogDirectory = info.currentCatalogDirectory
                        currentVersion = info.currentVersion
                        currentCategoryDirectory = path.dirname(fsItemPath)
                        log.debug('IMAGE PARTY: ', fsItemName)
                        //////////////
                        const descriptor =
                            loadDescriptor(currentCategoryDirectory)
                        let product = descriptor.find(p => p.code === path.parse(fsItemName).name)
                        /////////////
                        if (!product) {
                            product = {
                                code: path.parse(fsItemName).name,
                                name: '',
                                description: '',
                                observations: '',
                                status: 'ACT',
                                prices: []
                            }
                        }
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
        log.debug('reach root directory')
        return false
    }
    const targetDirectory = type === 'version' || type === 'category' ? path.dirname(_path) : _path
    log.debug('path to evaluate: ', _path)
    log.debug('target directory: ', targetDirectory)

    if (type !== 'category') {
        return readdir(targetDirectory).then(files => {
            log.debug('files inside directory', files)
            if (files.includes('info.json') && files.includes('company-logo.png')) {
                log.debug(`it is a ${type} directory!`)
                const info = loadInfo(targetDirectory)
                info.logoPath = path.resolve(targetDirectory, 'company-logo.png')
                return info
            }
        })
    } else {
        return readdir(targetDirectory).then(files => {
            log.debug('files inside directory', files)
            if (files.includes('info.json') && files.includes('company-logo.png') && currentDeep === 0) {
                log.debug('error')
                return false
            } else if (files.includes('info.json') && files.includes('company-logo.png') && currentDeep > 0) {
                log.debug('it is a category directory!')
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

/* function loadInfo(infoPath) {
    if (infoPath) {
        const infoRaw = fs.readFileSync(infoPath)
        return JSON.parse(infoRaw)
    }
} */

function showNotification(message, showCreateCatalogDirectoryButton) {
    const notifMsg = document.getElementById('notification-text')
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
        .setStyleDisplay(dom.DISPLAY_NONE, [
            'catalog-resume',
            'catalog-form',
            'item-form',
            'uploaderFileName',
            'uploaderCategoryFiles',
            'uploaderWallArt'
        ])
        .setStyleDisplay(dom.DISPLAY_FLEX, ['notification-area'])

    notifMsg.innerText = message

    if (showCreateCatalogDirectoryButton) {
        dom.setStyleDisplay(dom.DISPLAY_FLEX, ['notification-action'])
    } else {
        dom.setStyleDisplay(dom.DISPLAY_NONE, ['notification-action'])
    }
}

function showImagesList(fileNames, descriptor) {
    if (!_.isEmpty(fileNames)) {
        log.debug('showImagesList')

        const imageNames = fileNames.filter(fsItemName => fsItemName.endsWith('.jpg') || fsItemName.endsWith('.png'))
        let images = imageNames.map(imageName => {
            const parsedPath = path.parse(imageName)
            return {
                name: parsedPath.name,
                ext: parsedPath.ext
            }
        })
        images = _.sortBy(
            _.uniqBy(images, img => img.name),
            ['name']
        )
        log.debug('$images: ', images)

        const categoryProductsDataList = document.getElementById('categoryProductsDataList')
        while (categoryProductsDataList.firstChild) {
            categoryProductsDataList.removeChild(categoryProductsDataList.lastChild)
        }

        images.forEach(productImage => {
            const newOptionElement = document.createElement('option')
            newOptionElement.textContent = productImage.name
            newOptionElement.setAttribute('data-file-ext', productImage.ext)
            newOptionElement.onclick = function (event) {
                log.debug('click on option!')
            }
            categoryProductsDataList.appendChild(newOptionElement)
        })

        showCategoryFilesSelector()
    }
}

function showCategoryFilesSelector() {
    document.getElementById('selectedProduct').value = ''
    dom.setStyleDisplay(dom.DISPLAY_NONE, ['uploaderFileName', 'uploaderWallArt', 'workspace']).setStyleDisplay(
        dom.DISPLAY_FLEX,
        ['uploaderCategoryFiles']
    )
}

function displayInitialScreen() {
    dom.setStyleDisplay(dom.DISPLAY_NONE, dom.INITIAL_STATUS)
}

function showPreviewInfo(info, version) {
    log.debug('$info: ', info)
    dom.setInnerText(info.title, ['title'])
        .setInnerText(info.company, ['company-text'])
        .setInnerText(version, ['version-text'])
        .setScr(info.logoPath, ['logo-img'])
        .setScr(`© ${info.company} ${new Date().getFullYear()}`, ['copyright-text'])
        .setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
        .setStyleDisplay(dom.DISPLAY_FLEX, ['catalog-resume'])
        .setStyleDisplay(dom.DISPLAY_NONE, [
            'notification-area',
            'catalog-form',
            'item-form',
            'uploaderFileName',
            'uploaderCategoryFiles',
            'uploaderWallArt'
        ])
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
    log.debug('showPrices: ', document.getElementById('showPrices').value)
}

function showProductInfo(itemName, itemPath, product, showProductsList) {
    dom.setStyleDisplay(dom.DISPLAY_FLEX, ['uploaderFileName', 'uploaderWallArt'])
        .setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'item-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'notification-area', 'catalog-form'])
        .setInnerText(itemName, ['uploaderFileName'])
        .setScr(itemPath, ['itemImg'])

    showProductsList
        ? dom.setStyleDisplay(dom.DISPLAY_FLEX, ['uploaderCategoryFiles'])
        : dom.setStyleDisplay(dom.DISPLAY_NONE, ['uploaderCategoryFiles'])

    if (product) {
        dom.setValue(product.code, ['code'])
            .setValue(product.name, ['name'])
            .setValue('', ['size'])
            .setValue('', ['price'])
            .setValue(product.description, ['description'])
            .setValue(product.observations, ['observations'])
            .setChecked(product.status === 'ACT' ? true : false, ['active'])

        const pricesTable = document.getElementById('pricesTable')
        log.debug('$pricesTable: ', pricesTable.rows)
        const pricesTableLength = pricesTable.rows.length
        for (let i = 1; i < pricesTableLength; i++) {
            log.debug('index: ', i, pricesTableLength)
            pricesTable.deleteRow(-1)
        }
        log.debug('product.prices: ', JSON.stringify(product.prices, null, 2))
        product?.prices?.forEach(p => {
            window.addPrice({ value: p.size }, { value: p.price })
        })
    }
}

window.saveConfiguration = () => {
    log.debug('saveConfiguration()')
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
    log.debug('Generating PDF...')

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
        showDialog({
            title: 'Operación no completada',
            content: 'Debe ingresar el tamaño y el precio',
            dialogType: 'error'
        })
        return
    }

    const pricesTable = document.getElementById('pricesTableBody')
    const newPriceRow = pricesTable.insertRow(-1)
    const newPriceId = `priceRow${idGenerator.next().value}`
    newPriceRow.id = newPriceId
    log.debug('$newPriceRow: ', newPriceRow)
    log.debug('$newPriceId: ', newPriceId)
    const newSize = newPriceRow.insertCell(0)
    const newPrice = newPriceRow.insertCell(1)
    const newRemove = newPriceRow.insertCell(2)
    newSize.innerHTML = size.value
    newPrice.innerHTML = price.value
    newRemove.innerHTML = `<input type="button" value="Remover" style="background-color: #f44336" onclick="removePrice('${newPriceId}')" />`
}

window.removePrice = priceId => {
    log.debug('id to remove: ', priceId)
    const selectedRowIndex = document.getElementById(priceId).rowIndex
    log.debug('row index to remove: ', selectedRowIndex)
    pricesTable.deleteRow(selectedRowIndex)
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

    const productForm = {
        code: dom.getValue('code'),
        name: dom.getValue('name'),
        description: dom.getValue('description'),
        prices: pricesData,
        observations: dom.getValue('observations'),
        status: dom.getChecked('active') ? 'ACT' : 'INA'
    }

    log.debug('***** --- *****')
    log.debug('saving product: ', productForm)
    log.debug('currentCatalogDirectory', currentCatalogDirectory)
    log.debug('currentVersion', currentVersion)
    log.debug('currentCategoryDirectory', currentCategoryDirectory)
    //read the file
    const existingDescriptor = loadDescriptor(currentCategoryDirectory)
    const newDescriptor = existingDescriptor.filter(p => p.code !== productForm.code)
    //find the code
    const existingProduct = existingDescriptor.find(p => p.code === productForm.code) || {}
    const newProduct = _.merge({}, existingProduct, productForm)
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
    showDialog({ title: 'Operación completada', content: 'El producto se guardó exitosamente', dialogType: 'message' })
}

window.onInputCategoryProductsDatalistItem = () => {
    const value = document.getElementById('selectedProduct').value
    const opts = document.getElementById('categoryProductsDataList').childNodes

    for (const opt of opts) {
        if (opt.value === value) {
            // An item was selected from the list
            log.debug('$opt: ', opt)
            log.debug('$value: ', value)
            const fileExt = opt.getAttribute('data-file-ext')
            log.debug('fileExt: ', fileExt)
            const itemPath = path.resolve(currentCategoryDirectory, `${value}${fileExt}`)
            const descriptor = loadDescriptor(currentCategoryDirectory)
            let product = descriptor.find(p => p.code === value)
            showProductInfo(value, itemPath, product, true)
            break
        }
    }
}

/* function loadDescriptor(descriptorPath) {
    if (descriptorPath) {
        try {
            const descriptorRaw = fs.readFileSync(descriptorPath)
            return JSON.parse(descriptorRaw)
        } catch (error) {
            log.debug('Error on loadDescriptor: ', error)
            return []
        }
    }
} */

function showDialog({ title, content, dialogType }) {
    if (dialogType === 'error') {
        remote.dialog.showErrorBox(title, content)
    } else if (dialogType === 'message') {
        remote.dialog.showMessageBox({ title, message: content, type: 'info' })
    } else if (dialogType === 'question') {
        const clicked = remote.dialog.showMessageBoxSync(remote.getCurrentWindow(), {
            title,
            message: content,
            type: dialogType,
            buttons: ['Sí', 'No'],
            defaultId: 0,
            cancelId: 1
        })
        log.debug('clicked: ', clicked)
        return clicked === 0
    }
}

function* ids() {
    let index = 0
    while (true) {
        yield index++
    }
}

window.createExampleCatalog = () => {
    if (
        showDialog({
            title: 'Confirmación',
            content: `Está seguro de que desea crear un nuevo directorio de catálogo en ${currentDirectory}?`,
            dialogType: 'question'
        })
    ) {
        try {
            if (fs.readdirSync(currentDirectory).length > 0) {
                showDialog({
                    title: 'Error',
                    content: 'El directorio del nuevo catálogo debe estar vacío',
                    dialogType: 'error'
                })
                return
            }

            // Create Resica Example Directory Structure
            log.debug('Creating Example Catalog')
            fs.writeFileSync(
                path.resolve(currentDirectory, 'info.json'),
                JSON.stringify(exampleCatalog.info, null, 2),
                {
                    encoding: 'utf8',
                    flag: 'w'
                }
            )
            fs.copyFileSync(
                path.resolve(path.dirname(__dirname), 'assets/company-logo.png'),
                path.resolve(currentDirectory, 'company-logo.png')
            )
            const exampleVersion = path.resolve(currentDirectory, 'VERSION 2021-08-01 (EJEMPLO)')
            if (!fs.existsSync(exampleVersion)) {
                fs.mkdirSync(exampleVersion)
            }
            const exampleCategory = path.resolve(exampleVersion, 'COCINA (EJEMPLO)')
            if (!fs.existsSync(exampleCategory)) {
                fs.mkdirSync(exampleCategory)
            }
            fs.writeFileSync(
                path.resolve(exampleCategory, 'descriptor.json'),
                JSON.stringify(exampleCatalog.descriptor, null, 2),
                {
                    encoding: 'utf8',
                    flag: 'w'
                }
            )
            fs.copyFileSync(
                path.resolve(path.dirname(__dirname), 'assets/MC-CUA-COC-001.jpg'),
                path.resolve(exampleCategory, 'MC-CUA-COC-001.jpg')
            )
            fs.copyFileSync(
                path.resolve(path.dirname(__dirname), 'assets/MC-CUA-COC-002.jpg'),
                path.resolve(exampleCategory, 'MC-CUA-COC-002.jpg')
            )
            log.debug('Example Catalog Created Successfully')
            displayInitialScreen()
            showNotification('El nuevo catálogo fue creado exitosamente')
        } catch (err) {
            log.error('Error on createExampleCatalog: ', err)
        }
    }
}
