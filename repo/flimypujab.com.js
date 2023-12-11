// ==KazeExtension==
// @name         FlimyPujab
// @version      v0.0.1
// @author       kaze
// @lang         hi
// @license      MIT
// @icon         https://111.90.151.26/wp-content/uploads/2020/06/cropped-Logo-2-60x60.png
// @package      flimypujab.com
// @type         movies
// @webSite      https://111.90.151.26
// @nsfw         false
// ==/KazeExtension==

export default class extends Extension {
  async search(kw, page) {
    const res = await this.request(`/page/${page}/?s=${kw}`, {
      headers: {
        referer: `https://111.90.151.26`,
      },
    });
    const bsxList = res.match(/<article([\s\S]+?<\/article>)/g);
    const movies = [];
    bsxList.forEach((element) => {
      const url = element.match(/href="https:\/\/111.90.151.26(\/.+?)"/)[1];
      const title = element.match(/title="Permalink to:(.+?)"/)[1];
      const cover = element.match(/src="(.+?)"/)[1];
      movies.push({
        title,
        url: `${url};${cover}`,
        cover,
      });
    });
    return movies;
  }

  async latest() {
    const res = await this.request(`/hindi-movies/`);
    const bsxList = res.match(/<article([\s\S]+?<\/article>)/g);
    const movies = [];
    bsxList.forEach((element) => {
      const url = element.match(/href="https:\/\/111.90.151.26(\/.+?)"/)[1];
      const title = element.match(/title="(.+?)"/)[1];
      // console.log(title);
      const cover = element.match(/src="(.+?)"/)[1];
      // console.log(cover);
      movies.push({
        title: title.replace("Permalink to: ", ""),
        url: `${url};${cover}`,
        cover,
      });
    });
    return movies;
  }

  async detail(url) {
    const url_split = url.split(";");
    const res = await this.request(url_split[0]);
    const titleRegex = /<h2 class="entry-title" itemprop="name">(.+?)<\/h2>/;
    const titleMatch = res.match(titleRegex);
    const title = titleMatch ? titleMatch[1] : null;
    const cover = url_split[1];
    const descriptionRegex =
      /<div class="entry-content entry-content-single" itemprop="description">[\s]+<p>(.+?)<\/p>/;
    const descriptionMatch = res.match(descriptionRegex);
    const desc = descriptionMatch ? descriptionMatch[1] : null;

    const ep_button = res.match(
      /<div class="gmr-listseries"><a class="button button-shadow" [\S\s]+?<\/div>/
    );
    if (ep_button === null) {
      //movie
      return {
        title: title || "Unknown Title",
        cover: cover || "",
        desc: desc || "No description available.",
        episodes: [
          {
            title: "Directory",
            urls: [{ name: "ep1", url: url_split[0] }],
          },
        ],
      };
    }
    const liListRegex = /<a class(.+?)<\/a>/g;
    const liListMatch = ep_button[0].match(liListRegex);

    const episodes = [];
    if (liListMatch) {
      liListMatch.forEach((element) => {
        const chapterNumRegex = /">(.+?)<\/a>/;
        const chapterNumMatch = element.match(chapterNumRegex);
        const name = chapterNumMatch ? chapterNumMatch[1] : null;
        const chapterUrlRegex = /"https:\/\/111.90.151.26(.+?)"/;
        const chapterUrlMatch = element.match(chapterUrlRegex);
        url = chapterUrlMatch ? chapterUrlMatch[1] : null;
        if (name && url) {
          episodes.push({
            name,
            url,
          });
        }
      });
    }
    return {
      title: title || "Unknown Title",
      cover: cover || "",
      desc: desc || "No description available.",
      episodes: [
        {
          title: "Directory",
          urls: episodes || null,
        },
      ],
    };
  }

  async watch(url) {
    const res = await this.request(url);
    const video_url = res.match(/<source src="(.+?.mp4)"/)[1];
    // console.log(video_url);

    return {
      type: "mp4",
      url: video_url || null,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36",
        referer: "https://111.90.151.26",
      },
    };
  }
}
