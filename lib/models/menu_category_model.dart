import '../utils/json_parser.dart';
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
      displayOrder: JsonParser.parseInt(json['display_order'] ?? json['displayOrder'], 0),
      isActive: JsonParser.parseBool(json['is_active'] ?? json['isActive'], true),
      items: parsedItems,
    );
  }
}
