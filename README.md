backbone.suggestions.js
===

An autocompletion view for Backbone.js

Requirements
---
* [CoffeeScript](http://jashkenas.github.com/coffee-script/)
* [Underscore.js](http://documentcloud.github.com/underscore/) 1.2.2
* [Backbone.js](http://documentcloud.github.com/backbone/) 0.5.3
* [localStorage polyfill](https://gist.github.com/350433)
* [Backbone Sync Storage Engines + localStorage](https://gist.github.com/1468270)
* [Express](http://expressjs.com/) 2.5.1
* [jQuery](http://jquery.com) 1.7
* [Docco](http://jashkenas.github.com/docco/)

### To run the demo

    cake demo
    
### To build

    cake build
    
### To uglify

    cake uglify
    
### To build spec tests

    cake spec
    
### To build documentation

    cake docs
    
### To clean

    cake clean

Introduction
---
backbone.suggestions.js is a Backbone.js view written in CoffeeScript that
enables AJAX autocompletion backed by a localStorage cache for text input 
fields.

There is no need to add HTML to your document to display the suggestion menu.
A `<div>` element will be generated and placed within the `document.body`
element.
  
    <div class="suggestions-menu">
      <ol>
        <li class="selected">Alabama</li>
        <li>Alaska</li>
      </ol>
    </div>
    
Demo
---
I have supplied a demo application which sits in /demo, along with the
necessary libraries and HTML code. I've added an Express server that will
manage serving HTML and JSON data.

There is a custom compiler middleware configured within the demo that will
compile the CoffeeScript files automatically whenever a JS file is requested,
the compiled JS will be cached for five seconds.

The demo will run on port 3000, http://localhost:3000.

Usage
---
    Suggestions.View(options)
  
Options
---
* `@options` = The suggestions options (all Backbone.View options can be
  passed as well)
    * `ajax` = The options passed to the $.ajax method, below describes the
      default values, see the
      [jQuery documentation](http://api.jquery.com/jQuery.ajax/) for more
      information.
        * `url` = The URL of the REST action, any reference to `:query` within
          the string will be replaced by the text within the input box. The
          values for `:page` will be replaced with the requested page, and
          `:take` will be replaced by how many items to take from the
          response.
          (default: '/suggestions?p=:page&t=:take&q=:query')
        * `dataType` = The type of data that you're expecting back from the
          server.
          (default: 'json')
    * `cache` = Enables or disables caching results in localStorage
      (default: true)
    * `lengthThreshold` = Sets how many characters are need in order to
      begin suggesting.
      (default: 3)
    * `enable` = Sets whether the system is enabled at start.
      (default: true)
    * `take` = Sets how many items to retrieve from the query result
      set.
      (default: 10)
    * `paging` = Sets whether to use paging or not.
      (default: true)
    * `valueField` = The property of the JSON data that represents the textual
      value of the data object.
      (default: 'value')
    * `timeout` = Waiting period before asking for a suggestion.
      (default: 500)
    * `expiresIn` = The expiration duration of cached results.
      (default: 0.5 days)
    * `zIndex` = The z-index of the `<div>` containing element.
        (default: 500)
    * `cssClass` = The CSS class that is applied to the containing element.
      (default: 'suggestions-menu')
    * `loadingCssClass` = The CSS class that is applied whenever the menu
      makes an AJAX call.
    * `nextActionCssClass` = The CSS class for the next action element.
    * `prevActionCssClass` = The CSS class for the previous action element.
    * `pagingPanelCssClass` = The CSS class for the paging container element.
    * `loadedListCssClass` = The CSS class that is applied to the list
      element.
      (default: 'suggestions-loaded-list')
    * `listItemCssClass` = The CSS class that is applied to each list item.
      (default: 'suggestions-list-item')
    * `listItemActionCssClass` = The CSS class that is applied to each item
      in the list that emits the click event, in the default template it's
      applied to an anchor (<a>) tag.
      (default: 'suggestions-list-item-action')
    * `offsetLeft` = The number of pixels to offset the position of the popup
      to by the `left` CSS property, position starts at the bottom left corner
      of the input field. (default: 0)
    * `offsetTop` = The number of pixels to offset the position of the popup
      to by the `top` CSS property, position starts at the bottom left corner
      of the input field. (default: 0)
    * `selectedCssClass` = The CSS class that is applied to the `<li>` element
      that is selected. (default: 'selected')
    * `enableForceClose` = Enables or disables auto-complete windows closing
      when the `esc` key is pressed. (default: true)
    * `callbacks` = The object containing all of the custom callbacks
        * `selected` = The callback that is executed when a suggestion is
          selected.
        * `initiateSuggestion` = The callback that is executed at the
          beginning of a suggestion.
        * `suggesting(paging)` = The callback that is executed when the
          application begins the suggestion process. This callback only occurs
          if a suggestion can proceed, the only state it cannot proceed in is
          when the input field is blank. The only parameter passed is whether
          the method is paging.
        * `suggested(paging)` = The callback that is executed when suggestions
          are displayed. The only parameter passed is whether the method is
          paging.
        * `show` = The callback that is executed when the menu is shown.
        * `hide` = The callback that is executed when the menu is hidden.
        * `loading(pagingVector)` = The callback that is executed when a
          remote call is loading. The only parameter passed is the paging
          vector, 1 means next page and -1 means previous page.
        * `error` = The callback that is executed when an AJAX error occurs.
        * `abort` = The callback that is executed when the AJAX error is an
          abort.
        * `keyDown` = The callback that is executed when a key is pressed
        * `keyUp` = The callback that is executed when a key is released
        * `enabled` = The callback that is executed when the view is enabled.
        * `disabled` = The callback that is executed when the view is
          disabled.
        * `checkingLengthThreshold(does_meet)` = The callback that is executed
          when the controller checks the length threshold prior to determining
          whether a suggestion is to be executed. A value describing whether
          the field does meet the length threshold is passed as the callback's
          only argument.
    * `templates` = The object containing all of the custom templates
        * `default` = The popup content when no text is filled within the
          input
        * `loading` = The popup content when data is loading
        * `loadedList` = The parent list object that will contain the list
          items
        * `loadedItem` = The list item
        * `empty` = The popup content when there are no results found
        * `error` = The popup content when an error occurred
  
Example
---
    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      ajax: {
        url: '/suggestions.json?p=:page&t=:take&q=:query'
      }
    });
      
Templates
---
You can pass templates in as options, the following example displays all of
the available template options and what their default values are. The values
for each of the templates must result in a function.
 
    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      ajax: {
        url: '/suggestions.json?p=:page&t=:take&q=:query'
      },
      templates: {
        container: _.template('<div class="<%= cssClass %>"></div>')
        default: _.template('<span class="message default">Begin typing for suggestions</span>')
        loading: _.template('<span class="message loading">Begin typing for suggestions (Loading...)</span>')
        loadedList: _.template('<ol class="<%= cssClass %>"></ol><ol class="<%= pagingPanelCssClass %>"><li><a href="javascript:void(0)" class="<%= prevActionCssClass %>">Prev</a></li><li><a href="javascript:void(0)" class="<%= nextActionCssClass %>">Next</a></li></ol>')
        loadedItem: _.template('<li class="<%= cssClass %>"><a href="#" class="<%= actionCssClass %>"><%= value %></a></li>')
        empty: _.template('<span class="message empty">No suggestions were found</span>')
        error: _.template('<span class="message error">An error has occurred while retrieving data</span>')
      }
    });

JSON Results
---
JSON formatted responses must contain 1 object with a property called
`suggestions` that represents an array of suggestion values. It may also
contain a second object called `hasMore` that represents if there are more
values that can be loaded in.

**With No More Pages**

    {
      "suggestions": [
        { "value": "Alabama" },
        { "value": "Alaska" },
        { "value": "American Samoa" },
        { "value": "Arizona" },
        { "value": "Arkansas" }
      ],
      "hasMore": false
    }

**With More Pages**    

    {
      "suggestions": [
        { "value": "Alabama" },
        { "value": "Alaska" },
      ],
      "hasMore": true
    }
    
Your suggestions do not have to contain the same data as above (i.e. a
property called `value`); though if they contain fields different than above
you must pass in a custom `templates.loadedItem` template, as well as the
`valueField` option.
    
Testing
---
All of the tests are built using [Jasmine](https://jasmine.github.io/)
and [Mary](https://github.com/alexeypetrushin/mary). You can run the tests by
launching /specs/SpecRunner.html in your browser after running the following
commands:

    cake spec
    
Upgrading To Version 0.7.0
---
The major change is in the way that options are passed. The `url` option needs
to be passed through the `ajax` property and all of the callback options need
to be passed through the `callbacks` property.

**Before**

    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      url: '/suggestions.json?q=:query',
      selected: function() { console.log('selected'); }
    });
    
**After**

    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      ajax: {
        url: '/suggestions.json?q=:query'
      },
      callbacks: {
        selected: function() { console.log('selected'); }
      }
    });
    
Upgrading To Version 0.7.2
---
The `name` property is no longer the default value property of the returned
JSON data, the new default value property name is `value`.

**Before**

    {
      "suggestions": [
        { "name": "Alabama" },
        { "name": "Alaska" },
        { "name": "American Samoa" },
        { "name": "Arizona" },
        { "name": "Arkansas" }
      ]
    }
    
**After**

    {
      "suggestions": [
        { "value": "Alabama" },
        { "value": "Alaska" },
        { "value": "American Samoa" },
        { "value": "Arizona" },
        { "value": "Arkansas" }
      ]
    }
  
You can make the new code work with the old data by passing the following
options to the view:

    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      ajax: {
        url: '/suggestions.json?q=:query'
      },
      valueField: 'name',
      callbacks: {
        selected: function() { console.log('selected'); }
      },
      templates: {
        loadedItem: _.template('<li class="<%= cssClass %>"><a href="#" class="<%= actionCssClass %>"><%= name %></a></li>'),
      }
    });

Upgrading to Version 0.7.11
---
The templates now rely on CSS classes for selecting the elements of the
template. This should make the templates much more flexible. Any custom
templates made for previous versions of the backbone.suggestions.js view must
be converted to the new template structure.

**Before**

    container: _.template('<div></div>')
    default: _.template('<span class="message default">Begin typing for suggestions</span>')
    loading: _.template('<span class="message loading">Begin typing for suggestions (Loading...)</span>')
    loadedList: _.template('<ol></ol>')
    loadedItem: _.template('<li><a href="#"><%= value %></a></li>')
    empty: _.template('<span class="message empty">No suggestions were found</span>')
    error: _.template('<span class="message error">An error has occurred while retrieving data</span>')

**After**

    container: _.template('<div class="<%= cssClass %>"></div>')
    default: _.template('<span class="message default">Begin typing for suggestions</span>')
    loading: _.template('<span class="message loading">Begin typing for suggestions (Loading...)</span>')
    loadedList: _.template('<ol class="<%= cssClass %>"></ol>')
    loadedItem: _.template('<li class="<%= cssClass %>"><a href="#" class="<%= actionCssClass %>"><%= value %></a></li>')
    empty: _.template('<span class="message empty">No suggestions were found</span>')
    error: _.template('<span class="message error">An error has occurred while retrieving data</span>')
   
Upgrading to Version 0.8.0
---
The service now supports loading in of more suggestions. The JSON data
returned can now have a value called `hasMore` which enables the loading
of more values. This value should be set to `true` if there are more results
that can be loaded in, otherwise if all values have been requested it should
return `false`.

**Before**

    {
      "suggestions": [
        { "name": "Alabama" },
        { "name": "Alaska" },
        { "name": "American Samoa" },
        { "name": "Arizona" },
        { "name": "Arkansas" }
      ]
    }
    
**After**

    {
      "suggestions": [
        { "value": "Alabama" },
        { "value": "Alaska" },
        { "value": "American Samoa" },
        { "value": "Arizona" },
        { "value": "Arkansas" }
      ],
      "hasMore": false
    }
    
There is an update to the templates as well, the `loadedList` template now
contains the element that represents the more button.

**Before**

    loadedList: _.template('<ol class="<%= cssClass %>"></ol>')
   
**After**

    loadedList: _.template('<ol class="<%= cssClass %>"></ol><span class="<%= morePanelCssClass %>"><a href="javascript:void(0)" class="<%= moreActionCssClass %>">More</a></span>')

Upgrading to Version 0.8.1
---
The `moreActionCssClass` parameter has been renamed to `nextActionCssClass`
and the `morePanelCssClass` has been renamed to `pagingPanelCssClass`.

Along with this the template for `loadedList` has changed to support a
previous button.

    loadedList: _.template('<ol class="<%= cssClass %>"></ol><ol class="<%= pagingPanelCssClass %>"><li><a href="javascript:void(0)" class="<%= prevActionCssClass %>">Prev</a></li><li><a href="javascript:void(0)" class="<%= nextActionCssClass %>">Next</a></li></ol>')
   
Another service update has been made in this version, you can now pass in both
the page number and how many items to take from the result set.

**Before**

    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      ajax: {
        url: '/suggestions.json?q=:query'
      }
    });
    
**After**

    view = new Suggestions.View({
      el: $('input[type="text"].suggestions'),
      ajax: {
        url: '/suggestions.json?p=:page&t=:take&q=:query'
      }
    });

License
---
Copyright (c) 2011-2012 Michael Diolosa <[michael.diolosa@gmail.com](michael.diolosa@gmail.com)>

The backbone.suggestions.js library is licensed under the MIT license. For
more information see the [Wiki](https://github.com/mbrio/backbone.suggestions/wiki/License).
