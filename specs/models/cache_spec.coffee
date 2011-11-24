describe 'Cache', ->
  cache = null
  timestamp = new Date
  key = 'a'
  
  beforeEach ->
    cache = new Suggestions.Models.Cache
      timestamp: timestamp
      key: key
      suggestions: [
          { name: 'Alabama' },
          { name: 'Alaska' }
        ]
    
  it 'should initialize correctly', ->
    (cache.get('timestamp') is timestamp).should be: true
    cache.get('key').should be: key
    cache.get('version').should be: Suggestions.version
    cache.get('suggestions').length.should be: 2
    (state.name is 'Alabama' for state in cache.get('suggestions')).shouldNot be: null