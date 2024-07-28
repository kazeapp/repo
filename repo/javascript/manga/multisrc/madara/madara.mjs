class DefaultExtension extends KProvider {
  // constructor(name, baseUrl, lang) {
  //   this.name = name;
  //   this.baseUrl = baseUrl;
  //   this.lang = lang;
  // }

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
    const res = (
      await new Client().get(
        `${this.extension.baseUrl}/manga/page/${page}/?m_orderby=views`
      )
    ).body;
    const document = new Document(res);
    return this.mangaFromElements(document.select("div.page-item-detail"));
  }

  async getLatestUpdates(page) {
    const res = (
      await new Client().get(
        `${this.extension.baseUrl}/manga/page/${page}/?m_orderby=latest`
      )
    ).body;
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
    const image =
      imageElement?.attr("src") ??
      imageElement?.attr("data-src") ??
      imageElement?.attr("data-lazy-src") ??
      imageElement?.attr("srcset");
    if (image) {
      if (image.includes("dflazy")) {
        image =
          imageElement?.attr("data-src") ??
          imageElement?.attr("data-src") ??
          imageElement?.attr("data-lazy-src") ??
          imageElement?.attr("srcset");
      }
      if (image) {
        imageUrl = image;
      }
    }
    const id =
      document.selectFirst("div[id^=manga-chapters-holder]")?.attr("data-id") ??
      "";
    let mangaId = "";
    if (id.isNotEmpty) {
      mangaId = id;
    }
    const statusText = document.selectFirst("div.summary-content")?.text ?? "";

    const status = this.parseStatus(statusText);
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
      res = (await new Client().post(`${url}ajax/chapters`), headers).body;
    } else {
      res = oldXhrChaptersRequest.body;
    }
    console.log(res.body);
    const chapDoc = new Document(res);
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
  async getPageList() {
    throw new Error("getPageList not implemented");
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
        imageElement?.attr("data-src") ??
        imageElement?.attr("data-lazy-src") ??
        imageElement?.attr("srcset") ??
        imageElement?.getSrc ??
        "";
      const name = postTitle.text;
      const imageUrl = image.substringBefore(" ");
      const link = postTitle.attr("href");
      mangaList.push({ name, imageUrl, link });
    }
    return { list: mangaList, hasNextPage: true };
  }

  getChapters(chapDoc) {
    let chapters = [];

    for (const element of chapDoc.select("li.wp-manga-chapter") ?? []) {
      const ch = element.selectFirst("a");
      if (ch != null) {
        let url = ch.attr("href");
        if (url != null && url.isNotEmpty) {
          url = substringBefore(url, "?style=paged");
          if (url.endsWith("?style=paged")) {
            url = url + "?style=paged";
          }
          url = url;

          let dateUpload;
          const chapName = ch.text;
          if (this.extension.dateFormat.isNotEmpty) {
            var chd = element.selectFirst("span.chapter-release-date");
            if (chd != null && chd.text.isNotEmpty()) {
              const dates = parseDates(
                [chd.text],
                this.extension.dateFormat,
                this.extension.dateFormatLocale
              );
              dateUpload = dates[0];
            } else {
              dateUpload = DateTime.now().millisecondsSinceEpoch.toString();
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
