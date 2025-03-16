const roomController = require('./roomController')
const systemExpansionController = require('./systemExpansionController')
const systemTerminal = require('./systemTerminal')
require('./store')
require('./structureController')
require('./source')
require('./mineral')
//require('./console')


module.exports.loop = function () {
    if (_.isUndefined(Memory.metrics.cpu)) {
        Memory.metrics = {
            cpu: {}
        }    
    }

    // Memory GC
    var initCpu = Game.cpu.getUsed()
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }
    Memory.metrics.cpu.GCCalculation = Game.cpu.getUsed() - initCpu

    for (var room in Game.rooms) {
        initCpu = Game.cpu.getUsed()
        if (_.isUndefined(Memory.metrics.cpu[room])) {
            Memory.metrics.cpu[room] = {}
        }
        roomController.run(Game.rooms[room])
        Memory.metrics.cpu[room].total = Game.cpu.getUsed() - initCpu
    }

    var initCpu = Game.cpu.getUsed()
    systemTerminal.run()
    Memory.metrics.cpu.terminalSystem = Game.cpu.getUsed() - initCpu

    initCpu = Game.cpu.getUsed()
    for (var name in Game.flags) {

        var flag = this.decodeflag(name)
        
        switch (flag.action) {
        
            case 'expand':
                systemExpansionController.run(Game.flags[name], Game.rooms[flag.parentRoom])
                break;
        }
    }

    Memory.metrics.cpu.expansion = Game.cpu.getUsed() - initCpu
    return

    try {
        foo()
    } catch (e) {
        console.stack(e)
    }
}

module.exports.decodeflag = function(flagName) {
    var splitName = flagName.split('---')
    return {parentRoom: splitName[0], action: splitName[1]}
}

