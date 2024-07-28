import '../../../../../model/extension.dart';
import 'src/hiperdex/hiperdex.dart';

const madaraVersion = "0.1.0";
const madaraSourceCodeUrl =
    "https://raw.githubusercontent.com/kazeapp/repo/$branchName/dart/manga/multisrc/madara/madara.dart";

List<Extension> get madaraExtensionsList => _madaraExtensionsList;

List<Extension> _madaraExtensionsList = [
  //Hiperdex (EN)
  hiperdexExtension,
]
    .map((e) => e
      ..pkgUrl = madaraSourceCodeUrl
      ..version = madaraVersion)
    .toList();
