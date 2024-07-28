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
    return mangaFromElements(document.select("div.page-item-detail"));
  }

  async getLatestUpdates(page) {
    const res = (
      await new Client().get(
        `${this.extension.baseUrl}/manga/page/${page}/?m_orderby=latest`
      )
    ).body;
    const document = new Document(res);
    return mangaFromElements(document.select("div.page-item-detail"));
  }

  async search(query, page, filters) {
    throw new Error("search not implemented");
  }
  async getDetail(url) {
    throw new Error("getDetail not implemented");
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
      const link = postTitle.href;
      mangaList.push({ name, imageUrl, link });
    }
    return MPages(mangaList, true);
  }
}
