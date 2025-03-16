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
                var target = Game.getObjectById(myCreep.memory.target)
                if (target != null || _.isUndefined(target)) {
                    if (myCreep.moveTransfer(target, RESOURCE_ENERGY) == OK) {
                        return
                    }
                } else {
                    this.findTarget(myCreep)
                }        
                break;
        }
    },
    
    stateMachine: function(myCreep) {
        if (myCreep.memory.state == EMPTY && myCreep.store.getFreeCapacity() == 0) {
            myCreep.say('⚡');
            delete myCreep.memory.target
            myCreep.memory.state = FULL

        } else if (myCreep.memory.state == FULL && myCreep.store.getUsedCapacity() == 0) {
            myCreep.say('🚫')
            myCreep.memory.state = EMPTY
            delete myCreep.memory.target
        } else if (myCreep.memory.state == undefined) {
            myCreep.memory.state = EMPTY
        }
    },

    pickupEnergy: function(myCreep) {
        // check if we have a target lock already
        if (!_.isUndefined(myCreep.memory.target)) {
            var target = Game.getObjectById(myCreep.memory.target)

            // check if the target still exists
            if (target != null) {

                // assume its energy
                switch (myCreep.pickup(target)) {
                    case ERR_INVALID_TARGET:
                        // if it isnt, assume its a tombstone
                        target.store.listResources().forEach(resource => {
                            // dont take energy from the controller container, only take minerals
                            
                            if (resource == RESOURCE_ENERGY) {
                                switch (myCreep.withdraw(target, resource)) {
                                    case ERR_NOT_IN_RANGE:
                                        if (target.store[resource] == 0) {
                                            delete myCreep.memory.target
                                        }
                                        myCreep.moveTo(target)
                                        break;
                                    case OK:
                                        delete myCreep.memory.target
                                        break;
                                }        
                            }
                        })
                        break;    
                    case ERR_NOT_IN_RANGE:
                        myCreep.moveTo(target)
                        break;
                    case OK:
                        delete myCreep.memory.target
                        break;
                }
                return
            }
        }

        var tombstone = myCreep.pos.findClosestByRange(FIND_TOMBSTONES, {
            filter: function(t) {
                return t.store.getUsedCapacity() > 0  && myCreep.room.creeps.carriers.filter(c => c.memory.target === t.id).length == 0
            }
        })
        if (tombstone != null) {
            if (tombstone.store.getUsedCapacity() < myCreep.carryCapacity) {
                myCreep.memory.target = tombstone.id
            }

            var resources = tombstone.store.listResources()
            for (r in resources) {
                switch (myCreep.withdraw(tombstone, resources[r])) {
                    case ERR_NOT_IN_RANGE:
                        myCreep.moveTo(tombstone)
                        break;
                    case OK:
                        delete myCreep.memory.target
                }                
            }
            return
        }
        // check mining containers
        var containers = []
        myCreep.room.memory.sources.forEach(source_id => {
            var container = Game.getObjectById(source_id).container
            if (!_.isUndefined(container)) {
                containers.push(container)
            }
        });

        if (containers.length > 0) {
            containers.sort((a, b) => {
                return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]
            })
        
            // make sure we can get atleast as much as we carry from it.
            var container = containers[0]
            if (container.store.getUsedCapacity() >= myCreep.store.getFreeCapacity()) {
                myCreep.memory.target = container.id
                container.store.listResources().forEach(r => {
                    switch (myCreep.withdraw(container, r)) {
                        case ERR_NOT_IN_RANGE:
                            myCreep.moveTo(container)
                    }                       
                })
                return
            }
        }

        // check for minerals in controller container
        if (!_.isUndefined(myCreep.room.controller.container)) {
            var yep = false
            myCreep.room.controller.container.store.listResources().forEach( r => {
                if (r != RESOURCE_ENERGY) {
                    myCreep.memory.target = myCreep.room.controller.container.id
                    switch (myCreep.withdraw(container, r)) {
                        case ERR_NOT_IN_RANGE:
                            myCreep.moveTo(myCreep.room.controller.container)
                    }
                    yep = true
                    return
                }
            })
            if (yep) {
                return
            }
        }

        // check mineral container
        if (!_.isUndefined(myCreep.room.mineral.container)) {
            if (myCreep.room.mineral.container.store.getUsedCapacity() > myCreep.store.getFreeCapacity()) {
                myCreep.room.mineral.container.store.listResources().forEach(r => {
                    myCreep.memory.target = myCreep.room.mineral.container.id
                    switch (myCreep.withdraw(myCreep.room.mineral.container, r)) {
                        case ERR_NOT_IN_RANGE:
                            myCreep.moveTo(myCreep.room.mineral.container)
                    }
                })
            }
        }
        
        // look for dropped energy
        var droppedEnergies = []
        var droppedEnergies = myCreep.room.find(FIND_DROPPED_RESOURCES)
        droppedEnergies.sort((a, b) => {
            return b.amount - a.amount
        })

        // go get from the largest pile
        if (!myCreep.room.underAttack) {
            var droppedEnergy = droppedEnergies[0]
            if (!_.isUndefined(droppedEnergy)) {
                if (droppedEnergy.amount < myCreep.carryCapacity) {
                    myCreep.memory.target = droppedEnergy.id
                }    
                switch (myCreep.pickup(droppedEnergy)) {
                    case ERR_NOT_IN_RANGE:
                        myCreep.moveTo(droppedEnergy)
                        break;
                    case OK:
                        delete myCreep.memory.target
                }
                return    
            }
        }

        // take from room storage
        myCreep.withdraw(myCreep.room.storage, RESOURCE_ENERGY)
        myCreep.moveTo(myCreep.room.storage)
        
    },

    findTarget: function(myCreep) {

        if (myCreep.store.getUsedCapacity('energy') > 0) {
            // spawns & extentions
            var extensionSpawn = myCreep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: function(structure) {
                    // if no other carrier has this as a target
                    if (myCreep.room.creeps.carriers.filter(c => c.memory.target === structure.id).length == 0) {
                        // is the structure missing energy
                        if (structure.energy < structure.energyCapacity) {
                            if (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) {
                                return true
                            }
                        }
                    }
                }
            })
            if (extensionSpawn != null){
                if (extensionSpawn.energyCapacity - extensionSpawn.energy < myCreep.carry[RESOURCE_ENERGY]) {
                    myCreep.memory.target = extensionSpawn.id
                }
                myCreep.moveTransfer(extensionSpawn, RESOURCE_ENERGY)
                return
            }
                


            // towers
            var tower = _.filter(myCreep.room.towers, function(t) {
                if (t.energy / t.energyCapacity < 0.7 && myCreep.room.creeps.carriers.filter(c => c.memory.target === t.id).length == 0) {
                    return t
                }
            })[0]

            if (!_.isUndefined(tower)) {
                myCreep.memory.target = tower.id
                myCreep.moveTransfer(tower, RESOURCE_ENERGY)
                return
            }            

            // if we havent got a controller link and master link, carry energy to the container
            if (_.isUndefined(myCreep.room.masterLink) && _.isUndefined(myCreep.room.cotrollerLink)) {
                // if the controller has a container nearby that can take atleast how much were holding
                var container = myCreep.room.controller.container
                if (!_.isUndefined(container)) {
                    if (_.sum(container.store) / container.storeCapacity < 0.6){
                        myCreep.memory.target = container.id
                        myCreep.moveTransfer(container, RESOURCE_ENERGY)
                        return    
                    }
                } else {
                    // feed the upgraders
                
                    var upgrader = myCreep.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: function(creep) {
                            return creep.memory.role == 'upgrader' && creep.memory.state == 0
                        }
                    })
                    if (!_.isUndefined(upgrader) && upgrader != null) {
                        myCreep.moveTransfer(upgrader, RESOURCE_ENERGY)
                        return
                    }
                }
            }
            if (myCreep.store.getUsedCapacity('energy') > 0) {
                var storage = myCreep.room.storage
                if(!_.isUndefined(storage)) {
                    myCreep.moveTransfer(storage, RESOURCE_ENERGY)
                    return
                }    
            }
        } else {
            if (!_.isUndefined(myCreep.room.terminal)) {
                target = myCreep.room.terminal
            } else if (!_.isUndefined(myCreep.room.storage)) {
                target = myCreep.room.storage
            } else {
                myCreep.drop(myCreep.store.listResources()[0])
            }
            myCreep.memory.target = target.id
            myCreep.moveTransfer(target, myCreep.store.listResources()[0])
        }
    
        
    

        

    }, 
    bodyTypes: [
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        [CARRY, MOVE, MOVE, CARRY, MOVE, MOVE],
        [CARRY, MOVE, MOVE],
    ]
}