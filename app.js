var http = require('http');
var qs = require('querystring');
var Q = require('q');
var _ = require('lodash');


var httpGet = function(path) {
  var options = {
    host: 'http://challenge2.airtime.com',
    port: 7182,
    method: 'GET',
    path: path,
    headers: {
      "X-Labyrinth-Email": "ang.lee@gmail.com"
    }
  };

  var deferred = Q.defer();
  http.request(options, function(response) {
    if (response.statusCode == 200) {
      var str = '';
      response.on('data', function(chunk) {
        str += chunk;
      });
      response.on('end', function() {
        console.log("path = " + path + " OK(" + response.statusCode + "), ret = " + str);
        deferred.resolve(JSON.parse(str));
      });
    } else {
      console.error("path = " + path + " ERR(" + response.statusCode + ")");
      deferred.reject("Error");
    }

  }).end();
  return deferred.promise;
};


var start = function() {
  return httpGet("/start").then(function(ret) {
    return ret.roomId;
  });
};

var getExits = function(roomId) {
  return httpGet("/exits?roomId=" + roomId).then(function(ret) {
    return ret.exits;
  });
};

var getNeighbor = function(roomId, exit) {
  return httpGet("/move?roomId=" + roomId + "&exit=" + exit).then(function(ret) {
    return ret.roomId;
  });
};

var brokens = [];
var lits = [];

var getWall = function(roomId) {
  return httpGet("/wall?roomId=" + roomId).then(function(ret) {
    if (ret.order === -1) {
      // the lights is broken
      brokens.push(roomId);
    } else {
      // the room is lit
      lits.push(ret);
    }
  });
};

var report = function() {
  var body = JSON.stringify({
    roomIds: brokens,
    challenge: _.sortBy(lits, function(lit) {
      return lit.order;
    })
  });
  console.log("body " + body);
};


var visited = {};
var markVisited = function(roomId) {
  visited[roomId] = true;
};
var isVisited = function(roomId) {
  return visited[roomId];
};

var visitRoom = function(roomId) {
  if (isVisited(roomId)) {
    return;
  } else {
    markVisited(roomId);
    return Q.all([
      getWall(),
      getExits(roomId).then(function(exits) {

        /*return Q.all(_.map(exits, function(exit) {
          return getNeighbor(roomId, exit).then(visitRoom);
        }));*/
      })
    ]);
  }
};

//start().then(visitRoom).then(report);
start();
//start().then(getWall);
//start().then(getExits);
//start().then(getExits).then(function(exits) {
//  console.log(exits);
//});