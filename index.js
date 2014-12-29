var spawn = require('child_process').spawn;
var split = require('split');

function parseInfo(chunk) {

  var info = {};
  var currentSection;

  var lines = chunk.replace(/\r/g, '').split('\n');
  // the .replace removes the remaining \r which appear
  // on windows systems after the split operation

  lines.forEach(function(line) {
    // skip every line once we have an error
    if(info.status && info.status === 'error') return;

    var tmp = line.split(' ');
    var prefix = tmp.shift();
    var data = tmp.join(' ');

    if(prefix === 'ERROR:' || prefix === 'rtmpdump:') {

      info.status = 'error';
      info.message = data;

    } else if(prefix === 'INFO:') {

      if(info.status === 'connected') {
        if(data.indexOf(':') !== -1) {
          // this is a "section:" line
          currentSection = data.slice(0, -1).toLowerCase(); // remove trailing ':'
          info[currentSection] = {};
        } else {
          var kv = data.trim().split(/\s+/);
          info[currentSection][kv[0].toLowerCase()] = isNaN(kv[1]) ? kv[1] : Number(kv[1]);
        }
      } else if(data === 'Connected...') {
        info.status = 'connected';
      }

    } 

  });

  return info;
}

function createStream(options) {

  // build an argument array from an object, skipping null *values*
  // { b: 'foo', o: null, bar: 'baz' } becomes "-b foo -o --bar baz"
  var args = [];
  Object.keys(options).forEach(function(key) {
    if(key.length === 1) args.push('-' + key);
    else args.push('--' + key);
    if(options[key]) args.push(options[key]);
  });

  var rtmpdump = spawn('rtmpdump', args);

  var readable = rtmpdump.stdout;

  rtmpdump.stderr
    .pipe(split(/\r(?!\n)/))
    .once('data', function(chunk) {
      // when split by \r the first chunk is status / stream info
      // since windows systems encode a newline with \r\n we need
      // to check if the \r has no trailing \n to get the right \r
      var info = parseInfo(chunk);

      if(info.status === 'connected') {
        delete info.status;
        readable.emit('connected', info);
        this.on('data', function(chunk) {
          var matches = chunk.match(/(\d+\.\d+)/g);
          // emit "progress" with kbytes, elapsed, percent
          readable.emit.apply(readable, ['progress'].concat(matches));
        });
      } else {
        readable.emit('error', new Error(info.message));
      }

    });

  return readable;
}

module.exports.createStream = createStream;
