import 'package:flutter/material.dart';
import '../utils/json_parser.dart';

enum TableStatus {
  available,
  reserved,
  occupied,
  cleaning,
  blocked,
  maintenance,
  unknown;

  static TableStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return TableStatus.available;
      case 'RESERVED':
        return TableStatus.reserved;
      case 'OCCUPIED':
        return TableStatus.occupied;
      case 'CLEANING':
        return TableStatus.cleaning;
      case 'BLOCKED':
        return TableStatus.blocked;
      case 'MAINTENANCE':
      case 'OUT_OF_SERVICE':
        return TableStatus.maintenance;
      default:
        return TableStatus.unknown;
    }
  }

  String get label {
    switch (this) {
      case TableStatus.available:
        return 'Available';
      case TableStatus.reserved:
        return 'Reserved';
      case TableStatus.occupied:
        return 'Occupied';
      case TableStatus.cleaning:
        return 'Cleaning';
      case TableStatus.blocked:
        return 'Blocked';
      case TableStatus.maintenance:
        return 'Maintenance';
      case TableStatus.unknown:
        return 'Unavailable';
    }
  }

  Color get color {
    switch (this) {
      case TableStatus.available:
        return const Color(0xFF10B981); // Emerald
      case TableStatus.reserved:
        return const Color(0xFFF59E0B); // Amber
      case TableStatus.occupied:
        return const Color(0xFFEF4444); // Rose
      case TableStatus.cleaning:
        return const Color(0xFFF97316); // Orange
      case TableStatus.blocked:
        return const Color(0xFFA855F7); // Purple
      case TableStatus.maintenance:
      case TableStatus.unknown:
        return const Color(0xFF6B7280); // Gray
    }
  }
}

class TableModel {
  final String id;
  final String restaurantId;
  final String tableNumber;
  final int capacity;
  final String section;
  final TableStatus status;
  final String? occupiedSince;
  final String? currentReservationId;

  const TableModel({
    required this.id,
    required this.restaurantId,
    required this.tableNumber,
    required this.capacity,
    this.section = 'Main Dining',
    this.status = TableStatus.available,
    this.occupiedSince,
    this.currentReservationId,
  });

  bool get isAvailable => status == TableStatus.available;
  bool get isOccupied => status == TableStatus.occupied;
  bool get isReserved => status == TableStatus.reserved;
  bool get isCleaning => status == TableStatus.cleaning;
  bool get isBlocked => status == TableStatus.blocked;
  bool get isMaintenance => status == TableStatus.maintenance;

  factory TableModel.fromJson(Map<String, dynamic> json) {
    return TableModel(
      id: (json['id'] ?? '').toString(),
      restaurantId: (json['restaurant_id'] ?? json['restaurantId'] ?? '').toString(),
      tableNumber: (json['table_number'] ?? json['tableNumber'] ?? 'T-01').toString(),
      capacity: JsonParser.parseInt(json['capacity'], 2),
      section: (json['section'] ?? 'Main Dining').toString(),
      status: TableStatus.fromString(json['status']?.toString()),
      occupiedSince: json['occupied_since']?.toString(),
      currentReservationId: json['current_reservation_id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'restaurant_id': restaurantId,
      'table_number': tableNumber,
      'capacity': capacity,
      'section': section,
      'status': status.name.toUpperCase(),
      'occupied_since': occupiedSince,
      'current_reservation_id': currentReservationId,
    };
  }
}
