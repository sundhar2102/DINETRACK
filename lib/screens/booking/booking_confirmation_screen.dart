import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../models/reservation_model.dart';
import '../../models/restaurant_model.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../bookings/my_bookings_screen.dart';
import '../home/customer_home_screen.dart';

class BookingConfirmationScreen extends StatelessWidget {
  final ReservationModel reservation;
  final RestaurantModel? restaurant;
  final ApiService? apiService;
  final UserModel? currentUser;

  const BookingConfirmationScreen({
    super.key,
    required this.reservation,
    this.restaurant,
    this.apiService,
    this.currentUser,
  });

  @override
  Widget build(BuildContext context) {
    final restName = reservation.restaurantName ?? restaurant?.name ?? 'Restaurant';
    final restAddr = reservation.restaurantAddress ?? restaurant?.fullAddress ?? 'Chennai, Tamil Nadu';
    final restImage = reservation.restaurantImageUrl ?? restaurant?.imageUrl;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (_) => CustomerHomeScreen(
              currentUser: currentUser,
              apiService: apiService,
            ),
          ),
          (route) => false,
        );
      },
      child: Scaffold(
        backgroundColor: AppTheme.darkBg,
        appBar: AppBar(
          backgroundColor: AppTheme.darkSurface,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: const Text(
            'Booking Confirmed',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white),
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CustomerHomeScreen(
                      currentUser: currentUser,
                      apiService: apiService,
                    ),
                  ),
                  (route) => false,
                );
              },
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 10),

              // Celebration Icon & Badge
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.emerald.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.emerald, width: 2),
                ),
                child: const Icon(Icons.check_circle_rounded, color: AppTheme.emerald, size: 48),
              ),
              const SizedBox(height: 16),

              const Text(
                'Reservation Requested!',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Your table booking has been placed and sent to $restName.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 24),

              // Booking Ticket Container
              Container(
                padding: const EdgeInsets.all(20),
                decoration: AppTheme.cardDecoration(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Restaurant Header
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: restImage != null && restImage.isNotEmpty
                              ? Image.network(
                                  restImage,
                                  width: 56,
                                  height: 56,
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
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                restAddr,
                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: AppTheme.darkBorder),
                    const SizedBox(height: 12),

                    // Booking Reference ID
                    _ticketRow('Booking Reference', '#${reservation.id}', highlight: true),
                    const SizedBox(height: 10),
                    _ticketRow('Date', reservation.formattedDateDisplay),
                    const SizedBox(height: 10),
                    _ticketRow('Time', reservation.formattedTimeDisplay),
                    const SizedBox(height: 10),
                    _ticketRow('Party Size', '${reservation.guestCount} Guests'),
                    const SizedBox(height: 10),
                    _ticketRow(
                      'Table',
                      reservation.tableNumber != null && reservation.tableNumber!.isNotEmpty
                          ? 'Table #${reservation.tableNumber}'
                          : 'Auto-Assigned Table',
                    ),
                    const SizedBox(height: 10),
                    _ticketRow(
                      'Status',
                      reservation.formattedStatus,
                      valueColor: reservation.statusColor,
                    ),

                    if (reservation.specialRequests != null && reservation.specialRequests!.trim().isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _ticketRow('Requests', reservation.specialRequests!.trim()),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Action Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MyBookingsScreen(
                          apiService: apiService,
                          currentUser: currentUser,
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.brand500,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.bookmark_outline_rounded, size: 20),
                  label: const Text('View My Bookings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
              const SizedBox(height: 12),

              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CustomerHomeScreen(
                          currentUser: currentUser,
                          apiService: apiService,
                        ),
                      ),
                      (route) => false,
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppTheme.darkBorder),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.home_outlined, color: Colors.white, size: 20),
                  label: const Text('Back to Home', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _ticketRow(String label, String value, {bool highlight = false, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: TextStyle(
              color: valueColor ?? (highlight ? AppTheme.brand500 : Colors.white),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 56,
      height: 56,
      color: AppTheme.darkInput,
      child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 26),
    );
  }
}
