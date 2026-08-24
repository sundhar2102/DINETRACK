import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import '../models/reservation_model.dart';
import 'status_badge.dart';

class BookingCard extends StatelessWidget {
  final ReservationModel reservation;
  final VoidCallback onTap;
  final VoidCallback? onCancel;

  const BookingCard({
    super.key,
    required this.reservation,
    required this.onTap,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final restName = reservation.restaurantName ?? 'Restaurant';
    final restAddr = reservation.fullAddress;
    final restImage = reservation.restaurantImageUrl;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: AppTheme.cardDecoration(),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Restaurant Thumbnail, Name, Address & Status Badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: restImage != null && restImage.isNotEmpty
                        ? Image.network(
                            restImage,
                            width: 52,
                            height: 52,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => _imagePlaceholder(),
                          )
                        : _imagePlaceholder(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          restName,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          restAddr,
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(
                    status: reservation.status,
                    isSmall: true,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: AppTheme.darkBorder, height: 1),
              const SizedBox(height: 12),

              // Booking Metadata Pills
              Row(
                children: [
                  _infoPill(
                    icon: Icons.calendar_month_rounded,
                    text: reservation.formattedDateDisplay,
                  ),
                  const SizedBox(width: 8),
                  _infoPill(
                    icon: Icons.access_time_rounded,
                    text: reservation.formattedTimeDisplay,
                  ),
                  const SizedBox(width: 8),
                  _infoPill(
                    icon: Icons.people_rounded,
                    text: '${reservation.guestCount} Guests',
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Table Assignment & Actions
              Row(
                children: [
                  Icon(
                    Icons.table_restaurant_outlined,
                    size: 14,
                    color: reservation.tableNumber != null ? AppTheme.emerald : AppTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    reservation.tableNumber != null && reservation.tableNumber!.isNotEmpty
                        ? 'Table #${reservation.tableNumber}'
                        : 'Auto-Assigned Table',
                    style: TextStyle(
                      color: reservation.tableNumber != null ? AppTheme.emerald : AppTheme.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),

                  if (reservation.canBeCancelled && onCancel != null) ...[
                    TextButton(
                      onPressed: onCancel,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: AppTheme.red,
                      ),
                      child: const Text('Cancel', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 6),
                  ],

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.darkInput,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.darkBorder),
                    ),
                    child: const Row(
                      children: [
                        Text('Details', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        SizedBox(width: 2),
                        Icon(Icons.chevron_right_rounded, color: Colors.white, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoPill({required IconData icon, required String text}) {
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
          Icon(icon, size: 12, color: AppTheme.brand500),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 52,
      height: 52,
      color: AppTheme.darkInput,
      child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 24),
    );
  }
}
