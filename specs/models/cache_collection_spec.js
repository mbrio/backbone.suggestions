
  describe('CacheCollection', function() {
    var cache1, cache2, collection, id1, id2, timestamp;
    collection = null;
    timestamp = new Date;
    id1 = 'a';
    id2 = 'n';
    cache1 = null;
    cache2 = null;
    beforeEach(function() {
      collection = new Suggestions.Models.CacheCollection;
      collection.fetch();
      collection.each(function(item) {
        return item.destroy();
      });
      collection.reset();
      cache1 = new Suggestions.Models.Cache({
        id: id1,
        timestamp: timestamp,
        suggestions: [
          {
            name: 'Alabama'
          }, {
            name: 'Alaska'
          }
        ]
      });
      cache2 = new Suggestions.Models.Cache({
        id: id2,
        timestamp: timestamp,
        suggestions: [
          {
            name: 'New York'
          }, {
            name: 'North Carolina'
          }
        ]
      });
      cache1.save();
      cache2.save();
      return collection.fetch();
    });
    return it('should initialize properly', function() {
      collection.length.should({
        be: 2
      });
      return collection.at(0).get('suggestions')[0].name.should({
        be: 'Alabama'
      });
    });
  });
