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
  templates:
    container: _.template('<div></div>')
    default: _.template('<span class="message default">Begin typing for suggestions</span>')
    loading: _.template('<span class="message loading">Begin typing for suggestions (Loading...)</span>')
    loadedList: _.template('<ol></ol>')
    loadedItem: _.template('<li><a href="#"><%= name %></a></li>')
    empty: _.template('<span class="message empty">No suggestions were found</span>')
    error: _.template('<span class="message error">An error has occurred while retrieving data</span>')
  
  ### Default options ###
  options:
    zIndex: 500
    cssClass: 'suggestions-menu'
    selectedCssClass: 'selected'
    enableForceClose: true
    templates: null
    
    ### Event callbacks ###
    selected: null
    
  
  _onkeydown: (event) => @_keydown event
  _onkeyup: (event) => @_keyup event
  _onblur: (event) => @_blur event
  _onfocus: (event) => @_focus event
    
  ### Initializes the object ###
  initialize: ->
    @el.attr 'autocomplete', 'off'
    @_specified = _.clone @options
    @templates = _.defaults @options.templates, @templates if @options?.templates?
    
    @options.initiateSuggestion = => @_initiateSuggestion()
    @options.suggesting = => @_suggesting()
    @options.suggested = (cached) => @_suggested(cached)
    @options.error = (jqXHR, textStatus, errorThrown) => @_error(jqXHR, textStatus, errorThrown)
    @options.loading = => @_loading()
    @options.enabled = => @_enabled()
    @options.disabled = => @_disabled()

    @_controller = new SuggestionController @el, @options
    
    @_generateMenu()
      
  is_enabled: ->
    @_controller.is_enabled()
    
  _enabled: ->
    @el.bind (if $.browser.opera then 'keypress' else 'keydown'), @_onkeydown
    @el.bind
      keyup: @_onkeyup
      blur: @_onblur
      focus: @_onfocus
      
    @_specified?.enabled?()
    
  _disabled: ->
    @el.blur()
    
    @el.unbind (if $.browser.opera then 'keypress' else 'keydown'), @_onkeydown
    @el.unbind
      keyup: @_onkeyup
      blur: @_onblur
      focus: @_onfocus
      
    @_specified?.disabled?()
    
  enable: ->
    @_controller.enable()
        
  disable: ->
    @_controller.disable()
        
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
        return unless @_menuVisible && @options.enableForceClose == true
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
    @_menu = $(@templates.container()).addClass(@options.cssClass).css
      display: 'none'

    @el.parent().append(@_menu)
      
  ### Displays the menu ###
  show: ->
    return if @_menuVisible
    
    @_menuVisible = true
    @_controller.halt()
    @render 'default'
    
    #@_position()
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
  #_position: ->
    #offset = @el.offset()
    #@_menu.css
    #  left: offset.left + @options.offsetLeft
    #  top: offset.top + @options.offsetTop
  
  ### Renders the template of the menu ###
  render: (state, parameters) ->
    @_menu.empty()
    
    switch state
      when 'default' then @_menu.append @templates.default()
      when 'loading' then @_menu.append @templates.loading()
      when 'loaded'
        list = $(@templates.loadedList());
        list.append @templates.loadedItem(suggestion) for suggestion in parameters
        @_menu.append list
          
        @_menu.find('> ol > li:first-child').addClass('selected')
        @_menu.find('> ol > li > a').click (event) =>
          @select($(event.target).text())
          
      when 'empty' then @_menu.append @templates.empty()
      when 'error' then @_menu.append @templates.error()
      else @render 'default'