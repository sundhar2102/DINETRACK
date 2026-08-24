/// User Data Model mapped from existing DineTrack Authentication API
class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? avatarUrl;
  final String? restaurantId;
  final String? restaurantName;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.avatarUrl,
    this.restaurantId,
    this.restaurantName,
  });

  /// True if user is a diner customer
  bool get isCustomer => role.toUpperCase() == 'CUSTOMER';

  /// True if user is restaurant owner
  bool get isOwner => role.toUpperCase() == 'OWNER' || role.toUpperCase() == 'RESTAURANT_OWNER';

  /// True if user is restaurant staff
  bool get isStaff => role.toUpperCase() == 'STAFF';

  /// True if user is admin
  bool get isAdmin => role.toUpperCase() == 'ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? restId = json['restaurant_id']?.toString();
    String? restName = json['restaurant_name']?.toString();
    if (json['restaurant'] is Map) {
      final restMap = json['restaurant'] as Map;
      restId ??= restMap['id']?.toString();
      restName ??= restMap['name']?.toString();
    }

    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Diner',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'CUSTOMER',
      avatarUrl: json['avatar_url']?.toString(),
      restaurantId: restId,
      restaurantName: restName,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'avatar_url': avatarUrl,
      'restaurant_id': restaurantId,
      'restaurant_name': restaurantName,
      if (restaurantId != null)
        'restaurant': {
          'id': restaurantId,
          'name': restaurantName,
        },
    };
  }
}

