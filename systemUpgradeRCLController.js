const EMPTY = 0
const WORKING = 1

module.exports = {
    run: function(room, upgraders) {
        room.creeps.upgraders.forEach(creep => {
            if (creep.ticksToLive <= 1) {
                creep.transfer(room.controller.container, RESOURCE_ENERGY)
            } else {
                if (creep.memory.state == WORKING) {
                    switch (creep.upgradeController(room.controller)) {
                        case ERR_NOT_ENOUGH_RESOURCES:
                            creep.memory.state = EMPTY
                            break;
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(room.controller)
                            break;
                    }
                } else {
                    var target = this.getCachedTarget(room)
                    if (!_.isUndefined(target)) {
                        switch (creep.withdraw(target, RESOURCE_ENERGY)) {
                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(target)
                                break;
                            
                            case ERR_FULL:
                                creep.memory.state = WORKING
                                break;
            
                            case ERR_INVALID_TARGET:
                                switch (creep.pickup(target)) {
                                    case ERR_NOT_IN_RANGE:
                                        creep.moveTo(target)
                                        break;

                                    case ERR_FULL:
                                        creep.memory.state = WORKING
                                        break;
                                }
                                break;
                        }
                    }
                }
            }
        });
        delete this._target
    },
    
    getCachedTarget: function(room) {
        if (_.isUndefined(this._target)) {
            var target = this.getTarget(room)
            if (!_.isUndefined(target)) {
                this._target = target
                return target
            }
        } else {
            return this._target
        }
    },

    getTarget: function(room) {
        // if the controller has a container nearby
        var container = room.controller.container
        if (!_.isUndefined(container)) {
            return container
        }

        // if not check sources
        for(var s in room.sources) {

            // is there a source container?
            var container = room.sources[s].container
            if (!_.isUndefined(container)) {
                return container
            }

            // maybe we're only drop mining?
            var droppedEnergies = room.sources[s].containerPos.lookFor(LOOK_ENERGY)
            if (!_.isUndefined(droppedEnergies)) {
                droppedEnergies.sort(e => {
                    e.amount
                })
                var droppedEnergy = droppedEnergies[0]
                return droppedEnergy
            }   
        }     
    }
}