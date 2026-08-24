import '../utils/json_parser.dart';
import 'menu_category_model.dart';
import 'menu_item_model.dart';

/// Restaurant Data Model mapped strictly from DineTrack SQLite database and REST API
class RestaurantModel {
  final String id;
  final String? ownerId;
  final String name;
  final String? description;
  final String cuisine;
  final String priceRange;
  final double rating;
  final int ratingCount;
  final String? phone;
  final String? email;
  final String? imageUrl;
  final String? coverImageUrl;
  final bool isOpen;
  final bool isVerified;
  final String verificationStatus;
  final String? fssaiLicense;
  final String? openingTime;
  final String? closingTime;
  final String? addressLine1;
  final String? addressLine2;
  final String? city;
  final String? state;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final int? estimatedTravelTimeMinutes;
  final int? availableTablesCount;
  final int? totalTablesCount;
  final int? estimatedWaitTime;
  final String? crowdLevel;
  final List<MenuCategoryModel>? menuCategories;
  final List<MenuItemModel>? menuItems;

  const RestaurantModel({
    required this.id,
    this.ownerId,
    required this.name,
    this.description,
    required this.cuisine,
    required this.priceRange,
    required this.rating,
    required this.ratingCount,
    this.phone,
    this.email,
    this.imageUrl,
    this.coverImageUrl,
    required this.isOpen,
    required this.isVerified,
    required this.verificationStatus,
    this.fssaiLicense,
    this.openingTime,
    this.closingTime,
    this.addressLine1,
    this.addressLine2,
    this.city,
    this.state,
    this.postalCode,
    this.latitude,
    this.longitude,
    this.distanceKm,
    this.estimatedTravelTimeMinutes,
    this.availableTablesCount,
    this.totalTablesCount,
    this.estimatedWaitTime,
    this.crowdLevel,
    this.menuCategories,
    this.menuItems,
  });

  /// Factory constructor to deserialize backend JSON response
  factory RestaurantModel.fromJson(Map<String, dynamic> json) {
    // Parse Menu Categories if present in payload
    List<MenuCategoryModel>? parsedCategories;
    final catData = json['categories'] ?? json['menuCategories'] ?? json['menu'];
    if (catData is List) {
      parsedCategories = catData
          .whereType<Map<String, dynamic>>()
          .map((c) => MenuCategoryModel.fromJson(c))
          .toList();
    }

    // Parse Menu Items if present in payload
    List<MenuItemModel>? parsedItems;
    final itemData = json['menuItems'] ?? json['items'];
    if (itemData is List) {
      parsedItems = itemData
          .whereType<Map<String, dynamic>>()
          .map((i) => MenuItemModel.fromJson(i))
          .toList();
    }

    return RestaurantModel(
      id: json['id']?.toString() ?? '',
      ownerId: json['owner_id']?.toString(),
      name: json['name']?.toString() ?? 'Unnamed Restaurant',
      description: json['description']?.toString(),
      cuisine: json['cuisine']?.toString() ?? 'Multi-Cuisine',
      priceRange: json['price_range']?.toString() ?? '₹₹',
      rating: JsonParser.parseDouble(json['rating'] ?? json['average_rating'], 4.5),
      ratingCount: JsonParser.parseInt(json['rating_count'] ?? json['total_reviews'], 0),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      imageUrl: json['image_url']?.toString(),
      coverImageUrl: json['cover_image_url']?.toString(),
      isOpen: JsonParser.parseBool(json['is_open']),
      isVerified: JsonParser.parseBool(json['is_verified']),
      verificationStatus: json['verification_status']?.toString() ?? 'APPROVED',
      fssaiLicense: json['fssai_license']?.toString(),
      openingTime: json['opening_time']?.toString() ?? '08:00',
      closingTime: json['closing_time']?.toString() ?? '23:00',
      addressLine1: json['address_line1']?.toString() ?? json['location']?['address1']?.toString(),
      addressLine2: json['address_line2']?.toString() ?? json['location']?['address2']?.toString(),
      city: json['city']?.toString() ?? json['location']?['city']?.toString() ?? 'Chennai',
      state: json['state']?.toString() ?? json['location']?['state']?.toString() ?? 'Tamil Nadu',
      postalCode: json['postal_code']?.toString() ?? json['location']?['postal_code']?.toString(),
      latitude: json['latitude'] != null ? JsonParser.parseDouble(json['latitude']) : null,
      longitude: json['longitude'] != null ? JsonParser.parseDouble(json['longitude']) : null,
      distanceKm: json['distanceKm'] != null ? JsonParser.parseDouble(json['distanceKm']) : (json['distance_km'] != null ? JsonParser.parseDouble(json['distance_km']) : null),
      estimatedTravelTimeMinutes: json['estimatedTravelTimeMinutes'] != null ? JsonParser.parseInt(json['estimatedTravelTimeMinutes']) : null,
      availableTablesCount: json['availableTablesCount'] != null ? JsonParser.parseInt(json['availableTablesCount']) : (json['waitInfo']?['availableTablesCount'] != null ? JsonParser.parseInt(json['waitInfo']['availableTablesCount']) : null),
      totalTablesCount: json['totalTablesCount'] != null ? JsonParser.parseInt(json['totalTablesCount']) : (json['waitInfo']?['totalTables'] != null ? JsonParser.parseInt(json['waitInfo']['totalTables']) : null),
      estimatedWaitTime: json['estimatedWaitTime'] != null ? JsonParser.parseInt(json['estimatedWaitTime']) : (json['waitInfo']?['estimatedWaitTime'] != null ? JsonParser.parseInt(json['waitInfo']['estimatedWaitTime']) : null),
      crowdLevel: json['crowd_level']?.toString() ?? json['crowdLevel']?.toString() ?? json['waitInfo']?['crowdLevel']?.toString(),
      menuCategories: parsedCategories,
      menuItems: parsedItems,
    );
  }

  /// Formatted full address helper
  String get fullAddress {
    final parts = [addressLine1, addressLine2, city, state]
        .where((p) => p != null && p.trim().isNotEmpty)
        .toList();
    return parts.isEmpty ? 'Chennai, Tamil Nadu' : parts.join(', ');
  }

  /// Display rating string
  String get formattedRating => rating.toStringAsFixed(1);

  /// Formatted operating hours
  String get formattedHours => '${openingTime ?? "08:00"} - ${closingTime ?? "23:00"}';

  /// Address alias
  String? get address => addressLine1 ?? fullAddress;

  /// Cuisines list helper
  List<String> get cuisines {
    if (cuisine.contains(',')) {
      return cuisine.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    }
    return [cuisine];
  }

  /// Verification & Approval Helpers
  bool get isApproved => verificationStatus.toUpperCase() == 'APPROVED';
  bool get isPending => verificationStatus.toUpperCase() == 'PENDING' || verificationStatus.toUpperCase() == 'PENDING_VERIFICATION';
  bool get isRejected => verificationStatus.toUpperCase() == 'REJECTED';

}

