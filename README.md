# ExtendScript RPC Server

```
npm install extendscript-rpc-server
```

ExtendScript has Socket class with it's limitations. It's inefficient and *boring* to implement HTTP library on top of it.

Since server-side JavaScript is popular nowadays, I decided to write a *XML / Binary* RPC implementation, that is easy to implement it with the ExtendScript's Socket class.

This library uses XML as a text exchange method. ExtendScript has a nice native (and fast) XML implementation but does not implement native JSON parser. I must agree that there are few over the internet, but some of them are slow and does not implement UTF-8 support. Some of users just use eval function to deserialize it (insecure but genius), however this does not work well on big JSONs.

However, this library can also transport binary alongside with XML, just like multipart datas, but fast.

# Example

**Example Client**

```JavaScript
#include "client.jsx" // copy client.jsx to the folder, which script is located at, or copy contents of the client.jsx to here

var connection = new xmlconnection("localhost:3333");

var response = connection.send([<Login username="burak"
                                        password="notasecret" />]);
alert(response[0].toXMLString());
```

**Example Server**

```JavaScript
var esrpc = require('extendscript-rpc-server'),
    et = require('elementtree'),
    XML = et.XML,
    ElementTree = et.ElementTree,
    element = et.Element,
    subElement = et.SubElement;

var tablo = {
  "Login": function(data, session, binaries) {
    // session is connection session, it's shared every every connection
    // session.authenticed = true;

    // if there are binaries sent from the client, it is stored on binaries array.

    var result = element('UserInfo');

    subElement(result, 'UserName').text = 'Burak Tamtürk';

    return Promise.resolve(result);
  },
  "SomeOtherFunction": function(data, session, binaries) {
    // etc.
  }
};

var server = esrpc(tablo);

server.listen({
  port: 3333
});
```

# The MIT License

Copyright (c) 2015 Burak Tamtürk

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
