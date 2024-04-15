// ==KazeExtension==
// @name         Animepahe
// @version      1.0.0
// @developer    kaze
// @lang         en
// @icon         https://animepahe.ru/pikacon.ico
// @pkg          animepahe.ru
// @type         anime
// @webSite      https://animepahe.ru
// @baseUrl      https://animepahe.ru
// @nsfw         false
// ==/KazeExtension==

export default class extends Extension {
  async search(kw) {
    const res = await this.request(`/api?m=search&q=${kw}`);
    // console.log(res);
    return res.data.map((item) => ({
      title: item.title,
      url: item.session.toString(),
      cover: item.poster,
    }));
  }

  async latest(page) {
    try {
      const res = await this.request(`/api?m=airing&page=${page}`);
      return res.data.map((item) => ({
        title: item.anime_title,
        url: item.anime_session.toString(),
        cover: item.snapshot,
      }));
    } catch (e) {
      const bangumi = [
        {
          title: "error",
          url: "/",
          cover: null,
        },
      ];
      return bangumi;
    }
  }

  async detail(url) {
    if (url == "/") {
      return {
        title: "Blocked",
        cover: null,
        desc: "Please use webview to enter the website then close the webview window.",
      };
    }
    const res = await this.request("", {
      headers: {
        "Kaze-Url": `https://animepahe.ru/anime/${url}`,
      },
    });
    const title = res.match(/<span>(.+?)<\/span>/)[1];
    const cover = res.match(
      /<a href="(https:\/\/i.animepahe.ru\/posters.+?)"/
    )[1];
    const desc = res.match(/<div class="anime-synopsis">(.+?)<\/div>/)[1];
    const epRes = await this.request(`/api?m=release&id=${url}`);
    // console.log(title[1]);
    const reverse_data = epRes.data.reverse();
    return {
      title: title,
      cover: cover,
      desc: desc,
      episodes: [
        {
          title: "SubsPlease-360p",
          urls: reverse_data.map((item) => ({
            name: `Episode ${item.episode}`,
            url: `${url}/${item.session};0`, //url;quality
          })),
        },
        {
          title: "SubsPlease-720p",
          urls: reverse_data.map((item) => ({
            name: `Episode ${item.episode}`,
            url: `${url}/${item.session};1`,
          })),
        },
        {
          title: "SubsPlease-1080p",
          urls: reverse_data.map((item) => ({
            name: `Episode ${item.episode}`,
            url: `${url}/${item.session};2`,
          })),
        },
      ],
    };
  }

  async watch(url) {
    // console.log(url);
    const url_split = url.split(";");
    const res = await this.request("", {
      headers: {
        "Kaze-Url": `https://animepahe.ru/play/${url_split[0]}`,
      },
    });
    // console.log((/data-src="https:\/\/kwik.cx.+?"/g).exec(res)[parseInt(url_split[1])]);
    // console.log(res.match(/data-src="https:\/\/kwik.cx.+?"/g))
    // const src_match = res.match(/data-src="https:\/\/kwik.cx.+?"/g)[parseInt(url_split[1])]; //480,720,1080 === [0],[1],[2]
    // console.log(src_match);
    console.log(url_split[1]);
    console.log(res.match(/data-src="(https:\/\/kwik\.si.+?)"/g));
    const src = res
      .match(/data-src="(https:\/\/kwik\.si.+?)"/g)
      [parseInt(url_split[1])].match(/data-src="(.+?)"/)[1];
    console.log(src);
    const hid_res = await this.request("", {
      headers: {
        "Kaze-Url": src,
        Referer: "https://animepahe.com",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56",
      },
    });
    const hid_script = hid_res.match(/eval\(f.+?\}\)\)/g)[1];
    const decode_script = eval(hid_script.match(/eval(.+)/)[1]);
    // the obfuscated script look like eval(function(p,a,c,k,e,d){e=function(c){return(c<a?......
    const decode_url = decode_script.match(/source='(.+?)'/)[1];
    return {
      type: "hls",
      url: decode_url,
    };
  }
}
