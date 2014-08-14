var assert = require('assert')
    http = require('http')
    zlib = require('zlib'),
    buffer = require('buffer').Buffer;

var port = 2540642;

exports.testUncompressed = function(done, app, path, headers, resBody, resType, method) {
  assert.response(app, {
      path: path,
      method: method ? method : 'GET',
      headers: headers,
      port: port++
    }, {
      status: 200,
      body: resBody,
      headers: { 'Content-Type': resType }
    }, function(res) {
      assert.equal(res.headers['content-encoding'], undefined);
      done();
    }
  );
}

exports.testCompressed = function(done, app, path, headers, resBody, resType, method) {
  assert.response(app, {
      path: path,
      method: method ? method : 'GET',
      headers: headers,
      encoding: 'binary',
      port: port++
    }, {
      status: 200,
      headers: {
        'Content-Type': resType,
        'Content-Encoding': 'gzip',
        'Vary': 'Accept-Encoding'
      }
    }, function(res) {
      assert.notEqual(res.body, resBody);
      zlib.gunzip(res.buffer, function(err, body) {
        assert.ifError(err);
        assert.equal(body, resBody);
        done();
      });
    }
  );

}

exports.testRedirect = function(done, app, path, headers, location) {
  assert.response(app, {
      path: path,
      headers: headers,
      port: port++
    }, {
      status: 301,
      headers: {
        'Location': location
      }
    }, function() { done(); }
  );
}

exports.testMaxAge = function(done, app, path, headers, maxAge) {
  assert.response(app, {
      path: path,
      headers: headers,
      port: port++
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000)
      }
    }, function() { done(); }
  );
}

assert.response = function(server, req, expected, done) {
  server.listen(req.port);

  http.request(req, function(res) {

    var dataArr = [];

    res.on('data', function(chunk) {
      var x = new buffer(chunk);
      dataArr.push(x);
    });

    res.on('error', function(err) {
      assert.ifError(err);
    });

    res.on('end', function() {
      res.buffer = buffer.concat(dataArr);
      assert.equal(res.statusCode, expected.status);
      for (key in expected.headers) {
        assert.header(key, expected.headers[key], res);
      };
      done(res);
    });

  }).end();
}

assert.header = function (name, expected, res) {
  var actual = res.headers[name.toLowerCase()];
  expected instanceof RegExp
    ? assert(expected.test(actual))
    : assert.equal(expected, actual);
}
