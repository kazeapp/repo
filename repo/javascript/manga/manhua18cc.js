// prettier-ignore
const extensionMetaInfo = [
    {
      "name": "Manhua18.cc",
      "lang": "all",
      "author": "Kaze",
      "baseUrl": "https://manhwa18.cc",
      "apiUrl": "",
      "iconUrl":"https://raw.githubusercontent.com/kazeapp/repo/main/repo/javascript/icon/manhua18cc.png",
      "sourceType": "madara",
      "extensionType": 1,
      "isNsfw": true,
      "version": "1.5.0",
      "dateFormat": "dd MMM yyyy",
      "dateFormatLocale": "en_US",
      "pkgPath": "manga/manhua18cc.js"
    }
  ];

class DefaultExtension extends KProvider {
  siteConfig() {
    return {
      hasLatest: true,
      hasPopular: true,
      hasTVLatest: false,
      hasTVPopular: false,
      dateFormat: "",
    };
  }

  async getPopular(page) {
    const url = `${this.extension.baseUrl}/webtoons/${page}?orderby=trending`;
    const res = (await new Client().get(url)).body;
    // webtoons
    const document = new Document(res);
    const hasNext = document.selectFirst("ul.pagination li.next a")?.text
      ? true
      : false;
    // const hasNext = hasNextData;
    return this.mangaFromElements(
      document.select("div.list-block div.manga-lists div.manga-item"),
      hasNext
    );
  }

  async getLatestUpdates(page) {
    const url = `${this.extension.baseUrl}/webtoons/${page}?orderby=latest`;
    const res = (await new Client().get(url)).body;

    const document = new Document(res);
    const hasNext = document.selectFirst("ul.pagination li.next a")?.text
      ? true
      : false;
    return this.mangaFromElements(
      document.select("div.list-block div.manga-lists div.manga-item"),
      hasNext
    );
  }

  async search(query, page, filters) {
    throw new Error("search not implemented");
  }

  async getDetail(url) {
    url = url.replace(/\/?$/, "/");
    let res = (await new Client().get(url)).body;
    const document = new Document(res);
    const author = document.selectFirst("div.author-content > a")?.text ?? "";

    const description =
      document.selectFirst(
        "div.panel-story-description p, div.description-summary div.summary__content, div.summary_content div.post-content_item > h5 + div, div.summary_content div.manga-excerpt, div.sinopsis div.contenedor, .description-summary > p"
      )?.text ?? "";

    let imageUrl = "";
    const imageElement = document.selectFirst("div.summary_image img");
    let image =
      this.getAttributeValue(imageElement, "src") ??
      this.getAttributeValue(imageElement, "data-src") ??
      this.getAttributeValue(imageElement, "data-lazy-src") ??
      this.getAttributeValue(imageElement, "srcset");

    if (image) {
      if (image.includes("dflazy")) {
        image =
          this.getAttributeValue(imageElement, "data-src") ??
          this.getAttributeValue(imageElement, "src") ??
          this.getAttributeValue(imageElement, "data-lazy-src") ??
          this.getAttributeValue(imageElement, "srcset");
      }
      if (image) {
        imageUrl = image;
      }
    }

    const chaptersWrapper = document.selectFirst(
      "div[id^=manga-chapters-holder]"
    );
    const id = chaptersWrapper?.attr("data-id") ?? "";
    let mangaId = "";
    if (id) {
      mangaId = id;
    }
    const statusText =
      document.select("div.post-status div.summary-content")[1]?.text ?? "";
    const status = this.parseStatus(statusText.trim());
    const genre =
      document.select("div.genres-content a")?.map((e) => e.text) ?? [];
    let chapters = this.getChapters(document);
    return {
      author: author,
      description: description,
      status: status,
      genre: genre,
      chapters: chapters,
    };
  }
  // For anime episode video list
  async getVideoList(url) {
    throw new Error("getVideoList not implemented");
  }
  // For manga chapter pages
  async getPageList(url) {
    const res = (await new Client().get(url)).body;
    const document = new Document(res);
    const pageElement = document.selectFirst("div.read-content");
    const imgs = pageElement
      .select("img")
      .map(
        (e) =>
          this.getAttributeValue(e, "src") ??
          this.getAttributeValue(e, "data-src") ??
          this.getAttributeValue(e, "data-lazy-src") ??
          this.getAttributeValue(e, "srcset")
      );
    // console.log(imgs.length);
    let pageUrls = [];
    if (imgs.length == 1) {
      const pagesNumber = document
        .selectFirst("#single-pager")
        .select("option").length;
      const imgElement = pageElement.selectFirst("img");
      const imgUrl =
        this.getAttributeValue(imgElement, "src") ??
        this.getAttributeValue(imgElement, "data-src") ??
        this.getAttributeValue(imgElement, "data-lazy-src") ??
        this.getAttributeValue(imgElement, "srcset");
      for (const i = 0; i < pagesNumber; i++) {
        const val = i + 1;
        if (i.length == 1) {
          pageUrls.push(imgUrl.replace("01", `0${val}`));
        } else {
          pageUrls.add(imgUrl.replace("01", val));
        }
      }
    } else {
      return imgs;
    }
    return pageUrls;
  }
  getFilterList() {
    throw new Error("getFilterList not implemented");
  }
  getExtensionPreferences() {
    throw new Error("getExtensionPreferences not implemented");
  }

  mangaFromElements(elements, hasNext) {
    let mangaList = [];
    for (const element of elements) {
      const postTitle = element.selectFirst("div.data a");
      const imageElement = element.selectFirst("img");
      const imageUrl = imageElement.attr("src");
      const name = postTitle.text;
      const linkData = postTitle.attr("href");
      const link = `${this.extension.baseUrl}${linkData}`;

      // console.log(imageUrl + ` and ${image}`);
      mangaList.push({ name, imageUrl, link });
    }
    return { list: mangaList, hasNextPage: hasNext };
  }

  getAttributeValue(element, attribute) {
    const value = element?.attr(attribute);
    return value && value.trim() !== "" ? value : null;
  }

  getChapters(chapDoc) {
    let chapters = [];

    for (const element of chapDoc.select("li.a-h") ?? []) {
      const ch = element.selectFirst("a");
      if (ch) {
        let url = ch.attr("href");
        if (url) {
          url = url.substringBefore("?style=paged");
          if (url.endsWith("?style=paged")) {
            url = url + "?style=paged";
          }
          url = `${this.extension.baseUrl}${url}`;

          let dateUpload;
          const chapName = ch.text.trim();
          if (this.extension.dateFormat) {
            var chd = element.selectFirst("span.chapter-time");
            if (chd && chd.text.trim()) {
              const dates = parseDates(
                [chd.text.trim()],
                this.extension.dateFormat,
                this.extension.dateFormatLocale
              );
              dateUpload = dates[0];
            } else {
              dateUpload = Date.now();
            }
          }

          chapters.push({
            name: chapName,
            url: url,
            dateUpload: dateUpload,
          });
          // chapters.push({ name: name, url: url, dateUpload:dateUpload});
        }
      }
    }
    return chapters;
  }

  //  0=>"ongoing", 1=>"completed", 2=>"hiatus", 3=>"canceled", 4=>"publishingFinished",  5=>"unknown"
  parseStatus(string) {
    switch (string) {
      case "OnGoing":
      case "Продолжается":
      case "Updating":
      case "Em Lançamento":
      case "Em lançamento":
      case "Em andamento":
      case "Em Andamento":
      case "En cours":
      case "Ativo":
      case "Lançando":
      case "Đang Tiến Hành":
      case "Devam Ediyor":
      case "Devam ediyor":
      case "In Corso":
      case "In Arrivo":
      case "مستمرة":
      case "مستمر":
      case "En Curso":
      case "En curso":
      case "Emision":
      case "En marcha":
      case "Publicandose":
      case "En emision":
      case "连载中":
        return 0;
      case "Completed":
      case "Completo":
      case "Completado":
      case "Concluído":
      case "Concluido":
      case "Finalizado":
      case "Terminé":
      case "Hoàn Thành":
      case "مكتملة":
      case "مكتمل":
      case "已完结":
        return 1;
      case "On Hold":
      case "Pausado":
      case "En espera":
        return 2;
      case "Canceled":
      case "Cancelado":
        return 3;
      default:
        return 5;
    }
  }
}
