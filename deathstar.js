// Generated by CoffeeScript 1.3.3
(function() {
  var app, credentials, express, fs, http, instagram, io, pushNewItem, request, server, strencode, twitter;

  express = require('express');

  http = require('http');

  fs = require('fs');

  request = require('request');

  credentials = require('./credentials');

  instagram = require('./instagram');

  twitter = require('./twitter');

  instagram.setCredentials(credentials.instagram);

  app = express.createServer();

  server = app.listen(6767);

  io = require('socket.io').listen(server);

  io.set('log level', 2);

  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.logger("dev"));
    app.use(express["static"](__dirname + "/public"));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    return app.use(express.errorHandler({
      showStack: true,
      dumpExceptions: true
    }));
  });

  strencode = function(data) {
    return unescape(encodeURIComponent(JSON.stringify(data)));
  };

  pushNewItem = function(item) {
    console.log('> Push', item.data.id, 'to', io.sockets.length, 'websocket clients.');
    return io.sockets.emit('newItem', strencode(item));
  };

  /*
    ROUTES
  */


  twitter.pullList(function(listIDs) {
    console.log('+ Twitter is rolling. List IDs:', listIDs);
    return twitter.startStream(listIDs, function(newTweet) {
      return console.log(newTweet);
    });
  });

  app.get('/', function(req, res) {
    return res.send("This is not the webpage you are looking for.");
  });

  app.all('/notify/:id', function(req, res) {
    var notification, notifications, _i, _len, _results;
    if (req.query && req.query['hub.mode'] === 'subscribe') {
      console.log('+ Confirming new Instagram real-time subscription...');
      res.send(req.query['hub.challenge']);
      return;
    }
    notifications = req.body;
    console.log('* Notification for', req.params.id, '. Had', notifications.length, 'item(s). Subscription ID:', req.body[0].subscription_id);
    _results = [];
    for (_i = 0, _len = notifications.length; _i < _len; _i++) {
      notification = notifications[_i];
      if (notification.object === "tag") {
        _results.push(instagram.getTagMedia(notification.object_id, function(err, data) {
          return pushNewItem({
            'type': 'instagram',
            'object': 'tag',
            'data': data
          });
        }));
      } else if (notification.object === "geography") {
        _results.push(instagram.getGeoMedia(notification.object_id, function(err, data) {
          return pushNewItem({
            'type': 'instagram',
            'object': 'geo',
            'data': data
          });
        }));
      } else {
        _results.push(console.log("notification object type is unknown:", notification.object));
      }
    }
    return _results;
  });

  /*  
  app.get '/delete/:subscriptionID', (req, res) -> #todo: move this to the instagram module
    console.log '! Got delete request for', req.params.subscriptionID
    requestObj = {
      url: instagram.getDeleteURL(req.params.subscriptionID),
      method: 'DELETE'
    }
    request requestObj, (error, response, body) ->    
      body = JSON.parse body
      if body.meta.code is 200
        res.send body
      else 
        res.send body
  */


  app.get('/listInstagram', function(req, res) {
    console.log('get listInstagram');
    return instagram.listSubscriptions(function(subscriptions) {
      console.log('listSubscriptions callback');
      return res.send(subscriptions);
    });
  });

  app.get('/build_instagram_geo', function(req, res) {
    var buildObj;
    buildObj = {
      lat: '44.058263',
      lng: '-123.068483',
      radius: '4000',
      streamID: 'uo_geo'
    };
    return instagram.buildGeographySubscription(buildObj, function(err, data) {
      if (err != null) {
        return res.send('err', err);
      } else {
        return res.send('yay', data);
      }
    });
  });

  app.get('/build_instagram_tag', function(req, res) {
    var buildObj;
    buildObj = {
      tag: 'oregonfootball',
      streamID: 'love_tag'
    };
    return instagram.buildTagSubscription(buildObj, function(err, data) {
      if (err != null) {
        return res.send('err<br><br>' + err);
      } else {
        return res.send('yay<br><br>' + data);
      }
    });
  });

  io.sockets.on('connection', function(socket) {
    return console.log('Socket connection!');
  });

}).call(this);
