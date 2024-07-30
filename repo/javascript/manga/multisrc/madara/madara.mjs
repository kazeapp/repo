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

  extraSiteCheck() {
    const sites = ["toonily"];
    const baseUrl = this.extension.baseUrl;
    if (
      sites.some(function (v) {
        return baseUrl.indexOf(v) > -1;
      })
    ) {
      return true;
    } else {
      return false;
    }
  }

  async getPopular(page) {
    const checkSite = this.extraSiteCheck();
    let url = `${this.extension.baseUrl}/manga/page/${page}/?m_orderby=views`;
    if (checkSite) {
      url = `${this.extension.baseUrl}/webtoons/page/${page}/?m_orderby=views`;
    }
    const res = (await new Client().get(url)).body;
    // webtoons
    const document = new Document(res);
    return this.mangaFromElements(document.select("div.page-item-detail"));
  }

  async getLatestUpdates(page) {
    const checkSite = this.extraSiteCheck();
    let url = `${this.extension.baseUrl}/manga/page/${page}/?m_orderby=latest`;
    if (checkSite) {
      url = `${this.extension.baseUrl}/webtoons/page/${page}/?m_orderby=views`;
    }
    const res = (await new Client().get(url)).body;

    const document = new Document(res);
    return this.mangaFromElements(document.select("div.page-item-detail"));
  }

  async search(query, page, filters) {
    throw new Error("search not implemented");
  }
  async getDetail(url) {
    let res = (await new Client().get(url)).body;
    const document = new Document(res);
    const author = document.selectFirst("div.author-content > a")?.text ?? "";
    const description =
      document.selectFirst(
        "div.description-summary div.summary__content, div.summary_content div.post-content_item > h5 + div, div.summary_content div.manga-excerpt, div.sinopsis div.contenedor, .description-summary > p"
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
    const id =
      document.selectFirst("div[id^=manga-chapters-holder]")?.attr("data-id") ??
      "";
    let mangaId = "";
    if (id) {
      mangaId = id;
    }
    const statusText =
      document.select("div.post-status div.summary-content")[1]?.text ?? "";
    console.log(statusText.trim());
    const status = this.parseStatus(statusText.trim());
    console.log(status);
    const genre =
      document.select("div.genres-content a")?.map((e) => e.text) ?? [];

    const baseUrl = `${this.extension.baseUrl}/`;
    const headers = { Referer: baseUrl, "X-Requested-With": "XMLHttpRequest" };
    const oldXhrChaptersRequest = await new Client().post(
      `${baseUrl}wp-admin/admin-ajax.php`,
      headers,
      { action: "manga_get_chapters", manga: mangaId }
    );

    if (oldXhrChaptersRequest.statusCode == 400) {
      res = (await new Client().post(`${url}ajax/chapters`, headers)).body;
    } else {
      res = oldXhrChaptersRequest.body;
    }
    let chapDoc = new Document(res);
    let chapters = this.getChapters(chapDoc);
    if (chapters.isEmpty()) {
      res = (await new Client().post(`${url}ajax/chapters`, headers)).body;

      chapDoc = new Document(res);
      chapters = this.getChapters(chapDoc);
    }

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
    const pageElement = document.selectFirst(
      "div.read-container .reading-content"
    );
    const imgs = pageElement.select("img").map(
      (e) =>
        e.attr("src") ??
        e.attr("data-src") ??
        e.attr("data-lazy-src") ??
        e.attr("srcset")

      // this.getAttributeValue(e, "src") ??
      //   this.getAttributeValue(e, "data-src") ??
      //   this.getAttributeValue(e, "data-lazy-src") ??
      //   this.getAttributeValue(e, "srcset");
    );
    for (const vvv of imgs) {
      console.log(`value::: ${vvv}`);
    }
    console.log(imgs.length);
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

  mangaFromElements(elements) {
    let mangaList = [];

    for (const element of elements) {
      const postTitle = element.selectFirst("div.post-title a");
      const imageElement = element.selectFirst("img");
      const image =
        this.getAttributeValue(imageElement, "data-src") ??
        this.getAttributeValue(imageElement, "data-lazy-src") ??
        this.getAttributeValue(imageElement, "srcset") ??
        this.getAttributeValue(imageElement, "src") ??
        "";
      const name = postTitle.text;
      const imageUrl = image.substringBefore(" ");
      const link = postTitle.attr("href");

      // console.log(imageUrl + ` and ${image}`);
      mangaList.push({ name, imageUrl, link });
    }
    return { list: mangaList, hasNextPage: true };
  }

  getAttributeValue(element, attribute) {
    const value = element?.attr(attribute);
    return value && value.trim() !== "" ? value : null;
  }

  getChapters(chapDoc) {
    let chapters = [];

    for (const element of chapDoc.select("li.wp-manga-chapter") ?? []) {
      const ch = element.selectFirst("a");
      if (ch) {
        let url = ch.attr("href");
        if (url) {
          url = url.substringBefore("?style=paged");
          if (url.endsWith("?style=paged")) {
            url = url + "?style=paged";
          }
          url = url;

          let dateUpload;
          const chapName = ch.text.trim();
          if (this.extension.dateFormat) {
            var chd = element.selectFirst("span.chapter-release-date");
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
