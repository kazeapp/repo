// ==KazeExtension==
// @name         Dramacool
// @version      v0.0.2
// @author       kaze
// @lang         en
// @license      MIT
// @icon         https://dramacool.pa/images/mobi/logo.png
// @package      dramacool.pa
// @type         movies
// @webSite      https://nontan-source-kgw9jch3s-imkryp70n.vercel.app/movies/dramacool
// ==KazeExtension==

export default class extends Extension {
  async req(url) {
    return this.request(url, {
      headers: {
        "Kaze-Url": await this.getSetting("dramacool"),
      },
    });
  }

  async load() {
    this.registerSetting({
      title: "Dramacool API",
      key: "dramacool",
      type: "input",
      description: "Dramacool Api Url",
      defaultValue:
        "https://nontan-source-kgw9jch3s-imkryp70n.vercel.app/movies/dramacool",
    });
  }

  async latest() {
    const res = await this.request("", {
      headers: {
        "Kaze-Url": "https://dramacool.pa/most-popular-drama",
      },
    });
    const bsxList = await this.querySelectorAll(
      res,
      "ul.switch-block.list-episode-item > li"
    );
    const novel = [];
    for (const element of bsxList) {
      const html = await element.content;
      const url = await this.getAttributeText(html, "a", "href");
      const title = await this.querySelector(html, "h3").text;
      const cover = await this.querySelector(html, "img").getAttributeText(
        "data-original"
      );
      //console.log(title+cover+url)
      novel.push({
        title,
        url: url.replace("https://dramacool.pa/", ""),
        cover,
      });
    }
    return novel;
  }

  async detail(url) {
    const res = await this.req(`/info?id=${url}`);
    return {
      title: res.title,
      cover: res.image,
      desc: res.description,
      episodes: [
        {
          title: "Directory",
          urls: res.episodes.map((item) => ({
            name: item.title,
            url: item.id,
          })),
        },
      ],
    };
  }

  async search(kw, page) {
    const res = await this.req(`/${kw}?page=${page}`);
    return res.results.map((item) => ({
      title: item.title,
      url: item.id,
      cover: item.image,
    }));
  }

  async watch(url) {
    const res = await this.req(`/watch?episodeId=${url}&server=streamsb`);
    return {
      type: "hls",
      url: res.sources[0].url,
    };
  }
}
