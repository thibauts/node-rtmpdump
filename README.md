rtmpdump
=============
### A streamable wrapper around the rtmpdump CLI

This module is a thin wrapper around the `rtmpdump` binary. It provides 
a readable stream you can pipe to your heart's content.

The `rtmpdump` binary must be installed on your system.

The options are those used by `rtmpdump`, both short and long options are supported (see example).
`$ rtmpdump --help` to list them all.

Installation
------------

``` bash
$ npm install rtmpdump
```

Example
-------

``` javascript
var rtmpdump = require('rtmpdump');
var fs = require('fs');

var options = {
  rtmp: 'rtmp://host.tld/app/path',
  playpath: 'mp4:playpath',
  pageUrl: 'http://host.tld/somepage.html',
  swfVfy: 'http://host.tld/player.swf',
  v: null // parameter-less command line switches must have null as a value
};

var stream = rtmpdump.createStream(options);

stream.on('connected', function(info) {
  // info provides various details about the stream
  // duration, resolution, codecs, ...
  console.log(info);
});

stream.on('progress', function(kbytes, elapsed, percent) {
  console.log('%s kbytes read, %s secs elapsed, %s%%', kbytes, elapsed, percent);
});

stream.on('error', function(err) {
  // as usual, unhandled error events will throw
  console.log(err);
  process.exit(1);
});

stream.pipe(fs.createWriteStream('video.mp4'));

```

