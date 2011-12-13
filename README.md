backbone.suggestions
====================

An autocompletion view for Backbone.js

Requirements
------------
* [CoffeeScript](http://jashkenas.github.com/coffee-script/)
* [Underscore.js](http://documentcloud.github.com/underscore/) 1.2.2
* [Backbone.js](http://documentcloud.github.com/backbone/) 0.5.3
* [localStorage polyfill](https://gist.github.com/350433)
* [Backbone Sync Storage Engines + localStorage](https://gist.github.com/1468270)
* [jQuery](http://jquery.com) 1.7
* [Docco](http://jashkenas.github.com/docco/)

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
------------
backbone.suggestions is a Backbone.js view written in CoffeeScript that enables AJAX autocompletion backed by a localStorage cache for text input fields.

There is no need to add HTML to your document to display the suggestion menu. A `<div>` element will be generated and placed within the `document.body` element.
  
    <div class="suggestions-menu">
      <ol>
        <li class="selected">Alabama</li>
        <li>Alaska</li>
      </ol>
    </div>

Usage
-----
    Suggestions.View(options)
  
Options
-------
* `@options` = The suggestions options (all Backbone.View options can be passed as well)
  * `url` = The URL of the REST action, any reference to `:query` within the string will be replaced by the text within the input box. (default: '/suggestions?q=:query')
  * `timeout` = Waiting period before asking for a suggestion. (default: 500)
  * `expiresIn` = The expiration duration of cached results. (default: 0.5 days)
  * `zIndex` = The z-index of the `<div>` containing element. (default: 500)
  * `cssClass` = The CSS class that is applied to the `<div>` containing element. (default: 'suggestions-menu')
  * `offsetLeft` = The number of pixels to offset the position of the popup to by the `left` CSS property, position starts at the bottom left corner of the input field. (default: 0)
  * `offsetTop` = The number of pixels to offset the position of the popup to by the `top` CSS property, position starts at the bottom left corner of the input field. (default: 0)
  * `selectedCssClass` = The CSS class that is applied to the `<li>` element that is selected. (default: 'selected')
  * `enableForceClose` = Enables or disables auto-complete windows closing when the `esc` key is pressed. (default: true)
  * `selected` = The callback that is executed when a suggestion is selected.
  * `initiateSuggestion` = The callback that is executed at the beginning of a suggestion.
  * `suggesting` = The callback that is executed when the application begins the suggestion process. This callback only occurs if a suggestion can proceed, the only state it cannot proceed in is when the input field is blank.
  * `suggested` = The callback that is executed when suggestions are displayed.
  * `loading` = The callback that is executed when a remote call is loading.
  * `error` = The callback that is executed when an AJAX error occurs.
  * `enabled` = The callback that is executed when the view is enabled.
  * `disabled` = The callback that is executed when the view is disabled.
  
Example
-------
    view = new Suggestions.View
      el: $('input#search')
      url: 'suggestions.json?q=:query'

JSON Results
------------
When retrieving a JSON formatted response from a GET request the data must be formatted as follows:

    {
      "suggestions": [
        { "name": "Alabama" },
        { "name": "Alaska" },
        { "name": "American Samoa" },
        { "name": "Arizona" },
        { "name": "Arkansas" }
      ]
    }

Demo
----
I have supplied a demo application which sits in /demo, along with the necessary libraries and HTML code I've added a Node.js server that will manage sending JSON data to backbone.suggestions.

You can run the Node.js server from the command line:

    cake demo
    
Testing
-------
All of the tests are built using [Jasmine](http://pivotal.github.com/jasmine/) and [Mary](https://github.com/alexeypetrushin/mary). You can run the tests by launching /specs/SpecRunner.html in your browser after running the following commands:

    cake build && cake spec

License
-------
The backbone.suggestions library is licensed under the MIT license.