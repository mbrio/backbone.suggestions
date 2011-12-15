### The controller that manages the retrieval of suggestions ###
class SuggestionController  
  ### Initializes the object ###
  constructor: (@el, options) ->
    @options = _.defaults _.clone(options), @options
    @callbacks = _.defaults _.clone(@options.callbacks), @callbacks if @options?.callbacks?
    @ajax = _.defaults _.clone(@options.ajax), @ajax if @options?.ajax?
    if @options.enable ? true then @enable() else @disable()

    @_load()
    
  ### Private fields ###
  _cacheKey: 'suggestions-cache'
  _request: null
  _timeout: null
  
  ### Default options ###
  options:
    timeout: 500
    expiresIn: 1000 * 60 * 60 * 12
    cache: true
    
  ### Event callbacks ###
  callbacks:
    initiateSuggestion: null
    suggesting: null
    suggested: null
    loading: null
    error: null
    enabled: null
    disabled: null
  
  ### AJAX options ###
  ajax:
    url: '/suggestions?q=:query'
    dataType: 'json'
    
  is_enabled: ->
    @_enabled
    
  enable: ->
    return if @_enabled
    @halt()
    @_enabled = true
    @callbacks.enabled?()
  
  disable: ->
    return unless @_enabled
    @halt()
    @_enabled = false
    @callbacks.disabled?()
    
  ### Initializes a suggestion ###
  suggest: ->
    return unless @is_enabled()
    
    @callbacks.initiateSuggestion?()
    @halt();

    if @el.val()
      @callbacks.suggesting?()
      @_timeout = setTimeout @_suggestionMethod(@el.val()), (@options.timeout)
    
  ### Halts any AJAX requests and timeouts ###
  halt: ->
    @_request?.abort()
    clearTimeout @_timeout if @_timeout?

  ### Determines whether to use locally cached or remotely called data ###
  _suggestionMethod: (key) ->
    key = (@ajax.url).replace ':query', key.toLowerCase()
    
    cached = @_findCache(key)
  
    if cached? then () => @_local(cached) else () => @_ajax(key)
    
  ### Complete suggestion with local data ###
  _local: (cached) ->    
    @callbacks.suggested?(cached)
    
  ### Retrieve remote data and cache it prior to completing suggestion with
      local data ###
  _ajax: (key) ->
    @callbacks.loading?()

    ajaxOptions =
      url: key
      success: (data) =>
        @_request = null
      
        @_processAjax key.toLowerCase(), data?.suggestions
        @ajax.success? data
      error: (jqXHR, textStatus, errorThrown) =>
        @callbacks.error? jqXHR, textStatus, errorThrown
        @ajax.error? jqXHR, textStatus, errorThrow
        
    ajaxOptions = _.defaults ajaxOptions, @ajax
    @callbacks = _.defaults @options.callbacks, @callbacks if @options?.callbacks?
    @_request = $.ajax ajaxOptions
        
  ### Process the retrieved data prior to completing the suggestion with local
      data ###
  _processAjax: (key, suggestions) ->
    cached = new Cache
      timestamp: new Date
      key: key
      version: Suggestions.version
      suggestions: suggestions
        
    if @options.cache
      @_cache.add cached
      @_save()
    
    @_local(cached)
    
  ### Methods for managing the cache ###
  
  ### Save the data to local storage ###
  ### TODO: Would like to move this to the Backbone localStorage mechanism of
      the collection ###
  _save: ->
    if @options.cache
      localStorage.setItem @_cacheKey, JSON.stringify(@_cache)
    
  ### Load the data from localStorage, if there is a JSON parsing exception
      create a new data collection ###
  _load: ->
    if @options.cache
      json = localStorage.getItem @_cacheKey
    
      # If a JSON parse error occurs reset the localStorage
      try
        @_cache = new CacheCollection(@_parse(json)) ? new CacheCollection
      catch error
        localStorage.removeItem @_cacheKey
        @_cache = new CacheCollection
    else
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

    if suggestions? and (suggestions.get('version') isnt Suggestions.version or (new Date() - suggestions.get('timestamp')) > @options.expiresIn)
      @_cache.remove suggestions
      suggestions = null

    suggestions