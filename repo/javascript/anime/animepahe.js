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
    const apiUrl = this.extension.apiUrl;
    const baseUrl = this.extension.baseUrl;
    return (await new Client().get(apiUrl + url, { Referer: baseUrl })).body;
  }

  siteConfig() {
    return { hasLatest: true, hasPopular: false, dateFormat: "" };
  }

  getHeaders(url) {
    return {
      Referer: this.extension.baseUrl,
    };
  }

  async getPopular(page) {
    throw new Error("getPopular not implemented");
  }

  checkIfDDos(body) {
    const document = new Document(body);
    const isDdos = document.selectFirst("title").text;
    console.log(isDdos);
    if (isDdos === "DDoS-Guard") {
      return true;
    } else {
      return false;
    }
  }

  async getLatestUpdates(page) {
    // const res = await this.request(`?m=airing&page=${page}`);
    try {
      const res = await this.request(`?m=airing&page=${page}`);
      //   const document = new Document(res);
      //   const isDdos = document.selectFirst("title").text;
      //   console.log(isDdos);
      //   if(isDdos === "DDoS-Guard"){
      //   }
      const resData = JSON.parse(res);
      const list = [];
      const hasNext = resData.current_page < resData.last_page;
      for (const item of resData.data) {
        const id = item.id;
        const name = item.anime.title;
        const imageUrl = item.snapshot;
        // const link = item.anime_session.toString();
        const link = `/anime/?anime_id=${id}&name=${name}`;
        const artist = item.anime.fansub;
        list.push({ name, imageUrl, link, artist });
      }
      return {
        list: list,
        hasNextPage: hasNext,
      };
    } catch (e) {
      const anime = [
        {
          title: "error",
          url: "/",
          cover: null,
        },
      ];
      return { list: anime, hasNextPage: false };
    }
  }
  async search(query, page, filters) {
    throw new Error("search not implemented");
  }
  async getDetail(url) {
    const statusList = [{ "Currently Airing": 0, "Finished Airing": 1 }];

    const res = (await new Client().get(`https://animepahe.ru/anime/${url}`))
      .body;
    const isDDos = this.checkIfDDos(res);
    if (!isDDos) {
      const id = this.substringBefore(
        this.substringAfterLast(url, "?anime_id="),
        "&name="
      );
      const nameData = this.substringAfterLast(url, "&name=");
      const session = await this.getSession(nameData, id);
      const baseUrl = this.extension.baseUrl;
      const apiUrl = this.extension.apiUrl;
      const res = (
        await new Client().get(`${baseUrl}/anime/${session}?anime_id=${id}`)
      ).body;
      const document = new Document(res);
      const statusRes = (
        document.xpathFirst('//div/p[contains(text(),"Status:")]/text()') ?? ""
      )
        .replaceAll("Status:\n", "")
        .trim();
      const status = this.parseStatus(statusRes, statusList);
      const name = document.selectFirst("div.title-wrapper > h1 > span").text;
      const author = (
        document.xpathFirst('//div/p[contains(text(),"Studio:")]/text()') ?? ""
      )
        .replaceAll("Studio:\n", "")
        .trim();
      const imageUrl = document.selectFirst("div.anime-poster a").attr("href");
      const genre = xpath(
        res,
        '//*[contains(@class,"anime-genre")]/ul/li/text()'
      );
      const synonyms = (
        document.xpathFirst('//div/p[contains(text(),"Synonyms:")]/text()') ??
        ""
      )
        .replaceAll("Synonyms:\n", "")
        .trim();
      const description = document.selectFirst("div.anime-summary").text;
      if (synonyms.isNotEmpty) {
        anime.description += "\n\n$synonyms";
      }
      const epUrl = `${apiUrl}?m=release&id=${session}&sort=episode_desc&page=1`;
      const resEp = (await client.get(Uri.parse(epUrl))).body;
      const episodes = await this.recursivePages(epUrl, resEp, session);

      //   const chapters = episodes;
      return {
        name,
        imageUrl,
        description,
        author,
        status,
        genre,
        episodes,
      };
    } else {
      // DDos Triggered
    }
  }

  async recursivePages(url, res, session) {
    const jsonResult = JSON.parse(res);
    const page = jsonResult.current_page;
    const hasNextPage = page < jsonResult.last_page;
    const animeList = [];
    for (const item of jsonResult.data) {
      const name = `Episode ${item.episode}`;
      const url = `/play/${session}/${item.session}`;
      const dateUpload = this.parseDates(
        item.created_at,
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
    return this.substringBefore(
      this.substringAfter(
        this.substringAfter(res, '"id":$animeId'),
        '"session":"'
      ),
      '"'
    );
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
    throw new Error("getExtensionPreferences not implemented");
  }
}
