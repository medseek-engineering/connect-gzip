var connect = require('connect'),
    fs = require('fs'),
    helpers = require('./helpers'),
    testUncompressed = helpers.testUncompressed,
    testCompressed = helpers.testCompressed,
    gzip = require('../index'),
    
    fixturesPath = __dirname + '/fixtures',
    cssBody = fs.readFileSync(fixturesPath + '/style.css', 'utf8'),
    htmlBody = fs.readFileSync(fixturesPath + '/index.html', 'utf8'),
    largeBody = fs.readFileSync(fixturesPath + '/large.html', 'utf8')
    cssPath = '/style.css',
    htmlPath = '/',
    largePath = '/large.html',
    matchCss = /text\/css/,
    matchHtml = /text\/html/;

function server() {
  var args = Array.prototype.slice.call(arguments, 0),
      callback = args.pop();
  args.push(function(req, res) {
    var headers = {},
        body;
    if (req.url === cssPath) {
      headers['Content-Type'] = 'text/css; charset=utf-8';
      body = cssBody;
    } else if (req.url === htmlPath) {
      headers['Content-Type'] = 'text/html; charset=utf-8';
      body = htmlBody;
    } else if (req.url === largePath) {
      headers['Content-Type'] = 'text/html charset=utf-8';
      body = largeBody;
    }
    headers['Content-Length'] = body.length;
    callback(res, headers, body);
  });
  return connect.apply(null, args);
}

function setHeaders(res, headers) {
  for (var key in headers) {
    res.setHeader(key, headers[key]);
  }
}
var setHeadersWriteHeadWrite = server(gzip.gzip(), function(res, headers, body) {
  setHeaders(res, headers);
  res.writeHead(200);
  res.write(body);
  res.end();
});
var setHeadersWriteHeadEnd = server(gzip.gzip(), function(res, headers, body) {
  setHeaders(res, headers);
  res.writeHead(200);
  res.end(body);
});
var setHeadersWrite = server(gzip.gzip(), function(res, headers, body) {
  setHeaders(res, headers);
  res.write(body);
  res.end();
});
var setHeadersEnd = server(gzip.gzip(), function(res, headers, body) {
  setHeaders(res, headers);
  res.end(body);
});
var writeHeadWrite = server(gzip.gzip(), function(res, headers, body) {
  res.writeHead(200, headers);
  res.write(body);
  res.end();
});
var writeHeadEnd = server(gzip.gzip(), function(res, headers, body) {
  res.writeHead(200, headers);
  res.end(body);
});
var css = server(gzip.gzip({ matchType: /css/ }), function(res, headers, body) {
  res.writeHead(200, headers);
  res.end(body);
});
var best = server(gzip.gzip({ flags: '--best' }), function(res, headers, body) {
  res.writeHead(200, headers);
  res.end(body);
});
var kilobyteMin = server(gzip.gzip({ minContentLength: 1000 }), function(res, headers, body) {
  res.writeHead(200, headers);
  res.end(body);
});


describe('gzip', function() {

  describe('uncompressable', function() {

    it('no Accept-Encoding', function(done) {
       testUncompressed(done, css, cssPath, {}, cssBody, matchCss);  
    });

    it('no Accept-Encoding', function(done) {
      testUncompressed(done, css, cssPath, {}, cssBody, matchCss);
    });

    it('does not accept gzip', function(done) {
      testUncompressed(done, css, cssPath, { 'Accept-Encoding': 'deflate' }, cssBody, matchCss);
    });

    it('unmatched mime type', function(done) {
      testUncompressed(done, css, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('HEAD request', function(done) {
      testUncompressed(done, css, cssPath, { 'Accept-Encoding': 'gzip' }, '', matchCss, 'HEAD');
    });

    it('setHeaders, write, end', function(done) {
      testUncompressed(done, setHeadersWrite, htmlPath, {}, htmlBody, matchHtml);
    });

    it('setHeaders, writeHead, end', function(done) {
      testUncompressed(done, setHeadersWriteHeadEnd, htmlPath, {}, htmlBody, matchHtml);
    });

    it('setHeaders, end', function(done) {
      testUncompressed(done, setHeadersEnd, htmlPath, {}, htmlBody, matchHtml);
    });

    // See: http://sebduggan.com/posts/ie6-gzip-bug-solved-using-isapi-rewrite
    it('IE6 before XP SP2', function(done) {
      testUncompressed(done, setHeadersEnd, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' }, htmlBody, matchHtml);
    });

    it('writeHead, write, end', function(done) {
      testUncompressed(done, writeHeadWrite, htmlPath, {}, htmlBody, matchHtml);
    });

    it('writeHead, end', function(done) {
      testUncompressed(done, writeHeadEnd, htmlPath, {}, htmlBody, matchHtml);
    });

    it('setHeaders, writeHead, write, end', function(done) {
      testUncompressed(done, setHeadersWriteHeadWrite, htmlPath, {}, htmlBody, matchHtml);
    });

    it('size below minContentLength threshold', function(done) {
      testUncompressed(done, kilobyteMin, htmlPath, { 'Content-Length': 900, 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

  });

  describe('compressable', function() {

    it('accepts gzip', function(done) {
      testCompressed(done, css, cssPath, { 'Accept-Encoding': 'gzip' }, cssBody, matchCss);
    });

    it('multiple Accept-Encoding types', function(done) {
      testCompressed(done, css, cssPath, { 'Accept-Encoding': 'deflate, gzip, sdch' }, cssBody, matchCss);
    });

    it('specify --best flag', function(done) {
      testCompressed(done, best, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('setHeaders, writeHead, write, end', function(done) {
      testCompressed(done, setHeadersWriteHeadWrite, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('setHeaders, writeHead, end', function(done) {
      testCompressed(done, setHeadersWriteHeadEnd, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('setHeaders, write, end', function(done) {
      testCompressed(done, setHeadersWrite, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('setHeaders, end', function(done) {
      testCompressed(done, setHeadersEnd, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('IE6 after XP SP2', function(done) {
      testCompressed(done, setHeadersEnd, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1' }, htmlBody, matchHtml);
    });

    it('IE7', function(done) {
      testCompressed(done, setHeadersEnd, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)' }, htmlBody, matchHtml);
    });

    it('Chrome', function(done) {
      testCompressed(done, setHeadersEnd, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1' }, htmlBody, matchHtml);
    });

    it('writeHead, write, end', function(done) {
      testCompressed(done, writeHeadWrite, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('writeHead, end', function(done) {
      testCompressed(done, writeHeadEnd, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('size above minContentLength threshold', function(done) {
      testCompressed(done, kilobyteMin, largePath, { 'Accept-Encoding': 'gzip' }, largeBody, matchHtml);
    });

  });

});
