# Copyright 2019 Peter Debelak

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
"""
Script to generate the ``unicode.json`` file for unicode symbols.
"""
import argparse
import json
import sys
from typing import Dict
import unicodedata


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a json file with unicode data."
    )
    parser.add_argument("file", type=argparse.FileType(mode="w"))
    return parser.parse_args()


def unicode_mapping() -> Dict[str, str]:
    """Generate a mapping of unicode character name -> character.

    """
    mapping: Dict[str, str] = {}
    for c in map(chr, range(sys.maxunicode + 1)):
        if unicodedata.category(c) in {"Sc", "Sk", "Sm", "So"}:
            mapping[unicodedata.name(c)] = c
    return mapping


if __name__ == "__main__":
    args = parse_args()
    json.dump(unicode_mapping(), args.file, indent=2)
