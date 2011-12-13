var fs   = require('fs'),
    path = require('path');
    
exports.suggestions = function(req, res) {
 var json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'json', 'suggestions.json'), 'utf-8'));
 var output = { suggestions: [] };

 if(req.query.q !== null && typeof(req.query.q) !== 'undefined' && req.query.q.length > 0)
 {
   for(var i = 0, j = json.suggestions.length; i < j; i++)
   {
     var sug = json.suggestions[i];
     if (sug.name.toLowerCase().indexOf(req.query.q) === 0)
     {
       output.suggestions[output.suggestions.length] = sug;
     }
   }
 }

 res.charset = 'utf-8';
 res.contentType('application/json');
 res.header('Access-Control-Allow-Origin', '*');
 res.send(output);
};