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
const path = require("path");

const server = require("./server.js");

class Character {
  constructor(glyph, name) {
    this.glyph = glyph;
    this.name = name;
  }

  matches(regexes) {
    return regexes.every(r => this.name.match(r));
  }
}

class Characters {
  constructor() {
    const mapping = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "unicode.json"))
    );
    this.characters = Object.keys(mapping).map(
      key => new Character(mapping[key], key)
    );
    this.unicodeData = this.unicodeData.bind(this);
  }

  unicodeData(resp, req) {
    const search = req.query.search || "";
    const resultCount = parseInt(req.query.count, 10);
    const page = parseInt(req.query.page || "1", 10);
    const offset = (page - 1) * resultCount;
    const regexes = search.split(/\s+/).map(s => new RegExp(`.*${s}.*`, "i"));
    const allMatches = this.characters.filter(c => c.matches(regexes));
    const matches = allMatches.slice(offset);
    const results = [];
    for (let i = 0; i < resultCount; i++) {
      const match = matches[i];
      if (match) {
        results.push({ name: match.name, glyph: match.glyph });
      }
    }
    resp.json({
      characters: results,
      pages: Math.ceil(allMatches.length / resultCount)
    });
  }
}

server.start(
  {
    "/": server.sendFile("public/index.html"),
    "/public/app.css": server.sendFile("public/app.css"),
    "/public/app.js": server.sendFile("public/app.js"),
    "/public/android-chrome-192x192.png": server.sendFile("public/android-chrome-192x192.png"),
    "/public/android-chrome-512x512.png": server.sendFile("public/android-chrome-512x512.png"),
    "/public/apple-touch-icon.png": server.sendFile("public/apple-touch-icon.png"),
    "/public/favicon-16x16.png": server.sendFile("public/favicon-16x16.png"),
    "/public/favicon-32x32.png": server.sendFile("public/favicon-32x32.png"),
    "/public/favicon.ico": server.sendFile("public/favicon.ico"),
    "/favicon.ico": server.sendFile("public/favicon.ico"),
    "/unicode": new Characters().unicodeData,
    "404": server.sendFile("public/404.html", 404)
  },
  process.env.PORT || 3000
);
