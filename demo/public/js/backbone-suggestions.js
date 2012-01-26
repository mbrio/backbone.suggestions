/*
backbone.suggestions.js 0.8.6
Copyright (c) 2011-2012 Michael Diolosa, <michael.diolosa@gmail.com>
backbone.suggestions.js may be freely distributed under the MIT license.
For all details and documentation:
https://github.com/mbrio/backbone.suggestions/wiki/License
*/
(function() {
  var $, Cache, CacheCollection, KEYS, PAGING_VECTOR, SuggestionController, SuggestionView, Suggestions, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $ = jQuery;

  root = this;

  Suggestions = root.Suggestions = {};

  Suggestions.version = '0.8.6';

  KEYS = {
    UP: 38,
    DOWN: 40,
    ENTER: 13,
    ESC: 27,
    TAB: 9
  };

  PAGING_VECTOR = {
    NEXT: 1,
    PREV: -1
  };

  Cache = (function() {

    __extends(Cache, Backbone.Model);

    function Cache() {
      Cache.__super__.constructor.apply(this, arguments);
    }

    Cache.prototype.storageEngine = 'localStorage';

    Cache.prototype.storeName = 'Suggestions.Models.CacheCollection';

    Cache.prototype.defaults = {
      timestamp: null,
      version: Suggestions.version,
      suggestions: null,
      hasMore: false
    };

    return Cache;

  })();

  CacheCollection = (function() {

    __extends(CacheCollection, Backbone.Collection);

    function CacheCollection() {
      CacheCollection.__super__.constructor.apply(this, arguments);
    }

    CacheCollection.prototype.storageEngine = 'localStorage';

    CacheCollection.prototype.storeName = 'Suggestions.Models.CacheCollection';

    CacheCollection.prototype.model = Cache;

    CacheCollection.prototype.comparator = function(cache) {
      return cache.id;
    };

    return CacheCollection;

  })();

  /* The controller that manages the retrieval of suggestions
  */

  SuggestionController = (function() {

    /* Initializes the object
    */

    function SuggestionController(view, el, options) {
      var _ref, _ref2, _ref3;
      this.view = view;
      this.el = el;
      this.options = _.defaults(_.clone(options), this.options);
      if (((_ref = this.options) != null ? _ref.callbacks : void 0) != null) {
        this.callbacks = _.defaults(_.clone(this.options.callbacks), this.callbacks);
      }
      if (((_ref2 = this.options) != null ? _ref2.ajax : void 0) != null) {
        this.ajax = _.defaults(_.clone(this.options.ajax), this.ajax);
      }
      if ((_ref3 = this.options.enable) != null ? _ref3 : true) {
        this.enable();
      } else {
        this.disable();
      }
      this._load();
    }

    /* Private fields
    */

    SuggestionController.prototype._cacheKey = 'suggestions-cache';

    SuggestionController.prototype._request = null;

    SuggestionController.prototype._timeout = null;

    SuggestionController.prototype._currentPage = 1;

    /* Default options
    */

    SuggestionController.prototype.options = {
      timeout: 500,
      expiresIn: 1000 * 60 * 60 * 12,
      cache: true,
      lengthThreshold: 3,
      take: 10,
      enable: true
    };

    /* Event callbacks
    */

    SuggestionController.prototype.callbacks = {
      initiateSuggestion: null,
      suggesting: null,
      suggested: null,
      loading: null,
      error: null,
      enabled: null,
      disabled: null,
      checkingLengthThreshold: null
    };

    /* AJAX options
    */

    SuggestionController.prototype.ajax = {
      url: '/suggestions?p=:page&t=:take&q=:query',
      dataType: 'json'
    };

    SuggestionController.prototype.is_enabled = function() {
      return this._enabled;
    };

    SuggestionController.prototype.can_suggest = function() {
      return this.is_enabled() && this.meets_length_threshold();
    };

    SuggestionController.prototype.get_current_page = function() {
      return this._currentPage;
    };

    SuggestionController.prototype.meets_length_threshold = function() {
      return this.el.val().length >= this.options.lengthThreshold;
    };

    SuggestionController.prototype.enable = function() {
      var _ref;
      if (this._enabled) return;
      this.halt();
      this._enabled = true;
      return (_ref = this.callbacks.enabled) != null ? _ref.call(this.view) : void 0;
    };

    SuggestionController.prototype.disable = function() {
      var _ref;
      if (!this._enabled) return;
      this.halt();
      this._enabled = false;
      return (_ref = this.callbacks.disabled) != null ? _ref.call(this.view) : void 0;
    };

    /* Initializes a suggestion
    */

    SuggestionController.prototype.suggest = function(pagingVector) {
      var _ref, _ref2, _ref3;
      if (pagingVector == null) pagingVector = null;
      this.halt();
      if ((_ref = this.callbacks.checkingLengthThreshold) != null) {
        _ref.call(this.view, this.meets_length_threshold());
      }
      if (!this.can_suggest()) return;
      if ((_ref2 = this.callbacks.initiateSuggestion) != null) {
        _ref2.call(this.view);
      }
      if (pagingVector === null) {
        this._currentPage = 1;
        pagingVector = 0;
      }
      if (this.el.val()) {
        this._currentPage = this._currentPage + pagingVector;
        if (this._currentPage < 1) this._currentPage = 1;
        if ((_ref3 = this.callbacks.suggesting) != null) {
          _ref3.call(this.view, pagingVector);
        }
        return this._timeout = setTimeout(this._suggestionMethod(this.el.val(), pagingVector), this.options.timeout);
      }
    };

    /* Halts any AJAX requests and timeouts
    */

    SuggestionController.prototype.halt = function() {
      var _ref;
      if ((_ref = this._request) != null) _ref.abort();
      if (this._timeout != null) return clearTimeout(this._timeout);
    };

    /* Determines whether to use locally cached or remotely called data
    */

    SuggestionController.prototype._suggestionMethod = function(key, pagingVector) {
      var cached;
      var _this = this;
      key = this.ajax.url.replace(':query', key.toLowerCase());
      key = key.replace(':page', this._currentPage);
      key = key.replace(':take', this.options.take);
      cached = this._findCache(key);
      if (cached != null) {
        return function() {
          return _this._local(cached, pagingVector);
        };
      } else {
        return function() {
          return _this._ajax(key, pagingVector);
        };
      }
    };

    /* Complete suggestion with local data
    */

    SuggestionController.prototype._local = function(cached, pagingVector) {
      var _ref;
      return (_ref = this.callbacks.suggested) != null ? _ref.call(this.view, cached, pagingVector) : void 0;
    };

    /* Retrieve remote data and cache it prior to completing suggestion with
        local data
    */

    SuggestionController.prototype._ajax = function(key, pagingVector) {
      var ajaxOptions, _ref, _ref2;
      var _this = this;
      if ((_ref = this.callbacks.loading) != null) {
        _ref.call(this.view, pagingVector);
      }
      ajaxOptions = {
        url: key,
        success: function(data) {
          var _base, _ref2;
          _this._request = null;
          _this._processAjax(key.toLowerCase(), data != null ? data.suggestions : void 0, pagingVector, (_ref2 = data != null ? data.hasMore : void 0) != null ? _ref2 : false);
          return typeof (_base = _this.ajax).success === "function" ? _base.success(data) : void 0;
        },
        error: function(jqXHR, textStatus, errorThrown) {
          var _base, _ref2;
          if ((_ref2 = _this.callbacks.error) != null) {
            _ref2.call(_this.view, jqXHR, textStatus, errorThrown);
          }
          return typeof (_base = _this.ajax).error === "function" ? _base.error(jqXHR, textStatus, errorThrown) : void 0;
        }
      };
      ajaxOptions = _.defaults(ajaxOptions, this.ajax);
      if (((_ref2 = this.options) != null ? _ref2.callbacks : void 0) != null) {
        this.callbacks = _.defaults(this.options.callbacks, this.callbacks);
      }
      return this._request = $.ajax(ajaxOptions);
    };

    /* Process the retrieved data prior to completing the suggestion with local
        data
    */

    SuggestionController.prototype._processAjax = function(key, suggestions, pagingVector, hasMore) {
      var cached;
      cached = new Cache({
        timestamp: new Date,
        key: key,
        version: Suggestions.version,
        suggestions: suggestions,
        hasMore: hasMore
      });
      if (this.options.cache) {
        this._cache.add(cached);
        this._save();
      }
      return this._local(cached, pagingVector);
    };

    /* Methods for managing the cache
    */

    /* Save the data to local storage
    */

    /* TODO: Would like to move this to the Backbone localStorage mechanism of
        the collection
    */

    SuggestionController.prototype._save = function() {
      if (this.options.cache) {
        return localStorage.setItem(this._cacheKey, JSON.stringify(this._cache));
      }
    };

    /* Load the data from localStorage, if there is a JSON parsing exception
        create a new data collection
    */

    SuggestionController.prototype._load = function() {
      var json, _ref;
      if (this.options.cache) {
        json = localStorage.getItem(this._cacheKey);
        try {
          return this._cache = (_ref = new CacheCollection(this._parse(json))) != null ? _ref : new CacheCollection;
        } catch (error) {
          localStorage.removeItem(this._cacheKey);
          return this._cache = new CacheCollection;
        }
      } else {
        return this._cache = new CacheCollection;
      }
    };

    /* Parse the stored JSON data, ensure dates are properly deserialized
    */

    SuggestionController.prototype._parse = function(json) {
      var results;
      return results = JSON.parse(json, function(key, value) {
        var a;
        if (typeof value === 'string') {
          a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
          if (a) {
            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
          }
        }
        return value;
      });
    };

    /* Find the cached suggestions list, if the list returned is of a different
        version or out of date remove the list, if the list does not exist
        return null
    */

    SuggestionController.prototype._findCache = function(key) {
      var suggestions;
      var _this = this;
      suggestions = this._cache.find(function(item) {
        return item.get('key') === key;
      });
      if ((suggestions != null) && (suggestions.get('version') !== Suggestions.version || (new Date() - suggestions.get('timestamp')) > this.options.expiresIn)) {
        this._cache.remove(suggestions);
        suggestions = null;
      }
      return suggestions;
    };

    return SuggestionController;

  })();

  /* The view that manages displaying the list of suggestions
  */

  SuggestionView = (function() {
    var _blurTimeout, _donotBlur;

    __extends(SuggestionView, Backbone.View);

    function SuggestionView() {
      this._listItemClick = __bind(this._listItemClick, this);
      this._prevClick = __bind(this._prevClick, this);
      this._nextClick = __bind(this._nextClick, this);
      this._moreLoadingClick = __bind(this._moreLoadingClick, this);
      this._moreClick = __bind(this._moreClick, this);
      this._onblur = __bind(this._onblur, this);
      this._onfocus = __bind(this._onfocus, this);
      this._onkeyup = __bind(this._onkeyup, this);
      this._onkeydown = __bind(this._onkeydown, this);
      SuggestionView.__super__.constructor.apply(this, arguments);
    }

    /* Private fields
    */

    SuggestionView.prototype._forceClosed = false;

    SuggestionView.prototype._menuVisible = false;

    SuggestionView.prototype._controller = null;

    SuggestionView.prototype._menu = null;

    SuggestionView.prototype._previousValue = null;

    _blurTimeout = null;

    _donotBlur = false;

    /* Templates that define the layout of the menu for each of it's states
    */

    SuggestionView.prototype.templates = {
      container: _.template('<div class="<%= cssClass %>"></div>'),
      "default": _.template('<span class="message default">Begin typing for suggestions</span>'),
      loading: _.template('<span class="message loading">Begin typing for suggestions (Loading...)</span>'),
      loadedList: _.template('<ol class="<%= cssClass %>"></ol><ol class="<%= pagingPanelCssClass %>"><li><a href="javascript:void(0)" class="<%= prevActionCssClass %>">Prev</a></li><li><a href="javascript:void(0)" class="<%= nextActionCssClass %>">Next</a></li></ol>'),
      loadedItem: _.template('<li class="<%= cssClass %>"><a href="javascript:void(0)" class="<%= actionCssClass %>"><%= value %></a></li>'),
      empty: _.template('<span class="message empty">No suggestions were found</span>'),
      error: _.template('<span class="message error">An error has occurred while retrieving data</span>')
    };

    /* Event callbacks
    */

    SuggestionView.prototype.callbacks = {
      selected: null,
      abort: null,
      keyDown: null,
      keyUp: null,
      show: null,
      hide: null
    };

    /* Default options
    */

    SuggestionView.prototype.options = {
      zIndex: 500,
      cssClass: 'suggestions-menu',
      pagingPanelCssClass: 'suggestions-paging-panel',
      nextActionCssClass: 'suggestions-next-action',
      prevActionCssClass: 'suggestions-prev-action',
      loadedListCssClass: 'suggestions-loaded-list',
      listItemCssClass: 'suggestions-list-item',
      listItemActionCssClass: 'suggestions-list-item-action',
      selectedCssClass: 'selected',
      enableForceClose: true,
      templates: null,
      callbacks: null,
      valueField: 'value',
      paging: true
    };

    SuggestionView.prototype._onkeydown = function(event) {
      return this._keydown(event);
    };

    SuggestionView.prototype._onkeyup = function(event) {
      return this._keyup(event);
    };

    SuggestionView.prototype._onfocus = function(event) {
      return this._focus(event);
    };

    SuggestionView.prototype._onblur = function(event) {
      return this._blur(event);
    };

    /* Initializes the object
    */

    SuggestionView.prototype.initialize = function() {
      var _ref, _ref2;
      var _this = this;
      this.el.attr('autocomplete', 'off');
      if (((_ref = this.options) != null ? _ref.templates : void 0) != null) {
        this.templates = _.clone(_.defaults(this.options.templates, this.templates));
      }
      if (((_ref2 = this.options) != null ? _ref2.callbacks : void 0) != null) {
        this.callbacks = _.clone(_.defaults(this.options.callbacks, this.callbacks));
      }
      this.options.callbacks = {
        initiateSuggestion: function() {
          return _this._initiateSuggestion();
        },
        checkingLengthThreshold: function(does_meet) {
          return _this._checkingLengthThreshold(does_meet);
        },
        suggesting: function() {
          return _this._suggesting();
        },
        suggested: function(cached, pagingVector) {
          return _this._suggested(cached, pagingVector);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          return _this._error(jqXHR, textStatus, errorThrown);
        },
        loading: function(pagingVector) {
          return _this._loading(pagingVector);
        },
        enabled: function() {
          return _this._enabled();
        },
        disabled: function() {
          return _this._disabled();
        }
      };
      this._controller = new SuggestionController(this, this.el, this.options);
      return this._generateMenu();
    };

    SuggestionView.prototype.is_enabled = function() {
      return this._controller.is_enabled();
    };

    SuggestionView.prototype._enabled = function() {
      var _ref, _ref2;
      this.el.bind(($.browser.opera ? 'keypress' : 'keydown'), this._onkeydown);
      this.el.bind({
        keyup: this._onkeyup,
        blur: this._onblur,
        focus: this._onfocus
      });
      return (_ref = this.callbacks) != null ? (_ref2 = _ref.enabled) != null ? _ref2.call(this) : void 0 : void 0;
    };

    SuggestionView.prototype._disabled = function() {
      var _ref, _ref2;
      this.el.blur();
      this.el.unbind(($.browser.opera ? 'keypress' : 'keydown'), this._onkeydown);
      this.el.unbind({
        keyup: this._onkeyup,
        blur: this._onblur,
        focus: this._onfocus
      });
      return (_ref = this.callbacks) != null ? (_ref2 = _ref.disabled) != null ? _ref2.call(this) : void 0 : void 0;
    };

    SuggestionView.prototype.enable = function() {
      return this._controller.enable();
    };

    SuggestionView.prototype.disable = function() {
      return this._controller.disable();
    };

    /* Callback for when the controller is checking the length threshold prior
        to making a suggestion
    */

    SuggestionView.prototype._checkingLengthThreshold = function(does_meet) {
      var _ref;
      if ((_ref = this.callbacks.checkingLengthThreshold) != null) {
        _ref.call(this, does_meet);
      }
      if (!does_meet) return this.render('default');
    };

    /* Callback for when a suggestion is initialized
    */

    SuggestionView.prototype._initiateSuggestion = function() {
      var _ref, _ref2;
      if ((_ref = this.callbacks.initiateSuggestion) != null) _ref.call(this);
      if (!(((_ref2 = this.el.val()) != null ? _ref2.length : void 0) > 0)) {
        return this.render('default');
      }
    };

    /* Callback for when a suggestion is processing
    */

    SuggestionView.prototype._suggesting = function() {
      var _ref;
      return (_ref = this.callbacks.suggesting) != null ? _ref.call(this) : void 0;
    };

    SuggestionView.prototype._loading = function(pagingVector) {
      var _ref;
      if ((_ref = this.callbacks.loading) != null) _ref.call(this, pagingVector);
      return this.render('loading', {
        pagingVector: pagingVector,
        pagingVector: pagingVector
      });
    };

    /* Callback for when a suggestions is completed
    */

    SuggestionView.prototype._suggested = function(cached, pagingVector) {
      var suggestions, _ref;
      if ((_ref = this.callbacks.suggested) != null) _ref.call(this, cached);
      suggestions = cached.get('suggestions');
      if (suggestions.length > 0) {
        return this.render('loaded', {
          cached: cached,
          pagingVector: pagingVector
        });
      } else {
        return this.render('empty');
      }
    };

    /* Callback for when there is an AJAX error durion a suggestion
    */

    SuggestionView.prototype._error = function(jqXHR, textStatus, errorThrown) {
      var _ref, _ref2;
      if (textStatus !== 'abort') {
        if ((_ref = this.callbacks.error) != null) {
          _ref.call(this, jqXHR, textStatus, errorThrown);
        }
        return this.render('error');
      } else {
        if ((_ref2 = this.callbacks.abort) != null) {
          _ref2.call(this, jqXHR, textStatus, errorThrown);
        }
        return this.render('default');
      }
    };

    /* Manages user input
    */

    SuggestionView.prototype._keydown = function(event) {
      var selected, _ref;
      if (this._forceClosed) return;
      if (((_ref = this.callbacks.keyDown) != null ? _ref.call(this, event) : void 0) === true) {
        return;
      }
      switch (event.keyCode) {
        case KEYS.UP:
          if (!this._menuVisible) return;
          event.preventDefault();
          selected = this.filterFind(this._menu, "." + this.options.listItemCssClass + "." + this.options.selectedCssClass);
          if ((selected != null ? selected.size() : void 0) > 0 && (selected != null ? selected.prev().length : void 0) > 0) {
            selected.removeClass(this.options.selectedCssClass);
            return selected.prev().addClass(this.options.selectedCssClass);
          }
          break;
        case KEYS.DOWN:
          if (!this._menuVisible) return;
          event.preventDefault();
          selected = this.filterFind(this._menu, "." + this.options.listItemCssClass + "." + this.options.selectedCssClass);
          if ((selected != null ? selected.size() : void 0) > 0 && (selected != null ? selected.next().length : void 0) > 0) {
            selected.removeClass(this.options.selectedCssClass);
            return selected.next().addClass(this.options.selectedCssClass);
          }
          break;
        case KEYS.ENTER:
          if (!this._menuVisible) return;
          event.preventDefault();
          selected = this.filterFind(this._menu, "." + this.options.listItemCssClass + "." + this.options.selectedCssClass + " a");
          if ((selected != null ? selected.get(0) : void 0) != null) {
            selected.click();
            return this.hide();
          }
          break;
        case KEYS.ESC:
          if (!(this._menuVisible && this.options.enableForceClose === true)) {
            return;
          }
          event.preventDefault();
          this._forceClosed = true;
          return this.hide();
      }
    };

    /* Manages user input and potentially initiates a suggestion call
    */

    SuggestionView.prototype._keyup = function(event) {
      var _ref;
      if (this._forceClosed) return;
      if (((_ref = this.callbacks.keyUp) != null ? _ref.call(this, event) : void 0) === true) {
        return;
      }
      switch (event.keyCode) {
        case KEYS.UP:
        case KEYS.DOWN:
        case KEYS.ENTER:
        case KEYS.ESC:
          if (this._menuVisible) return event.preventDefault();
          break;
        default:
          if (this._menuVisible && this._previousValue !== this.el.val()) {
            this._controller.suggest();
            return this._previousValue = this.el.val();
          }
      }
    };

    /* Shows the menu when the element's focus event is fired
    */

    SuggestionView.prototype._focus = function(event) {
      this._forceClosed = false;
      if (this._menuVisible) return;
      this.show();
      return this._controller.suggest();
    };

    /* Hides the menu when the element's blur event is fired
    */

    SuggestionView.prototype._blur = function(event) {
      var callback;
      var _this = this;
      if (!this._donotBlur) {
        callback = function() {
          return _this.hide();
        };
        return this._blurTimeout = setTimeout(callback, 200);
      }
    };

    /* Generates the menu HTML
    */

    SuggestionView.prototype._generateMenu = function() {
      this._menu = $(this.templates.container({
        cssClass: this.options.cssClass
      })).css({
        display: 'none'
      });
      return this.el.parent().append(this._menu);
    };

    /* Displays the menu
    */

    SuggestionView.prototype.show = function() {
      var _ref;
      if (this._menuVisible) return;
      if ((_ref = this.callbacks.show) != null) _ref.call(this);
      clearTimeout(this._blurTimeout);
      this._menuVisible = true;
      this._controller.halt();
      this.render('default');
      return this._menu.fadeIn({
        duration: 200
      });
    };

    /* Hides the menu
    */

    SuggestionView.prototype.hide = function() {
      var _ref;
      if (!this._menuVisible) return;
      if ((_ref = this.callbacks.hide) != null) _ref.call(this);
      this._previousValue = null;
      this._menuVisible = false;
      this._controller.halt();
      return this._menu.fadeOut({
        duration: 200
      });
    };

    /* Passes halt to the _controller property
    */

    SuggestionView.prototype.halt = function() {
      return this._controller.halt();
    };

    /* Selects a value
    */

    SuggestionView.prototype.select = function(val) {
      var _ref;
      this.el.val(val[this.options.valueField]);
      return (_ref = this.callbacks.selected) != null ? _ref.call(this, val) : void 0;
    };

    SuggestionView.prototype.filterFind = function(jq, selector) {
      var obj;
      obj = jq.filter(selector);
      if (!(obj.size() > 0)) obj = jq.find(selector);
      return obj;
    };

    SuggestionView.prototype._moreClick = function(vector) {
      var nextAction, prevAction;
      console.log('clicked');
      nextAction = this.filterFind(this._menu, "." + this.options.nextActionCssClass);
      prevAction = this.filterFind(this._menu, "." + this.options.prevActionCssClass);
      prevAction.unbind('click', this._prevClick);
      nextAction.unbind('click', this._nextClick);
      prevAction.bind('click', this._moreLoadingClick);
      nextAction.bind('click', this._moreLoadingClick);
      this._donotBlur = true;
      clearTimeout(this._blurTimeout);
      event.preventDefault();
      this.el.focus();
      this._donotBlur = false;
      return this._controller.suggest(vector);
    };

    SuggestionView.prototype._moreLoadingClick = function(event) {
      this._donotBlur = true;
      clearTimeout(this._blurTimeout);
      event.preventDefault();
      this.el.focus();
      return this._donotBlur = false;
    };

    SuggestionView.prototype._nextClick = function(event) {
      console.log('test');
      return this._moreClick(PAGING_VECTOR.NEXT);
    };

    SuggestionView.prototype._prevClick = function(event) {
      return this._moreClick(PAGING_VECTOR.PREV);
    };

    SuggestionView.prototype._loadingClick = function(event) {
      return event.preventDefault();
    };

    SuggestionView.prototype._listItemClick = function(event) {
      event.preventDefault();
      return this.select($(event.currentTarget).data('suggestion'));
    };

    /* Renders the template of the menu
    */

    SuggestionView.prototype.render = function(state, parameters) {
      var actionsRemoved, container, li, list, nextAction, prevAction, suggestion, suggestions, _i, _j, _len, _len2;
      switch (state) {
        case 'default':
          this._menu.empty();
          return this._menu.append(this.templates["default"]());
        case 'loading':
          if ((parameters != null) && (parameters.pagingVector === PAGING_VECTOR.NEXT || parameters.pagingVector === PAGING_VECTOR.PREV)) {
            this.filterFind(this._menu, "." + this.options.listItemActionCssClass).unbind('click', this._listItemClick);
            return this.filterFind(this._menu, "." + this.options.listItemActionCssClass).bind('click', this._listItemLoadingClick);
          } else {
            this._menu.empty();
            return this._menu.append(this.templates.loading());
          }
          break;
        case 'loaded':
          if ((parameters != null) && (parameters.pagingVector === PAGING_VECTOR.NEXT || parameters.pagingVector === PAGING_VECTOR.PREV)) {
            container = this.filterFind(this._menu, "." + this.options.loadedListCssClass);
            suggestions = parameters.cached.get('suggestions');
            container.empty();
            for (_i = 0, _len = suggestions.length; _i < _len; _i++) {
              suggestion = suggestions[_i];
              suggestion.cssClass = this.options.listItemCssClass;
              suggestion.actionCssClass = this.options.listItemActionCssClass;
              li = $(this.templates.loadedItem(suggestion));
              this.filterFind(li, "." + this.options.listItemActionCssClass).data('suggestion', suggestion);
              container.append(li);
            }
            nextAction = this.filterFind(this._menu, "." + this.options.nextActionCssClass);
            prevAction = this.filterFind(this._menu, "." + this.options.prevActionCssClass);
            actionsRemoved = 0;
            prevAction.unbind('click', this._moreLoadingClick);
            nextAction.unbind('click', this._moreLoadingClick);
            prevAction.bind('click', this._prevClick);
            nextAction.bind('click', this._nextClick);
            if (!(this._controller.get_current_page() > 1)) {
              prevAction.css('display', 'none');
              actionsRemoved++;
            } else {
              prevAction.css('display', 'block');
            }
            if (parameters.cached.get('hasMore') !== true) {
              nextAction.css('display', 'none');
              actionsRemoved++;
            } else {
              nextAction.css('display', 'block');
            }
            if (actionsRemoved === 2 || this.options.paging === false) {
              this.filterFind(this._menu, "." + this.options.pagingPanelCssClass).css('display', 'none');
            } else {
              this.filterFind(this._menu, "." + this.options.pagingPanelCssClass).css('display', 'block');
            }
            this.filterFind(this._menu, "." + this.options.listItemCssClass + ":first-child").addClass('selected');
            this.filterFind(this._menu, "." + this.options.listItemActionCssClass).bind('click', this._listItemClick);
            return this.filterFind(this._menu, "." + this.options.listItemActionCssClass).unbind('click', this._listItemLoadingClick);
          } else {
            this._menu.empty();
            list = $(this.templates.loadedList({
              cssClass: this.options.loadedListCssClass,
              pagingPanelCssClass: this.options.pagingPanelCssClass,
              prevActionCssClass: this.options.prevActionCssClass,
              nextActionCssClass: this.options.nextActionCssClass
            }));
            container = this.filterFind(list, "." + this.options.loadedListCssClass);
            suggestions = parameters.cached.get('suggestions');
            for (_j = 0, _len2 = suggestions.length; _j < _len2; _j++) {
              suggestion = suggestions[_j];
              suggestion.cssClass = this.options.listItemCssClass;
              suggestion.actionCssClass = this.options.listItemActionCssClass;
              li = $(this.templates.loadedItem(suggestion));
              this.filterFind(li, "." + this.options.listItemActionCssClass).data('suggestion', suggestion);
              container.append(li);
            }
            this._menu.append(list);
            nextAction = this.filterFind(list, "." + this.options.nextActionCssClass);
            prevAction = this.filterFind(list, "." + this.options.prevActionCssClass);
            prevAction.unbind('click', this._moreLoadingClick);
            nextAction.unbind('click', this._moreLoadingClick);
            prevAction.bind('click', this._prevClick);
            nextAction.bind('click', this._nextClick);
            actionsRemoved = 0;
            if (!(this._controller.get_current_page() > 1)) {
              prevAction.css('display', 'none');
              actionsRemoved++;
            }
            if (parameters.cached.get('hasMore') !== true) {
              nextAction.css('display', 'none');
              actionsRemoved++;
            }
            if (actionsRemoved === 2 || this.options.paging === false) {
              this.filterFind(list, "." + this.options.pagingPanelCssClass).css('display', 'none');
            }
            this.filterFind(list, "." + this.options.listItemCssClass + ":first-child").addClass('selected');
            this.filterFind(this._menu, "." + this.options.listItemActionCssClass).bind('click', this._loadingClick);
            return this.filterFind(this._menu, "." + this.options.listItemActionCssClass).unbind('click', this._listItemLoadingClick);
          }
          break;
        case 'empty':
          this._menu.empty();
          return this._menu.append(this.templates.empty());
        case 'error':
          this._menu.empty();
          return this._menu.append(this.templates.error());
        default:
          return this.render('default');
      }
    };

    return SuggestionView;

  })();

  Suggestions.Models = {};

  Suggestions.Models.Cache = Cache;

  Suggestions.Models.CacheCollection = CacheCollection;

  Suggestions.View = SuggestionView;

}).call(this);
