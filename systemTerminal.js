runTerminalOperator = function(room) {
    // if terminal has low resources, get from storage
    if (room.terminal.store[RESOURCE_ENERGY]  < 105000) {
        if (room.storage.store[RESOURCE_ENERGY] > 300000) {
            room.terminalOperator.say('S => T')
            if (room.terminalOperator.store[RESOURCE_ENERGY] == 0) {
                if (room.terminalOperator.withdraw(room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    room.terminalOperator.moveTo(room.storage)
                }    
            } else {
                // operator isnt empty, transfer to link
                if (room.terminalOperator.transfer(room.terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    room.terminalOperator.moveTo(room.terminal)
                }
            }

        }

    // if terminal has excess resources, put into storage
    } else if (room.terminal.store[RESOURCE_ENERGY] > 110000) {
        room.terminalOperator.say('T => S')
        if (room.terminalOperator.store[RESOURCE_ENERGY] > 0) {

            if (room.terminalOperator.transfer(room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                room.terminalOperator.moveTo(room.storage)
            }    
        } else {
            // operator isnt empty, transfer to link
            if (room.terminalOperator.withdraw(room.terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                room.terminalOperator.moveTo(room.terminal)
            }
        }
    }

}

module.exports = {
    run: function() {
        // get list of rooms with terminals
        var rooms = _.filter(Game.rooms, function(r) {
            return !_.isUndefined(r.terminal) && r.terminal.isActive() && r.terminal.my
        })

        // if there are less then 2 terminals, exit
        if (rooms.length < 2) {
            return
        }

        for (var r in rooms) {
            var room = rooms[r]

            if (_.isUndefined(room.terminal) || _.isUndefined(room.terminalOperator)) {
                continue;
            }

            if (room.terminalOperator != 'spawning' && !_.isUndefined(room.terminalOperator)) {
                runTerminalOperator(room)
            }

        }

        rooms.sort((a, b) => (a.storage.store[RESOURCE_ENERGY] < b.storage.store[RESOURCE_ENERGY]) ? 1 : -1)
        const targetRoom = rooms[rooms.length -1]
        const sourceRoom = rooms[0]
        if (Game.time % 200 == 0) {
            const energyStats = {
                average: Math.floor(average(rooms, (r) => (r.storage.store[RESOURCE_ENERGY]))),
                max: {
                    room: sourceRoom.name,
                    energy: sourceRoom.storage.store[RESOURCE_ENERGY]
                },
                min: {
                    room: targetRoom.name,
                    energy: targetRoom.storage.store[RESOURCE_ENERGY]
                }
            }
            console.log('Energy statistics: {' +
                        'Average:' + energyStats.average + ', ' + 
                        'Max: {' + energyStats.max.room + ': ' + energyStats.max.energy + '}, ' +
                        'Min: {' + energyStats.min.room + ': ' + energyStats.min.energy + '}}')
        }
        //const averageTerminalEnergy = average(rooms, (r) => r.storage.store[RESOURCE_ENERGY])
        const energyDiff = sourceRoom.storage.store[RESOURCE_ENERGY] - targetRoom.storage.store[RESOURCE_ENERGY]
        if (energyDiff > 50000 && sourceRoom.terminal.store[RESOURCE_ENERGY] >= 100000) {
            var resourcesToSend = Math.floor(energyDiff / 2)
            if (energyDiff > sourceRoom.terminal.store[RESOURCE_ENERGY] * 0.8) {
                resourcesToSend = Math.floor(sourceRoom.terminal.store[RESOURCE_ENERGY] * 0.8)
            }
            console.log('sending ' + resourcesToSend + ' resources to ' + targetRoom.name + ' from ' + sourceRoom.name)
            sourceRoom.terminal.send(RESOURCE_ENERGY, resourcesToSend, targetRoom.name)
        }
    }
}

var average = function (a, b) {
    const sum = _.sum(a, b)
    return sum / a.length
}