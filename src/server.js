// Copyright 2019 Peter Debelak

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
const fs = require("fs");
const http = require("http");
const querystring = require("querystring");
const path = require("path");
const url = require("url");

const contentTypeMapping = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".png": "image/png",
  ".webmanifest": "text/plain"
};

const fileCache = {};

class Request {
  constructor(req) {
    this._req = req;
    this._url = url.parse(req.url);
    this.query = querystring.parse(this._url.query);
  }

  get path() {
    return this._url.pathname;
  }
}

class Response {
  constructor(resp) {
    this._resp = resp;
  }

  sendFile(filePath, status) {
    this._readCachedFile(filePath)
      .then(content => {
        const contentType =
          contentTypeMapping[path.extname(filePath)] || "text/plain";
        this._resp.writeHead(status || 200, { "Content-Type": contentType });
        this._resp.end(content, "utf-8");
      })
      .catch(e => {
        this._resp.writeHead(500);
        this._resp.end("Error: " + e.code + " ..\n");
      });
  }

  _readCachedFile(filePath) {
    const cachedFile = fileCache[filePath];
    if (cachedFile) {
      return Promise.resolve(cachedFile);
    }
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, "..", filePath), (error, content) => {
        if (error) {
          reject(error);
        } else {
          fileCache[filePath] = content;
          resolve(content);
        }
      });
    });
  }

  json(content, status) {
    this._resp.writeHead(status || 200, { "Content-Type": "application/json" });
    this._resp.end(JSON.stringify(content), "utf-8");
  }
}

module.exports.sendFile = (fileName, status) => {
  return resp => {
    resp.sendFile(fileName, status);
  };
};

module.exports.start = (mapping, port) => {
  http
    .createServer((rq, rp) => {
      const req = new Request(rq);
      const resp = new Response(rp);

      const func = mapping[req.path] || mapping["404"];
      func(resp, req);
    })
    .listen(port);
};
