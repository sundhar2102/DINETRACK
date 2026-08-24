import 'package:flutter/material.dart';
import '../core/app_theme.dart';

/// Reusable, standardized Status Badge matching the Web application (.status-* badges)
class StatusBadge extends StatelessWidget {
  final String status;
  final String? customLabel;
  final bool isSmall;

  const StatusBadge({
    super.key,
    required this.status,
    this.customLabel,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    final s = status.toUpperCase().trim();
    Color textColor;
    String label = customLabel ?? s;
    IconData? icon;

    switch (s) {
      case 'AVAILABLE':
        textColor = AppTheme.emerald;
        label = customLabel ?? 'Available';
        icon = Icons.check_circle_outline;
        break;

      case 'CONFIRMED':
        textColor = AppTheme.emerald;
        label = customLabel ?? 'Confirmed';
        icon = Icons.check_circle;
        break;

      case 'SEATED':
      case 'CHECKED_IN':
        textColor = AppTheme.blue;
        label = customLabel ?? 'Seated';
        icon = Icons.airline_seat_recline_normal;
        break;

      case 'PENDING':
      case 'PENDING_APPROVAL':
        textColor = AppTheme.amber;
        label = customLabel ?? 'Pending Approval';
        icon = Icons.hourglass_empty;
        break;

      case 'RESERVED':
        textColor = AppTheme.amber;
        label = customLabel ?? 'Reserved';
        icon = Icons.bookmark_border;
        break;

      case 'PREPARING':
      case 'COOKING':
        textColor = AppTheme.brand500;
        label = customLabel ?? 'Preparing Food';
        icon = Icons.outdoor_grill_outlined;
        break;

      case 'READY':
        textColor = AppTheme.emerald;
        label = customLabel ?? 'Food Ready';
        icon = Icons.restaurant;
        break;

      case 'SERVED':
      case 'COMPLETED':
        textColor = AppTheme.blue;
        label = customLabel ?? 'Completed';
        icon = Icons.task_alt;
        break;

      case 'OCCUPIED':
        textColor = AppTheme.red;
        label = customLabel ?? 'Occupied';
        icon = Icons.group;
        break;

      case 'CLEANING':
        textColor = AppTheme.brand500;
        label = customLabel ?? 'Cleaning Table';
        icon = Icons.cleaning_services_outlined;
        break;

      case 'CANCELLED':
        textColor = AppTheme.red;
        label = customLabel ?? 'Cancelled';
        icon = Icons.cancel_outlined;
        break;

      case 'REJECTED':
        textColor = AppTheme.red;
        label = customLabel ?? 'Declined';
        icon = Icons.close;
        break;

      case 'WAITING':
      case 'WAITLIST':
        textColor = AppTheme.purple;
        label = customLabel ?? 'In Waitlist Queue';
        icon = Icons.people_outline;
        break;

      case 'VEG':
        textColor = AppTheme.emerald;
        label = 'VEG';
        icon = Icons.circle;
        break;

      case 'NON-VEG':
        textColor = AppTheme.red;
        label = 'NON-VEG';
        icon = Icons.change_history;
        break;

      default:
        textColor = AppTheme.textSecondary;
        label = customLabel ?? s;
        icon = Icons.info_outline;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 8 : 10,
        vertical: isSmall ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: textColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.35), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: isSmall ? 11 : 13,
            color: textColor,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: isSmall ? 10 : 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
