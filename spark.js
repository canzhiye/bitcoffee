var express = require('express');
var app = express();
var http = require('http').Server(app);
var spark = require('spark');
var bodyParser = require('body-parser');
var request = require('request');


var access_token = '098f6ddba5302206b105827440733f97a123d82ae4a6108b2a1efe47aedfa69f';
var size = '8';

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!');
})

app.get('/setSize', function(req, res){
  size = req.param("size")
  res.send(size)
});

app.get('/login', function(req, res) {
  var code = req.param("code")
  console.log('code: ' + code)
  request.post('https://www.coinbase.com/oauth/token?grant_type=authorization_code&code='+code+'&redirect_uri=https://bitcoffeebackend.herokuapp.com/login&client_id=0cf1b16d57e27d5b342880a130cd19b2403f03cde6e74bb404b0f18ae7d1c9af&client_secret=fb230a0a256392532f79f7c2037c18493b4c39bbf82ce99027321df000009374', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      access_token = JSON.parse(body).access_token
      console.log(access_token)

      res.status(307);
      res.set({"location" : "http://bitcoffee.herokuapp.com"});
      res.end();

      var options = {
            uri: 'http://bitcoffeebackend.herokuapp.com/pay',
            method: 'POST',
            json: {
              "duration": size
            }
          };

      request.post(options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
          } else {
          }
      });
    }
  })
});

app.post('/pay', function (req, res) {
  var options = {
            uri: 'https://api.coinbase.com/v1/transactions/send_money?access_token='+access_token,
            method: 'POST',
            json: {
              "transaction": {
                "to": "canzhiye@gmail.com",
                "amount_string": "0.01",
                "amount_currency_iso": "USD",
                "notes": "Coffee!"}
            }
    };

    request.post(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
            spark.login({username: 'canzhiye@gmail.com', password: 'BitCoffee'}).then(
              function(token){
                spark.listDevices().then(
                  function(success) {
                    var device = success[0]

                    device.callFunction('brew', req.body.duration, function(err, data) {
                      if (err) {
                        console.log('An error occurred:', err);
                      } else {
                        console.log('Brewed succesfully: ' + req.body.duration);
                      }
                      res.send('1')
                    });
                  },
                  function(failure) {
                    console.log('0')
                  }
                );
              },
              function(err) {
                console.log('API call completed on promise fail: ', err);
              }
            );
        } else {
            console.log('fuck it broke: ' + response.statusCode)
        }
    });
});

app.get('/testBrew', function(req, res) {
  spark.login({username: 'canzhiye@gmail.com', password: 'BitCoffee'}).then(
    function(token){
      spark.listDevices().then(
        function(success) {
          var device = success[0]
          console.log(device)

          device.callFunction('brew', req.param("duration"), function(err, data) {
            if (err) {
              console.log('An error occurred:', err);
            } else {
              console.log('Brewed succesfully');
            }

            res.send('success')
          });
        },
        function(failure) {
          console.log('failure')
        }
      );
    },
    function(err) {
      console.log('API call completed on promise fail: ', err);
    }
  );
});

http.listen(process.env.PORT || 5000, function(){
  console.log('listening on *:');
});


