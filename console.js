Object.defineProperty(console.prototype, 'stack', {
    get: function(e) {
        this.log(e.stack)
    }
})