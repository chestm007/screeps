const staticMiner = require('./creepRoleStaticMiner')
const upgrader = require('./creepRoleUpgrader')
const carrier = require('./creepRoleCarrier')
const builder = require('./creepRoleBuilder')
const linkOperator = require('./creepRoleLinkOperator')
const defender = require('./creepRoleDefender')
const terminalOperator = require('./creepRoleTerminalOperator')
const claimer = require('./creepRoleClaimer')
const mineralMiner = require('./creepRoleMineralMiner')

Object.defineProperty(Room.prototype, 'sources', {
    get: function() {
        if(_.isUndefined(this.memory.sources)) {
            this.memory.sources = []
            this.find(FIND_SOURCES).forEach(element => {
                this.memory.sources.push(element.id)
            });
            return sources
        } else {
            var sources = []
            this.memory.sources.forEach(element => {
                sources.push(Game.getObjectById(element))
            })
            return sources
        }
    }
})

Object.defineProperty(Room.prototype, 'mineral', {
    get: function() {
        if (_.isUndefined(this.memory.mineral)) {
            var mineral = this.find(FIND_MINERALS)[0]
            if(!_.isUndefined(mineral)) {
                this.memory.mineral = {id: mineral.id, type: mineral.mineralType, density: mineral.density}
            }
            return mineral
        } else {
            return Game.getObjectById(this.memory.mineral.id)
        }
    }
})

Object.defineProperty(Room.prototype, 'creeps', {
    get: function() {
        roomName = this.name
        if (_.isUndefined(this._creeps)) {
            this._creeps = {
                all: this.find(FIND_MY_CREEPS),    
                staticMiners: [],
                carriers: [],
                harvesters: [],
                upgraders: [],
                builders: [],
                defenders: [],
            }

            this._creeps.all.forEach(c => {
                switch (c.memory.role) {
                    case 'staticMiner':
                        this._creeps.staticMiners.push(c)
                        break;
                    
                    case 'carrier':
                        this._creeps.carriers.push(c)
                        break;
                    
                    case 'upgrader':
                        this._creeps.upgraders.push(c)
                        break;
        
                    case 'builder':
                        this._creeps.builders.push(c)
                        break;
                    
                    case 'masterLinkOperator':
                        this._creeps['masterLinkOperator'] = c
                        this.masterLinkOperator = c
                        break;
        
                    case 'controllerLinkOperator':
                        this._creeps['controllerLinkOperator'] = c
                        this.controllerLinkOperator = c
                        break;

                    case 'terminalOperator':
                        this._creeps['terminalOperator'] = c
                        this.terminalOperator = c
                        break;
                    
                    case 'defender':
                        this._creeps.defenders.push(c)
                        break;
                    
                    case 'mineralMiner':
                        this._creeps.mineralMiner = c
                        break;
                }
            });
                
        }
        return this._creeps
    }
})

Object.defineProperty(Room.prototype, 'myStructures', {
    get: function() {
        return this.find(FIND_STRUCTURES)
    }
})

Object.defineProperty(Room.prototype, 'structures', {
    get: function() {
        return this.find(FIND_STRUCTURES)
    }
})

Object.defineProperty(Room.prototype, 'spawns', {
    get: function() {
        return _.filter(this.myStructures, function(s) {
            if (s.structureType == STRUCTURE_SPAWN && s.my) {
                return s
            }
        })
    }
})

Object.defineProperty(Room.prototype, 'structuresNeedRepair', {
    get: function() {
        return _.filter(this.myStructures, function(s) {
            if ((s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE || s.my || s.structureType == STRUCTURE_ROAD) && s.structureType != STRUCTURE_WALL  && s.structureType != STRUCTURE_RAMPART) {
                if (s.hits / s.hitsMax < 0.8) {
                    return s
                }    
            }
        })
    }
})

Object.defineProperty(Room.prototype, 'wallsAndRampartsCloseToExpiring', {
    get: function() {
        return _.filter(this.structures, function(s) {
                if (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) {
                    if (s.hits < 1000) {
                        return s
                    }
                }
            }
        )
    }
})

Object.defineProperty(Room.prototype, 'towers', {
    get: function() {
        return _.filter(this.myStructures, function(s) {
            if(s.structureType == STRUCTURE_TOWER && s.my) {
                return s
            }
        })
    }
})

Object.defineProperty(Room.prototype, 'labs', {
    get: function() {
        return _.filter(this.myStructures, function(s){
            if (s.structureType == STRUCTURE_LAB && s.my) {
                return s
            }
        })
    }
})

Object.defineProperty(Room.prototype, 'observer', {
    get: function() {
        return _.filter(this.myStructures, function(s) {
            if (s.structureType == STRUCTURE_OBSERVER && s.my) {
                return s
            }
        })[0]
    }
})

// return link deignated to be filled from the room storage
Object.defineProperty(Room.prototype, 'masterLink', {
    get: function() {
        if (!_.isUndefined(this.memory.masterLink)) {
            var link = Game.getObjectById(this.memory.masterLink)
            if (!_.isUndefined(link)) {
                return link
            }
        }

        if (!_.isUndefined(this.storage)) {
            var links = this.storage.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                filter: {structureType: STRUCTURE_LINK}
            })
            if (links.length == 1) {
                var link = links[0]
                this.memory.masterLink = link.id
                return link
            }
        }
    }
})

// return link designated fot the room controller contaier
Object.defineProperty(Room.prototype, 'controllerLink', {
    get: function() {
        if (!_.isUndefined(this.controller)){
            return this.controller.link

        }
    }
})

Object.defineProperty(Room.prototype, 'underAttack', {
    get: function() {
        if (_.isUndefined(this._underAttack)){
            if (this.hostileCreeps.length > 0) {
                this._underAttack = true
            }    
        }
        return this._underAttack
    }
})

Object.defineProperty(Room.prototype, 'hostileCreeps', {
    get: function() {
        if (_.isUndefined(this._hostileCreeps)) {
            this._hostileCreeps = this.find(FIND_HOSTILE_CREEPS)
        }
        return this._hostileCreeps
    }
})

Room.prototype.spawnCustomCreeps = function(spawnQueue, targetRoomName) {
    var spawns = this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN}})
    var availableSpawns = _.filter(spawns, function (s) {
        if (!s.spawning) {
            return s;
        }
    })

    const bodyTypes = {
        staticMiner: staticMiner.bodyTypes,
        carrier: carrier.bodyTypes,
        defender: defender.bodyTypes,
        upgrader: upgrader.bodyTypes,
        builder: builder.bodyTypes,
        linkOperator: linkOperator.bodyTypes,
        terminalOperator: terminalOperator.bodyTypes,
        claimer: claimer.bodyTypes,
        mineralMiner: mineralMiner.bodyTypes
    }

    availableSpawns.forEach(spawn => {
        if (_.isUndefined(spawnQueue[0])) {
            return
        }

        if (!spawn.spawning) {
            var toSpawn = spawnQueue.pop()
            var role = toSpawn
        
            switch (toSpawn) {
                case 'controllerLinkOperator':
                case 'masterLinkOperator':
                    toSpawn = 'linkOperator'
                    break;
            }

            for (var body in bodyTypes[toSpawn]) {
                name = toSpawn + '_' + (Math.floor(Math.random() * 65534) + 1)
                if (spawn.spawnCreep(bodyTypes[toSpawn][body], name, { dryRun: true }) == OK) {
                    console.log(this.name + ': spawning ' + toSpawn + ' for room ' + targetRoomName)
                    spawn.spawnCreep(bodyTypes[toSpawn][body], name, {memory: {role: role, room: targetRoomName}})
                    break;
                }
            }
        }
    });

}

