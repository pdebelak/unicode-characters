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
const fs = require('fs');
const path = require('path');
const http = require('http');

class Character {
  constructor(glyph, name) {
    this.glyph = glyph;
    this.name = name;
  }

  matches(regexes) {
    return regexes.every(r => this.name.match(r));
  }
}

const mapping = JSON.parse(fs.readFileSync('unicode.json'));
const characters = Object.keys(mapping).map(key => new Character(mapping[key], key));

function sendStaticFile(resp, filePath, contentType, status) {
  fs.readFile(path.join(__dirname, filePath), (error, content) => {
    if (error) {
      resp.writeHead(500);
      resp.end('Error: '+error.code+' ..\n');
    } else {
      resp.writeHead(status || 200, { 'Content-Type': contentType });
      resp.end(content, 'utf-8');
    }
  });
}

function sendUnicodeData(resp, path, params) {
  const query = new URLSearchParams(params);
  const search = query.get('search') || '';
  const resultCount = parseInt(query.get('count'), 10);
  const page = parseInt(query.get('page') || '1', 10);
  const offset = (page - 1) * resultCount;
  const regexes = search.split(/\s+/).map(s => new RegExp(`.*${s}.*`, 'i'));
  const allMatches = characters.filter(c => c.matches(regexes));
  const matches = allMatches.slice(offset);
  const results = [];
  for (let i = 0; i < resultCount; i++) {
    const match = matches[i];
    if (match) {
      results.push({ name: match.name, glyph: match.glyph });
    }
  }
  resp.writeHead(200, { 'Content-Type': 'application/json' });
  resp.end(JSON.stringify({ characters: results, pages: Math.ceil(allMatches.length / resultCount) }), 'utf-8');
}

http.createServer((req, resp) => {
  const [path, params] = req.url.split('?');
  switch (path) {
  case '/':
    sendStaticFile(resp, 'index.html', 'text/html');
    break;
  case '/app.css':
    sendStaticFile(resp, 'app.css', 'text/css');
    break;
  case '/app.js':
    sendStaticFile(resp, 'app.js', 'text/javascript');
    break;
  case '/unicode':
    sendUnicodeData(resp, path, params);
    break;
  default:
    sendStaticFile(resp, '404.html', 'text/html', 404);
  }
}).listen(process.env.PORT || 3000);
