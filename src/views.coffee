### The view that manages displaying the list of suggestions ###
class SuggestionView extends Backbone.View
  ### Private fields ###
  _forceClosed: false
  _menuVisible: false
  _controller: null
  _menu: null
  _previousValue: null
  _specified: null
  
  ### Templates that define the layout of the menu for each of it's states ###
  _templates:
    container: '<div></div>'
    default: 'Begin typing for suggestions'
    loading: 'Begin typing for suggestions (Loading...)'
    loaded: '<ol>{{#suggestions}}<li><a href="#">{{name}}</a></li>{{/suggestions}}</ol>'
    empty: 'No suggestions were found'
    error: 'An error has occurred while retrieving data'
  
  ### Default options ###
  options:
    zIndex: 500
    cssClass: 'suggestions-menu'
    selectedCssClass: 'selected'
    
    ### Event callbacks ###
    selected: null
    
  ### Initializes the object ###
  initialize: ->
    @el.attr 'autocomplete', 'off'
    
    @_specified = _.clone(@options)
    
    @options.initiateSuggestion = => @_initiateSuggestion()
    @options.suggesting = => @_suggesting()
    @options.suggested = (cached) => @_suggested(cached)
    @options.error = (jqXHR, textStatus, errorThrown) => @_error(jqXHR, textStatus, errorThrown)
    @options.loading = => @_loading()

    @_controller = new SuggestionController @el, @options
    
    @_generateMenu()
    
    @el.bind (if $.browser.opera then 'keypress' else 'keydown'), (event) => @_keydown(event)
    @el.bind
      keyup: (event) => @_keyup(event)
      blur: (event) => @_blur(event)
      focus: (event) => @_focus(event)
        
  ### Callback for when a suggestion is initialized ###
  _initiateSuggestion: ->
    @_specified?.initiateSuggestion?()
    @render 'default' unless @el.val()?.length > 0

  ### Callback for when a suggestion is processing ###
  _suggesting: ->
    @_specified?.suggesting?()

  _loading: ->
    @_specified?.loading?()
    @render 'loading'
        
  ### Callback for when a suggestions is completed ###
  _suggested: (cached) ->
    @_specified?.suggested?(cached)
    suggestions = cached.get('suggestions')
    if suggestions.length > 0 then @render 'loaded', suggestions else @render 'empty'
    
  ### Callback for when there is an AJAX error durion a suggestion ###
  _error: (jqXHR, textStatus, errorThrown) ->
    @_specified?.error?(jqXHR, textStatus, errorThrown)
    @render 'error'
    
  ### Manages user input ###
  _keydown: (event) ->
    return if @_forceClosed
    
    switch event.keyCode
      when KEYS.UP
        return unless @_menuVisible
        event.preventDefault()
        
        selected = @_menu.find "li.#{@options.selectedCssClass}"

        if selected?.size() > 0 and selected?.prev().length > 0
          selected.removeClass @options.selectedCssClass
          selected.prev().addClass @options.selectedCssClass

      when KEYS.DOWN            
        return unless @_menuVisible
        event.preventDefault()
        
        selected = @_menu.find "li.#{@options.selectedCssClass}"
        
        if selected?.size() > 0 and selected?.next().length > 0
          selected.removeClass @options.selectedCssClass
          selected.next().addClass @options.selectedCssClass

      when KEYS.ENTER
        return unless @_menuVisible
        event.preventDefault()
        
        selected = @_menu.find "li.#{@options.selectedCssClass} a"

        if selected?.get(0)?
          selected.click()
          @hide()

      when KEYS.ESC
        return unless @_menuVisible
        event.preventDefault()
        
        @_forceClosed = true
        @hide()
    
  ### Manages user input and potentially initiates a suggestion call ###
  _keyup: (event) ->
    return if @_forceClosed    
    switch event.keyCode
      when KEYS.UP, KEYS.DOWN, KEYS.ENTER, KEYS.ESC
        if @_menuVisible then do event.preventDefault
      else
        if @_menuVisible and @_previousValue isnt @el.val()
          @_controller.suggest()
          @_previousValue = @el.val()
  
  ### Hides the menu when the element's blur event is fired ###
  _blur: (event) ->
    @hide()

  ### Shows the menu when the element's focus event is fired ###
  _focus: (event) ->
    @_forceClosed = false
    
    @show()
    @_controller.suggest()
    
  ### Generates the menu HTML ###
  _generateMenu: ->
    @_menu = $(Mustache.to_html @_templates.container).addClass(@options.cssClass).css
      'display': 'none'
      'position': 'absolute'
      'z-index': @options.zIndex

    $(document.body).append(@_menu)
      
  ### Displays the menu ###
  show: ->
    return if @_menuVisible
    
    @_menuVisible = true
    @_controller.halt()
    @render 'default'
    
    @_position()
    @_menu.fadeIn
      duration: 200
      
  ### Hides the menu ###
  hide: ->
    return unless @_menuVisible
    
    @_previousValue = null
    @_menuVisible = false
    @_controller.halt()
    @_menu.fadeOut
      duration: 200
      
  ### Selects a value ###
  select: (val) ->
    @el.val(val)
    @options.selected?(val)
    
  ### Updates the position of the menu ###
  _position: ->
    @_menu.css
      left: @el.offset().left
      top: @el.offset().top + @el.outerHeight()
      width: @el.outerWidth()
  
  ### Renders the template of the menu ###
  render: (state, parameters) ->
    @_menu.empty()
    
    switch state
      when 'default' then @_menu.append Mustache.to_html(@_templates.default)
      when 'loading' then @_menu.append Mustache.to_html(@_templates.loading)
      when 'loaded'
        @_menu.append Mustache.to_html @_templates.loaded,
          suggestions: parameters
          
        @_menu.find('> ol > li:first-child').addClass('selected')
        @_menu.find('> ol > li > a').click (event) =>
          @select($(event.target).text())
          
      when 'empty' then @_menu.append Mustache.to_html(@_templates.empty)
      when 'error' then @_menu.append Mustache.to_html(@_templates.error)
      else @render 'default'