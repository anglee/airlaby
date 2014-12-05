var http = require('http');
var Q = require('q');
var _ = require('lodash');

var httpGet = function(path) {
  var options = {
    host: 'challenge2.xxxxxxx.com',
    port: 7182,
    method: 'GET',
    path: path,
    headers: {
      "X-Labyrinth-Email": "first.last@gmail.com"
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
      // I didn't handle error with retry, making the assumption that server responds 404 only if
      // there is a mistake, according to the instruction. However, this assumption seems not always
      // true, the server's behavior seems not deterministic. So, I simply rerun the program until
      // not getting any unexpected 404
      console.error("path = " + path + " ERR(" + response.statusCode + ")");
      deferred.reject("Error");
    }

  }).end();
  return deferred.promise;
};


var getStartRoom = function() {
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
      getWall(roomId),
      getExits(roomId).then(function(exits) {
        return Q.all(_.map(exits, function(exit) {
          return getNeighbor(roomId, exit).then(visitRoom);
        }));
      })
    ]);
  }
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
    challenge: _(lits).chain()
        .sortBy(function(lit) {
          return lit.order;
        })
        .map(function(it) {
          return it.writing;
        })
        .value().join('')
  });
  console.log("body " + body);
  // I didn't POST to /report programmatically,
  // but instead copied the console output and used POSTMAN(chrome extension) to post it manually
};

getStartRoom().then(visitRoom).then(report);
