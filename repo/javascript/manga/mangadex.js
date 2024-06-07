// prettier-ignore
const extensionMetaInfo = [
    {
      "name": "MangaDex",
      "lang": "en",
      "author": "Kaze",
      "baseUrl": "https://mangadex.org/",
      "apiUrl": "https://api.mangadex.org",
      "iconUrl":
        "https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/mangadex.png",
      "sourceType": "single",
      "extensionType": 1,
      "isNsfw": true,
      "version": "1.3.0",
      "dateFormat": "yyyy-MM-dd'T'HH:mm:ss.SSS",
      "dateFormatLocale": "en_Us",
      "pkgPath": "manga/mangadex.js"
    }
  ];

class DefaultExtension extends KProvider {
  async request(body) {
    const apiUrl = this.source.apiUrl;
    const baseUrl = this.source.baseUrl;
    return (await new Client().get(apiUrl + body, { Referer: baseUrl })).body;
  }

  supportsLatest() {
    return true;
  }

  getHeaders(url) {
    throw new Error("getHeaders not implemented");
  }

  mangaRes(res) {
    const data = JSON.parse(res).data;
    let animeList = [];
    for (const anime of data) {
      let name = this.findTitle(anime);
      let imageUrl = this.getCover(anime);
      let link = `/manga/${anime.id}`;
      animeList.push({ name, imageUrl, link });
    }
    return {
      list: animeList,
      hasNextPage: true,
    };
  }

  async getPopular(page) {
    page = 20 * (page - 1);
    const userContentRating = this.preferenceContentRating();
    const url = `https://api.mangadex.org/manga?limit=20&offset=${page}&availableTranslatedLanguage[]=${this.extension.lang}&includes[]=cover_art${userContentRating}&order[followedCount]=desc`;
    const res = (await new Client().get(url)).body;
    return this.mangaRes(res);
  }

  async getLatestUpdates(page) {
    page = 20 * (page - 1);
    const url = `https://api.mangadex.org/chapter?limit=20&offset=${page}&translatedLanguage[]=${this.extension.lang}&includeFutureUpdates=0&order[publishAt]=desc&includeFuturePublishAt=0&includeEmptyPages=0`;
    const ress = (await new Client().get(url)).body;
    const data = JSON.parse(ress).data;
    const mangaIds = data.flatMap((item) =>
      item.relationships.map((relationship) => relationship.id)
    );

    let mangaIdss = "";
    for (const i of mangaIds) {
      mangaIdss += `&ids[]=${i}`;
    }
    const userContentRating = this.preferenceContentRating();
    const newUrl = `https://api.mangadex.org/manga?includes[]=cover_art&limit=${mangaIds.length}${userContentRating}${mangaIdss}`;
    const res = (await new Client().get(newUrl)).body;
    return this.mangaRes(res);
  }

  parseStatus(string) {
    switch (string) {
      case "ongoing":
        return 0;
      case "completed":
        return 1;
      case "hiatus":
        return 2;
      case "cancelled":
        return 3;
    }
  }

  async search(query, page, filters) {
    throw new Error("search not implemented");
  }
  async getDetail(url) {
    const res = (
      await new Client().get(
        `https://api.mangadex.org${url}?includes[]=cover_art&includes[]=author&includes[]=artist`
      )
    ).body;
    const data = JSON.parse(res).data;

    // Extract all names, handling cases where 'attributes' or 'name' is missing
    const author = data.relationships
      .map(
        (relationship) =>
          relationship.attributes && relationship.attributes.name
      ) // Map to the name if it exists, otherwise undefined
      .filter((name) => name !== undefined)
      .slice(0, 2)
      .join(":::"); // Filter out undefined values

    const description = data.attributes.description.en;
    const genres = data.attributes.tags.map((tag) => tag.attributes.name.en);

    const contentRating = data.attributes.contentRating;
    if (contentRating !== "safe") {
      genres.push(contentRating);
    }
    const publicationDemographic = data.attributes.publicationDemographic;
    if (publicationDemographic === "null") {
    } else {
      genres.push(publicationDemographic);
    }
    const statusRes = data.attributes.status;
    const status = this.parseStatus(statusRes);

    const mangaId = url.split("/").slice(-1);
    //   const mangaId = mangaIdSplit[mangaIdSplit.length - 1];

    const paginatedChapterList = await this.paginatedChapterListRequest(
      mangaId,
      0
    );

    const limit = parseInt(paginatedChapterList.limit);
    const offset = parseInt(paginatedChapterList.offset);
    const total = parseInt(paginatedChapterList.total);
    const chapterListA = [];
    const list = this.getChapters(paginatedChapterList);

    chapterListA.push(...list);
    const hasMoreResults = limit + offset < total;
    while (hasMoreResults) {
      offset += limit;
      const newRequest = await paginatedChapterListRequest(mangaId, offset);
      const total = parseInt(newRequest.total);
      const list = this.getChapters(newRequest);
      chapterListA.push(...list);
      hasMoreResults = limit + offset < total;
    }
    const returnValue = {
      author: author,
      description: description,
      genre: genres,
      status: status,
      chapters: chapterListA,
    };
    console.log(returnValue);
    return returnValue;
  }

  getChapters(paginatedChapterListA) {
    const chaptersList = [];
    const paginatedChapterList = paginatedChapterListA;
    const dataList = paginatedChapterList.data;
    for (const res of dataList) {
      let scan = "";
      const groups = res.relationships.filter(
        (relationship) =>
          relationship.id !== "00e03853-1b96-4f41-9542-c71b8692033b"
      );
      let chapName = "";
      for (const element of groups) {
        const data = element.attributes;
        if (data) {
          const name = data.name;
          scan += `${name}`;
          const username = data.username;
          if (username) {
            if (!scan) {
              scan += `Uploaded by ${username}`;
            }
          }
        }
      }
      if (!scan) {
        scan = "No Group";
      }
      const dataRes = res.attributes;
      if (dataRes) {
        const attributes = res.attributes;
        const volume = attributes.volume;
        if (volume) {
          if (volume !== "null") {
            chapName = `Vol.${volume} `;
          }
        }
        const chapter = attributes.chapter;
        if (chapter) {
          if (chapter !== "null") {
            chapName += `Ch.${chapter} `;
          }
        }
        const title = attributes.title;
        if (title) {
          if (title !== "null") {
            if (chapName) {
              chapName += "- ";
            }
            chapName += `${title}`;
          }
        }
        if (!chapName) {
          chapName += "Oneshot";
        }
        const date = attributes.publishAt;
        const id = res.id;
        const dateUpload = parseDates(
          [date],
          "yyyy-MM-dd'T'HH:mm:ss+SSS",
          "en_US"
        )[0];
        chaptersList.push({
          name: chapName,
          url: id,
          scanlator: scan,
          dateUpload: dateUpload,
        });
      }
    }
    return chaptersList;
  }

  async paginatedChapterListRequest(mangaId, offset) {
    const userContentRating = this.preferenceContentRating();
    const url = `https://api.mangadex.org/manga/${mangaId}/feed?limit=500&offset=${offset}&includes[]=user&includes[]=scanlation_group&order[volume]=desc&order[chapter]=desc&translatedLanguage[]=${this.extension.lang}&includeFuturePublishAt=0&includeEmptyPages=0${userContentRating}`;
    const res = (await new Client().get(url)).body;
    const data = JSON.parse(res);
    return data;
  }

  // For anime episode video list
  async getVideoList(url) {
    throw new Error("getVideoList not implemented");
  }
  // For manga chapter pages
  async getPageList(url) {
    const res = (
      await new Client().get(`https://api.mangadex.org/at-home/server/${url}`)
    ).body;
    const data = JSON.parse(res);

    const host = data.baseUrl;
    const chapter = data.chapter;
    const hash = chapter.hash;
    const chapterDatas = chapter.data;
    return chapterDatas.map((e) => `${host}/data/${hash}/${e}`);
  }

  getFilterList() {
    throw new Error("getFilterList not implemented");
  }

  findTitle(anime) {
    const attributes = anime.attributes;
    const altTitlesJ = attributes.altTitles;
    const titleJ = attributes.title;
    const title = titleJ["en"];
    if (!title) {
      for (var r of altTitlesJ) {
        let altTitle = r["en"];
        if (altTitle) {
          return altTitle;
        }
      }
    }
    return title;
  }

  getCover(anime) {
    const preferences = new SharedPreferences();
    const coverQuality = preferences.get("cover_quality");

    const relationships = anime.relationships;
    let coverFileName;
    for (const a of relationships) {
      const relationType = a.type;
      if (relationType === "cover_art") {
        if (!coverFileName) {
          const attributes = a.attributes;
          const id = anime.id;
          const fileName = attributes.fileName;
          coverFileName = `https://uploads.mangadex.org/covers/${id}/${fileName}${coverQuality}`;
        }
      }
    }
    return coverFileName;
  }

  preferenceContentRating() {
    const preferences = new SharedPreferences();
    const contentRating = preferences.get("content_rating");
    let contentRatingStr = "";
    if (contentRating.isNotEmpty) {
      contentRatingStr = "&";
      for (var ctn of contentRating) {
        contentRatingStr += `&${ctn}`;
      }
    }
    return contentRatingStr;
  }

  getExtensionPreferences() {
    return [
      {
        key: "cover_quality",
        listPreference: {
          title: "Cover Quality",
          summary: "",
          valueIndex: 0,
          entries: ["Original", "Medium", "Low"],
          entryValues: ["", ".512.jpg", ".256.jpg"],
        },
      },
      {
        key: "alternative_title_in_description",
        switchPreferenceCompat: {
          title: "Alternative titles in description",
          summary:
            "Include alternative titles of the manga at the end of the description",
          value: false,
        },
      },
      {
        key: "content_rating",
        multiSelectListPreference: {
          title: "Content Rating",
          summary:
            "Enable/Disable content rating to be used to filter out the content",
          entries: ["safe", "suggestive", "erotica", "pornographic"],
          entryValues: [
            "contentRating[]=safe",
            "contentRating[]=suggestive",
            "contentRating[]=erotica",
            "contentRating[]=pornographic",
          ],
          values: ["contentRating[]=safe", "contentRating[]=suggestive"],
        },
      },
    ];
  }
}
