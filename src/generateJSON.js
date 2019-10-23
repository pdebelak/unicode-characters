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
const https = require("https");

function readUnicodeData() {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  return new Promise((resolve, reject) => {
    https
      .get(
        "https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt",
        resp => {
          let data = "";

          resp.on("data", chunk => {
            data += chunk;
          });

          resp.on("end", () => {
            const mapping = {};

            data.split("\n").forEach(line => {
              let l = line.trim();
              if (l.length === 0) {
                return;
              }
              l = l.split(";");
              if (l[1].charAt(0) === "<") {
                return;
              }
              const name = l[1].charAt(0) + l[1].slice(1).toLowerCase();
              const glyph = String.fromCodePoint(parseInt(l[0], 16));
              mapping[name] = glyph;
            });

            resolve(mapping);
          });
        }
      )
      .on("error", err => {
        reject(err);
      });
  });
}

async function writeUnicodeData(filename) {
  const mapping = await readUnicodeData();
  fs.writeFileSync(filename, JSON.stringify(mapping));
}

writeUnicodeData(process.argv[2]);
