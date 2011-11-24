
  describe('Cache', function() {
    var cache, key, timestamp;
    cache = null;
    timestamp = new Date;
    key = 'a';
    beforeEach(function() {
      return cache = new Suggestions.Models.Cache({
        timestamp: timestamp,
        key: key,
        suggestions: [
          {
            name: 'Alabama'
          }, {
            name: 'Alaska'
          }
        ]
      });
    });
    return it('should initialize correctly', function() {
      var state;
      (cache.get('timestamp') === timestamp).should({
        be: true
      });
      cache.get('key').should({
        be: key
      });
      cache.get('version').should({
        be: Suggestions.version
      });
      cache.get('suggestions').length.should({
        be: 2
      });
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = cache.get('suggestions');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          state = _ref[_i];
          _results.push(state.name === 'Alabama');
        }
        return _results;
      })()).shouldNot({
        be: null
      });
    });
  });
