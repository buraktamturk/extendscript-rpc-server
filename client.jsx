
// taken from http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
function byteLength(str) {
  // returns the byte length of an utf8 string
  var s = str.length;
  for (var i=str.length-1; i>=0; i--) {
    var code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s+=2;
    if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
  }
  return s;
}

function xmlconnection(host) {
  this.sock = new Socket();

  if(!this.sock.open(host, 'binary')) {
    throw "connection timeout or refused";
  }

  this.recv = function() {
    var payload = this.sock.read(4),
        totalLength = (payload.charCodeAt(0) << 24) | (payload.charCodeAt(1) << 16) | (payload.charCodeAt(2) << 8) | (payload.charCodeAt(3)),
        datas = [],
        parsed = 0;

    do {
      var offset = 0;

      payload = this.sock.read(9);
      if(!payload || !payload.length) {
        throw "couldn't read from the socket";
      }

      var length = (payload.charCodeAt(offset) << 24) | (payload.charCodeAt(offset+1) << 16) | (payload.charCodeAt(offset+2) << 8) | (payload.charCodeAt(offset+3));
      offset += 4;
      if(!length) {
        throw "couldn't parse length from the data";
      }

      var cid = (payload.charCodeAt(offset) << 24) | (payload.charCodeAt(offset+1) << 16) | (payload.charCodeAt(offset+2) << 8) | (payload.charCodeAt(offset+3));
      offset += 4;

      var type = payload.charCodeAt(offset);
      offset += 1;

      if(type == 1) {
        this.sock.encoding = 'utf8';
      }

      data = this.sock.read(length);
      if(!data || !data.length) {
        throw "couldn't read from the socket";
      }

      this.sock.encoding = 'binary';

      offset += length;

      if(type == 1) {
        alert(data);
        datas.push(new XML(data));
      } else {
        datas.push({cid: cid, data: data});
      }

      parsed += offset;
    } while(parsed != totalLength);

    return datas;
  };

  this.send = function(toBeSend) {
    var datas = toBeSend.length ? toBeSend : [toBeSend];

    var length = 0;

    for(var i = 0; i < datas.length; ++i) {
      var data = datas[i];

      if(data.toXMLString) {
        var str = data.toXMLString();
        data = datas[i] = { cid: 0, type: 1, data: str, length: byteLength(str), charset: 'utf8' };
      } else {
        data = datas[i] = { cid: data.cid || i, type: 2, data: data, length: data.length, charset: 'binary' };
      }

      length += data.length + 9;
    }

    var payload = String.fromCharCode((length >> 24) & 0xFF) +
        String.fromCharCode((length >> 16) & 0xFF) +
        String.fromCharCode((length >> 8) & 0xFF) +
        String.fromCharCode(length & 0xFF);

    this.sock.write(payload);

    for(var i = 0; i < datas.length; ++i) {
      var data = datas[i];

      payload = String.fromCharCode((data.length >> 24) & 0xFF) +
          String.fromCharCode((data.length >> 16) & 0xFF) +
          String.fromCharCode((data.length >> 8) & 0xFF) +
          String.fromCharCode(data.length & 0xFF) +
          String.fromCharCode((data.cid >> 24) & 0xFF) +
          String.fromCharCode((data.cid >> 16) & 0xFF) +
          String.fromCharCode((data.cid >> 8) & 0xFF) +
          String.fromCharCode(data.cid & 0xFF) +
          String.fromCharCode(data.type);

      this.sock.write(payload);

      this.sock.encoding = data.charset || 'binary';
      this.sock.write(data.data);
      this.sock.encoding = 'binary';
    }

    return this.recv();
  };
}
