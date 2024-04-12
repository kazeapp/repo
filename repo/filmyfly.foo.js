// ==KazeExtension==
// @name         FilmyFly
// @version      1.0.0
// @developer    kaze
// @lang         hi
// @icon         https://image.linkmake.in/images/files/afaa901b76bc48d57a346319423035dd384208.png
// @pkg          filmyfly.foo
// @type         movies
// @webSite      https://filmyfly.foo
// @baseUrl      https://filmyfly.foo
// @nsfw         false
// ==/KazeExtension==

export default class extends Extension {
  async latest(page) {
    const res = await this.request(`/?to-page=${page}`);
    const movie = [];
    const bsxList = await this.querySelectorAll(res, "div.A10");
    for (const element of bsxList) {
      const html = await element.content;
      const url = await this.getAttributeText(html, "a", "href");
      const title = await this.querySelector(html, "a > div").text;
      const cover = await this.getAttributeText(html, "a > img", "src");
      movie.push({
        title: title.trim(),
        url: url,
        cover,
      });
    }
    return movie;
  }

  async search() {
    // Search
  }
  async detail(url) {
    console.log(url);
    const res = await this.request("", {
      headers: {
        "Miru-Url": `https://filmyfly.foo${url}`,
      },
    });
    const title = await this.querySelector(res, "div.colora").text;
    console.log(title);
    const cover = await this.getAttributeText(
      res,
      "div.movie-thumb > img",
      "src"
    );
    const descDiv = await this.querySelectorAll(res, "div.fname > div.colorg");
    console.log(descDiv.length);
    const desc = descDiv[1].text;
    const movieUrl = await this.getAttributeText(res, "a.dl", "href");

    function limitWords(text, maxWords) {
      const words = text.split(/\s+/);
      if (words.length > maxWords) {
        return words.slice(0, maxWords).join(" ") + " ...";
      }
      return text;
    }
    return {
      title: title.trim(),
      cover: cover,
      desc,
      episodes: [
        {
          title: "Directory",
          urls: [
            {
              name: limitWords(title.trim(), 10),
              url: movieUrl,
            },
          ],
        },
      ],
    };
  }

  async watch() {
    // Watch
  }
}
