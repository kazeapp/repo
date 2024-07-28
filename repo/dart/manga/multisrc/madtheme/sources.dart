import '../../../../../model/extension.dart';
import 'src/beehentai/beehentai.dart';

const madThemeVersion = "1.0.0";
const madThemeSourceCodeUrl =
    "https://raw.githubusercontent.com/kazeapp/repo/main/repo/dart/manga/multisrc/madtheme/madtheme.dart";

List<Extension> get madThemeExtensionsList => _madThemeExtensionsList;

List<Extension> _madThemeExtensionsList = [
  //BeeHentai (EN)
  beeHentaiExtension,
].map((e) => e
      ..pkgUrl = madThemeSourceCodeUrl
      ..version = madThemeVersion)
    .toList();
