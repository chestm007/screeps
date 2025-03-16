Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            return undefined;
        }
        return Memory.sources[this.id] = Memory.sources[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            throw new Error('Could not set source memory');
        }
        Memory.sources[this.id] = value;
    }
});

Object.defineProperty(Source.prototype, 'miner', {
    get: function() {
        // do we have a miner assigned to this source.
        for (var name in Memory.creeps) {
            if (Memory.creeps[name].source == this.id) {
                return Game.creeps[name]
            }
        }
        // if not lets assign one.
        for (var name in Memory.creeps) {
            if (_.isUndefined(Memory.creeps[name].source) && Memory.creeps[name].role == 'staticMiner' && Memory.creeps[name].room == this.room.name) {
                Memory.creeps[name].source = this.id
                return Game.creeps[name]
            }
        }
    }
})

Object.defineProperty(Source.prototype, 'containerPos', {
    get: function() {
        if(_.isUndefined(this.memory.container)) {
            var adjacentTerrain = this.room.lookForAtArea(LOOK_TERRAIN, this.pos.y-1, this.pos.x-1, this.pos.y+1, this.pos.x+1, asArray=true)
            var clearTerrains = _.filter(adjacentTerrain, function(t) {
                if (t.terrain != 'wall') {
                    return t;
                }
            })
            if (clearTerrains.length > 0) {
                var clearTerrain = clearTerrains[0]
                this.memory.container = {x: clearTerrain.x, y: clearTerrain.y}
                return this.room.getPositionAt(clearTerrain.x, clearTerrain.y)
            }
        } else {
            return this.room.getPositionAt(this.memory.container.x, this.memory.container.y)
        }
    } 
})

Object.defineProperty(Source.prototype, 'container', {
    get: function() {
        return this.containerPos.lookFor(LOOK_STRUCTURES, {
            filter: {structureType: STRUCTURE_CONTAINER}
        })[0]
    }
})
