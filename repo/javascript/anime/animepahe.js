// prettier-ignore
// a69cbcb1-e06a-a49d-b292-9cc6d2538a0f
const extensionMetaInfo = [
    {
      "name": "AnimePahe",
      "lang": "en",
      "author": "Kaze",
      "baseUrl": "https://animepahe.ru",
      "apiUrl": "https://animepahe.ru/api",
      "iconUrl":"https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/en.animepahe.png",
      "sourceType": "single",
      "extensionType": 0,
      "isNsfw": false,
      "version": "1.0.0",
      "dateFormat": "",
      "dateFormatLocale": "",
      "pkgPath": "anime/animepahe.js"
    }
  ];

class DefaultExtension extends KProvider {
  async request(url) {
    const apiUrl = this.apiUrl;
    const baseUrl = this.baseUrl;
    return (await new Client().get(apiUrl + url, { Referer: baseUrl })).body;
  }

  get baseUrl() {
    const preferences = new SharedPreferences();
    const baseUrl = preferences.get("preferred_domain");
    return baseUrl || this.extension.baseUrl;
  }

  get apiUrl() {
    return `${this.baseUrl}/api`;
  }

  siteConfig() {
    return { hasLatest: true, hasPopular: false, dateFormat: "" };
  }

  getHeaders(url) {
    return {
      Referer: this.baseUrl,
    };
  }

  async getPopular(page) {
    return await this.getLatestUpdates(page);
  }

  checkIfDDos(body) {
    const document = new Document(body);
    const isDdos = document.selectFirst("title").text;
    // console.log(isDdos);
    if (isDdos === "DDoS-Guard") {
      return true;
    } else {
      return false;
    }
  }

  async getLatestUpdates(page) {
    const res = await this.request(`?m=airing&page=${page}`);
    //   if(isDdos === "DDoS-Guard"){
    //   }
    const resData = JSON.parse(res);
    const list = [];
    const hasNext = resData.current_page < resData.last_page;
    for (const item of resData.data) {
      const id = item.id;
      const name = item.anime_title;
      const imageUrl = item.snapshot;
      // const link = item.anime_session.toString();
      const link = `/anime/?anime_id=${id}&name=${name}`;
      const artist = item.fansub;
      list.push({ name, imageUrl, link, artist });
    }
    return {
      list: list,
      hasNextPage: hasNext,
    };
  }

  async search(query, page, filters) {
    const apiUrl = this.apiUrl;
    const res = (await new Client().get(`${apiUrl}?m=search&l=8&q=${query}`))
      .body;
    const jsonResult = JSON.parse(res);
    const animeList = [];
    for (const item of jsonResult.data) {
      const name = item.title;
      const imageUrl = item.poster;
      const link = `/anime/?anime_id=${item.id}&name=${item.title}`;
      animeList.push({ name, imageUrl, link });
    }
    return {
      list: animeList,
      hasNextPage: false,
    };
  }

  async getDetail(url) {
    // const res = (await new Client().get(`${this.baseUrl}${url}`)).body;
    const id = url.substringAfterLast("?anime_id=").substringBefore("&name=");

    const nameData = url.substringAfterLast("&name=");
    const session = await this.getSession(nameData, id);
    const baseUrl = this.baseUrl;
    const apiUrl = this.apiUrl;
    const res = (
      await new Client().get(`${baseUrl}/anime/${session}?anime_id=${id}`)
    ).body;
    const document = new Document(res);
    const statusRes = (
      document.xpathFirst('//div/p[contains(text(),"Status:")]/text()') ?? ""
    )
      .replaceAll("Status:\n", "")
      .trim();
    const status = this.parseStatus(statusRes);
    const name = document.selectFirst("div.title-wrapper > h1 > span").text;
    const author = (
      document.xpathFirst('//div/p[contains(text(),"Studio:")]/text()') ?? ""
    )
      .replaceAll("Studio:\n", "")
      .trim();
    const imageUrl = document.selectFirst("div.anime-poster a").attr("href");
    const genre = document.xpath(
      '//*[contains(@class,"anime-genre")]/ul/li/text()'
    );
    // const genre = document.xpath(
    //   '//*[@class="anime-genre font-weight-bold"]/ul/li/a/text()'
    // );
    const synonyms = (
      document.xpathFirst('//div/p[contains(text(),"Synonyms:")]/text()') ?? ""
    )
      .replaceAll("Synonyms:\n", "")
      .trim();
    let description = document.selectFirst("div.anime-summary").text;
    if (synonyms) {
      description += `\n\n${synonyms}`;
    }

    const epUrl = `${apiUrl}?m=release&id=${session}&sort=episode_desc&page=1`;
    const resEp = (await new Client().get(epUrl)).body;
    const episodes = await this.recursivePages(epUrl, resEp, session);

    //   const chapters = episodes;
    return {
      name: name,
      imageUrl: imageUrl,
      description: description,
      author: author,
      status: status,
      genre: genre,
      chapters: episodes,
    };
  }

  async recursivePages(url, res, session) {
    const jsonResult = JSON.parse(res);
    const page = jsonResult.current_page;
    const hasNextPage = page < jsonResult.last_page;
    const animeList = [];
    for (const item of jsonResult.data) {
      const name = `Episode ${item.episode}`;
      const url = `/play/${session}/${item.session}`;
      const dateUpload = parseDates(
        [item.created_at],
        "yyyy-MM-dd HH:mm:ss",
        "en"
      )[0];
      animeList.push({
        name: name,
        num: item.episode,
        url: url,
        dateUpload: dateUpload,
      });
    }
    if (hasNextPage) {
      const newUrl = `${this.substringBeforeLast(url, "&page=")}&page=${
        page + 1
      }`;
      const newRes = (await new Client().get(newUrl)).body;
      animeList.push(...(await recursivePages(newUrl, newRes, session)));
    }
    return animeList;
  }

  async getSession(title, animeId) {
    const res = (
      await new Client().get(
        `${this.extension.baseUrl}/api?m=search&q=${title}`
      )
    ).body;
    return res
      .substringAfter('"id":$animeId')
      .substringAfter('"session":"')
      .substringBefore('"');
  }
  // For anime episode video list
  async getVideoList(url) {
    throw new Error("getVideoList not implemented");
  }
  // For manga chapter pages
  async getPageList() {
    throw new Error("getPageList not implemented");
  }
  getFilterList() {
    throw new Error("getFilterList not implemented");
  }
  getExtensionPreferences() {
    return [
      {
        key: "preferred_domain",
        listPreference: {
          title: "Change Domain",
          summary: "",
          valueIndex: 0,
          entries: ["animepahe.ru", "animepahe.com", "animepahe.org"],
          entryValues: [
            "https://animepahe.ru",
            "https://animepahe.com",
            "https://animepahe.org",
          ],
        },
      },
      {
        key: "preffered_link_type",
        switchPreferenceCompat: {
          title: "Use HLS links",
          summary: "Enable this if you are having Cloudflare issues.",
          value: false,
        },
      },
      {
        key: "preferred_quality",
        listPreference: {
          title: "Preferred Quality",
          summary: "",
          valueIndex: 0,
          entries: ["1080p", "720p", "360p"],
          entryValues: ["1080", "720", "360"],
        },
      },
    ];
  }

  parseStatus(string) {
    switch (string) {
      case "Currently Airing":
        return 0;
      case "Finished Airing":
        return 1;
    }
  }
}
