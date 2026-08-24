class JsonParser {
  /// Robustly parse boolean values from JSON, including `1`, `0`, `'true'`, `'false'`, `true`, `false`.
  static bool parseBool(dynamic value, [bool defaultValue = false]) {
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is num) return value == 1;
    final str = value.toString().trim().toLowerCase();
    return str == '1' || str == 'true' || str == 'yes' || str == 'on';
  }

  /// Robustly parse integers
  static int parseInt(dynamic value, [int defaultValue = 0]) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString().trim()) ?? defaultValue;
  }

  /// Robustly parse doubles
  static double parseDouble(dynamic value, [double defaultValue = 0.0]) {
    if (value == null) return defaultValue;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString().trim()) ?? defaultValue;
  }
}
