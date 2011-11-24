var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    qs = require('querystring')

var filename = path.join(__dirname, 'suggestions.json');
var port = 8888;
var ip = '127.0.0.1'

fs.readFile(filename, 'utf-8', function(err, data) {
  var json = JSON.parse(data);
  
  http.createServer(function (req, res) {
    var reqUrl = url.parse(req.url);
    var query = qs.parse(reqUrl.query);
    
    var output = json;
    
    if(query.q !== null && typeof(query.q) !== 'undefined' && query.q.length > 0)
    {
      output = { suggestions: [] };
      
      for(var i = 0, j = json.suggestions.length; i < j; i++)
      {
        var sug = json.suggestions[i];
        if (sug.name.toLowerCase().indexOf(query.q) == 0)
        {
          output.suggestions[output.suggestions.length] = sug;
        }
      }
    }
    
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    res.end(JSON.stringify(output));
  }).listen(port, ip);
});

console.log('Server running at http://' + ip + ':' + port + '/');