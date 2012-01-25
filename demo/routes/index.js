var fs   = require('fs'),
    path = require('path');
    
exports.suggestions = function(req, res) {
  var json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'json', 'suggestions.json'), 'utf-8'));
  var output = { suggestions: [], hasMore: true };
  var found = [];
  var take = parseInt(req.query.t)
  var page = parseInt(req.query.p)

  if (take === NaN || take < 1) take = 10;
  if (page === NaN || page < 1) page = 1;

  var offset = take * (page - 1);

  if(req.query.q !== null && typeof(req.query.q) !== 'undefined' && req.query.q.length > 0) {
    for(var i = 0, j = json.suggestions.length; i < j; i++) {
      var sug = json.suggestions[i];
      if (sug.value.toLowerCase().indexOf(req.query.q) === 0) {
        found[found.length] = sug;
      }
    }
  }

  if (offset + take > found.length) take = found.length - offset;

  if (offset < found.length) {
    for(var n = offset; n < offset + take; n++) {
      output.suggestions[output.suggestions.length] = found[n];
    }
  }
  
  if (offset + take >= found.length) output.hasMore = false;

  res.charset = 'utf-8';
  res.contentType('application/json');
  res.header('Access-Control-Allow-Origin', '*');
  res.send(output);
};