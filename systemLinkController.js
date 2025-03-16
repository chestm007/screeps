require('./room')

module.exports = {
    run: function(room) {
        if (_.isUndefined(room.masterLink) || _.isUndefined(room.controllerLink)) {
            // ensure there is alteast one more link available
            return
        }

        if (_.isUndefined(room.masterLinkOperator) || room.masterLinkOperator == 'spawning') {
            // if we cant operate the master link, the system is down.
            return
        }

        if (_.isUndefined(room.controllerLinkOperator || room.controllerLinkOperator == 'spawning')) {
            // verify that atleast one of our endpoints is functional aswell
            return
        }

        // fill up the master link
        if (room.masterLinkOperator != 'spawning'){
            if (room.masterLink.energy < room.masterLink.energyCapacity && !_.isUndefined(room.masterLinkOperator)) {
                if (room.masterLinkOperator.carry[RESOURCE_ENERGY] == 0) {
                    // operator is empty, withdraw from storage
                    switch (room.masterLinkOperator.withdraw(room.storage, RESOURCE_ENERGY)) {
                        case ERR_NOT_IN_RANGE:
                            room.masterLinkOperator.moveTo(room.storage)
                            break;
                    }    
                } else {
                    // operator isnt empty, transfer to link
                    switch (room.masterLinkOperator.transfer(room.masterLink, RESOURCE_ENERGY)) {
                        case ERR_NOT_IN_RANGE:
                            room.masterLinkOperator.moveTo(room.masterLink)
                            break;
                    }
                }
            }    
        }

        // check if the controllers container needs filling
        if (room.controller.container.store.getFreeCapacity() > 100 ){
            // fill up the controller container
            if (room.controllerLinkOperator != 'spawning' && !_.isUndefined(room.controllerLinkOperator)){
                if (room.controllerLinkOperator.carry[RESOURCE_ENERGY] == 0) {
                    // operator is empty
                    if (room.controllerLink.energy > 0) {
                        // withdraw from link
                        if(room.controllerLinkOperator.withdraw(room.controllerLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            room.controllerLinkOperator.moveTo(room.controllerLink)
                        }
                    } else {
                        // link is empty, transfer from master
                        room.masterLink.transferEnergy(room.controllerLink)
                    }
                } else {
                    // operator isnt empty, refil controller container
                    if (room.controllerLinkOperator.transfer(room.controller.container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        room.controllerLinkOperator.moveTo(room.controller.container)
                    }
                }    
            }
        }
    }
}