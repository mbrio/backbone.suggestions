describe 'CacheCollection', ->
  collection = null
  timestamp = new Date
  id1 = 'a'
  id2 = 'n'
  cache1 = null
  cache2 = null

  beforeEach ->
    collection = new Suggestions.Models.CacheCollection
    collection.fetch()
    collection.each (item) -> item.destroy()
    collection.reset()
    
    cache1 = new Suggestions.Models.Cache
      id: id1
      timestamp: timestamp
      suggestions: [ { name: 'Alabama' }, { name: 'Alaska' } ]
    
    cache2 = new Suggestions.Models.Cache
      id: id2
      timestamp: timestamp
      suggestions: [ { name: 'New York' }, { name: 'North Carolina' } ]

    cache1.save()
    cache2.save()
    
    collection.fetch()
    
  it 'should initialize properly', ->
    collection.length.should be: 2
    collection.at(0).get('suggestions')[0].name.should be: 'Alabama'