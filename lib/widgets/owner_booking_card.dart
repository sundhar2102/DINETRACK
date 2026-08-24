import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import '../models/reservation_model.dart';
import 'status_badge.dart';

/// Reusable Card Widget for displaying Reservations in the Owner Portal
class OwnerBookingCard extends StatelessWidget {
  final ReservationModel reservation;
  final VoidCallback? onTap;
  final Function(String newStatus)? onStatusChanged;
  final bool isUpdating;

  const OwnerBookingCard({
    super.key,
    required this.reservation,
    this.onTap,
    this.onStatusChanged,
    this.isUpdating = false,
  });

  @override
  Widget build(BuildContext context) {
    final statusUpper = reservation.status.toUpperCase();

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: AppTheme.cardDecoration(
          borderColor: reservation.isPending
              ? AppTheme.amber.withValues(alpha: 0.5)
              : AppTheme.darkBorder,
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Header: Customer Name & Status Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reservation.userName ?? 'Guest Diner',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (reservation.userPhone != null && reservation.userPhone!.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 2.0),
                              child: Text(
                                reservation.userPhone!,
                                style: const TextStyle(
                                  color: AppTheme.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    StatusBadge(
                      status: reservation.status,
                      isSmall: true,
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // 2. Metadata Pills (Date, Time, Guests, Table)
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _buildPill(
                      Icons.calendar_today,
                      reservation.formattedDateDisplay,
                      AppTheme.brand500,
                    ),
                    _buildPill(
                      Icons.access_time,
                      reservation.formattedTimeDisplay,
                      AppTheme.blue,
                    ),
                    _buildPill(
                      Icons.people_outline,
                      '${reservation.guestCount} Guests',
                      AppTheme.emerald,
                    ),
                    _buildPill(
                      Icons.table_restaurant,
                      reservation.tableNumber != null ? 'Table #${reservation.tableNumber}' : 'Auto Table',
                      AppTheme.amber,
                    ),
                  ],
                ),

                // 3. Special Requests / Notes if present
                if (reservation.specialRequests != null && reservation.specialRequests!.trim().isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.darkInput,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.darkBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.comment_outlined, size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            reservation.specialRequests!,
                            style: const TextStyle(
                              color: Color(0xFFCBD5E1),
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // 4. Quick Action Buttons based on valid status transitions
                if (onStatusChanged != null && _hasAvailableActions(statusUpper)) ...[
                  const SizedBox(height: 12),
                  const Divider(color: AppTheme.darkBorder, height: 1),
                  const SizedBox(height: 10),
                  _buildActionButtons(context, statusUpper),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool _hasAvailableActions(String status) {
    return status == 'PENDING' || status == 'CONFIRMED' || status == 'SEATED';
  }

  Widget _buildPill(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.darkInput,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, String status) {
    if (isUpdating) {
      return const Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppTheme.brand500,
          ),
        ),
      );
    }

    if (status == 'PENDING') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _confirmAction(context, 'REJECTED', 'Decline this reservation?'),
              icon: const Icon(Icons.close, size: 16, color: AppTheme.red),
              label: const Text('Decline', style: TextStyle(color: AppTheme.red, fontSize: 13)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.red),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _confirmAction(context, 'CONFIRMED', 'Confirm this table booking?'),
              icon: const Icon(Icons.check, size: 16, color: Colors.white),
              label: const Text('Confirm', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emerald,
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      );
    } else if (status == 'CONFIRMED') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _confirmAction(context, 'CANCELLED', 'Cancel this confirmed booking?'),
              icon: const Icon(Icons.cancel_outlined, size: 16, color: AppTheme.textSecondary),
              label: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.darkBorder),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _confirmAction(context, 'SEATED', 'Mark customer as Seated?'),
              icon: const Icon(Icons.chair, size: 16, color: Colors.white),
              label: const Text('Mark Seated', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      );
    } else if (status == 'SEATED') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () => _confirmAction(context, 'COMPLETED', 'Mark dining session as Completed?'),
          icon: const Icon(Icons.done_all, size: 16, color: Colors.white),
          label: const Text('Complete Dining Session', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.blue,
            padding: const EdgeInsets.symmetric(vertical: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Future<void> _confirmAction(BuildContext context, String newStatus, String prompt) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Update Status: $newStatus',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: Text(
          prompt,
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Back', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.brand500,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Proceed', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && onStatusChanged != null) {
      onStatusChanged!(newStatus);
    }
  }
}
