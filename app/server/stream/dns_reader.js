import { log } from './../../logger/log';

var Readable = require('stream').Readable;
var util = require('util');

export var DnsReader = function (req, res,
  longName, serviceName, filePath, start, end, hasSafeDriveAccess, appDirKey) {
  Readable.call(this);
  this.req = req;
  this.res = res;
  this.longName = longName;
  this.serviceName = serviceName;
  this.filePath = filePath;
  this.start = start;
  this.end = end;
  this.curOffset = start;
  this.sizeToRead = 0;
  this.hasSafeDriveAccess = hasSafeDriveAccess;
  this.appDirKey = appDirKey;
  return this;
};

util.inherits(DnsReader, Readable);

DnsReader.prototype._read = function() {
  let self = this;
  if (self.curOffset === self.end) {
    return self.push(null);
  }
  let MAX_SIZE_TO_READ = 1048576; // 1 MB
  let diff = this.end - this.curOffset;
  this.sizeToRead = diff > MAX_SIZE_TO_READ ? MAX_SIZE_TO_READ : diff;
  this.req.app.get('api').dns.getFile(this.longName, this.serviceName, this.filePath, this.curOffset,
    this.sizeToRead, this.hasSafeDriveAccess, this.appDirKey,
    function(err, data) {
      if (err) {
        self.push(null);
        log.error(err);
        return self.res.end();
      }
      self.curOffset += self.sizeToRead;
      self.push(new Buffer(JSON.parse(data).content, 'base64'));
    });
};
