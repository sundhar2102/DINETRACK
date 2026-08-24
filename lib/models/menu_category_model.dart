import 'menu_item_model.dart';

/// Menu Category Data Model mapped strictly from DineTrack SQLite database and REST API
class MenuCategoryModel {
  final String id;
  final String restaurantId;
  final String name;
  final String? description;
  final int displayOrder;
  final bool isActive;
  final List<MenuItemModel> items;

  const MenuCategoryModel({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    this.displayOrder = 0,
    this.isActive = true,
    this.items = const [],
  });

  /// Factory constructor to deserialize backend JSON response
  factory MenuCategoryModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value, [int defaultValue = 0]) {
      if (value == null) return defaultValue;
      if (value is int) return value;
      if (value is num) return value.toInt();
      return int.tryParse(value.toString()) ?? defaultValue;
    }

    bool parseBool(dynamic value, [bool defaultValue = true]) {
      if (value == null) return defaultValue;
      if (value is bool) return value;
      if (value is num) return value == 1;
      final str = value.toString().toLowerCase();
      return str == '1' || str == 'true';
    }

    List<MenuItemModel> parsedItems = [];
    if (json['items'] is List) {
      parsedItems = (json['items'] as List)
          .whereType<Map<String, dynamic>>()
          .map((itemJson) => MenuItemModel.fromJson(itemJson))
          .toList();
    }

    return MenuCategoryModel(
      id: json['id']?.toString() ?? '',
      restaurantId: json['restaurant_id']?.toString() ?? json['restaurantId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Category',
      description: json['description']?.toString(),
      displayOrder: parseInt(json['display_order'] ?? json['displayOrder'], 0),
      isActive: parseBool(json['is_active'] ?? json['isActive'], true),
      items: parsedItems,
    );
  }
}
