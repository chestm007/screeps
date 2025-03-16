Object.defineProperty(StructureController.prototype, 'container', {
    get: function() {
        if (_.isUndefined(this._container)) {
            this._container = this.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: {structureType: STRUCTURE_CONTAINER}
            })[0]
        }
        return this._container
    }
})

Object.defineProperty(StructureController.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.controllers)) {
            Memory.controllers = {};
        }
        if(!_.isObject(Memory.controllers)) {
            return undefined;
        }
        return Memory.controllers[this.id] = Memory.controllers[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.controllers)) {
            Memory.controllers = {};
        }
        if(!_.isObject(Memory.controllers)) {
            throw new Error('Could not set controller memory');
        }
        Memory.controllers[this.id] = value;
    }
        
})

Object.defineProperty(StructureController.prototype, 'containerPos', {
    get: function() {
        if (_.isUndefined(this.room.spawns[0])){
            return
        }
        
        // if we havent set a container location
        if(_.isUndefined(this.memory.container)) {
            // check if some dumbass already built a container
            if (!_.isUndefined(this.container)) {
                this.memory.container = {x: this.container.pos.x, y: this.container.pos.y}
            } else {
                const containerPos = this.pos.findPathTo(this.room.spawns[0], {ignoreCreeps: true})[1]
                console.log(containerPos.x, containerPos.y)
                this.memory.container = {x: containerPos.x, y: containerPos.y}              
            }
        }
        return this.room.getPositionAt(this.memory.container.x, this.memory.container.y)
    } 
})

Object.defineProperty(StructureController.prototype, 'linkPos', {
    get: function() {
        if (_.isUndefined(this.room.spawns[0])){
            return
        }

        if (_.isUndefined(this.container)) {
            return
        }

        if (_.isUndefined(this.memory.linkPos)) {
            if (!_.isUndefined(this.link)) {
                this.memory.linkPos = {x: this.link.pos.x, y: this.link.pos.y}
            } else {
                const linkPos = this.container.pos.findPathTo(this.room.spawns[0], {ignoreCreeps: true})[1]
                console.log(linkPos.x, linkPos.y)
                this.memory.linkPos = {x: linkPos.x, y: linkPos.y}
            }
        }
        return this.room.getPositionAt(this.memory.linkPos.x, this.memory.linkPos.y)
    }
})

Object.defineProperty(StructureController.prototype, 'link', {
    get: function() {
        if (!_.isUndefined(this.memory.link)) {
            this._link = Game.getObjectById(this.memory.link)
        }
        if (_.isUndefined(this._link)){
            if (!_.isUndefined(this.container)) {
                var links = this.container.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                    filter: {structureType: STRUCTURE_LINK}
                })
                if (links.length == 1) {
                    var link = links[0]
                    this._link = link
                    this.memory.link = this._link.id
                }
            }    
        }
        return this._link
    }
})