/*
backbone.suggestions.js 0.5.0
(c) 2011 Michael Diolosa, Deepend New York, Inc.
backbone.suggestions.js may be freely distributed under the MIT license.
For all details and documentation:
https://github.com/mbrio/backbone.suggestions/wiki/License
*/
(function() {
  var $, Cache, CacheCollection, KEYS, SuggestionController, SuggestionView, Suggestions, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $ = jQuery;

  root = this;

  Suggestions = root.Suggestions = {};

  Suggestions.version = '0.5.0';

  KEYS = {
    UP: 38,
    DOWN: 40,
    ENTER: 13,
    ESC: 27
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
      suggestions: null
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

    function SuggestionController(el, options) {
      var _ref;
      this.el = el;
      this.options = _.defaults(options, this.options);
      if ((_ref = this.options.enable) != null ? _ref : true) {
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

    /* Default options
    */

    SuggestionController.prototype.options = {
      url: '/suggestions?q=:query',
      timeout: 500,
      expiresIn: 1000 * 60 * 60 * 12,
      /* Event callbacks
      */
      initiateSuggestion: null,
      suggesting: null,
      suggested: null,
      loading: null,
      error: null,
      enabled: null,
      disabled: null
    };

    SuggestionController.prototype.is_enabled = function() {
      return this._enabled;
    };

    SuggestionController.prototype.enable = function() {
      var _base;
      if (this._enabled) return;
      this.halt();
      this._enabled = true;
      return typeof (_base = this.options).enabled === "function" ? _base.enabled() : void 0;
    };

    SuggestionController.prototype.disable = function() {
      var _base;
      if (!this._enabled) return;
      this.halt();
      this._enabled = false;
      return typeof (_base = this.options).disabled === "function" ? _base.disabled() : void 0;
    };

    /* Initializes a suggestion
    */

    SuggestionController.prototype.suggest = function() {
      var _base, _base2;
      if (!this.is_enabled()) return;
      if (typeof (_base = this.options).initiateSuggestion === "function") {
        _base.initiateSuggestion();
      }
      this.halt();
      if (this.el.val()) {
        if (typeof (_base2 = this.options).suggesting === "function") {
          _base2.suggesting();
        }
        return this._timeout = setTimeout(this._suggestionMethod(this.el.val()), this.options.timeout);
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

    SuggestionController.prototype._suggestionMethod = function(key) {
      var cached;
      var _this = this;
      key = this.options.url.replace(':query', key.toLowerCase());
      cached = this._findCache(key);
      if (cached != null) {
        return function() {
          return _this._local(cached);
        };
      } else {
        return function() {
          return _this._ajax(key);
        };
      }
    };

    /* Complete suggestion with local data
    */

    SuggestionController.prototype._local = function(cached) {
      var _base;
      return typeof (_base = this.options).suggested === "function" ? _base.suggested(cached) : void 0;
    };

    /* Retrieve remote data and cache it prior to completing suggestion with
        local data
    */

    SuggestionController.prototype._ajax = function(key) {
      var _base;
      var _this = this;
      if (typeof (_base = this.options).loading === "function") _base.loading();
      return this._request = $.ajax({
        url: key,
        dataType: 'json',
        success: function(data) {
          _this._request = null;
          return _this._processAjax(key.toLowerCase(), data != null ? data.suggestions : void 0);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          var _base2;
          return typeof (_base2 = _this.options).error === "function" ? _base2.error(jqXHR, textStatus, errorThrown) : void 0;
        }
      });
    };

    /* Process the retrieved data prior to completing the suggestion with local
        data
    */

    SuggestionController.prototype._processAjax = function(key, suggestions) {
      var cached;
      cached = new Cache({
        timestamp: new Date,
        key: key,
        version: Suggestions.version,
        suggestions: suggestions
      });
      this._cache.add(cached);
      this._save();
      return this._local(cached);
    };

    /* Methods for managing the cache
    */

    /* Save the data to local storage
    */

    /* TODO: Would like to move this to the Backbone localStorage mechanism of
        the collection
    */

    SuggestionController.prototype._save = function() {
      return localStorage.setItem(this._cacheKey, JSON.stringify(this._cache));
    };

    /* Load the data from localStorage, if there is a JSON parsing exception
        create a new data collection
    */

    SuggestionController.prototype._load = function() {
      var json, _ref;
      json = localStorage.getItem(this._cacheKey);
      try {
        return this._cache = (_ref = new CacheCollection(this._parse(json))) != null ? _ref : new CacheCollection;
      } catch (error) {
        localStorage.removeItem(this._cacheKey);
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

    __extends(SuggestionView, Backbone.View);

    function SuggestionView() {
      this._onfocus = __bind(this._onfocus, this);
      this._onblur = __bind(this._onblur, this);
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

    SuggestionView.prototype._specified = null;

    /* Templates that define the layout of the menu for each of it's states
    */

    SuggestionView.prototype.templates = {
      container: _.template('<div></div>'),
      "default": _.template('<span class="message default">Begin typing for suggestions</span>'),
      loading: _.template('<span class="message loading">Begin typing for suggestions (Loading...)</span>'),
      loadedList: _.template('<ol></ol>'),
      loadedItem: _.template('<li><a href="#"><%= name %></a></li>'),
      empty: _.template('<span class="message empty">No suggestions were found</span>'),
      error: _.template('<span class="message error">An error has occurred while retrieving data</span>')
    };

    /* Default options
    */

    SuggestionView.prototype.options = {
      zIndex: 500,
      cssClass: 'suggestions-menu',
      selectedCssClass: 'selected',
      enableForceClose: true,
      /* Event callbacks
      */
      selected: null
    };

    SuggestionView.prototype._onkeydown = function(event) {
      return this._keydown(event);
    };

    SuggestionView.prototype._onkeyup = function(event) {
      return this._keyup(event);
    };

    SuggestionView.prototype._onblur = function(event) {
      return this._blur(event);
    };

    SuggestionView.prototype._onfocus = function(event) {
      return this._focus(event);
    };

    /* Initializes the object
    */

    SuggestionView.prototype.initialize = function() {
      var _this = this;
      this.el.attr('autocomplete', 'off');
      this._specified = _.clone(this.options);
      this.options.initiateSuggestion = function() {
        return _this._initiateSuggestion();
      };
      this.options.suggesting = function() {
        return _this._suggesting();
      };
      this.options.suggested = function(cached) {
        return _this._suggested(cached);
      };
      this.options.error = function(jqXHR, textStatus, errorThrown) {
        return _this._error(jqXHR, textStatus, errorThrown);
      };
      this.options.loading = function() {
        return _this._loading();
      };
      this.options.enabled = function() {
        return _this._enabled();
      };
      this.options.disabled = function() {
        return _this._disabled();
      };
      this._controller = new SuggestionController(this.el, this.options);
      return this._generateMenu();
    };

    SuggestionView.prototype.is_enabled = function() {
      return this._controller.is_enabled();
    };

    SuggestionView.prototype._enabled = function() {
      var _ref;
      this.el.bind(($.browser.opera ? 'keypress' : 'keydown'), this._onkeydown);
      this.el.bind({
        keyup: this._onkeyup,
        blur: this._onblur,
        focus: this._onfocus
      });
      return (_ref = this._specified) != null ? typeof _ref.enabled === "function" ? _ref.enabled() : void 0 : void 0;
    };

    SuggestionView.prototype._disabled = function() {
      var _ref;
      this.el.blur();
      this.el.unbind(($.browser.opera ? 'keypress' : 'keydown'), this._onkeydown);
      this.el.unbind({
        keyup: this._onkeyup,
        blur: this._onblur,
        focus: this._onfocus
      });
      return (_ref = this._specified) != null ? typeof _ref.disabled === "function" ? _ref.disabled() : void 0 : void 0;
    };

    SuggestionView.prototype.enable = function() {
      return this._controller.enable();
    };

    SuggestionView.prototype.disable = function() {
      return this._controller.disable();
    };

    /* Callback for when a suggestion is initialized
    */

    SuggestionView.prototype._initiateSuggestion = function() {
      var _ref, _ref2;
      if ((_ref = this._specified) != null) {
        if (typeof _ref.initiateSuggestion === "function") {
          _ref.initiateSuggestion();
        }
      }
      if (!(((_ref2 = this.el.val()) != null ? _ref2.length : void 0) > 0)) {
        return this.render('default');
      }
    };

    /* Callback for when a suggestion is processing
    */

    SuggestionView.prototype._suggesting = function() {
      var _ref;
      return (_ref = this._specified) != null ? typeof _ref.suggesting === "function" ? _ref.suggesting() : void 0 : void 0;
    };

    SuggestionView.prototype._loading = function() {
      var _ref;
      if ((_ref = this._specified) != null) {
        if (typeof _ref.loading === "function") _ref.loading();
      }
      return this.render('loading');
    };

    /* Callback for when a suggestions is completed
    */

    SuggestionView.prototype._suggested = function(cached) {
      var suggestions, _ref;
      if ((_ref = this._specified) != null) {
        if (typeof _ref.suggested === "function") _ref.suggested(cached);
      }
      suggestions = cached.get('suggestions');
      if (suggestions.length > 0) {
        return this.render('loaded', suggestions);
      } else {
        return this.render('empty');
      }
    };

    /* Callback for when there is an AJAX error durion a suggestion
    */

    SuggestionView.prototype._error = function(jqXHR, textStatus, errorThrown) {
      var _ref;
      if ((_ref = this._specified) != null) {
        if (typeof _ref.error === "function") {
          _ref.error(jqXHR, textStatus, errorThrown);
        }
      }
      return this.render('error');
    };

    /* Manages user input
    */

    SuggestionView.prototype._keydown = function(event) {
      var selected;
      if (this._forceClosed) return;
      switch (event.keyCode) {
        case KEYS.UP:
          if (!this._menuVisible) return;
          event.preventDefault();
          selected = this._menu.find("li." + this.options.selectedCssClass);
          if ((selected != null ? selected.size() : void 0) > 0 && (selected != null ? selected.prev().length : void 0) > 0) {
            selected.removeClass(this.options.selectedCssClass);
            return selected.prev().addClass(this.options.selectedCssClass);
          }
          break;
        case KEYS.DOWN:
          if (!this._menuVisible) return;
          event.preventDefault();
          selected = this._menu.find("li." + this.options.selectedCssClass);
          if ((selected != null ? selected.size() : void 0) > 0 && (selected != null ? selected.next().length : void 0) > 0) {
            selected.removeClass(this.options.selectedCssClass);
            return selected.next().addClass(this.options.selectedCssClass);
          }
          break;
        case KEYS.ENTER:
          if (!this._menuVisible) return;
          event.preventDefault();
          selected = this._menu.find("li." + this.options.selectedCssClass + " a");
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
      if (this._forceClosed) return;
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

    /* Hides the menu when the element's blur event is fired
    */

    SuggestionView.prototype._blur = function(event) {
      return this.hide();
    };

    /* Shows the menu when the element's focus event is fired
    */

    SuggestionView.prototype._focus = function(event) {
      this._forceClosed = false;
      this.show();
      return this._controller.suggest();
    };

    /* Generates the menu HTML
    */

    SuggestionView.prototype._generateMenu = function() {
      this._menu = $(this.templates.container()).addClass(this.options.cssClass).css({
        display: 'none'
      });
      return this.el.parent().append(this._menu);
    };

    /* Displays the menu
    */

    SuggestionView.prototype.show = function() {
      if (this._menuVisible) return;
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
      if (!this._menuVisible) return;
      this._previousValue = null;
      this._menuVisible = false;
      this._controller.halt();
      return this._menu.fadeOut({
        duration: 200
      });
    };

    /* Selects a value
    */

    SuggestionView.prototype.select = function(val) {
      var _base;
      this.el.val(val);
      return typeof (_base = this.options).selected === "function" ? _base.selected(val) : void 0;
    };

    /* Updates the position of the menu
    */

    /* Renders the template of the menu
    */

    SuggestionView.prototype.render = function(state, parameters) {
      var list, suggestion, _i, _len;
      var _this = this;
      this._menu.empty();
      switch (state) {
        case 'default':
          return this._menu.append(this.templates["default"]());
        case 'loading':
          return this._menu.append(this.templates.loading());
        case 'loaded':
          list = $(this.templates.loadedList());
          for (_i = 0, _len = parameters.length; _i < _len; _i++) {
            suggestion = parameters[_i];
            list.append(this.templates.loadedItem(suggestion));
          }
          this._menu.append(list);
          this._menu.find('> ol > li:first-child').addClass('selected');
          return this._menu.find('> ol > li > a').click(function(event) {
            return _this.select($(event.target).text());
          });
        case 'empty':
          return this._menu.append(this.templates.empty());
        case 'error':
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
