// import 'package:kaze/bridge_lib.dart';
// import 'dart:convert';

// class Madara extends KProvider {
//   Madara({required this.extension});

//   KExtension extension;

//   final Client client = Client(extension);

//   @override
//   Future<KPages> getPopular(int page) async {
//     final res = (await client.get(
//             Uri.parse("${extension.baseUrl}/manga/page/$page/?m_orderby=views")))
//         .body;
//     final document = parseHtml(res);
//     return mangaFromElements(document.select("div.page-item-detail"));
//   }

//   KPages mangaFromElements(List<KElement> elements) {
//     List<KAnime> mangaList = [];

//     for (var i = 0; i < elements.length; i++) {
//       final postTitle = elements[i].selectFirst("div.post-title a");
//       final imageElement = elements[i].selectFirst("img");
//       final image = imageElement?.attr("data-src") ??
//           imageElement?.attr("data-lazy-src") ??
//           imageElement?.attr("srcset") ??
//           imageElement?.getSrc ??
//           "";
//       KAnime manga = KAnime();
//       manga.name = postTitle.text;
//       manga.imageUrl = substringBefore(image, " ");
//       manga.link = postTitle.getHref;
//       mangaList.add(manga);
//     }

//     return KPages(mangaList, true);
//   }
// }
