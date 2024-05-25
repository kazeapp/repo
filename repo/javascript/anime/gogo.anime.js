const extensionMetaInfo = [
  {
    name: "GoGoAnime",
    lang: "en",
    author: "Kaze",
    baseUrl: "https://ww4.gogoanime2.org",
    apiUrl: "https://goraku-api.vercel.app/anime/gogoanime",
    iconUrl:
      "https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/en.gogoanime.png",
    sourceType: "single",
    extensionType: 0,
    isNsfw: false,
    version: "1.0.0",
    dateFormat: "",
    dateFormatLocale: "",
    pkgPath: "anime/gogo.anime.js",
  },
];

class DefaultExtension extends KProvider {
  async request(body) {
    const apiUrl = this.extension.apiUrl;
    const baseUrl = this.extension.baseUrl;
    return (await new Client().get(apiUrl + body, { Referer: baseUrl })).body;
  }

  async getAnime(url) {
    const res = await new Client().get(this.extension.apiUrl + url);
    const datas = JSON.parse(res.body);
    const anime = [];
    const hasNext = datas["hasNextPage"];
    for (const data of datas["results"]) {
      anime.push({
        name: data["title"],
        imageUrl: data["image"],
        link: data["url"],
      });
    }
    return {
      list: anime,
      hasNextPage: hasNext,
    };
  }

  async getPopular(page) {
    return await this.getAnime(`/popular?page=${page}`);
  }

  async getLatestUpdates(page) {
    return await this.getAnime(`/top-airing?page=${page}`);
  }

  async search(query, page, filters) {
    return await this.getAnime(`/${query}?page=${page}`);
  }

  async getDetail(url) {
    const res = await new Client().get(this.extension.apiUrl + `/info/${url}`);
    const data = JSON.parse(res.body);
    const title = data["title"];
    const cover = data["image"];
    const desc = data["description"];
    const author = "";
    const status = data["status"];
    const genres = data["genres"].map((e) => e["name"]);
    const chapters = [];
    chapters.reverse();
    return {
      name: title,
      imageUrl: cover,
      description: desc,
      author: author,
      status: status,
      genre: genres,
      episodes: chapters,
      link: url,
    };
  }
}
