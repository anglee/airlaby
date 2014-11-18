var http = require('http');

var options = {
  host: 'anglee.org',
  path: '/info.html'
};

callback = function(response) {
  var str = '';
  var chunkCount = 0;

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    console.log("data chunk", "" + chunk);
    console.log("======================================");
    str += chunk;
    chunkCount++;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    //console.log(str);

    console.log("chunkCount = ", chunkCount);
  });
}

http.request(options, callback).end();