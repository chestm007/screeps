const carrierCreep = require('./creepRoleCarrier')

const EMPTY = 0
const FULL = 1

module.exports = {
    run: function(myCreep) {
        this.stateMachine(myCreep)
        
        switch (myCreep.memory.state) {
            case EMPTY:
                this.pickupEnergy(myCreep)
                break;
            case FULL:
                this.findTarget(myCreep)
                break;
        }
    },

    stateMachine: function(myCreep) {
        if (myCreep.memory.state == EMPTY && myCreep.carry[RESOURCE_ENERGY] == myCreep.carryCapacity) {
            myCreep.say('⚡');
            myCreep.memory.state = FULL
            delete myCreep.memory.target

        } else if (myCreep.memory.state == FULL && myCreep.carry[RESOURCE_ENERGY] == 0) {
            myCreep.say('🚫')
            myCreep.memory.state = EMPTY
            delete myCreep.memory.target
        } else if (myCreep.memory.state == undefined) {
            myCreep.memory.state = EMPTY
            delete myCreep.memory.target
        }
    },

    pickupEnergy: function(myCreep) {
        var ruin = myCreep.pos.findClosestByRange(FIND_RUINS)
        if (!_.isUndefined(ruin) && ruin != null) {
            if (ruin.store[RESOURCE_ENERGY] > 0) {
                myCreep.moveTo(ruin)
                myCreep.withdraw(ruin, RESOURCE_ENERGY)
                return
            }
        }
        var storage = myCreep.room.storage
        if (!_.isUndefined(storage) && storage != null) {
            myCreep.moveTo(storage)
            myCreep.withdraw(storage, RESOURCE_ENERGY)
            return
        }

        // mining containers?
        var containers = []
        myCreep.room.memory.sources.forEach(source_id => {
            var container = Game.getObjectById(source_id).container
            if (!_.isUndefined(container) && myCreep.room.creeps.carriers.filter(c => c.memory.target === container.id).length == 0) {
                containers.push(container)
            }
        });

        if (containers.length > 0) {
            containers.sort((a, b) => {
                return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]
            })
        
            // make sure we can get atleast as much as we carry from it.
            var container = containers[0]
            if (container.store[RESOURCE_ENERGY] >= (myCreep.carryCapacity - _.sum(myCreep.carry))) {
                myCreep.memory.target = container.id
                myCreep.withdraw(container, RESOURCE_ENERGY)
                myCreep.moveTo(container)
                return
            }
        }

        var droppedEnergy = myCreep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: function(resource) {
                if (resource.resourceType == RESOURCE_ENERGY) {
                    return resource.amount > myCreep.carryCapacity / 2 || resource.amount > myCreep.carryCapacity - _.sum(myCreep.carry)
                }
            }
        })

        if (!_.isUndefined(droppedEnergy)) {
            myCreep.moveTo(droppedEnergy)
            myCreep.pickup(droppedEnergy)
            return
        }

        if (myCreep.carry[RESOURCE_ENERGY] > (myCreep.carryCapacity / 2)) {
            delete myCreep.memory.target
            myCreep.memory.state = FULL
        }
    },
    findTarget: function(myCreep) {
        if (myCreep.room.towers.length == 0) {
            var damagedStructures = myCreep.room.structuresNeedRepair
            if (!_.isUndefined(damagedStructures)) {
                if (damagedStructures.length > 0) {
                    return myCreep.moveRepair(myCreep.pos.findClosestByPath(damagedStructures))
                }
            }    
        }
        
        var constructionSite = myCreep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (!_.isUndefined(constructionSite) && constructionSite != null) {
            myCreep.moveBuild(constructionSite)
            return
        }

        if (myCreep.room.towers.length == 0) {
            var damagedStructures = _.filter(this.myStructures, function(s) {
                if ((s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE || s.my || s.structureType == STRUCTURE_ROAD) && s.structureType != STRUCTURE_WALL  && s.structureType != STRUCTURE_RAMPART) {
                    if (s.hits < s.hitsMax) {
                        return s
                    }    
                }
    
                myCreep.moveRepair(myCreep.pos.findClosestByPath(damagedStructures))
                return
            })    
        }
    },

    bodyTypes: [
        [CARRY, MOVE, MOVE, WORK, CARRY, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK],
        [CARRY, MOVE, MOVE, WORK, CARRY, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK],
        [WORK, CARRY, MOVE, MOVE, WORK, CARRY, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [WORK, CARRY, MOVE, MOVE, WORK, CARRY, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE],
        [WORK, CARRY, MOVE, MOVE, WORK, CARRY, MOVE, MOVE],
        [WORK, CARRY, MOVE, MOVE]
    ]
        
}