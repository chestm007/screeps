Store.prototype.listResources = function() {
    if (_.isUndefined(this._resources)) {
        this._resources = []
        for (var r in this) {
            if (['_resources', 'listResources'].includes(r)) {
                continue;
            }  
            this._resources.push(r)
        }    
    }
    return this._resources
}