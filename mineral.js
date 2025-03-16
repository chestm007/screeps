Object.defineProperty(Mineral.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.minerals)) {
            Memory.minerals = {};
        }
        if(!_.isObject(Memory.minerals)) {
            return undefined;
        }
        return Memory.minerals[this.id] = Memory.minerals[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.minerals)) {
            Memory.minerals = {};
        }
        if(!_.isObject(Memory.minerals)) {
            throw new Error('Could not set mineral memory');
        }
        Memory.minerals[this.id] = value;
    }
});

Object.defineProperty(Mineral.prototype, 'miner', {
    get: function() {
        // do we have a miner assigned to this source.
        for (var name in Memory.creeps) {
            if (Memory.creeps[name].mineral == this.id) {
                return Game.creeps[name]
            }
        }
        // if not lets assign one.
        for (var name in Memory.creeps) {
            if (_.isUndefined(Memory.creeps[name].mineral) && Memory.creeps[name].role == 'mineralMiner' && Memory.creeps[name].room == this.room.name) {
                Memory.creeps[name].mineral = this.id
                return Game.creeps[name]
            }
        }
    }
})

Object.defineProperty(Mineral.prototype, 'extractor', {
    get: function() {
        return this.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType == STRUCTURE_EXTRACTOR)[0]
    }
})

Object.defineProperty(Mineral.prototype, 'containerPos', {
    get: function() {
        if (_.isUndefined(this.room.storage)){
            return
        }
        
        // if we havent set a container location
        if(_.isUndefined(this.memory.container)) {
            // check if some dumbass already built a container
            if (!_.isUndefined(this.container)) {
                this.memory.container = {x: this.container.pos.x, y: this.container.pos.y}
            } else {
                const containerPos = this.pos.findPathTo(this.room.storage, {ignoreCreeps: true})[0]
                console.log(containerPos.x, containerPos.y)
                this.memory.container = {x: containerPos.x, y: containerPos.y}              
            }
        }
        return this.room.getPositionAt(this.memory.container.x, this.memory.container.y)
    } 
})

Object.defineProperty(Mineral.prototype, 'container', {
    get: function() {
        if (_.isUndefined(this._container)) {
            this._container = this.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: {structureType: STRUCTURE_CONTAINER}
            })[0]
        }
        return this._container
    }
})