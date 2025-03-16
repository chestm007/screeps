const RENEWING = 0
const IDLE = 1
module.exports = {
    stateMachine: function(myCreep) {
        if (_.isEmpty(myCreep.memory.state)) {
            myCreep.memory.role = role.memory.state = IDLE
        }
        if (myCreep.memory.state == IDLE) {
            if (myCreep.ticksToLive < 1000) {
                myCreep.memory.state = RENEWING
                myCreep.renew()
            }
        } else if (myCreep.memory.state == RENEWING) {
            if (myCreep.ticksToLive >= 1500) {
                myCreep.memory.state = IDLE
            }

        } else {
            myCreep.memory.state = IDLE
        }
    },

    run: function(room) {

        if (_.isUndefined(room.controller) || !room.controller.my) {
            return
        }
        runDefenders(room)
        //if (!room.underAttack) {
        //    for (var creep in room.creeps.defenders) {
        //        this.stateMachine(creep)
        //    }
        //    return
        //}

        if (room.towers.length < 1) {
            if (!_.isUndefined(room.controller) && _.isUndefined(room.controller.safeMode)) {
                console.log(room.name + ": activating safemode for room")
                room.controller.activateSafeMode()
            }    
        }

        const hostileHealers = _.filter(room.hostileCreeps, function(c) {
            return c.body.includes(HEAL)
        })

        if (hostileHealers.length > 0) {

        }

    }
}

runDefenders = function(room) {
    if (!_.isUndefined(room.creeps.defenders) && room.creeps.defenders.length > 0) {
        if (room.underAttack) {
            for (var defender in room.creeps.defenders) {
                room.creeps.defenders[defender].attack(room.hostileCreeps[0])
                room.creeps.defenders[defender].moveTo(room.hostileCreeps[0])
            }
            return
        }

        var flag = Game.flags[room.name + "---defender"]
        if (!_.isUndefined(flag))
            for (var defender in room.creeps.defenders) {
                if (!room.creeps.defenders[defender].pos.inRangeTo(flag, 4)) {
                    room.creeps.defenders[defender].moveTo(flag)
                }
        }
    }
}
