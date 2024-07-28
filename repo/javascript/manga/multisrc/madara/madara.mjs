class Madara extends KProvider {
  // constructor(name, baseUrl, lang) {
  //   this.name = name;
  //   this.baseUrl = baseUrl;
  //   this.lang = lang;
  // }

  async getPopular(page) {
    const res = (
      await new Client().get(
        `${this.extension.baseUrl}/manga/page/${page}/?m_orderby=views`
      )
    ).body;

    const document = new Document(res);
    return mangaFromElements(document.select("div.page-item-detail"));
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
