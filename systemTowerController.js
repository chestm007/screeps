module.exports = {
    run: function(room) {
        var healers = false
        if (room.underAttack) {
            room.hostileCreeps.forEach(c => {
                c.body.forEach(b => {
                    if (b.type == HEAL) {
                        healers = true
                    }
                })
            })
        }

        if (room.underAttack && !healers) {
            room.towers.forEach(tower => {
                return tower.attack(tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS))
            })
    
        } else {
            if (room.energyAvailable == room.energyCapacityAvailable) {
                var wallsAndRamparts = _.filter(room.structures, function(s) {
                    if (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) {
                        return s
                    }
                })
                var weakestDefensiveStructure = wallsAndRamparts.sort((a, b) => (a.hits > b.hits) ? 1 : -1)[0]
                if (!_.isUndefined(weakestDefensiveStructure)) {
                    
                    var targetHits = 0
                    if (_.isUndefined(room.storage)) {
                        targetHits = 20000
                    } else if(room.controller.level < 8) {
                        targetHits = 1000000
                    } else {
                        targetHits = 1800000
                    }
                    if (weakestDefensiveStructure.hits > targetHits) {
                        return
                    }

                    room.towers.forEach(tower => {
                        if (tower.energy >= 500) {
                            if (weakestDefensiveStructure.hits < room.storage.store[RESOURCE_ENERGY]) {
                                tower.repair(weakestDefensiveStructure)
                            } else if (!_.isUndefined(room.storage) && room.storage.store[RESOURCE_ENERGY] > 200000) {
                                tower.repair(weakestDefensiveStructure)
                            }
                        }
                    })
                }
            } else {
                var struct = room.structuresNeedRepair[0]
                room.towers.forEach(tower => {
                    tower.repair(tower.room.wallsAndRampartsCloseToExpiring[0])
                    tower.repair(struct)                       
                })
            }
        }
    }
}