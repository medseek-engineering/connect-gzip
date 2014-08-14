var connect = require('connect'),
    fs = require('fs'),
    helpers = require('./helpers'),
    testUncompressed = helpers.testUncompressed,
    testCompressed = helpers.testCompressed,
    testRedirect = helpers.testRedirect,
    testMaxAge = helpers.testMaxAge,
    gzip = require('../index'),
    
    fixturesPath = __dirname + '/fixtures\\',
    cssBody = fs.readFileSync(fixturesPath + '/style.css', 'utf8'),
    htmlBody = fs.readFileSync(fixturesPath + '/index.html', 'utf8'),
    appBody = '<b>Non-static html</b>',
    cssPath = '/style.css',
    gifPath = '/blank.gif',
    htmlPath = '/',
    matchCss = /text\/css/,
    matchHtml = /text\/html/,
    
    staticDefault = connect(
      gzip.staticGzip(fixturesPath)
    ),
    staticCss = connect(
      gzip.staticGzip(fixturesPath, { matchType: /css/ }),
      function(req, res) {
        if (req.url === '/app') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Length', appBody.length);
          res.end(appBody);
        }
      }
    ),
    staticMaxAge = connect(
      gzip.staticGzip(fixturesPath, { maxAge: 1234000 })
    );

describe('staticGzip test', function() {

  describe('uncompressable', function() {

    it('no Accept-Encoding', function(done) {
      testUncompressed(done, staticCss, cssPath, {}, cssBody, matchCss);
    });

    it('does not accept gzip', function(done) {
      testUncompressed(done, staticCss, cssPath, { 'Accept-Encoding': 'deflate' }, cssBody, matchCss);
    });

    it('unmatched mime type', function(done) {
      testUncompressed(done, staticCss, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('non-static request', function(done) {
      testUncompressed(done, staticCss, '/app', { 'Accept-Encoding': 'gzip' }, appBody, matchHtml);
    });

    // See: http://sebduggan.com/posts/ie6-gzip-bug-solved-using-isapi-rewrite
    it('IE6 before XP SP2', function(done) {
  		testUncompressed(done, staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' }, htmlBody, matchHtml);
    });
    
    it('default content types', function(done) {
      testUncompressed(done, staticDefault, htmlPath, {}, htmlBody, matchHtml);
    });

  });

  describe('compressable', function() {

    it('accept-encoding gzip', function(done) {
      testCompressed(done, staticCss, cssPath, { 'Accept-Encoding': 'gzip' }, cssBody, matchCss);
    });

    it('multiple Accept-Encoding types', function(done) {
      testCompressed(done, staticCss, cssPath, { 'Accept-Encoding': 'deflate, gzip, sdch' }, cssBody, matchCss);
    });

    it('default content types', function(done) {
      testCompressed(done, staticDefault, htmlPath, { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

    it('IE6 after XP SP2', function(done) {
  		testCompressed(done, staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1' }, htmlBody, matchHtml);
    });

    it('IE7', function(done) {
  		testCompressed(done, staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)' }, htmlBody, matchHtml);
    });

    it('Chrome', function(done) {
  		testCompressed(done, staticDefault, htmlPath, { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1' }, htmlBody, matchHtml);
    });

    it('subdirectory', function(done) {
  		testCompressed(done, staticDefault, '/subdirectory/', { 'Accept-Encoding': 'gzip' }, htmlBody, matchHtml);
    });

  });

  describe('redirect', function() {

    it('subdirectory redirect', function(done) {
      testRedirect(done, staticDefault, '/subdirectory', { 'Accept-Encoding': 'gzip' }, '/subdirectory/');
    });

  });

  describe('maxAge', function() {

    it('uncompressable with Accept-Encoding', function(done) {
      testMaxAge(done, staticMaxAge, gifPath, {'Accept-Encoding': 'gzip'}, 1234000);
    });

    it('uncompressable without Accept-Encoding', function(done) {
      testMaxAge(done, staticMaxAge, gifPath, {}, 1234000);
    });

    it('compressable with Accept-Encoding', function(done) {
      testMaxAge(done, staticMaxAge, cssPath, {'Accept-Encoding': 'gzip'}, 1234000);
    });

    it('compressable without Accept-Encoding', function(done) {
      testMaxAge(done, staticMaxAge, cssPath, {}, 1234000);
    });

  });
  
});
