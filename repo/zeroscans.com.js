// ==KazeExtension==
// @name         ZeroScans
// @version      1.0.0
// @developer    kaze
// @lang         en
// @icon         https://zscans.com/favicon.ico
// @pkg          zeroscans.com
// @type         manga
// @webSite      https://zscans.com
// @baseUrl      https://zscans.com
// ==/KazeExtension==

export default class extends Extension {
  async search(kw) {
    const res = await this.request(`/swordflake/comics`);
    const mangaList = [];

    for (const comic of res.data.comics) {
      const title = comic.name;
      if (!title || !comic.cover) continue;

      if (title.toLowerCase().includes(kw.toLowerCase())) {
        const coverUrl = comic.cover.full
          ? comic.cover.full.replace(/\\\//g, "/")
          : "https://shorturl.at/nCEY1";

        mangaList.push({
          title: title,
          url: comic.slug || "",
          cover: coverUrl,
        });
      }
    }

    return mangaList;
  }

  async latest(page) {
    const res = await this.request(`/swordflake/new-chapters`);
    return res.all.map((item) => ({
      title: item.name,
      url: item.slug,
      cover: item.cover.vertical.replace(/\\\//g, "/"),
    }));
  }

  async detail(url) {
    const res = await this.request(`/swordflake/comic/${url}`);
    const id = res.data.id;
    let page = 1;
    let allEpisodes = [];

    while (true) {
      const epres = await this.request(
        `/swordflake/comic/${id}/chapters?sort=desc&page=${page}`
      );
      const episodesOnPage = epres.data.data.map((item) => ({
        name: `Chapter ${item.name}`,
        url: `${item.id}|${url}`,
      }));

      if (episodesOnPage.length === 0) {
        break;
      }

      allEpisodes = allEpisodes.concat(episodesOnPage);
      page++;
    }

    return {
      title: res.data.name,
      cover: res.data.cover.full.replace(/\\\//g, "/"),
      desc: res.data.summary,
      episodes: [
        {
          title: "Directory",
          urls: allEpisodes.reverse(),
        },
      ],
    };
  }

  async watch(url) {
    const [ep, manga] = url.split("|");
    const res = await this.request(`/swordflake/comic/${manga}/chapters/${ep}`);
    return {
      urls: res.data.chapter.high_quality,
    };
  }
}
