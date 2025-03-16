const R = STRUCTURE_ROAD
const V = undefined
const E = STRUCTURE_EXTENSION
const T = STRUCTURE_TOWER
const M = STRUCTURE_TERMINAL
const S = STRUCTURE_STORAGE
const L = STRUCTURE_LINK
const N = STRUCTURE_NUKER
const O = STRUCTURE_OBSERVER
const B = STRUCTURE_LAB

plans = { 
    lab: {
        origin: {x: 2, y: 2},
        space: 3,
        cLevel: {
            6: [
                [V,B],
                [B,B],
            ], 
            7: [
                [V,B,V,B,V],
                [B,B,V,B,B],
            ],
            8: [
                [V,B,V,B,V],
                [B,B,V,B,B],
                [V,V,B,V,V],
                [V,V,B,V,V],
                [V,B,V,B,V]
            ]
        }
    },
    nexus: {
        origin: {x: 1, y: 2},
        space: 3,
        cLevel: {
            3: [
                [T,V,V],
                [V,V,V],
                [V,S,V],
                [V,V,V],
                [V,V,V]
            ],
            4: [
                [T,V,V],
                [V,V,V],
                [V,S,V],
                [V,V,V],
                [V,V,V],
            ],
            8: [
                [T,M,T],
                [V,V,V],
                [T,S,T],
                [V,V,V],
                [T,L,T]
            ]
        }
    }
}

module.exports.getPlans = function(structureType) {
    return plans[structureType]
}