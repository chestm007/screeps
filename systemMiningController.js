require('./room')
require('./source')
const staticMiner = require('./creepRoleStaticMiner')

module.exports = {
    run: function(room) {
        room.sources.forEach(source => {

            // if this source has a miner
            var miner = source.miner
            if(!_.isUndefined(miner)) {
                // renew the miner if its gonna die soon
                if ((miner.ticksToLive < 100 || !_.isUndefined(miner.memory.renewing)) && staticMiner.bodyTypes[0] == miner.body) {
                    console.log(miner.body == staticMiner.bodyTypes[0])
                    miner.memory.renewing = true
                    miner.renew()
                } else {
                    miner.harvest(source)
                    // if we havent registered as being on our container yet
                    if (!miner.memory.on_container) { 
                        // but were on it
                        if(miner.pos.isEqualTo(source.containerPos)) {
                            miner.on_container = true
                        } else { // otherwise, move too it
                            miner.moveTo(source.containerPos)
                        }
                    }    
                }
            } else {
                // hook into future systemSpawningController to trigger a new miner
            }
        });
        if (!_.isUndefined(room.mineral.extractor)) {
            var miner = room.mineral.miner
            if (!_.isUndefined(miner)) {
                if (Game.time % 6 == 0) {
                    miner.harvest(room.mineral)
                }
                if (!miner.memory.on_container) { 
                    // but were on it
                    if(miner.pos.isEqualTo(room.mineral.containerPos)) {
                        miner.on_container = true
                    } else { // otherwise, move too it
                        miner.moveTo(room.mineral.containerPos)
                    }
                }    
            }
        }
    }
}