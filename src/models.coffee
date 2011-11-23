class Cache extends Backbone.Model
  timestamp: null
  key: null
  version: null
  suggestions = null
  
class CacheCollection extends Backbone.Collection
  model: Cache
  comparator: (cache) ->
    cache.get 'key'