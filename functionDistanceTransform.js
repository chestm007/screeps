calcDistances = function(room) {
    if (_.isUndefined(Memory.rooms[room.name].distanceMatrix)) {
        startCpu = Game.cpu.getUsed()
        console.log('structure planning distanceMatrix is missing, calculating for room ' + room.name)

        let topDownPass = new PathFinder.CostMatrix();
        const terrain = Game.map.getRoomTerrain(room.name)
        const structures = room.find(FIND_STRUCTURES)
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (terrain.get(x, y) == TERRAIN_MASK_WALL || room.lookForAt(LOOK_STRUCTURES, x, y).length > 0) {
                    topDownPass.set(x, y, 0);
                } else {
                    topDownPass.set(x, y,
                        Math.min(topDownPass.get(x-1, y-1), topDownPass.get(x, y-1),
                            topDownPass.get(x+1, y-1), topDownPass.get(x-1, y)) + 1);
                }
            }
        }

        Memory.rooms[room.name].distanceMatrix = topDownPass.serialize()
        console.log('took: ' + (Game.cpu.getUsed() - startCpu))
        return topDownPass
    } else {
        return PathFinder.CostMatrix.deserialize(Memory.rooms[room.name].distanceMatrix)
    }
}

calculateSpaceForPosition = function(topDownPass, x, y) {
    let value = Math.min(topDownPass.get(x, y),
                         topDownPass.get(x+1, y+1) + 1, topDownPass.get(x, y+1) + 1,
                         topDownPass.get(x-1, y+1) + 1, topDownPass.get(x+1, y) + 1);
    topDownPass.set(x, y, value);

    return value
}

module.exports.renderVisual = function(room) {
    let vis = new RoomVisual(room.name);
    let topDownPass = calcDistances(room)

    for (let y = 49; y >= 0; --y) {
        for (let x = 49; x >= 0; --x) {
            let value = calculateSpaceForPosition(topDownPass, x, y)
            vis.circle(x, y, {radius:value/25});
        }
    }
}

positionsWithSpace = function(room, freeSpace) {
    let positions = []
    let topDownPass = calcDistances(room)

    for (let y = 49; y >= 0; --y) {
        for (let x = 49; x >= 0; --x) {
            let value = calculateSpaceForPosition(topDownPass, x, y)
            if (value > freeSpace) {
                positions.push(room.getPositionAt(x, y))
            }
        }
    }

    return positions
}

module.exports.findClosestPositionWithSpace = function(roomObject, freeSpace) {
    return roomObject.pos.findClosestByPath(positionsWithSpace(roomObject.room, freeSpace))
}