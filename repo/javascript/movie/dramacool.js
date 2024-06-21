// prettier-ignore
const extensionMetaInfo = [
    {
      "name": "DramaCool",
      "lang": "en",
      "author": "Kaze",
      "baseUrl": "https://asianc.to",
      "apiUrl": "",
      "iconUrl":"https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/dramacool.png",
      "sourceType": "single",
      "extensionType": 2,
      "isNsfw": false,
      "version": "1.0.0",
      "dateFormat": "",
      "dateFormatLocale": "",
      "pkgPath": "movie/dramacool.js"
    }
  ];

class DefaultExtension extends KProvider {
  async request(body) {
    const apiUrl = this.extension.apiUrl;
    const baseUrl = this.baseUrl;
    return (await new Client().get(baseUrl + body, { Referer: baseUrl })).body;
  }

  get baseUrl() {
    const preferences = new SharedPreferences();
    const baseUrl = preferences.get("override_baseurl");
    return baseUrl || this.extension.baseUrl;
  }

  siteConfig() {
    return {
      hasLatest: true,
      hasPopular: true,
      hasTVLatest: false,
      hasTVPopular: false,
      dateFormat: "",
    };
  }

  getHeaders(url) {
    throw new Error("getHeaders not implemented");
  }

  scrapItems(res) {
    const itemsList = [];
    const document = new Document(res);
    const path = "//li/a[@class='img']";
    const pages = document.xpath(
      '//ul[contains(@class,"pagination")]/li[@class="next"]/a/text()'
    );
    const urls = document.xpath(`${path}/@href`);
    let names = document.xpath(`${path}/@title`);
    if (names.isEmpty()) {
      names = document.xpath(`${path}/h3/text()`);
    }
    const images = document.xpath(`${path}/img/@data-original`);
    for (let i = 0; i < names.length; i++) {
      itemsList.push({
        name: names[i],
        imageUrl: images[i].replaceAll(" ", "%20"),
        link: urls[i],
      });
    }
    return { list: itemsList, hasNextPage: pages.length > 0 };
  }

  async getPopular(page) {
    const res = await this.request(`/most-popular-drama?page=${page}`);
    return this.scrapItems(res);
  }
  async getLatestUpdates(page) {
    const res = await this.request(`/recently-added?page=${page}`);
    return this.scrapItems(res);
  }
  async search(query, page, filters) {
    const res = await this.request(
      `/search?type=movies&keyword=${query}&page=${page}`
    );
    return this.scrapItems(res);
  }
  async getDetail(url) {
    if (url.includes("-episode-") && url.endsWith(".html")) {
      const res = await this.request(url);
      const document = new Document(res);
      url = document.selectFirst("div.category a").attr("href");
    }

    const res = await this.request(url);
    const document = new Document(res);
    const description = document
      .selectFirst("div.info")
      .select("p")
      .map((e) => {
        if (!e.outerHtml.includes("<span")) {
          return e.text;
        }
        return "";
      })
      .join("\n")
      .trim();

    let status = 3;

    const statusRes = document.xpath('//p[contains(text(),"Status")]/a/text()');
    if (statusRes.isNotEmpty()) {
      status = this.parseStatus(statusRes);
    }
    let author = document.xpath(
      '//p[contains(text(),"Original Network:")]/a/text()'
      // '//div/p/span[contains(text(),"Original Network:")]/following-sibling::a/text()'
    );

    if (author.isNotEmpty()) {
      author = author.first();
    }

    const genre = document.xpath('//p[contains(text(),"Genre:")]/a/text()');

    const episodesList = [];

    const episodeListElements = document.select("ul.all-episode li a");
    // const epHtml = document.select(
    //   "div.content-left > div.block-tab > div > div > ul > li"
    // );
    for (let element of episodeListElements) {
      const epNum = element
        .selectFirst("h3")
        .text.substringAfterLast("Episode ");
      const type = element.selectFirst("span.type")?.text ?? "RAW";
      const date = element.selectFirst("span.time")?.text ?? "";
      const name = `${type}: Episode ${epNum}`.trim();
      const url = element.getHref;
      let dateUpload;
      if (date) {
        dateUpload = parseDates(
          [element.selectFirst("span.time")?.text],
          "yyyy-MM-dd HH:mm:ss",
          "en"
        ).first();
      }

      episodesList.push({ name: name, url: url, dateUpload: dateUpload });
    }
    return {
      description: description,
      author: author,
      genre: genre,
      chapters: episodesList,
    };
  }

  parseStatus(string) {
    switch (string) {
      case "Ongoing":
        return 0;
      case "Completed":
        return 1;
      case "Upcoming":
        return 3;
      default:
        return 3;
    }
  }

  getUrlWithoutDomain(url) {
    const urlPattern = /^(?:https?:\/\/)?[^\/]+(\/.*)?$/i;
    const match = url.match(urlPattern);
    return match ? match[1] || "/" : "/";
  }

  // For anime episode video list
  async getVideoList(url) {
    // url = this.getUrlWithoutDomain(url);
    const res = await this.request(url);
    const document = new Document(res);
    let iframeUrl = document.selectFirst("iframe")?.getSrc ?? "";
    console.log(iframeUrl);
    if (!iframeUrl) return [];
    if (iframeUrl.startsWith("//")) {
      iframeUrl = `https:${iframeUrl}`;
    }
    const iframeDoc = new Document((await new Client().get(iframeUrl)).body);
    const serverElements = iframeDoc.select("ul.list-server-items li");
    const videos = [];
    for (let serverElement of serverElements) {
      const url = serverElement.attr("data-video");
      let a = [];
      if (url.includes("dood")) {
        a = await doodExtractor(url, "DoodStream");
      } else if (url.includes("dwish")) {
        a = await streamWishExtractor(url, "StreamWish");
      } else if (url.includes("streamtape")) {
        a = await streamTapeExtractor(url, "StreamTape");
      }
      videos.push(...a);
    }
    return this.sortVideos(videos);
  }
  sortVideos(videos) {
    const quality = this.getPreferenceValue("preferred_quality");
    videos.sort((a, b) => {
      let qualityMatchA = 0;
      if (a.quality.includes(quality)) {
        qualityMatchA = 1;
      }
      let qualityMatchB = 0;
      if (b.quality.includes(quality)) {
        qualityMatchB = 1;
      }

      if (qualityMatchA !== qualityMatchB) {
        return qualityMatchB - qualityMatchA;
      }
      //   return qualityMatchB - qualityMatchA;
      const regex = "(d+)p";
      // Use RegExp to match and extract quality numbers
      const matchA = regex.exec(a.quality);
      const matchB = regex.exec(b.quality);

      // Extract quality numbers and parse them as integers
      const qualityNumA = matchA ? parseInt(matchA[1]) : 0;
      const qualityNumB = matchB ? parseInt(matchB[1]) : 0;

      // Calculate the difference
      return qualityNumB - qualityNumA;
    });
    return videos;
  }

  getFilterList() {
    throw new Error("getFilterList not implemented");
  }

  getPreferenceValue(key) {
    const preferences = new SharedPreferences();
    const value = preferences.get(key);
    return value;
  }

  getExtensionPreferences() {
    return [
      {
        key: "override_baseurl",
        editTextPreference: {
          title: "Change BaseUrl",
          summary:
            "Change to different dramacool mirror site if default doesn't work for you",
          value: "https://asianc.to",
          dialogTitle: "Change BaseUrl",
          dialogMessage: "",
        },
      },
      {
        key: "preferred_quality",
        listPreference: {
          title: "Preferred Quality",
          summary: "",
          valueIndex: 0,
          entries: [
            "1080p",
            "720p",
            "480p",
            "360p",
            "Doodstream",
            "StreamTape",
          ],
          entryValues: [
            "1080",
            "720",
            "480",
            "360",
            "Doodstream",
            "StreamTape",
          ],
        },
      },
    ];
  }
}
