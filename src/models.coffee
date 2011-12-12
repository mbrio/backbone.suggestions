class Cache extends Backbone.Model
  storageEngine: 'localStorage'
  storeName: 'Suggestions.Models.CacheCollection'
  defaults: 
    timestamp: null
    version: Suggestions.version
    suggestions: null
  
class CacheCollection extends Backbone.Collection
  storageEngine: 'localStorage'
  storeName: 'Suggestions.Models.CacheCollection'
  model: Cache
  comparator: (cache) ->
    cache.id