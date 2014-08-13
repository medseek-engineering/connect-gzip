var assert = require('assert'),
    should = require('should'),
    zlib = require('zlib'),
    request = require('supertest');

exports.testUncompressed = function(done, app, url, headers, resBody, resType, method) {
  var req = request(app)[method ? method.toLowerCase() : 'get'](url);

  //clear accept-encoding header from supertest.
  req.set('accept-encoding', undefined);
  for (var key in headers) {
    req.set(key, headers[key]);
  };

  req
  .expect(resBody)
  .expect('content-type', resType)
  .expect(200)
  .end(function(err, res) {
    res.headers.should.not.have.property('content-encoding');
    done();
  })
}

exports.testCompressed = function(done, app, url, headers, resBody, resType, method) {
  var req = request(app)[method ? method.toLowerCase() : 'get'](url);

  //clear accept-encoding header from supertest.
  req.set('accept-encoding', undefined);
  for (var key in headers) {
    req.set(key, headers[key]);
  };

  req
  .expect(resBody)
  .expect('content-type', resType)
  .expect('content-encoding', 'gzip')
  .expect('vary', 'Accept-Encoding')
  .expect(200)
  .end(function(err, res) {
    res.body.should.not.equal(resBody);
    gunzip(res.body, function(err, body) {
      body.should.equal(resBody);
      done();
    });
  })

    // assert.response(app, {
    //     url: url,
    //     method: method ? method : 'GET',
    //     headers: headers,
    //     encoding: 'binary'
    //   }, {
    //     status: 200,
    //     headers: {
    //       'Content-Type': resType,
    //       'Content-Encoding': 'gzip',
    //       'Vary': 'Accept-Encoding'
    //     }
    //   }, function(res) {
    //     res.body.should.not.equal(resBody);
    //     gunzip(res.body, function(err, body) {
    //       body.should.equal(resBody);
    //       done();
    //     });
    //   }
    // );
}

exports.testRedirect = function(app, url, headers, location) {
  return wrapTest(function(done) {
    assert.response(app, {
        url: url,
        headers: headers
      }, {
        status: 301,
        headers: {
          'Location': location
        }
      }, done
    );
  });
}

exports.testMaxAge = function(app, url, headers, maxAge) {
  return wrapTest(function(done) {
    assert.response(app, {
        url: url,
        headers: headers
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000)
        }
      }, done
    );
  });
}

function gunzip(data, callback) {

    var gunzip = zlib.createGunzip(),
        out = '',
        err = '';
    console.log('GUNZIP')
    console.log(gunzip)

    gunzip.on('data', function(data){
        out += data;
    });

    gunzip.on('error', function(data) {
      err += data;
    });

    gunzip.on('end', function(){
      console.log('GUNZIP END')
      if (callback) callback(err, out);
    });

    response.pipe(gunzip);
}

function getGunzipped(url, callback) {
    // buffer to store the streamed decompression
    var buffer = [];

    http.get(url, function(res) {
        // pipe the response into the gunzip to decompress
        var gunzip = zlib.createGunzip();            
        res.pipe(gunzip);

        gunzip.on('data', function(data) {
            // decompression chunk ready, add it to the buffer
            buffer.push(data.toString())

        }).on("end", function() {
            // response and decompression complete, join the buffer and return
            callback(null, buffer.join("")); 

        }).on("error", function(e) {
            callback(e);
        })
    }).on('error', function(e) {
        callback(e)
    });
}

function gunzipOLD(data, callback) {
  var process = spawn('gunzip', ['-c']),
      out = '',
      err = '';
  process.stdout.on('data', function(data) {
    console.log('GUNZIP EXIT');
    out += data;
  });
  process.stderr.on('data', function(data) {
    console.log('GUNZIP EXIT');
    err += data;
  });
  process.on('exit', function(code) {
    console.log('GUNZIP EXIT');
    if (callback) callback(err, out);
  });
  console.log('GUNZIP end');
  process.stdin.end(data, 'binary');
}
