var connect = require('connect'),
    fs = require('fs'),
    helpers = require('./helpers'),
    testUncompressed = helpers.testUncompressed,
    testCompressed = helpers.testCompressed,
    testRedirect = helpers.testRedirect,
    testMaxAge = helpers.testMaxAge,
    gzip = require('../index'),
    
    fixturesPath = __dirname + '/fixtures',
    cssBody = fs.readFileSync(fixturesPath + '/style.css', 'utf8'),
    htmlBody = fs.readFileSync(fixturesPath + '/index.html', 'utf8'),
    appBody = '<b>Non-static html</b>',
    cssPath = '/style.css',
    gifPath = '/blank.gif',
    htmlPath = '/',
    matchCss = /text\/css/,
    matchHtml = /text\/html/,
    
    staticDefault = connect.createServer(
      gzip.staticGzip(fixturesPath)
    ),
    staticCss = connect.createServer(
      gzip.staticGzip(fixturesPath, { matchType: /css/ }),
      function(req, res) {
        if (req.url === '/app') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Length', appBody.length);
          res.end(appBody);
        }
      }
    ),
    staticMaxAge = connect.createServer(
      gzip.staticGzip(fixturesPath, { maxAge: 1234000 })
    );

describe('staticGzip test', function() {

  describe('uncompressable', function() {

    it('uncompressable: no Accept-Encoding', function() {
      testUncompressed(staticCss, cssPath, {}, cssBody, matchCss);
    });

    it('uncompressable: does not accept gzip', function() {
      testUncompressed(staticCss, cssPath, { 'Accept-Encoding': 'deflate' }, cssBody, matchCss);
    });

    it('uncompressable: unmatched mime type', function() {
      testUncompressed(staticCss, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('uncompressable: non-static request', function() {
      testUncompressed(staticCss, '/app', { 'Accept-Encoding': 'gzip' }, appBody, matchHtml);
    });

    // See: http://sebduggan.com/posts/ie6-gzip-bug-solved-using-isapi-rewrite
    it('uncompressable: IE6 before XP SP2', function() {
  		testUncompressed(staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' }, htmlBody, matchHtml);
    });

    it('uncompressable with Accept-Encoding: maxAge', function() {
      testMaxAge(staticMaxAge, gifPath, {'Accept-Encoding': 'gzip'}, 1234000);
    });

    it('uncompressable without Accept-Encoding: maxAge', function() {
      testMaxAge(staticMaxAge, gifPath, {}, 1234000);
    });

  });

  describe('compressable', function() {

    it('compressable', function() {
      testCompressed(staticCss, cssPath, { 'Accept-Encoding': 'gzip' }, cssBody, matchCss);
    });

    it('compressable: multiple Accept-Encoding types', function() {
      testCompressed(staticCss, cssPath, { 'Accept-Encoding': 'deflate, gzip, sdch' }, cssBody, matchCss);
    });
    
    it('uncompressable: default content types', function() {
      testUncompressed(staticDefault, htmlPath, {}, htmlBody, matchHtml);
    });

    it('compressable: default content types', function() {
      testCompressed(staticDefault, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('compressable: IE6 after XP SP2', function() {
  		testCompressed(staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1' }, htmlBody, matchHtml);
    });

    it('compressable: IE7', function() {
  		testCompressed(staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)' }, htmlBody, matchHtml);
    });

    it('compressable: Chrome', function() {
  		testCompressed(staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1' }, htmlBody, matchHtml);
    });

    it('compressable: subdirectory', function() {
  		testCompressed(staticDefault, '/sub/', { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('compressable: subdirectory redirect', function() {
  		testRedirect(staticDefault, '/sub', { 'Accept-Encoding': 'gzip' }, '/sub/');
    });

    it('compressable with Accept-Encoding: maxAge', function() {
  		testMaxAge(staticMaxAge, cssPath, {'Accept-Encoding': 'gzip'}, 1234000);
    });

    it('compressable without Accept-Encoding: maxAge', function() {
  		testMaxAge(staticMaxAge, cssPath, {}, 1234000);
    });
    
  })
  
});
