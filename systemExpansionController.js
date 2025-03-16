const builder = require('./creepRoleBuilder')
const claimer = require('./creepRoleClaimer')
const carrier = require('./creepRoleCarrier')
const creepRoleBuilder = require('./creepRoleBuilder')

require('./room')
const MIGRATING = 9
const EMPTY = 0
const FULL = 1


module.exports = {
    run: function(flag, parentRoom) {
        var creeps = {
            builders: [],
            claimers: [],
        }

        for (var name in Memory.creeps) {
            var creep = Game.creeps[name]
            if (creep.memory.room == flag.pos.roomName) {
                switch (creep.memory.role) {
                    case 'staticMiner':
                        flag.remove()
                        return
                    case 'builder':
                        creeps.builders.push(creep)
                        break;
                    case 'claimer':
                        creeps.claimers.push(creep)
                        break;
                }
            }
        }
        
        var spawnQueue = []
        // if the room is unclaimed:
        if (_.isUndefined(flag.room) || _.isUndefined(flag.room.controller) || !flag.room.controller.my) {
            // spawn a new claimer if we dont have one
            if (creeps.claimers.length == 0) {
                spawnQueue.push('claimer')
            } else {
                creeps.claimers.forEach(creep => {
                    // move to the new room if we arent there
                    if (creep.room.name != flag.pos.roomName) {
                        creep.moveTo(flag)
                    } else {
                        // otherwise claim the controller
                        switch (creep.claimController(flag.room.controller)) {
                            case ERR_INVALID_TARGET:
                                if (creeps.claimers.length < 3) {
                                    spawnQueue.push('claimer')
                                }
                                creep.attackController(flag.room.controller)
                                break;
                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(flag.room.controller)
                                break;
                            
                        } 
                    }
                });
            }

        } else {
            // spawn builder creeps
            if (creeps.builders.length < 4) {
                spawnQueue.push('builder')
            }

            creeps.builders.forEach(creep => {
                builder.stateMachine(creep)
            })

            // if we dont have a spawn in the room yet.
            var target = undefined
            if (flag.room.spawns.length == 0) {
                flag.pos.createConstructionSite(STRUCTURE_SPAWN) 

            } else {
                // at which point do we stop supporting the expansion
                //   are there mining buckets
                //   are there extensions
                //   is there a controller bucket
            }
            target = flag.room.find(FIND_MY_CONSTRUCTION_SITES)[0]
            if (!_.isUndefined(target)) {
                creeps.builders.forEach(creep => {
                    if (creep.room.name != flag.pos.roomName) {
                        creep.moveTo(flag)
                    } else{
                        if ((Game.time) % 3 == 0) {
                            creep.say('diggy')
                        } else if ((Game.time + 2)% 3 == 0) {
                            creep.say(' diggy')
                        } else if ((Game.time + 1)% 3 == 0) {
                            creep.say('hole')
                        }

                        switch (creep.memory.state) {

                            case EMPTY:
                                // find dropped energy
                                var droppedEnergies = creep.room.find(FIND_DROPPED_RESOURCES)
                                droppedEnergies.sort((a, b) => {
                                    return b.amount - a.amount
                                })
                        
                                // go get from the largest pile
                                var droppedEnergy = droppedEnergies[0]
                                if (!_.isUndefined(droppedEnergy)) {
                                    if (droppedEnergy.amount < creep.carryCapacity) {
                                        creep.memory.target = droppedEnergy.id
                                    }    
                                    switch (creep.pickup(droppedEnergy)) {
                                        case ERR_NOT_IN_RANGE:
                                            creep.moveTo(droppedEnergy)
                                            break;
                                        case OK:
                                            delete creep.memory.target
                                    }
                                    return    
                                }

                                // mining containers?
                                var containers = []
                                creep.room.memory.sources.forEach(source_id => {
                                    var container = Game.getObjectById(source_id).container
                                    if (!_.isUndefined(container) && creep.room.creeps.carriers.filter(c => c.memory.target === container.id).length == 0) {
                                        containers.push(container)
                                    }
                                });
                        
                                if (containers.length > 0) {
                                    containers.sort((a, b) => {
                                        return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]
                                    })
                                
                                    // make sure we can get atleast as much as we carry from it.
                                    var container = containers[0]
                                    if (container.store[RESOURCE_ENERGY] >= (creep.carryCapacity - _.sum(creep.carry))) {
                                        creep.memory.target = container.id
                                        creep.withdraw(container, RESOURCE_ENERGY)
                                        creep.moveTo(container)
                                        return
                                    }
                                }
                        
                                // fuck it, just mine
                                if (!_.isUndefined(creep.memory.mySource)) {
                                    source = Game.getObjectById(creep.memory.mySource)
                                    if (source.room != creep.room) {
                                        delete creep.memory.mySource
                                        delete source
                                    }
                                } else {
                                    source = creep.room.sources[Math.round(Math.random()) * (creep.room.sources.length -1)]
                                    creep.memory.mySource = source.id
                                    
                                }
                                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(source)
                                }
                                break;
                            
                            case FULL:
                                if (creep.room.controller.level < 2) {
                                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(creep.room.controller)
                                        break;
                                    }
                                } else {
                                    creepRoleBuilder.findTarget(creep)
                                    break;      
                                }
                                break;
                        }
    
                    }
                })    
            } else {
                creeps.builders.forEach(creep => {
                    creep.moveTo(creep.room.controller)
                    creep.upgradeController(creep.room.controller)
                })
            }
        }


        spawnQueue.reverse()
        parentRoom.spawnCustomCreeps(spawnQueue, flag.pos.roomName)
    }
}