const distanceTransform = require('./functionDistanceTransform')
const plans = require('./templateBasePlans')

module.exports = {
    run: function(room) {
        // every 100 ticks, check vital infrastructure exists
        if (!_.isUndefined(room.controller) && room.controller.my && room.find(FIND_CONSTRUCTION_SITES).length == 0) {
            if (_.isUndefined(room.spawns[0])) {
                return
            }

            // mining container
            room.sources.forEach(source => {
                if(_.isUndefined(source.container)) {
                    source.containerPos.createConstructionSite(STRUCTURE_CONTAINER)
                }
            })

            // controller container
            if (_.isUndefined(room.controller.container)) {
                room.controller.containerPos.createConstructionSite(STRUCTURE_CONTAINER)
            }

            // main storage
            if (_.isUndefined(room.storage) && room.controller.level >= 4) {
                for (var f in Game.flags) {
                    var flag = Game.flags[f]
                    if (flag.name.endsWith('storage') || flag.room.name == room.name) {
                        if (flag.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(e => e.structureType == STRUCTURE_STORAGE).length == 0) {
                            flag.pos.createConstructionSite(STRUCTURE_STORAGE)
                            flag.remove()
                        }
                    }
                }
            }

            if (room.controller.level >= 5) {
                // controller link
                if (_.isUndefined(room.controller.link)) {
                    room.controller.linkPos.createConstructionSite(STRUCTURE_LINK)
                }

                // master link
                if (_.isUndefined(room.masterLink)) {
                    if (!_.isUndefined(room.storage)) {
                        const masterLinkPos = room.getPositionAt(room.storage.pos.x, room.storage.pos.y + 2)
                        masterLinkPos.createConstructionSite(STRUCTURE_LINK)
                    }
                }

                // extractor
                if (_.isUndefined(room.mineral.extractor)) {
                    if (!_.isUndefined(room.storage)) {
                        room.mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR)
                    }
                }

                if (!_.isUndefined(room.mineral.extractor)) {
                    if (_.isUndefined(room.mineral.container)) {
                        room.mineral.containerPos.createConstructionSite(STRUCTURE_CONTAINER)
                    }
                }

                if (!_.isUndefined(room.storage) && (room.labs.length < CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level])) {
                    const labPlan = plans.getPlans(STRUCTURE_LAB)
                    const labPos = distanceTransform.findClosestPositionWithSpace(room.storage, labPlan.space)
                    labPlan.cLevel[room.controller.level].forEach((row, x) => {
                        row.forEach((structure, y) => {
                            if (!_.isUndefined(structure)) {
                                room.getPositionAt((labPos.x - labPlan.origin.x) + x, (labPos.y - labPlan.origin.y) + y).createConstructionSite(structure)
                            }
                        })
                    })
                }
            }

            if (room.controller.level >= 6) {
                // terminal
                if (_.isUndefined(room.terminal)) {
                    if (!_.isUndefined(room.storage)) {
                        const terminalPos = room.getPositionAt(room.storage.pos.x, room.storage.pos.y - 2)
                        terminalPos.createConstructionSite(STRUCTURE_TERMINAL)
                    }
                }
            }


            // T T
            //
            // TST
            //
            // T T
            var towerLayout = [
                [-1, -2], [-1, 0], [-1, 2], [1, -2], [1, 0], [1, 2]
            ]

            if (!_.isUndefined(room.storage)) {
                if (room.towers.length < CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level]) {
                    towerLayout.some(x => {
                        const towerPos = room.getPositionAt(room.storage.pos.x + x[0], room.storage.pos.y + x[1])
                        if (towerPos.lookFor(LOOK_STRUCTURES).filter(e => e.structureType == STRUCTURE_TOWER).length == 0) {
                            if (towerPos.createConstructionSite(STRUCTURE_TOWER) == OK) {
                                console.log(room.name + ': building tower at ' + towerPos)
                                return true;
                            }    
                        }
                    })                   
                } else {
                    [-1, 0, 1].forEach(x => {
                        [-2, -1, 0, 1, 2].forEach(y => {
                            const rampartPos = room.getPositionAt(room.storage.pos.x + x, room.storage.pos.y + y)
                            // create rampart if one isnt there already
                            if (rampartPos.lookFor(LOOK_STRUCTURES).filter(e => e.structureType == STRUCTURE_RAMPART).length == 0) {
                                if (rampartPos.createConstructionSite(STRUCTURE_RAMPART) == OK) {
                                    console.log(room.name + ': building rampart at ' + rampartPos)
                                }
                            }
                        })
                    })
                }
            }
        }

    }
}