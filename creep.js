const carrierCreep = require('./creepRoleCarrier')
const builderCreep = require('./creepRoleBuilder');
const creepRoleCarrier = require('./creepRoleCarrier');


Creep.prototype.run = function() {
    switch (this.memory.role) {
        case 'carrier':
            carrierCreep.run(this)
            break;

        case 'builder':
            builderCreep.run(this)
            break;
    }
}

Creep.prototype.assignedResource = function() {
    if (_.isUndefined(this.memory.source)) {
        this.room.sources.forEach(mySource => {
            if (!mySource.miner) {
                this.memory.source = mySource.id
                return mySource
            }
        })
    } else {
        return Game.getObjectById(this.memory.source)
    }
}

Creep.prototype.renew = function() {
    this.say('MEDIC')
    if (!_.isUndefined(this.memory.target)){
        spawn = Game.getObjectById(this.memory.target)

    } else {
        spawn = this.pos.findClosestByPath(this.room.spawns)
        if (!_.isUndefined(spawn) && spawn != null) {
            this.memory.target = spawn.id
        }
    }
    switch (spawn.renewCreep(this)) {
        case ERR_NOT_IN_RANGE:
            this.moveTo(spawn)
            break;
        case ERR_FULL:
            delete this.memory.target
            delete this.memory.renewing
    }

}

Creep.prototype.moveTransfer = function(target, resource) {
    if (!_.isUndefined(target.structureType != null)) {
        switch (target.structureType) {
            case STRUCTURE_SPAWN:
            case STRUCTURE_TOWER:
            case STRUCTURE_EXTENSION:
                if (target.energy == target.energyCapacity) {
                    target = undefined
                    delete this.memory.target
                    creepRoleCarrier.findTarget(this)
                }
            case STRUCTURE_CONTAINER:
            case STRUCTURE_STORAGE:
            case STRUCTURE_TERMINAL:
                return this._transfer(target, resource)
            
        }
    } else {
        return this._transfer(target, resource)
    }
}


Creep.prototype._transfer = function(target, resource) {
    switch (this.transfer(target, resource)) {
        case ERR_FULL:
            target = undefined
            delete this.memory.target
            creepRoleCarrier.findTarget(this)
            break;

        case ERR_NOT_IN_RANGE:
            return this.moveTo(target)

        case ERR_NOT_ENOUGH_RESOURCES:
            delete this.memory.target
            return ERR_NOT_ENOUGH_RESOURCES

        case OK:
            if (!this._transferRecurse) {
                this._transferRecurse = true
                creepRoleCarrier.findTarget(this)
            }
            return OK
    }
}

Creep.prototype.moveBuild = function(target) {
    if (this.build(target)) {
        return this.moveTo(target)
    }
}

Creep.prototype.moveRepair = function(target) {
    switch (this.repair(target)) {
        case ERR_NOT_IN_RANGE:
            return this.moveTo(target)
        case OK:
            return OK
    } 
}

Object.defineProperty(Creep.prototype, 'homeRoom', {
    get: function() {
        return Game.rooms[this.memory.room]
    }
})