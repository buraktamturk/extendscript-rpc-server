
'use strict';

var net = require('net'),
    et = require('elementtree'),
    ElementTree = et.ElementTree;

module.exports = function(functionTable) {
  return net.createServer(function (socket) {
    socket.setEncoding('binary');

    var type = 0,
        remain = 4,
        data = "",
        session = {};

    socket.on('error', function(data) {
      socket.end();
    });

    socket.on('data', function(paket) {
        var offset = 0;
        while(offset != paket.length) {
          var offset2 = Math.min(paket.length - offset, remain);

          data += paket.slice(offset, offset + offset2);
          remain -= offset2;

          offset += offset2;

          if(type == 0 && remain == 0) {
            type = 1;
            remain = (data.charCodeAt(0) << 24) | (data.charCodeAt(1) << 16) | (data.charCodeAt(2) << 8) | (data.charCodeAt(3));
            data = "";

            offset2 = Math.min(paket.length - offset, remain);
            data += paket.slice(offset, offset + offset2);
            remain -= offset2;
            offset += offset2;
          }

          if(remain == 0) {
            var offset3 = 0,
                promises = [],
                cids = [],
                datas = [];

            do {
              var nextSize = (data.charCodeAt(offset3) << 24) | (data.charCodeAt(offset3 + 1) << 16) | (data.charCodeAt(offset3 + 2) << 8) | (data.charCodeAt(offset3 + 3));
              offset3 += 4;

              var nextContentId = (data.charCodeAt(offset3) << 24) | (data.charCodeAt(offset3 + 1) << 16) | (data.charCodeAt(offset3 + 2) << 8) | (data.charCodeAt(offset3 + 3));
              offset3 += 4;

              var type2 = data.charCodeAt(offset3);
              offset3 += 1;

              switch(type2) {
                case 1:
                  var xmlDATA = et.parse(new Buffer(data.slice(offset3, nextSize + offset3), 'binary').toString('ucs2'));

                  var fnc = functionTable[xmlDATA._root.tag];

                  if(fnc) {
                    promises.push(fnc(xmlDATA, session, datas));
                    cids.push(nextContentId);
                  }

                  break;
                case 2:
                  datas.push({
                    cid: nextContentId,
                    data: data.slice(offset3, nextSize + offset3)
                  });
                  break;
              }

              offset3 += nextSize;
            } while(offset3 != data.length);

            Promise.all(promises)
              .then(function(values) {
                values = values.map(function(value, index) {
                  if(!value.tag) {
                    return { cid: cids[index], type: 2, data: value.data, length: value.data.length };
                  } else {
                    var etree = new ElementTree(value);
                    var xml = etree.write({'xml_declaration': false});
                    var edata = new Buffer(xml, 'ucs2');
                    return { cid: cids[index], type: 1, data: edata, length: edata.length };
                  }
                });

                var buffer = null;
                var totalLength = 0;

                for(var i = 0; i < values.length; ++i) {
                  totalLength += values[i].length + 9;
                }

                var payload = String.fromCharCode((totalLength >> 24) & 0xFF) +
                    String.fromCharCode((totalLength >> 16) & 0xFF) +
                    String.fromCharCode((totalLength >> 8) & 0xFF) +
                    String.fromCharCode(totalLength & 0xFF);

                socket.write(payload, 'binary');

                values.forEach(function(value) {
                  var payload2 = String.fromCharCode((value.length >> 24) & 0xFF) +
                      String.fromCharCode((value.length >> 16) & 0xFF) +
                      String.fromCharCode((value.length >> 8) & 0xFF) +
                      String.fromCharCode(value.length & 0xFF) +
                      String.fromCharCode((value.cid >> 24) & 0xFF) +
                      String.fromCharCode((value.cid >> 16) & 0xFF) +
                      String.fromCharCode((value.cid >> 8) & 0xFF) +
                      String.fromCharCode(value.cid & 0xFF) +
                      String.fromCharCode(value.type);

                  socket.write(payload2, 'binary');
                  socket.write(value.data, 'binary');
                });
              });

            type = 1;
            remain = 4;
            data = "";
          }
        }
    });

    socket.on('end', function() {

    });
  });
};
