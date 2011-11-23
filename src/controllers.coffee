### The controller that manages the retrieval of suggestions ###
class SuggestionController
  ### Initializes the object ###
  constructor: (@el, options) ->
    @options = _.defaults options, @options

    @_load()
    
  ### Private fields ###
  _cacheKey: 'suggestions-cache'
  _request: null
  _timeout: null
  
  ### Default options ###
  options:
    url: '/suggestions?q=:query'
    timeout: 500
    expiresIn: 1000 * 60 * 60 * 12
    
    ### Event callbacks ###
    initiateSuggestion: null
    suggesting: null
    suggested: null
    loading: null
    error: null
    
  ### Initializes a suggestion ###
  suggest: ->
    @options.initiateSuggestion?()
    @halt();

    if @el.val()
      @options.suggesting?()
      @_timeout = setTimeout @_suggestionMethod(@el.val()), (@options.timeout)
    
  ### Halts any AJAX requests and timeouts ###
  halt: ->
    @_request?.abort()
    clearTimeout @_timeout if @_timeout?

  ### Determines whether to use locally cached or remotely called data ###
  _suggestionMethod: (key) ->
    key = (@options.url).replace ':query', key.toLowerCase()
    
    cached = @_findCache(key)
    
    if cached? then () => @_local(cached) else () => @_ajax(key)
    
  ### Complete suggestion with local data ###
  _local: (cached) ->    
    @options.suggested?(cached)
    
  ### Retrieve remote data and cache it prior to completing suggestion with
      local data ###
  _ajax: (key) ->
    @options.loading?()
    @_request = $.ajax
      url: key
      dataType: 'json'
      success: (data) =>
        @_request = null
        
        @_processAjax key.toLowerCase(), data?.suggestions
      error: (jqXHR, textStatus, errorThrown) =>
        @options.error?(jqXHR, textStatus, errorThrown)
        
  ### Process the retrieved data prior to completing the suggestion with local
      data ###
  _processAjax: (key, suggestions) ->
    # TODO: Remove this line
    suggestions = @_preprocessAjax suggestions

    cached = new Cache
      timestamp: new Date
      key: key
      version: Suggestions.VERSION
      suggestions: suggestions
        
    @_cache.add cached
    @_save()
    
    @_local(cached)
   
  ### This is a temporary method for testing ###
  ### TODO: Remove this method ###
  _preprocessAjax: (suggestions) ->
    val = @el.val().toLowerCase()
    (suggestion for suggestion in suggestions ? [] when suggestion.name.toLowerCase().indexOf(val) is 0)
    
  ### Methods for managing the cache ###
  
  ### Save the data to local storage ###
  ### TODO: Would like to move this to the Backbone localStorage mechanism of
      the collection ###
  _save: ->
    localStorage.setItem @_cacheKey, JSON.stringify(@_cache)
    
  ### Load the data from localStorage, if there is a JSON parsing exception
      create a new data collection ###
  _load: ->
    json = localStorage.getItem @_cacheKey
    
    # If a JSON parse error occurs reset the localStorage
    try
      @_cache = new CacheCollection(@_parse(json)) ? new CacheCollection
    catch error
      localStorage.removeItem @_cacheKey
      @_cache = new CacheCollection
    
  ### Parse the stored JSON data, ensure dates are properly deserialized ###
  _parse: (json) ->
    results = JSON.parse json, (key, value) ->
      if typeof value is 'string'
          a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value)
          if a then return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]))

      value
  
  ### Find the cached suggestions list, if the list returned is of a different
      version or out of date remove the list, if the list does not exist
      return null ###
  _findCache: (key) ->
    suggestions = @_cache.find (item) => item.get('key') is key

    if suggestions? and (suggestions.get('version') isnt Suggestions.VERSION or (new Date() - suggestions.get('timestamp')) > @options.expiresIn)
      @_cache.remove suggestions
      suggestions = null

    suggestions