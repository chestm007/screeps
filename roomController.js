const creepController = require('./creepController')
const linkSystemController = require('./systemLinkController')
const miningSystemController = require('./systemMiningController')
const upgradeRCLSystemController = require('./systemUpgradeRCLController')
const defenceSystemController = require('./systemDefenceController')
const towerSystemController = require ('./systemTowerController')
const systemStructurePlanner = require('./systemStructurePlanner')

require('./room')

module.exports = {
    run: function(room) {
        if (_.isUndefined(room.controller) || !room.controller.my) {
            return
        }
    
        // run the defence system
        initCpu = Game.cpu.getUsed()
        defenceSystemController.run(room)
        Memory.metrics.cpu[room.name].defenceSystem = Game.cpu.getUsed() - initCpu

        // spawn creeps
        var initCpu = Game.cpu.getUsed()
        spawnCreeps(room)
        Memory.metrics.cpu[room.name].spawnCalculations = Game.cpu.getUsed() - initCpu

        // run the autobuild system
        if (Game.time % 20 == 0) {
            var initCpu = Game.cpu.getUsed()
            systemStructurePlanner.run(room)
            Memory.metrics.cpu[room.name].systemStructurePlanner = Game.cpu.getUsed() - initCpu
        }

        //initCpu = Game.cpu.getUsed()
        //distanceTransform.run(room)
        //Memory.metrics.cpu[room.name].distanceTransform = Game.cpu.getUsed() - initCpu


        // run the link system
        initCpu = Game.cpu.getUsed()
        linkSystemController.run(room)
        Memory.metrics.cpu[room.name].linkSystem = Game.cpu.getUsed() - initCpu
        
        // run mining system
        initCpu = Game.cpu.getUsed()
        miningSystemController.run(room)
        Memory.metrics.cpu[room.name].miningSystem = Game.cpu.getUsed() - initCpu

        // run RCL system
        initCpu = Game.cpu.getUsed()
        upgradeRCLSystemController.run(room, room.creeps.upgraders)
        Memory.metrics.cpu[room.name].upgradeRCLSystem = Game.cpu.getUsed() - initCpu

        // run tower system
        initCpu = Game.cpu.getUsed()
        towerSystemController.run(room)
        Memory.metrics.cpu[room.name].towerCalculations = Game.cpu.getUsed() - initCpu

        // run all self controlled creeps
        initCpu = Game.cpu.getUsed()
        room.creeps.all.forEach(creep => {
            creepController.run(creep)
        })
        Memory.metrics.cpu[room.name].creepActions = Game.cpu.getUsed() - initCpu
    },
}

function spawnCreeps(room) {
    var spawningCreeps = {
        staticMiners: [],
        carriers: [],
        harvesters: [],
        upgraders: [],
        builders: [],
        defenders: [],            
    }
    room.spawns.forEach(spawn => {
        // Build list of creeps currently being spawned so we dont spam spawn the same one
        if (spawn.spawning) {
            switch (Memory.creeps[spawn.spawning.name].role) {
                case 'staticMiner':
                    spawningCreeps.staticMiners.push(spawn.spawning.name)
                    break;
                
                case 'carrier':
                    spawningCreeps.carriers.push(spawn.spawning.name)
                    break;
                
                case 'upgrader':
                    spawningCreeps.upgraders.push(spawn.spawning.name)
                    break;

                case 'builder':
                    spawningCreeps.builders.push(spawn.spawning.name)
                    break;
                
                case 'masterLinkOperator':
                    spawningCreeps['masterLinkOperator'] = spawn.spawning.name
                    room.masterLinkOperator = 'spawning'
                    break;

                case 'controllerLinkOperator':
                    spawningCreeps['controllerLinkOperator'] = spawn.spawning.name
                    room.controllerLinkOperator = 'spawning'
                    break;

                case 'terminalOperator':
                    spawningCreeps['terminalOperator'] = spawn.spawning.name
                    room.terminalOperator = 'spawning'
                
                case 'defender':
                    spawningCreeps.defenders.push(spawn.spawning.name)
                    break;

                case 'mineralMiner':
                    spawningCreeps.mineralMiner = 'spawning'
                    break;
            }
        }
    })

    // Build list of existing spawned creeps for this room

    var spawnQueue = []
    room.spawnQueue = spawnQueue

    var carriers = 3
    if (room.creeps.staticMiners.length + spawningCreeps.staticMiners.length < room.sources.length) {
        // if less then 1 carrier, and already 1 miner exists
        if (room.creeps.carriers.length + spawningCreeps.carriers.length < 1 && room.creeps.staticMiners.length + spawningCreeps.staticMiners.length == 1) {
            spawnQueue.push('carrier')
        } else {
            spawnQueue.push('staticMiner')
        }
    }

    if (!_.isUndefined(room.terminal) && _.isUndefined(room.creeps.terminalOperator) && _.isUndefined(spawningCreeps.terminalOperator)) {
        spawnQueue.push('terminalOperator')
    }

    if (!_.isUndefined(room.masterLink) && _.isUndefined(room.creeps.masterLinkOperator) && _.isUndefined(spawningCreeps.masterLinkOperator)) {
        spawnQueue.push('masterLinkOperator')
        carriers = 2
    }

    if (!_.isUndefined(room.controllerLink) && _.isUndefined(room.creeps.controllerLinkOperator) && _.isUndefined(spawningCreeps.controllerLinkOperator)) {
        spawnQueue.push('controllerLinkOperator')
        carriers = 2
    }

    if (!_.isUndefined(room.masterLink) || !_.isUndefined(room.controllerLink)) {
        carriers = 2
    }

    if (room.creeps.carriers.length + spawningCreeps.carriers.length < carriers) {
        if (!_.isUndefined(room.controller)){
            spawnQueue.push('carrier')
        }
    }

    if (!_.isUndefined(room.controller)) {
        if (room.controller.level == 8) {
            if (room.storage.store[RESOURCE_ENERGY] < 100000) {
                upgraders = 1
            } else if (room.storage.store[RESOURCE_ENERGY] < 300000) {
                upgraders = 2
            } else {
                upgraders = 3
            }
        } else if (room.controller.level > 3) {
            if (!_.isUndefined(room.storage)) {
                var divisor = 0
                if (room.controller.level >= 6 && !_.isUndefined(room.terminal)) {
                    divisor = 200000
                } else {
                    divisor = 20000
                }
                upgraders = Math.ceil(room.storage.store[RESOURCE_ENERGY] / divisor)
                if (upgraders > 5) {
                    upgraders = 5
                }
            } else {
                upgraders = 3
            }
        } else {
            upgraders = 3
        }
    }

    if (room.creeps.upgraders.length + spawningCreeps.upgraders.length < upgraders) {
        spawnQueue.push('upgrader')
    }


    if (room.underAttack) {
        defenders = 4
    } else {
        defenders = 1
    }

    if (room.creeps.defenders.length + spawningCreeps.defenders.length < defenders && room.towers.length < 3) {
        spawnQueue.push('defender')
    }


    if (room.creeps.builders.length + spawningCreeps.builders.length < 2 && ((room.storage && room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 50000) || _.isUndefined(room.storage))) {
        if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 || (!_.isUndefined(room.structuresNeedRepair) && room.towers.length == 0)) {
            spawnQueue.push('builder')
        }
    }

    if ((!_.isUndefined(room.mineral.extractor)) && (_.isUndefined(room.creeps.mineralMiner) && _.isUndefined(spawningCreeps.mineralMiner))) {
        //spawnQueue.push('mineralMiner')
    }

    if (spawnQueue.length > 0) {
        spawnQueue.reverse()
        if ((room.creeps.staticMiners < 1 || room.creeps.carriers < 1) || (room.energyAvailable == room.energyCapacityAvailable && Game.time % 10 == 0)) {
            room.spawnCustomCreeps(spawnQueue, room.name)
        }    
    }

}


