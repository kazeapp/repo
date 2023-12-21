// ==KazeExtension==
// @name         Kisskh
// @version      v0.0.1
// @author       kaze
// @lang         all
// @license      MIT
// @icon         https://kisskh.co/assets/icons/icon-192x192.png
// @package      kisskh.co
// @type         movies
// @webSite      https://kisskh.co
// ==/KazeExtension==

export default class extends Extension {
    async search(kw) {
      const res = await this.request(`/api/DramaList/Search?q=${kw}&type=0`);
      return res.map((item) => ({
        title: item.title,
        url: item.id.toString(),
        cover: item.thumbnail,
      }));
    }
  
    async latest(page) {
      const res = await this.request(
        `/api/DramaList/List?page=${page}&type=0&sub=0&country=0&status=0&order=1&pageSize=40`
      );
      return res.data.map((item) => ({
        title: item.title,
        url: item.id.toString(),
        cover: item.thumbnail,
      }));
    }
  
    async detail(url) {
      const res = await this.request(`/api/DramaList/Drama/${url}?isq=true`);
      return {
        title: res.title,
        cover: res.thumbnail,
        desc: res.description,
        episodes: [
          {
            title: "Directory",
            urls: res.episodes.reverse().map((item) => ({
              name: `Episode ${item.number}`,
              url: item.id.toString(),
            })),
          },
        ],
      };
    }
  
    async watch(url) {
      const res = await this.request(
        `/api/DramaList/Episode/${url}.png?err=false&ts=&time=`
      );
      const subRes = await this.request(`/api/Sub/${url}`);
      return {
        type: "hls",
        url: res.Video,
        subtitles: subRes.map((item) => ({
          title: item.label,
          url: item.src,
          language: item.land,
        })),
      };
    }
  }
  
