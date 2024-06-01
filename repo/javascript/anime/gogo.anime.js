// prettier-ignore
const extensionMetaInfo = [
  {
    "name": "GoGoAnime",
    "lang": "en",
    "author": "Kaze",
    "baseUrl": "https://amvstr.me/",
    "apiUrl": "https://api.amvstr.me/api/v2",
    "iconUrl":
      "https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/en.gogoanime.png",
    "sourceType": "single",
    "extensionType": 0,
    "isNsfw": false,
    "version": "1.2.0",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/gogo.anime.js"
  }
];

class DefaultExtension extends KProvider {
  getExtensionPreferences() {
    return [
      {
        key: "api_url",
        editTextPreference: {
          title: "API URL",
          summary: "",
          value: "https://api.amvstr.me/api/v2",
          dialogTitle: "API URL",
          dialogMessage: "",
        },
      },
      {
        key: "preferred_title_style",
        listPreference: {
          title: "Preferred Title Style",
          summary: "",
          valueIndex: 0,
          entries: ["Romaji", "English", "Native"],
          entryValues: ["romaji", "eng", "native"],
        },
      },
    ];
  }

  async request(body) {
    const preferences = new SharedPreferences();
    const userApiUrl = preferences.get("api_url");
    const apiUrl = userApiUrl != null ? userApiUrl : this.extension.apiUrl;
    const baseUrl = this.extension.baseUrl;
    return (await new Client().get(apiUrl + body, { Referer: baseUrl })).body;
  }

  async getAnime(url) {
    const preferences = new SharedPreferences();
    const titleStyle = preferences.get("preferred_title_style");
    const res = await new Client().get(this.extension.apiUrl + url);
    const data = JSON.parse(res.body);
    const list = [];
    const hasNext =
      data.page.hasNextPage != null
        ? data.page.hasNextPage
        : data.pageInfo.hasNextPage != null
        ? data.pageInfo.hasNextPage
        : false;

    for (const anime of data.results) {
      let title;
      if (titleStyle === "romaji") {
        title = anime.title.romaji;
      } else if (titleStyle === "eng") {
        title = anime.title.english || anime.title.romaji;
      } else {
        title = anime.title.nativeName || anime.title.romaji;
      }
      const name = title;
      const imageUrl =
        anime.coverImage.extraLarge != null
          ? anime.coverImage.extraLarge
          : anime.coverImage.large != null
          ? anime.coverImage.large
          : anime.coverImage.medium != null
          ? anime.coverImage.medium
          : "";

      const link = anime.id.toString();
      list.push({ name, imageUrl, link });
    }
    return {
      list: list,
      hasNextPage: hasNext,
    };
  }

  async getPopular(page) {
    return await this.getAnime(`/popular?p=${page}`);
  }

  async getLatestUpdates(page) {
    return await this.getAnime(`/trending?p=${page}`);
  }

  async search(query, page, filters) {
    return await this.getAnime(`/search?q=${query}?p=${page}`);
  }

  async getDetail(url) {
    const res = await new Client().get(this.extension.apiUrl + `/info/${url}`);
    const data = JSON.parse(res.body);
    const title =
      item.title.romaji != null
        ? item.title.romaji
        : item.title.english != null
        ? item.title.english
        : "";
    const cover =
      item.coverImage.extraLarge != null
        ? item.coverImage.extraLarge
        : item.coverImage.large != null
        ? item.coverImage.large
        : item.coverImage.medium != null
        ? item.coverImage.medium
        : "";
    let description = "";
    const desc = description.concat(
      data.description,
      "\n\n",
      `Type: ${data.format || "Unknown"}`,
      `\nAired: ${data.startIn.year || "-"} ${data.endIn?.year || "-"}`,
      `\nScore: ${data.score.decimalScore || "-"}★`
    );
    let studioNames = data.studio
      .map((a, i) => `${a.name}`)
      .slice(0, 2)
      .join(":::");
    const author = studioNames;
    const status = parseStatus(data.status);
    const genres = data.genres.map((e) => e);

    const epRes = await new Client().get(
      this.extension.apiUrl + `/episode/${url}`
    );

    const episodes = epRes.episodes.map((item) => ({
      name: item.title != null ? item.title : `Episode ${item.number}`,
      url: item.id != null ? item.id : "",
      scanlator: item.isDub ? "sub" : "dub",
    }));
    return {
      name: title,
      imageUrl: cover,
      description: desc,
      author: author,
      status: status,
      genre: genres,
      chapters: episodes,
      link: url,
    };
  }

  async getVideoList(url) {}

  parseStatus(string) {
    switch (string) {
      case "RELEASING":
        return 0;
      case "FINISHED":
        return 1;
      case "NOT_YET_RELEASED":
        return 0;
      case "CANCELLED":
        return 3;
      case "HIATUS":
        return 2;
    }
  }
}
