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

const express = require('express');

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

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/unicode', (req, res) => {
  const search = req.query.search || '';
  const resultCount = parseInt(req.query.count, 10);
  const page = parseInt(req.query.page || '1', 10);
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
  res.json({ characters: results, pages: Math.ceil(allMatches.length / resultCount) });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
