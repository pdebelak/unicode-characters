// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later
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
const CHARACTER_COUNT = 25;

class UnicodeChars extends HTMLElement {
  constructor() {
    super();

    this.characters = [];
  }

  connectedCallback() {
    const section = document.createElement('section');
    const label = document.createElement('label');
    label.for = 'filter';
    label.textContent = 'Filter';
    this.input = document.createElement('input');

    this.input.value = new URLSearchParams(window.location.search).get('search');
    this.input.name = 'filter';
    this.input.className = 'filter';
    section.appendChild(label);
    section.appendChild(this.input);
    this.appendChild(section);

    this.render = this.render.bind(this);
    this.setSearch = this.setSearch.bind(this);
    this.paginate = this.paginate.bind(this);

    this.input.addEventListener('input', this.setSearch);

    const list = document.createElement('ul');
    for (let i = 0; i < CHARACTER_COUNT; i++) {
      const li = document.createElement('li');
      const character = document.createElement('unicode-char');
      li.appendChild(character);
      list.appendChild(li);
      this.characters.push(character);
    }
    this.appendChild(list);

    const pagination = document.createElement('div')
    pagination.className = 'pagination';
    this.prev = document.createElement('a');
    this.prev.innerHTML = '&larr; Previous'
    this.prev.className = 'disabled';
    this.prev.addEventListener('click', this.paginate);
    pagination.appendChild(this.prev);
    this.next = document.createElement('a');
    this.next.innerHTML = 'Next &rarr;'
    this.next.className = 'disabled';
    this.next.addEventListener('click', this.paginate);
    pagination.appendChild(this.next);
    this.appendChild(pagination);

    window.addEventListener('popstate', this.render);

    this.input.focus();

    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.render);
    this.input.removeEventListener('input', this.setSearch);
    this.next.removeEventListener('click', this.paginate);
    this.prev.removeEventListener('click', this.paginage);
  }

  get currentPage() {
    const page = new URLSearchParams(window.location.search).get('page') || '1';
    return parseInt(page, 10);
  }

  paginate(e) {
    e.preventDefault();
    history.pushState(undefined, 'paginate', e.target.href);
    this.render();
  }

  setSearch() {
    const params = new URLSearchParams(window.location.search);
    const search = this.input.value.trim();
    if (search) {
      params.set('search', search);
      params.set('page', 1);
    } else {
      params.delete('search');
    }
    let paramsString = params.toString();
    if (paramsString) {
      history.replaceState(undefined, search, '?' + paramsString);
    } else {
      history.replaceState(undefined, search, '/');
    }
    this.render()
  }

  async render() {
    const search = (new URLSearchParams(window.location.search).get('search') || '').trim();
    this.input.value = search;

    let url = `/unicode?count=${CHARACTER_COUNT}&search=${encodeURIComponent(search)}`;
    const page = this.currentPage;
    if (page) {
      url += `&page=${page}`;
    }
    const response = await (await fetch(url)).json();
    const characters = response.characters;

    if (characters.length === 0) {
      let noResults = document.getElementById('no-results');
      if (!noResults) {
        noResults = document.createElement('li');
        noResults.id = 'no-results';
        noResults.textContent = 'No results match your search';
        this.querySelector('ul').appendChild(noResults);
      }
    } else {
      const noResults = document.getElementById('no-results');
      if (noResults) {
        this.querySelector('ul').removeChild(noResults);
      }
    }
    const pages = response.pages;
    if (page < pages) {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set('page', page + 1);
      this.next.classList.remove('disabled');
      this.next.href = `?${nextParams.toString()}`;
    } else {
      this.next.classList.add('disabled');
      this.next.href = '';
    }
    if (page > 1) {
      const prevParams = new URLSearchParams(window.location.search);
      prevParams.set('page', page - 1);
      this.prev.classList.remove('disabled');
      this.prev.href = `?${prevParams.toString()}`;
    } else {
      this.prev.classList.add('disabled');
      this.prev.href = '';
    }

    for (let i = 0; i < CHARACTER_COUNT; i++) {
      const match = characters[i];
      if (match) {
        this.characters[i].name = match.name;
        this.characters[i].glyph = match.glyph;
      } else {
        this.characters[i].name = null;
        this.characters[i].glyph = null;
      }
    }
  }
}

window.customElements.define('unicode-chars', UnicodeChars);

class UnicodeChar extends HTMLElement {
  get name() {
    return this.getAttribute('name');
  }

  set name(name) {
    this.setAttribute('name', name);
    if (this.isConnected) {
      this.querySelector('.glyph-name').textContent = name;
    }

    if (name) {
      this.classList.remove('hidden');
    } else {
      this.classList.add('hidden');
    }
  }

  get glyph() {
    return this.getAttribute('glyph');
  }

  set glyph(glyph) {
    this.setAttribute('glyph', glyph);
    if (this.isConnected) {
      this.querySelector('.glyph').textContent = glyph;
    }
  }

  connectedCallback() {
    const glyph = document.createElement('span');
    glyph.className = 'glyph';
    this.appendChild(glyph);
    const name = document.createElement('span');
    name.className = 'glyph-name';
    this.copyCharacter = this.copyCharacter.bind(this);
    this.appendChild(name);
    this.addEventListener('click', this.copyCharacter);

    // call setters to put data into html
    this.name = this.name;
    this.glyph = this.glyph;
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.copyCharacter);
  }

  copyCharacter() {
    const input = document.createElement('input');
    input.value = this.glyph;
    this.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    this.removeChild(input);
    const notification = document.createElement('div');
    notification.className = 'notification';
    const div = document.createElement('div');
    div.textContent = 'Copied!';
    notification.appendChild(div);
    this.appendChild(notification);
    window.setTimeout(() => {
      this.removeChild(notification);
    }, 1000);
  }
}

window.customElements.define('unicode-char', UnicodeChar);

class Character {
  constructor(glyph, name) {
    this.glyph = glyph;
    this.name = name;
  }

  matches(regexes) {
    return regexes.every(r => this.name.match(r));
  }
}
