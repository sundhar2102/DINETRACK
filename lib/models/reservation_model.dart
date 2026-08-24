import 'package:flutter/material.dart';

class OrderItemModel {
  final String id;
  final String? orderId;
  final String? menuItemId;
  final String name;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? imageUrl;
  final bool isVegetarian;
  final int prepTimeMinutes;

  const OrderItemModel({
    required this.id,
    this.orderId,
    this.menuItemId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.imageUrl,
    this.isVegetarian = false,
    this.prepTimeMinutes = 15,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final qty = (json['quantity'] is num)
        ? (json['quantity'] as num).toInt()
        : int.tryParse(json['quantity']?.toString() ?? '1') ?? 1;

    final unitP = (json['unit_price'] ?? json['price'] is num)
        ? ((json['unit_price'] ?? json['price']) as num).toDouble()
        : double.tryParse((json['unit_price'] ?? json['price'])?.toString() ?? '0') ?? 0.0;

    final totalP = (json['total_price'] is num)
        ? (json['total_price'] as num).toDouble()
        : (unitP * qty);

    final isVeg = json['is_vegetarian'] == 1 ||
        json['is_vegetarian'] == true ||
        json['is_vegetarian'] == '1' ||
        json['isVegetarian'] == true;

    return OrderItemModel(
      id: (json['id'] ?? '').toString(),
      orderId: json['order_id']?.toString(),
      menuItemId: (json['menu_item_id'] ?? json['menuItemId'])?.toString(),
      name: (json['item_name'] ?? json['name'] ?? 'Dish').toString(),
      quantity: qty,
      unitPrice: unitP,
      totalPrice: totalP,
      imageUrl: (json['item_image'] ?? json['image_url'] ?? json['imageUrl'])?.toString(),
      isVegetarian: isVeg,
      prepTimeMinutes: (json['prep_time_minutes'] is num)
          ? (json['prep_time_minutes'] as num).toInt()
          : 15,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'menu_item_id': menuItemId,
      'item_name': name,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_price': totalPrice,
      'item_image': imageUrl,
      'is_vegetarian': isVegetarian,
      'prep_time_minutes': prepTimeMinutes,
    };
  }
}

class ReservationModel {
  final String id;
  final String restaurantId;
  final String? restaurantName;
  final String? restaurantAddress;
  final String? restaurantCity;
  final String? restaurantImageUrl;
  final String userId;
  final String? userName;
  final String? userPhone;
  final String? userEmail;
  final String? tableId;
  final String? tableNumber;
  final int? tableCapacity;
  final int guestCount;
  final String reservationDate;
  final String reservationTime;
  final String status;
  final String? specialRequests;
  final int estimatedArrivalMinutes;
  final String? createdAt;
  final String? updatedAt;

  // Attached Pre-Order Bill & Payment Fields
  final String? orderId;
  final String? orderStatus;
  final String? orderType;
  final double subtotal;
  final double tax;
  final double totalAmount;
  final List<OrderItemModel> items;
  final String paymentStatus;
  final String? paymentMethod;
  final String? paymentId;
  final String? transactionReference;
  final String? paidAt;

  const ReservationModel({
    required this.id,
    required this.restaurantId,
    this.restaurantName,
    this.restaurantAddress,
    this.restaurantCity,
    this.restaurantImageUrl,
    required this.userId,
    this.userName,
    this.userPhone,
    this.userEmail,
    this.tableId,
    this.tableNumber,
    this.tableCapacity,
    required this.guestCount,
    required this.reservationDate,
    required this.reservationTime,
    this.status = 'PENDING',
    this.specialRequests,
    this.estimatedArrivalMinutes = 15,
    this.createdAt,
    this.updatedAt,
    this.orderId,
    this.orderStatus,
    this.orderType,
    this.subtotal = 0.0,
    this.tax = 0.0,
    this.totalAmount = 0.0,
    this.items = const [],
    this.paymentStatus = 'NOT_PAID',
    this.paymentMethod,
    this.paymentId,
    this.transactionReference,
    this.paidAt,
  });

  bool get isConfirmed => status.toUpperCase() == 'CONFIRMED';
  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isSeated => status.toUpperCase() == 'SEATED' || status.toUpperCase() == 'CHECKED_IN';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isCancelled =>
      status.toUpperCase() == 'CANCELLED' ||
      status.toUpperCase() == 'REJECTED' ||
      status.toUpperCase() == 'NO_SHOW';

  bool get isUpcoming => isPending || isConfirmed || isSeated;
  bool get canBeCancelled => isPending || isConfirmed;

  // Food Order & Payment helpers
  bool get hasOrder => items.isNotEmpty || totalAmount > 0;
  bool get isPaid =>
      paymentStatus.toUpperCase() == 'SUCCESS' ||
      paymentStatus.toUpperCase() == 'PAID';
  bool get isPaymentPending => hasOrder && !isPaid;

  String get formattedPaymentStatus {
    if (!hasOrder) return 'No Payment Required';
    switch (paymentStatus.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Payment Pending';
      case 'FAILED':
        return 'Payment Failed';
      case 'REFUNDED':
        return 'Refunded';
      case 'NOT_PAID':
      default:
        return 'Not Paid';
    }
  }

  Color get paymentStatusColor {
    if (!hasOrder) return const Color(0xFF94A3B8);
    switch (paymentStatus.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return const Color(0xFF10B981); // Emerald
      case 'PENDING':
      case 'NOT_PAID':
        return const Color(0xFFF59E0B); // Amber
      case 'FAILED':
        return const Color(0xFFEF4444); // Red
      case 'REFUNDED':
        return const Color(0xFF3B82F6); // Blue
      default:
        return const Color(0xFF94A3B8);
    }
  }

  String get formattedStatus {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending Approval';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CHECKED_IN':
      case 'SEATED':
        return 'Seated';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REJECTED':
        return 'Declined';
      case 'NO_SHOW':
        return 'No Show';
      default:
        return status;
    }
  }

  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'SEATED':
        return const Color(0xFF10B981); // Emerald
      case 'PENDING':
        return const Color(0xFFF59E0B); // Amber
      case 'COMPLETED':
        return const Color(0xFF3B82F6); // Blue
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF94A3B8);
    }
  }

  String get formattedDateDisplay {
    try {
      final parts = reservationDate.split('-');
      if (parts.length == 3) {
        final year = parts[0];
        final month = int.tryParse(parts[1]) ?? 1;
        final day = parts[2];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '$day ${months[month - 1]} $year';
      }
    } catch (_) {}
    return reservationDate;
  }

  String get formattedTimeDisplay {
    try {
      final parts = reservationTime.split(':');
      if (parts.length >= 2) {
        final hour = int.tryParse(parts[0]) ?? 12;
        final minute = parts[1];
        final isPm = hour >= 12;
        final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        final periodStr = isPm ? 'PM' : 'AM';
        return '$displayHour:$minute $periodStr';
      }
    } catch (_) {}
    return reservationTime;
  }

  String get fullAddress {
    if (restaurantAddress != null && restaurantCity != null) {
      return '$restaurantAddress, $restaurantCity';
    }
    return restaurantAddress ?? restaurantCity ?? 'Chennai, Tamil Nadu';
  }

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    // Parse order items if present
    List<OrderItemModel> parsedItems = [];
    if (json['items'] is List) {
      parsedItems = (json['items'] as List)
          .map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>))
          .toList();
    }

    final subT = (json['subtotal'] is num)
        ? (json['subtotal'] as num).toDouble()
        : double.tryParse(json['subtotal']?.toString() ?? '0') ?? 0.0;

    final tx = (json['tax'] is num)
        ? (json['tax'] as num).toDouble()
        : double.tryParse(json['tax']?.toString() ?? '0') ?? 0.0;

    final tot = (json['total_amount'] ?? json['order_total'] is num)
        ? ((json['total_amount'] ?? json['order_total']) as num).toDouble()
        : double.tryParse((json['total_amount'] ?? json['order_total'])?.toString() ?? '0') ?? 0.0;

    return ReservationModel(
      id: (json['id'] ?? '').toString(),
      restaurantId: (json['restaurant_id'] ?? json['restaurantId'] ?? '').toString(),
      restaurantName: (json['restaurant_name'] ?? json['restaurantName'])?.toString(),
      restaurantAddress: (json['restaurant_address'] ?? json['restaurantAddress'] ?? json['address_line1'])?.toString(),
      restaurantCity: (json['restaurant_city'] ?? json['restaurantCity'] ?? json['city'])?.toString(),
      restaurantImageUrl: (json['restaurant_image_url'] ?? json['restaurantImageUrl'] ?? json['image_url'])?.toString(),
      userId: (json['user_id'] ?? json['userId'] ?? '').toString(),
      userName: (json['user_name'] ?? json['userName'] ?? json['customer_name'] ?? json['guest_name'])?.toString(),
      userPhone: (json['user_phone'] ?? json['userPhone'] ?? json['customer_phone'] ?? json['phone'])?.toString(),
      userEmail: (json['user_email'] ?? json['userEmail'] ?? json['customer_email'] ?? json['email'])?.toString(),
      tableId: json['table_id']?.toString(),
      tableNumber: (json['table_number'] ?? json['tableNumber'])?.toString(),
      tableCapacity: (json['table_capacity'] is num)
          ? (json['table_capacity'] as num).toInt()
          : int.tryParse(json['table_capacity']?.toString() ?? ''),
      guestCount: (json['guest_count'] is num)
          ? (json['guest_count'] as num).toInt()
          : int.tryParse(json['guest_count']?.toString() ?? '2') ?? 2,
      reservationDate: (json['reservation_date'] ?? json['reservationDate'] ?? '').toString(),
      reservationTime: (json['reservation_time'] ?? json['reservationTime'] ?? '').toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      specialRequests: (json['special_requests'] ?? json['specialRequests'])?.toString(),
      estimatedArrivalMinutes: (json['estimated_arrival_minutes'] is num)
          ? (json['estimated_arrival_minutes'] as num).toInt()
          : int.tryParse(json['estimated_arrival_minutes']?.toString() ?? '15') ?? 15,
      createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
      updatedAt: (json['updated_at'] ?? json['updatedAt'])?.toString(),
      orderId: (json['order_id'] ?? json['orderId'])?.toString(),
      orderStatus: (json['order_status'] ?? json['orderStatus'])?.toString(),
      orderType: (json['order_type'] ?? json['orderType'])?.toString(),
      subtotal: subT,
      tax: tx,
      totalAmount: tot,
      items: parsedItems,
      paymentStatus: (json['payment_status'] ?? json['paymentStatus'] ?? 'NOT_PAID').toString(),
      paymentMethod: (json['payment_method'] ?? json['paymentMethod'])?.toString(),
      paymentId: (json['payment_id'] ?? json['paymentId'])?.toString(),
      transactionReference: (json['transaction_reference'] ?? json['transactionReference'])?.toString(),
      paidAt: (json['paid_at'] ?? json['paidAt'])?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'restaurant_id': restaurantId,
      'restaurant_name': restaurantName,
      'restaurant_address': restaurantAddress,
      'restaurant_city': restaurantCity,
      'restaurant_image_url': restaurantImageUrl,
      'user_id': userId,
      'user_name': userName,
      'user_phone': userPhone,
      'user_email': userEmail,
      'table_id': tableId,
      'table_number': tableNumber,
      'table_capacity': tableCapacity,
      'guest_count': guestCount,
      'reservation_date': reservationDate,
      'reservation_time': reservationTime,
      'status': status,
      'special_requests': specialRequests,
      'estimated_arrival_minutes': estimatedArrivalMinutes,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'order_id': orderId,
      'order_status': orderStatus,
      'order_type': orderType,
      'subtotal': subtotal,
      'tax': tax,
      'total_amount': totalAmount,
      'items': items.map((i) => i.toJson()).toList(),
      'payment_status': paymentStatus,
      'payment_method': paymentMethod,
      'payment_id': paymentId,
      'transaction_reference': transactionReference,
      'paid_at': paidAt,
    };
  }

  ReservationModel copyWith({
    String? status,
    String? paymentStatus,
    String? transactionReference,
    String? paidAt,
    String? paymentMethod,
    List<OrderItemModel>? items,
    double? subtotal,
    double? tax,
    double? totalAmount,
  }) {
    return ReservationModel(
      id: id,
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      restaurantAddress: restaurantAddress,
      restaurantCity: restaurantCity,
      restaurantImageUrl: restaurantImageUrl,
      userId: userId,
      userName: userName,
      userPhone: userPhone,
      userEmail: userEmail,
      tableId: tableId,
      tableNumber: tableNumber,
      tableCapacity: tableCapacity,
      guestCount: guestCount,
      reservationDate: reservationDate,
      reservationTime: reservationTime,
      status: status ?? this.status,
      specialRequests: specialRequests,
      estimatedArrivalMinutes: estimatedArrivalMinutes,
      createdAt: createdAt,
      updatedAt: updatedAt,
      orderId: orderId,
      orderStatus: orderStatus,
      orderType: orderType,
      subtotal: subtotal ?? this.subtotal,
      tax: tax ?? this.tax,
      totalAmount: totalAmount ?? this.totalAmount,
      items: items ?? this.items,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentId: paymentId,
      transactionReference: transactionReference ?? this.transactionReference,
      paidAt: paidAt ?? this.paidAt,
    );
  }
}
