// prettier-ignore
const extensionMetaInfo = [
    {
      "name": "GogoAnime",
      "lang": "en",
      "author": "Kaze",
      "baseUrl": "https://anitaku.to",
      "apiUrl": "",
      "iconUrl":"https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/en.gogoanime.png",
      "sourceType": "single",
      "extensionType": 0,
      "isNsfw": false,
      "version": "1.1.0",
      "dateFormat": "",
      "dateFormatLocale": "",
      "pkgPath": "anime/gogoanime.js",
      "isActive": true
    }
  ];

class DefaultExtension extends KProvider {
  async request(body) {
    const apiUrl = this.source.apiUrl;
    const baseUrl = this.source.baseUrl;
    return (await new Client().get(apiUrl + body, { Referer: baseUrl })).body;
  }

  get baseUrl() {
    const preferences = new SharedPreferences();
    const baseUrl = preferences.get("override_baseurl");
    return baseUrl || this.extension.baseUrl;
  }

  siteConfig() {
    return { hasLatest: true, hasPopular: true, dateFormat: "" };
  }

  getHeaders(url) {
    throw new Error("getHeaders not implemented");
  }
  async getPopular(page) {
    const res = (
      await new Client().get(`${this.baseUrl}/popular.html?page=${page}`)
    ).body;
    const document = new Document(res);
    const animeList = [];
    const urls = document.xpath('//*[@class="img"]/a/@href');
    const names = document.xpath('//*[@class="img"]/a/@title');
    const images = document.xpath('//*[@class="img"]/a/img/@src');
    for (let i = 0; i < names.length; i++) {
      animeList.push({ name: names[i], imageUrl: images[i], link: urls[i] });
    }
    return {
      list: animeList,
      hasNextPage: true,
    };
  }
  async getLatestUpdates(page) {
    let url = this.baseUrl;
    if (this.baseUrl.toLowerCase().includes("gogo")) {
      url = url + `/?page=${page}`;
    } else {
      url = url + `/home.html?page=${page}`;
    }
    const res = (await new Client().get(url)).body;
    const document = new Document(res);
    const elements = document.select("div.img a");
    const animeList = [];
    for (const element of elements) {
      // const linkElement = element.selectFirst("a");
      const name = element.attr("title");
      const imageUrl = element.selectFirst("img").attr("src") ?? "";
      const slug = element.attr("href").substringBefore("-episode-");
      const link = `/category/${slug}`;
      animeList.push({ name, imageUrl, link });
    }
    return { list: animeList, hasNextPage: true };
  }
  async search(query, page, filters) {
    const url = this.baseUrl + `?keyword=${query}&page=${page}`;
    const res = (await new Client().get(url)).body;
    const document = new Document(res);
    const animeList = [];
    const urls = document.xpath('//*[@class="img"]/a/@href');
    const names = document.xpath('//*[@class="img"]/a/@title');
    const images = document.xpath('//*[@class="img"]/a/img/@src');
    for (let i = 0; i < names.length; i++) {
      animeList.push({ name: names[i], imageUrl: images[i], link: urls[i] });
    }
    return {
      list: animeList,
      hasNextPage: true,
    };
  }
  async getDetail(url) {
    const res = (await new Client().get(`${this.baseUrl}${url}`)).body;
    // console.log(res);
    const document = new Document(res);
    const statusData = document
      .xpathFirst('//*[@class="anime_info_body_bg"]/p[@class="type"][5]/text()')
      .replaceAll("Status: ", "")
      .trim();

    const description =
      document.selectFirst("div.anime_info_body_bg > div.description").text ??
      "";
    const status = this.parseStatus(statusData);
    const genre = document
      .xpathFirst('//*[@class="anime_info_body_bg"]/p[@class="type"][3]/text()')
      .replaceAll("Genre: ", "")
      .trim()
      .split(",");

    const id = document.xpathFirst('//*[@id="movie_id"]/@value');
    const urlEp = `https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=0&ep_end=4000&id=${id}`;
    const resEp = (await new Client().get(urlEp)).body;
    const episodeDocument = new Document(resEp);
    const epUrls = episodeDocument.xpath(
      '//*[@id="episode_related"]/li/a/@href'
    );
    const names = episodeDocument.xpath(
      '//*[@id="episode_related"]/li/a/div[@class="name"]/text()'
    );
    const episodeNames = [];
    for (const a of names) {
      const extractedName = a.substringAfterLast(" ");
      episodeNames.push(extractedName);
    }
    const episodesList = [];
    for (let i = 0; i < episodeNames.length; i++) {
      const name = episodeNames[i];
      const url = epUrls[i];
      episodesList.push({ name: name, url: url });
    }
    const chapters = episodesList;
    return {
      description: description,
      status: status,
      genre: genre,
      chapters: chapters,
    };
  }

  parseStatus(string) {
    switch (string) {
      case "Ongoing":
        return 0;
      case "Completed":
        return 1;
    }
  }

  // For anime episode video list
  async getVideoList(url) {
    const res = (await new Client().get(`${this.baseUrl}${url}`)).body;
    const document = new Document(res);
    const serverUrls = document.xpath(
      '//*[@class="anime_muti_link"]/ul/li/a/@data-video'
    );
    const serverNames = document.xpath(
      '//*[@class="anime_muti_link"]/ul/li/@class'
    );
    const videos = [];
    const hosterSelection = this.preferenceHosterSelection();
    for (let i = 0; i < serverNames.length; i++) {
        const name = serverNames[i];
        const url = serverUrls[i];
    }
  }

  preferenceHosterSelection() {
    const preferences = new SharedPreferences();
    const hosters = preferences.get("hoster_selection");
    return hosters;
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
        key: "override_baseurl",
        editTextPreference: {
          title: "Change BaseUrl",
          summary:
            "Change to different gogoanime mirror site if default doesn't work for you",
          value: "https://anitaku.to",
          dialogTitle: "Change BaseUrl",
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
      {
        key: "preferred_quality",
        listPreference: {
          title: "Preferred Quality",
          summary: "",
          valueIndex: 0,
          entries: ["1080p", "720p", "480p", "360p"],
          entryValues: ["1080", "720", "480", "360"],
        },
      },
      {
        key: "preferred_hoster",
        listPreference: {
          title: "Preferred Hoster",
          summary: "",
          valueIndex: 0,
          entries: [
            "Gogostream",
            "Vidstreaming",
            "Mp4upload",
            "Doodstream",
            "StreamWish",
            "FileLions",
          ],
          entryValues: [
            "Gogostream",
            "Vidstreaming",
            "Mp4upload",
            "Doodstream",
            "StreamWish",
            "FileLions",
          ],
        },
      },
      {
        key: "hoster_selection",
        multiSelectListPreference: {
          title: "Enable/Disable video hosts",
          summary: "",
          entries: [
            "Gogostream",
            "Vidstreaming",
            "Mp4upload",
            "Doodstream",
            "StreamWish",
            "FileLions",
          ],
          entryValues: [
            "vidcdn",
            "anime",
            "mp4upload",
            "doodstream",
            "streamwish",
            "filelions",
          ],
          values: [
            "vidcdn",
            "anime",
            "mp4upload",
            "doodstream",
            "streamwish",
            "filelions",
          ],
        },
      },
    ];
  }
}
