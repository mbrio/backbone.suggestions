### The controller that manages the retrieval of suggestions ###
class SuggestionController  
  ### Initializes the object ###
  constructor: (@view, @el, options) ->
    @isDestroyed = false;
    @options = _.defaults _.clone(options), @options
    @callbacks = _.defaults _.clone(@options.callbacks), @callbacks if @options?.callbacks?
    @ajax = _.defaults _.clone(@options.ajax), @ajax if @options?.ajax?
    if @options.enable ? true then @enable() else @disable()

    @_load()
    
  ### Private fields ###
  _cacheKey: 'suggestions-cache'
  _request: null
  _timeout: null
  _currentPage: 1
  
  ### Default options ###
  options:
    timeout: 500
    expiresIn: 1000 * 60 * 60 * 12
    cache: true
    lengthThreshold: 3
    take: 10
    enable: true
    
  ### Event callbacks ###
  callbacks:
    initiateSuggestion: null
    suggesting: null
    suggested: null
    loading: null
    error: null
    enabled: null
    disabled: null
    checkingLengthThreshold: null
  
  ### AJAX options ###
  ajax:
    url: '/suggestions?p=:page&t=:take&q=:query'
    dataType: 'json'
    
  is_enabled: ->
    @_enabled
    
  can_suggest: ->
    @is_enabled() && @meets_length_threshold()
    
  get_current_page: ->
    @_currentPage
    
  meets_length_threshold: ->
    @el.val().length >= @options.lengthThreshold
    
  enable: ->
    return if @_enabled
    @halt()
    @_enabled = true
    @callbacks.enabled?.call(@view)
  
  disable: ->
    return unless @_enabled
    @halt()
    @_enabled = false
    @callbacks.disabled?.call(@view)
    
  ### Initializes a suggestion ###
  suggest: (pagingVector = null) ->
    @halt();
    @callbacks.checkingLengthThreshold?.call(@view, @meets_length_threshold())
    return unless @can_suggest()
    
    @callbacks.initiateSuggestion?.call(@view)

    if pagingVector == null
      @_currentPage = 1
      pagingVector = 0
      
    if @el.val()
      @_currentPage = @_currentPage + pagingVector
      @_currentPage = 1 if @_currentPage < 1
      
      @callbacks.suggesting?.call(@view, pagingVector)
      
      if pagingVector? && pagingVector != 0
        @_suggestionMethod(@el.val(), pagingVector)()
      else
        @_timeout = setTimeout @_suggestionMethod(@el.val(), pagingVector), (@options.timeout)
    
  ### Halts any AJAX requests and timeouts ###
  halt: ->
    @_request?.abort()
    clearTimeout @_timeout if @_timeout?

  ### Determines whether to use locally cached or remotely called data ###
  _suggestionMethod: (key, pagingVector) ->
    key = (@ajax.url).replace ':query', key.toLowerCase()
    key = key.replace ':page', @_currentPage
    key = key.replace ':take', @options.take
    
    cached = @_findCache(key)
  
    if cached? then () => @_local(cached, pagingVector) else () => @_ajax(key, pagingVector)
    
  ### Complete suggestion with local data ###
  _local: (cached, pagingVector) ->    
    @callbacks.suggested?.call(@view, cached, pagingVector)
    
  ### Retrieve remote data and cache it prior to completing suggestion with
      local data ###
  _ajax: (key, pagingVector) ->
    @callbacks.loading?.call(@view, pagingVector)

    ajaxOptions =
      url: key
      success: (data) =>
        @_request = null
      
        @_processAjax key.toLowerCase(), data?.suggestions, pagingVector, data?.hasMore ? false
        @ajax.success? data
      error: (jqXHR, textStatus, errorThrown) =>
        @callbacks.error?.call(@view, jqXHR, textStatus, errorThrown)
        @ajax.error? jqXHR, textStatus, errorThrown
        
    ajaxOptions = _.defaults ajaxOptions, @ajax
    @callbacks = _.defaults @options.callbacks, @callbacks if @options?.callbacks?
    @_request = $.ajax ajaxOptions
        
  ### Process the retrieved data prior to completing the suggestion with local
      data ###
  _processAjax: (key, suggestions, pagingVector, hasMore) ->
    cached = new Cache
      timestamp: new Date
      key: key
      version: Suggestions.version
      suggestions: suggestions
      hasMore: hasMore
        
    if @options.cache
      @_cache.add cached
      @_save()
    
    @_local(cached, pagingVector)
    
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

  ### Puts the controller in a destroyed state that is no longer functional ###
  destroy: ->
    return if @isDestroyed
    @isDestroyed = true
    @halt()

    @_cacheKey = null
    @_request = null
    @_timeout = null
    @_currentPage = null
    @options = null
    @callbacks = null
    @ajax = null
    @_enabled = null
    @_cache = null