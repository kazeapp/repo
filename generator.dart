import 'dart:convert';
import 'dart:io';
import 'model/extension.dart';

void main() {
  final jsExtensions = _searchJsExtensions(Directory("repo/javascript"));
  final animeJson = genAnime(
      jsExtensions.where((element) => element.extensionType == 0).toList());
  final mangaJson = genManga(
      jsExtensions.where((element) => element.extensionType == 1).toList());
  final movieJson = genMovie(
      jsExtensions.where((element) => element.extensionType == 2).toList());

  List<Map<String, dynamic>> extensionsList = [
    ...animeJson,
    ...mangaJson,
    ...movieJson
  ];
  // final jsonString =
  //     jsonEncode({"anime": animeJson, "manga": mangaJson, "movie": movieJson});

  final jsonString = jsonEncode(extensionsList);
  final file = File('index.json');
  file.writeAsStringSync(jsonString);
}

List<Map<String, dynamic>> genAnime(List<Extension> jsAnimesourceList) {
  List<Extension> animeSources = [];
  // animeSources.addAll(dartAnimesourceList);
  animeSources.addAll(jsAnimesourceList);
  final List<Map<String, dynamic>> jsonList =
      animeSources.map((source) => source.toJson()).toList();
  // final jsonString = jsonEncode(jsonList);

  // final file = File('anime_index.json');
  // file.writeAsStringSync(jsonString);
  // log('JSON file created: ${file.path}');
  return jsonList;
}

List<Map<String, dynamic>> genManga(List<Extension> jsMangasourceList) {
  List<Extension> mangaSources = [];
  // mangaSources.addAll(dartMangaExtensionList);
  mangaSources.addAll(jsMangasourceList);
  final List<Map<String, dynamic>> jsonList =
      mangaSources.map((source) => source.toJson()).toList();
      
  // final jsonString = jsonEncode(jsonList);
  return jsonList;
}

List<Map<String, dynamic>> genMovie(List<Extension> jsMoviesourceList) {
  List<Extension> movieSources = [];
  // movieSources.addAll(dartMoviesourceList);
  movieSources.addAll(jsMoviesourceList);
  final List<Map<String, dynamic>> jsonList =
      movieSources.map((source) => source.toJson()).toList();
  // final jsonString = jsonEncode(jsonList);
  return jsonList;
}

List<Extension> _searchJsExtensions(Directory dir) {
  List<Extension> extensionList = [];
  List<FileSystemEntity> entities = dir.listSync();
  for (FileSystemEntity entity in entities) {
    if (entity is Directory) {
      List<FileSystemEntity> entities = entity.listSync();
      for (FileSystemEntity entity in entities) {
        if (entity is Directory) {
          extensionList.addAll(_searchJsExtensions(entity));
        } else if (entity is File && entity.path.endsWith('.js')) {
          final RegExp regex = RegExp(
              r'const\s+extensionMetaInfo\s*=\s*(\[.*?\]);',
              dotAll: true);
          final defaultSource = Extension();
          Match? match = regex.firstMatch(entity.readAsStringSync());
          if (match != null) {
            // log('Match: ${jsonDecode(match.group(1)!)}');
            extensionList.addAll((jsonDecode(match.group(1)!) as List)
                .map((e) => Extension.fromJson(e)
                  ..extensionCodeLanguage = 1
                  ..appMinVerReq = defaultSource.appMinVerReq
                  ..pkgUrl =
                      "https://raw.githubusercontent.com/kazeapp/repo/$branchName/repo/javascript/${e["pkgPath"] ?? e["pkgName"]}")
                .toList());
          }
        }
      }
    }
  }
  return extensionList;
}
