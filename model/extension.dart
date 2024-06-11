class Extension {
  int? id;

  String? name;

  String? baseUrl;

  String? lang;

  String? author;

  bool? isNsfw;

  String? pkgUrl;

  String? sourceType;

  String? iconUrl;

  bool? hasCloudflare;

  String? dateFormat;

  String? dateFormatLocale;

  String? apiUrl;

  String? version;

  int? extensionType;

  bool? isFullData;

  String? appMinVerReq;

  String? additionalParams;

  int? extensionCodeLanguage;

  bool? isActive;

  bool? isObsolete;

  Extension({
    this.id = null,
    this.name = "",
    this.baseUrl = "",
    this.lang = "",
    this.author = "",
    this.sourceType = "",
    this.iconUrl = "",
    this.dateFormat = "",
    this.dateFormatLocale = "",
    this.isNsfw = false,
    this.hasCloudflare = false,
    this.pkgUrl = "",
    this.apiUrl = "",
    this.version = "",
    this.extensionType = 0,
    this.isFullData = false,
    this.appMinVerReq = "0.1.0",
    this.additionalParams = "",
    this.extensionCodeLanguage = 0,
    this.isActive = true,
    this.isObsolete = false,
  });

  Extension.fromJson(Map<String, dynamic> json) {
    final extensionCodeLang = json['extensionCodeLanguage'] ?? 0;
    apiUrl = json['apiUrl'] ?? "";
    author = json["author"] ?? "";
    appMinVerReq = json['appMinVerReq'] ?? appMinVerReq;
    baseUrl = json['baseUrl'];
    dateFormat = json['dateFormat'] ?? "";
    dateFormatLocale = json['dateFormatLocale'] ?? "";
    hasCloudflare = json['hasCloudflare'] ?? false;
    iconUrl = json['iconUrl'] ?? "";
    id = (json['id'] ?? extensionCodeLang == 0
            ? 'kaze-"${json['lang'] ?? ""}"."${json['name'] ?? ""}"'
            : 'kaze-js-"${json['lang'] ?? ""}"."${json['name'] ?? ""}"')
        .hashCode;
    isFullData = json['isFullData'] ?? false;
    extensionType = json['extensionType'] ?? 0;
    isNsfw = json['isNsfw'] ?? false;
    lang = json['lang'] ?? "";
    name = json['name'] ?? "";
    pkgUrl = json['pkgUrl'] ?? "";
    sourceType = json['sourceType'] ?? "";
    version = json['version'] ?? "";
    additionalParams = json['additionalParams'] ?? "";
    extensionCodeLanguage = extensionCodeLang;
    isActive = json['isActive'];
    isObsolete = json['isObsolete'];
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'id': id ?? 'kaze-$lang.$name'.hashCode,
      'baseUrl': baseUrl,
      "lang": lang,
      "author": author,
      "sourceType": sourceType,
      "iconUrl": iconUrl,
      "dateFormat": dateFormat,
      "dateFormatLocale": dateFormatLocale,
      "isNsfw": isNsfw,
      "hasCloudflare": hasCloudflare,
      "pkgUrl": pkgUrl,
      "apiUrl": apiUrl,
      "version": version,
      "extensionType": extensionType,
      "isFullData": isFullData,
      "appMinVerReq": appMinVerReq,
      "additionalParams": additionalParams,
      "extensionCodeLanguage": extensionCodeLanguage,
      "isActive": isActive,
      "isObsolete": isObsolete,
    };
  }
}

const branchName = "main";
