class Cache extends Backbone.Model
  storeName: 'Suggestions.Models.CacheCollection'
  defaults: 
    timestamp: null
    version: Suggestions.version
    suggestions: null
  
class CacheCollection extends Backbone.Collection
  storeName: 'Suggestions.Models.CacheCollection'
  model: Cache
  comparator: (cache) ->
    cache.id