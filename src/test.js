const puppeteer = require("puppeteer");
const { expect } = require("chai");

describe("unicode-characters", () => {
  let browser, page;

  require("./index.js"); // starts the server

  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
      timeout: 10000
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });

  afterEach(async () => {
    await page.close();
  });

  after(() => {
    browser.close();
  });

  describe("basic page", () => {
    it("has a title", async () => {
      expect(await page.title()).to.eql("Unicode Characters");
    });

    it("renders 25 characters", async () => {
      await page.waitFor("unicode-chars");

      expect((await page.$$("unicode-char:not(.hidden)")).length).to.eql(25);
    });
  });

  describe("filtering", () => {
    it("filters to nothing", async () => {
      await page.waitFor("input");
      await page.keyboard.type("not existing symbol");
      await page.waitFor("#no-results");
      const textContent = await page.$eval("#no-results", el => el.textContent);
      expect(textContent).to.eql("No results match your search");
      expect(page.url()).to.eql(
        "http://localhost:3000/?search=not+existing+symbol"
      );
      expect((await page.$$("unicode-char:not(.hidden)")).length).to.eql(0);
      expect((await page.$$("unicode-char.hidden")).length).to.eql(25);
    });

    it("filters to a single element", async () => {
      await page.waitFor("input");
      await page.keyboard.type("die face-1");
      await page.waitFor("unicode-char");
      const name = await page.$eval(
        "unicode-char .glyph-name",
        el => el.textContent
      );
      expect(name).to.eql("Die face-1");
      const glyph = await page.$eval(
        "unicode-char .glyph",
        el => el.textContent
      );
      expect(glyph).to.eql("⚀");
      expect(page.url()).to.eql("http://localhost:3000/?search=die+face-1");
      expect((await page.$$("unicode-char:not(.hidden)")).length).to.eql(1);
      expect((await page.$$("unicode-char.hidden")).length).to.eql(24);
    });

    it("ignores case", async () => {
      await page.waitFor("input");
      await page.keyboard.type("DIE FACE-1");
      await page.waitFor("unicode-char");
      const name = await page.$eval(
        "unicode-char .glyph-name",
        el => el.textContent
      );
      expect(name).to.eql("Die face-1");
    });

    it("filters to multiple elements", async () => {
      await page.waitFor("input");
      await page.keyboard.type("die face");
      await page.waitFor("unicode-char");
      expect((await page.$$("unicode-char:not(.hidden)")).length).to.eql(6);
    });
  });
});
