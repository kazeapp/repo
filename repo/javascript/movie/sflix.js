// prettier-ignore
const extensionMetaInfo = [
    {
      "name": "SFlix",
      "lang": "en",
      "author": "Kaze",
      "baseUrl": "https://sflix.to",
      "apiUrl": "",
      "iconUrl":"https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/sflix.png",
      "sourceType": "single",
      "extensionType": 2,
      "isNsfw": false,
      "version": "1.0.0",
      "dateFormat": "",
      "dateFormatLocale": "",
      "pkgPath": "movie/sflix.js"
    }
  ];

class DefaultExtension extends KProvider {
  async request(body) {
    const apiUrl = this.extension.apiUrl;
    const baseUrl = this.extension.baseUrl;
    return (await new Client().get(baseUrl + body, { Referer: baseUrl })).body;
  }

  siteConfig() {
    return {
      hasLatest: true,
      hasPopular: true,
      hasTVLatest: true,
      hasTVPopular: true,
      dateFormat: "",
    };
  }

  getHeaders(url) {
    throw new Error("getHeaders not implemented");
  }

  scrapItems(res, page) {
    const bsxList = res.match(/flw-item[\s\S]+?<\/div>/g);
    const pageLink = res.match(/href="[^"]*page=(\d+)[^"]*">»<\/a>/);
    const lastPageNumber = pageLink ? pageLink[1] : 1;
    const hasNextPage = lastPageNumber > page;
    const pages = new Document(res).xpath(
      '//ul[contains(@class,"pagination")]/li/a[@title="Next"]/@title'
    );
    const list = [];
    bsxList.forEach((element) => {
      const link = element.match(/href="(.+?)"/)[1];
      const name = element.match(/title="(.+?)"/)[1];
      const imageUrl = element.match(/src="(.+?)"/)[1];
      list.push({
        name,
        link,
        imageUrl,
      });
    });
    return { list: list, hasNextPage: pages.length > 0 };
  }

  async getPopular(page) {
    const res = await this.request(`/movie?page=${page}`);
    return this.scrapItems(res, page);
  }

  async getTVPopular(page) {
    const res = await this.request(`/tv-show?page=${page}`);
    return this.scrapItems(res, page);
  }

  async getLatestUpdates(page) {
    const res = await this.request(`/home`);
    const itemsList = [];
    const document = new Document(res);
    const path =
      '//section[contains(text(),"Latest Movies")]/div/div[@class="film_list-wrap"]/div[@class="flw-item"]/div[@class="film-poster"]';
    const urls = document.xpath(`${path}/a/@href`);
    const names = document.xpath(`${path}/a/@title`);
    const images = document.xpath(`${path}/img/@data-src`);

    for (let i = 0; i < names.length; i++) {
      itemsList.push({ name: names[i], imageUrl: images[i], link: urls[i] });
    }
    return { list: itemsList, hasNextPage: false };
  }

  async getTVLatest(page) {
    const res = await this.request(`/home`);
    const itemsList = [];
    const document = new Document(res);
    const path =
      '//section[contains(text(),"Latest TV Shows")]/div/div[@class="film_list-wrap"]/div[@class="flw-item"]/div[@class="film-poster"]';
    const urls = document.xpath(`${path}/a/@href`);
    const names = document.xpath(`${path}/a/@title`);
    const images = document.xpath(`${path}/img/@data-src`);

    for (let i = 0; i < names.length; i++) {
      itemsList.push({ name: names[i], imageUrl: images[i], link: urls[i] });
    }
    return { list: itemsList, hasNextPage: false };
  }

  async search(query, page, filters) {
    throw new Error("search not implemented");
  }
  async getDetail(url) {
    // url = getUrlWithoutDomain(url);
    const res = await this.request(url);
    const document = new Document(res);
    let description = document.xpath('//div[@class="description"]/text()');
    // console.log(description.isEmpty);
    if (description.length > 0) {
      description = description[0].replaceAll("Overview:", "").trim();
    } else {
      description = "";
    }
    let author = document.xpath(
      '//div[contains(text(),"Production")]/a/text()'
    );
    if (author.length > 0) {
      author = author[0];
    } else {
      author = "N/A";
    }

    const genre = document.xpath('//div[contains(text(),"Genre")]/a/text()');
    const episodesList = [];
    const id = document.xpath('//div[@class="detail_page-watch"]/@data-id')[0];
    const dataType = document.xpath(
      '//div[@class="detail_page-watch"]/@data-type'
    )[0];
    if (dataType == "1") {
      episodesList.push({
        name: "Movie",
        url: `${this.extension.baseUrl}/ajax/movie/episodes/${id}`,
      });
    } else {
      const resS = await this.request(`/ajax/v2/tv/seasons/${id}`);
      const epD = new Document(resS);
      const seasonIds = epD.xpath(
        '//a[@class="dropdown-item ss-item"]/@data-id'
      );
      const seasonNames = epD.xpath(
        '//a[@class="dropdown-item ss-item"]/text()'
      );
      for (let i = 0; i < seasonIds.length; i++) {
        const seasonId = seasonIds[i];
        const seasonName = seasonNames[i];
        const html = await this.request(`/ajax/v2/season/episodes/${seasonId}`);
        const epsHtmls = new Document(html).select("div.eps-item");
        for (const epH of epsHtmls) {
          const epHtml = new Document(epH.outerHtml);
          const episodeId = epHtml.xpath(
            '//div[contains(@class,"eps-item")]/@data-id'
          )[0];
          const epNum = epHtml.xpath(
            '//div[@class="episode-number"]/text()'
          )[0];
          const epName = epHtml.xpath('//h3[@class="film-name"]/text()')[0];
          const name = `${seasonName} ${epNum} ${epName}`;
          const url = `${this.extension.baseUrl}/ajax/v2/episode/servers/${episodeId}`;
          episodesList.push({ name: name, url: url });
        }
      }
    }
    const chapters = episodesList.reverse();
    return {
      description: description,
      author: author,
      genre: genre,
      chapters: chapters,
    };
  }

  getUrlWithoutDomain(url) {
    const urlPattern = /^(?:https?:\/\/)?[^\/]+(\/.*)?$/i;
    const match = url.match(urlPattern);
    return match ? match[1] || "/" : "/";
  }

  getBaseUrl(url) {
    const urlPattern = /^(https?:\/\/[^\/]+)\/?.*$/i;
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  }

  // For anime episode video list
  async getVideoList(url) {
    url = this.getUrlWithoutDomain(url);
    const res = await this.request(url);
    const vidsHtmls = new Document(res).select("ul.fss-list a.btn-play");
    const videos = [];
    for (const vidH of vidsHtmls) {
      const vidHtml = new Document(vidH.outerHtml);
      const id = vidHtml.xpath("//a/@data-id")[0];
      const name = vidHtml.xpath("//span/text()")[0];
      const resSource = await this.request(`/ajax/sources/${id}`);
      const vidUrl = resSource.substringAfter('"link":"').substringBefore('"');
      const a = [];
      let masterUrl = "";
      let type = "";
      if (name.includes("DoodStream")) {
        a = await doodExtractor(vidUrl, "DoodStream");
      }
    }
  }

  async generateIndexPairs() {
    const res = (
      await new Client().get(
        "https://rabbitstream.net/js/player/prod/e4-player.min.js"
      )
    ).body;

    let script = res.substringAfter("const ").substringBefore("()");
    console.log(`Script: ${script}`);
    script = script.substring(0, script.lastIndexOf(","));
    const list = script
      .split(",")
      .map((e) => {
        const value = e.substringAfter("=");
        if (value.includes("0x")) {
          return parseInt(value.substringAfter("0x"), 16);
        } else {
          return parseInt(value);
        }
      })
      .filter((_, i) => i == 1);
    return this.chunked(list, 2).map((list) => list.reverse());
  }

  chunked(list, size) {
    let chunks = [];
    for (let i = 0; i < list.length; i += size) {
      let end = list.length;
      if (i + size < list.length) {
        end = i + size;
      }
      chunks.push(list.slice(i, end));
    }
    return chunks;
  }

  // For manga chapter pages
  async getPageList() {
    throw new Error("getPageList not implemented");
  }
  getFilterList() {
    throw new Error("getFilterList not implemented");
  }
  getExtensionPreferences() {
    throw new Error("getExtensionPreferences not implemented");
  }
}
