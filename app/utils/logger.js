'use strict'

const log = require('electron-log')
//log.transports.console.level = 'debug'
log.transports.console.level = 'error'

const createLog = {
    INFO:
        prefix =>
        (...params) =>
            log.info(prefix, ...params),
    DEBUG:
        prefix =>
        (...params) =>
            log.debug(prefix, ...params),
    ERROR:
        prefix =>
        (...params) =>
            log.error(prefix, ...params)
}

module.exports = {
    log,
    createLog
}
