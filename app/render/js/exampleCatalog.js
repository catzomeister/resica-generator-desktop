'use strict'

const info = {
    title: 'CATÁLOGO DE PRODUCTOS',
    company: 'Mi Cuadro EC',
    whatsapp: '0986605577',
    instagram: '@micuadro.ec',
    fields: {
        showCode: true,
        showName: false,
        showDescription: true,
        showPrices: true,
        showObservations: false
    }
}

const descriptor = [
    {
        code: 'MC-CUA-COC-002',
        name: 'MC-CUA-COC-002',
        description: 'Cuadro de cocina vintage nuevo',
        prices: [
            {
                size: '30 cm alto X 20 cm ancho',
                price: '$ 15'
            },
            {
                size: '40 cm alto X 30 cm ancho',
                price: '$ 25'
            },
            {
                size: '50 cm alto X 40 cm ancho',
                price: '$ 35'
            }
        ],
        observations: 'N/A',
        status: 'ACT'
    },
    {
        code: 'MC-CUA-COC-001',
        name: 'MC-CUA-COC-001',
        description: 'Cuadro de cocina, diseño original y moderno',
        prices: [
            {
                size: '30 cm alto X 20 cm ancho',
                price: '$ 15'
            },
            {
                size: '40 cm alto X 30 cm ancho',
                price: '$ 25'
            },
            {
                size: '50 cm alto X 40 cm ancho',
                price: '$30'
            }
        ],
        observations: 'Preferido por madres modernas y hipsters',
        status: 'ACT'
    }
]

module.exports = {
    info,
    descriptor
}
