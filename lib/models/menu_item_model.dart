import '../utils/json_parser.dart';

/// Menu Item Data Model mapped strictly from DineTrack SQLite database and REST API
class MenuItemModel {
  final String id;
  final String restaurantId;
  final String categoryId;
  final String name;
  final String? description;
  final double price;
  final int prepTimeMinutes;
  final bool isVegetarian;
  final bool isVegan;
  final bool isGlutenFree;
  final bool isAvailable;
  final String? imageUrl;
  final String spicinessLevel;

  const MenuItemModel({
    required this.id,
    required this.restaurantId,
    required this.categoryId,
    required this.name,
    this.description,
    required this.price,
    this.prepTimeMinutes = 15,
    this.isVegetarian = false,
    this.isVegan = false,
    this.isGlutenFree = false,
    this.isAvailable = true,
    this.imageUrl,
    this.spicinessLevel = 'MILD',
  });

  /// Factory constructor to deserialize backend JSON response
  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['id']?.toString() ?? '',
      restaurantId: json['restaurant_id']?.toString() ?? json['restaurantId']?.toString() ?? '',
      categoryId: json['category_id']?.toString() ?? json['categoryId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Item',
      description: json['description']?.toString(),
      price: JsonParser.parseDouble(json['price']),
      prepTimeMinutes: JsonParser.parseInt(json['prep_time_minutes'] ?? json['prepTimeMinutes'], 15),
      isVegetarian: JsonParser.parseBool(json['is_vegetarian'] ?? json['isVegetarian']),
      isVegan: JsonParser.parseBool(json['is_vegan'] ?? json['isVegan']),
      isGlutenFree: JsonParser.parseBool(json['is_gluten_free'] ?? json['isGlutenFree']),
      isAvailable: JsonParser.parseBool(json['is_available'] ?? json['isAvailable'], true),
      imageUrl: json['image_url']?.toString() ?? json['imageUrl']?.toString(),
      spicinessLevel: json['spiciness_level']?.toString() ?? json['spicinessLevel']?.toString() ?? 'MILD',
    );
  }

  /// Formatted price with Indian Rupee symbol
  String get formattedPrice {
    if (price == price.roundToDouble()) {
      return '₹${price.toInt()}';
    }
    return '₹${price.toStringAsFixed(2)}';
  }

  /// Formatted preparation time
  String get formattedPrepTime => '$prepTimeMinutes mins';
}
