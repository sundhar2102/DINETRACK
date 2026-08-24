import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../models/reservation_model.dart';
import '../../models/restaurant_model.dart';
import '../../models/table_model.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import 'booking_confirmation_screen.dart';

class ReservationReviewScreen extends StatefulWidget {
  final RestaurantModel restaurant;
  final int adultsCount;
  final int childrenCount;
  final DateTime selectedDate;
  final String selectedTimeSlot;
  final String allocationMode;
  final TableModel? selectedTable;
  final List<String> selectedPresets;
  final String customRequest;
  final List<Map<String, dynamic>> preOrderItems;
  final int estimatedWaitMinutes;
  final ApiService? apiService;
  final AuthService? authService;
  final UserModel? currentUser;

  const ReservationReviewScreen({
    super.key,
    required this.restaurant,
    required this.adultsCount,
    required this.childrenCount,
    required this.selectedDate,
    required this.selectedTimeSlot,
    required this.allocationMode,
    this.selectedTable,
    this.selectedPresets = const [],
    this.customRequest = '',
    this.preOrderItems = const [],
    this.estimatedWaitMinutes = 0,
    this.apiService,
    this.authService,
    this.currentUser,
  });

  @override
  State<ReservationReviewScreen> createState() => _ReservationReviewScreenState();
}

class _ReservationReviewScreenState extends State<ReservationReviewScreen> {
  late final ApiService _apiService;
  late final AuthService _authService;
  bool _isSubmitting = false;

  int get _totalGuests => widget.adultsCount + widget.childrenCount;

  double get _foodSubtotal => widget.preOrderItems.fold(
        0.0,
        (sum, item) => sum + ((item['price'] as num? ?? 0).toDouble() * (item['quantity'] as num? ?? 1).toInt()),
      );
  double get _foodTax => _foodSubtotal * 0.05;
  double get _foodTotal => _foodSubtotal + _foodTax;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? ApiService();
    _authService = widget.authService ?? AuthService();
  }

  String _formatDateYMD(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  String _formatDateDisplay(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return '${days[dt.weekday - 1]}, ${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  String _formatTimeDisplay(String timeSlot) {
    final parts = timeSlot.split(':');
    if (parts.length >= 2) {
      final hour = int.tryParse(parts[0]) ?? 12;
      final min = parts[1];
      final isPm = hour >= 12;
      final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      return '$displayHour:$min ${isPm ? "PM" : "AM"}';
    }
    return timeSlot;
  }

  Future<void> _handleConfirmReservation() async {
    if (_isSubmitting) return;

    final user = widget.currentUser ?? _authService.currentUser;
    if (user == null && !_authService.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to confirm your table booking.'),
          backgroundColor: AppTheme.red,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final combinedNotes = [
      ...widget.selectedPresets,
      if (widget.customRequest.trim().isNotEmpty) widget.customRequest.trim(),
    ].join(' • ');

    try {
      final ReservationModel reservation = await _apiService.createReservation(
        restaurantId: widget.restaurant.id,
        guestCount: _totalGuests,
        reservationDate: _formatDateYMD(widget.selectedDate),
        reservationTime: widget.selectedTimeSlot,
        tableId: widget.allocationMode == 'manual' ? widget.selectedTable?.id : null,
        specialRequests: combinedNotes.isNotEmpty ? combinedNotes : null,
        preOrderItems: widget.preOrderItems.isNotEmpty ? widget.preOrderItems : null,
      );

      if (mounted) {
        setState(() => _isSubmitting = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookingConfirmationScreen(
              reservation: reservation,
              restaurant: widget.restaurant,
              apiService: _apiService,
              currentUser: user,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        final errText = e.toString().replaceAll('Exception: ', '');
        final isConflict = errText.toLowerCase().contains('conflict') ||
            errText.toLowerCase().contains('already booked') ||
            errText.toLowerCase().contains('no longer available');

        if (isConflict) {
          _showConflictDialog();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errText),
              backgroundColor: AppTheme.red,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    }
  }

  void _showConflictDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.red),
        ),
        title: const Row(
          children: [
            Icon(Icons.event_busy_rounded, color: AppTheme.red, size: 26),
            SizedBox(width: 10),
            Text(
              'Slot Unavailable',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17),
            ),
          ],
        ),
        content: const Text(
          'The selected table or time slot is no longer available. Please return and pick another available slot or table.',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.4),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.brand500,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Change Slot / Table', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Review Reservation',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Restaurant Header Card
            _buildRestaurantHeader(),
            const SizedBox(height: 16),

            // Booking Details Summary Card
            _buildBookingDetailsCard(),
            const SizedBox(height: 16),

            // Food Pre-Order Card (if items selected)
            if (widget.preOrderItems.isNotEmpty) ...[
              _buildFoodPreOrderSummaryCard(),
              const SizedBox(height: 16),
            ],

            // Special Requests Card (if any)
            _buildSpecialRequestsCard(),
            const SizedBox(height: 16),

            // Guarantee & Safety Badge
            _buildGuaranteeBadge(),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomActionBar(),
    );
  }

  Widget _buildRestaurantHeader() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: widget.restaurant.imageUrl != null && widget.restaurant.imageUrl!.isNotEmpty
                ? Image.network(
                    widget.restaurant.imageUrl!,
                    width: 68,
                    height: 68,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => _imagePlaceholder(),
                  )
                : _imagePlaceholder(),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.restaurant.name,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  widget.restaurant.cuisine,
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  widget.restaurant.fullAddress,
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 68,
      height: 68,
      color: AppTheme.darkInput,
      child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 30),
    );
  }

  Widget _buildBookingDetailsCard() {
    final hasTable = widget.allocationMode == 'manual' && widget.selectedTable != null;
    final tableDesc = hasTable
        ? 'Table #${widget.selectedTable!.tableNumber} (${widget.selectedTable!.section})'
        : 'Auto-Assigned Best Table';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.calendar_month_rounded, color: AppTheme.brand500, size: 18),
              SizedBox(width: 8),
              Text(
                'Reservation Details',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _detailRow(
            icon: Icons.event,
            label: 'Date',
            value: _formatDateDisplay(widget.selectedDate),
          ),
          const Divider(color: AppTheme.darkBorder, height: 18),
          _detailRow(
            icon: Icons.access_time_rounded,
            label: 'Time Slot',
            value: '${_formatTimeDisplay(widget.selectedTimeSlot)} (${widget.selectedTimeSlot})',
          ),
          const Divider(color: AppTheme.darkBorder, height: 18),
          _detailRow(
            icon: Icons.people_rounded,
            label: 'Party Size',
            value: '$_totalGuests Guests (${widget.adultsCount} Adults, ${widget.childrenCount} Children)',
          ),
          const Divider(color: AppTheme.darkBorder, height: 18),
          _detailRow(
            icon: Icons.table_restaurant_rounded,
            label: 'Table Arrangement',
            value: tableDesc,
            highlightValue: true,
          ),
          if (widget.estimatedWaitMinutes > 0) ...[
            const Divider(color: AppTheme.darkBorder, height: 18),
            _detailRow(
              icon: Icons.hourglass_top_rounded,
              label: 'Estimated Wait',
              value: '~${widget.estimatedWaitMinutes} mins',
              highlightValue: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFoodPreOrderSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.restaurant_menu_rounded, color: AppTheme.emerald, size: 18),
              SizedBox(width: 8),
              Text(
                'Pre-Ordered Food Items',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...widget.preOrderItems.map((item) {
            final name = item['name']?.toString() ?? 'Item';
            final qty = (item['quantity'] as num? ?? 1).toInt();
            final price = (item['price'] as num? ?? 0).toDouble();
            final total = price * qty;

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Text(
                    '${qty}x',
                    style: const TextStyle(color: AppTheme.brand500, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      name,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    '₹${total.toInt()}',
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            );
          }),
          const Divider(color: AppTheme.darkBorder, height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Dishes Subtotal:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              Text('₹${_foodSubtotal.toInt()}', style: const TextStyle(color: Colors.white, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('GST (5%):', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              Text('₹${_foodTax.toStringAsFixed(1)}', style: const TextStyle(color: Colors.white, fontSize: 12)),
            ],
          ),
          const Divider(color: AppTheme.darkBorder, height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Pre-Order Total to Pay at Restaurant:',
                style: TextStyle(color: AppTheme.emerald, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              Text(
                '₹${_foodTotal.toInt()}',
                style: const TextStyle(color: AppTheme.emerald, fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _detailRow({
    required IconData icon,
    required String label,
    required String value,
    bool highlightValue = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppTheme.textMuted, size: 16),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
        ),
        const Spacer(),
        Flexible(
          flex: 2,
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: TextStyle(
              color: highlightValue ? AppTheme.emerald : Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSpecialRequestsCard() {
    final hasPresets = widget.selectedPresets.isNotEmpty;
    final hasCustom = widget.customRequest.trim().isNotEmpty;

    if (!hasPresets && !hasCustom) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: AppTheme.cardDecoration(),
        child: const Row(
          children: [
            Icon(Icons.notes_rounded, color: AppTheme.textMuted, size: 18),
            SizedBox(width: 8),
            Text(
              'No special requests added',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.card_giftcard_rounded, color: AppTheme.purple, size: 18),
              SizedBox(width: 8),
              Text(
                'Occasion & Special Requests',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (hasPresets)
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: widget.selectedPresets.map((preset) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.purple.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.purple.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    preset,
                    style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                );
              }).toList(),
            ),
          if (hasCustom) ...[
            if (hasPresets) const SizedBox(height: 10),
            Text(
              '"${widget.customRequest.trim()}"',
              style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, fontStyle: FontStyle.italic),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGuaranteeBadge() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.emerald.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.25)),
      ),
      child: const Row(
        children: [
          Icon(Icons.verified_user_rounded, color: AppTheme.emerald, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Zero Booking Fees • Free cancellation up to 1 hour before dining time.',
              style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, height: 1.3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: AppTheme.darkSurface,
        border: Border(top: BorderSide(color: AppTheme.darkBorder)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_totalGuests Guests • ${_formatTimeDisplay(widget.selectedTimeSlot)}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    widget.preOrderItems.isNotEmpty
                        ? 'Food Total: ₹${_foodTotal.toInt()} (Pay at Table)'
                        : 'Instant Table Confirmation',
                    style: const TextStyle(color: AppTheme.emerald, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleConfirmReservation,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                disabledBackgroundColor: AppTheme.darkBorderSubtle,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle_rounded, size: 18),
                        SizedBox(width: 6),
                        Text('Confirm Reservation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
