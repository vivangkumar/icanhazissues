/**
 * Represents a hash backed in memory store
 */
function MemoryStore() {
  this.hash = {};
}

MemoryStore.prototype = {
  constructor: MemoryStore,

  get: function(key) {
    var self = this;
    var checkKey = function(key) {
      return self.hash.hasOwnProperty(key);
    }

    if (checkKey(key)) {
      return this.hash[key]
    } else {
      return null;
    }
  },

  set: function(key, value) {
    this.hash[key] = value;
  },

  delete: function(key) {
    delete this.hash[key];
  }
}

module.exports = MemoryStore;