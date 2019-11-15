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
const DEBOUNCE_TIMEOUT = 250;

function debounce(func) {
  let timer = undefined;
  return () => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = setTimeout(() => func(), DEBOUNCE_TIMEOUT);
  };
}

class UnicodeChars extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<section>
  <label for="filter">Filter</label>
  <input type="text" id="filter" name="filter" class="filter" value="${
    this.search
  }">
</section>
<ul>
  ${[...Array(CHARACTER_COUNT).keys()]
    .map(() => "<li><unicode-char></unicode-char></li>")
    .join("")}
</ul>
<div class="pagination">
  <a class="disabled" id="prev">&larr; Previous</a>
  <a class="disabled" id="next">Next &rarr;</a>
</div>`;
    this.loadFromURL = this.loadFromURL.bind(this);
    this.setSearch = debounce(this.setSearch.bind(this));
    this.paginate = this.paginate.bind(this);

    document.getElementById("filter").addEventListener("input", this.setSearch);
    document.getElementById("prev").addEventListener("click", this.paginate);
    document.getElementById("next").addEventListener("click", this.paginate);
    window.addEventListener("popstate", this.loadFromURL);

    document.getElementById("filter").focus();

    this.loadFromURL();
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.loadFromURL);
    document
      .getElementById("filter")
      .removeEventListener("input", this.setSearch);
    document.getElementById("next").removeEventListener("click", this.paginate);
    document.getElementById("prev").removeEventListener("click", this.paginate);
  }

  get currentPage() {
    const page = new URLSearchParams(window.location.search).get("page") || "1";
    return parseInt(page, 10);
  }

  paginate(e) {
    e.preventDefault();
    history.pushState(undefined, "paginate", e.target.href);
    this.render();
  }

  get search() {
    return new URLSearchParams(window.location.search).get("search") || "";
  }

  setSearch() {
    const params = new URLSearchParams(window.location.search);
    const search = document.getElementById("filter").value.trim();
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.delete("page");

    let paramsString = params.toString();
    if (paramsString) {
      history.replaceState(undefined, search, "?" + paramsString);
    } else {
      history.replaceState(undefined, search, "/");
    }
    this.render();
  }

  loadFromURL() {
    document.getElementById("filter").value = this.search;

    this.render();
  }

  setPagination(pages) {
    const page = this.currentPage;
    const next = document.getElementById("next");
    const prev = document.getElementById("prev");
    if (page < pages) {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set("page", page + 1);
      next.classList.remove("disabled");
      next.href = `?${nextParams.toString()}`;
    } else {
      next.classList.add("disabled");
      next.href = "";
    }
    if (page > 1) {
      const prevParams = new URLSearchParams(window.location.search);
      if (page === 2) {
        prevParams.delete("page");
      } else {
        prevParams.set("page", page - 1);
      }
      prev.classList.remove("disabled");
      const params = prevParams.toString();
      if (params) {
        prev.href = `?${prevParams.toString()}`;
      } else {
        prev.href = "/";
      }
    } else {
      prev.classList.add("disabled");
      prev.href = "";
    }
  }

  async render() {
    const search = this.search;

    let url = `/unicode?count=${CHARACTER_COUNT}&search=${encodeURIComponent(
      search
    )}&page=${this.currentPage}`;
    const response = await (await fetch(url)).json();
    const characters = response.characters;

    if (characters.length === 0) {
      let noResults = document.getElementById("no-results");
      if (!noResults) {
        noResults = document.createElement("li");
        noResults.id = "no-results";
        noResults.textContent = "No results match your search";
        this.querySelector("ul").appendChild(noResults);
      }
    } else {
      const noResults = document.getElementById("no-results");
      if (noResults) {
        this.querySelector("ul").removeChild(noResults);
      }
    }

    this.setPagination(response.pages);

    const characterElems = this.getElementsByTagName("unicode-char");
    for (let i = 0; i < CHARACTER_COUNT; i++) {
      const match = characters[i];
      if (match) {
        characterElems[i].name = match.name;
        characterElems[i].glyph = match.glyph;
      } else {
        characterElems[i].name = null;
        characterElems[i].glyph = null;
      }
    }
  }
}

window.customElements.define("unicode-chars", UnicodeChars);

class UnicodeChar extends HTMLElement {
  get name() {
    return this.getAttribute("name");
  }

  set name(name) {
    this.setAttribute("name", name);
    if (this.isConnected) {
      this.querySelector(".glyph-name").textContent = name;
    }

    if (name) {
      this.classList.remove("hidden");
    } else {
      this.classList.add("hidden");
    }
  }

  get glyph() {
    return this.getAttribute("glyph");
  }

  set glyph(glyph) {
    this.setAttribute("glyph", glyph);
    if (this.isConnected) {
      this.querySelector(".glyph").textContent = glyph;
      if (glyph) {
        // this.id = glyph;
        this.setAttribute("id", glyph);
      } else {
        this.removeAttribute("id");
      }
    }
  }

  connectedCallback() {
    this.innerHTML = `<span class="glyph"></span><span class="glyph-name"></span>`;
    this.copyCharacter = this.copyCharacter.bind(this);
    this.addEventListener("click", this.copyCharacter);

    // call setters to put data into html
    this.name = this.name;
    this.glyph = this.glyph;
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.copyCharacter);
  }

  copyCharacter() {
    const input = document.createElement("input");
    input.value = this.glyph;
    this.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand("copy");
    this.removeChild(input);
    const notification = document.createElement("div");
    notification.className = "notification";
    const div = document.createElement("div");
    div.textContent = "Copied!";
    notification.appendChild(div);
    this.appendChild(notification);
    window.setTimeout(() => {
      this.removeChild(notification);
    }, 1000);
  }
}

window.customElements.define("unicode-char", UnicodeChar);
