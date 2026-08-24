import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/app_theme.dart';
import '../../../models/reservation_model.dart';
import '../../../services/owner_api_service.dart';

/// Comprehensive Reservation Details Screen for Restaurant Owners
class OwnerBookingDetailsScreen extends StatefulWidget {
  final ReservationModel reservation;
  final OwnerApiService? apiService;

  const OwnerBookingDetailsScreen({
    super.key,
    required this.reservation,
    this.apiService,
  });

  @override
  State<OwnerBookingDetailsScreen> createState() => _OwnerBookingDetailsScreenState();
}

class _OwnerBookingDetailsScreenState extends State<OwnerBookingDetailsScreen> {
  late final OwnerApiService _apiService;
  late ReservationModel _reservation;

  bool _isUpdating = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    _reservation = widget.reservation;
  }

  Future<void> _handleStatusUpdate(String newStatus, String prompt) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Confirm $newStatus',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          prompt,
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.brand500,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Confirm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isUpdating = true;
      _errorMessage = null;
    });

    try {
      final updated = await _apiService.updateReservationStatus(_reservation.id, newStatus);
      if (mounted) {
        setState(() {
          _reservation = updated;
          _isUpdating = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.emerald,
            content: Text('Reservation status updated to $newStatus'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isUpdating = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final res = _reservation;
    final statusUpper = res.status.toUpperCase();

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context, _reservation),
        ),
        title: const Text(
          'Reservation Details',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                color: res.statusColor.withAlpha(30),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: res.statusColor.withAlpha(100), width: 1.5),
              ),
              child: Row(
                children: [
                  Icon(
                    res.isConfirmed
                        ? Icons.check_circle
                        : (res.isPending ? Icons.pending : Icons.info_outline),
                    color: res.statusColor,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          res.formattedStatus.toUpperCase(),
                          style: TextStyle(
                            color: res.statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Booking Reference: #${res.id}',
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy, size: 18, color: Colors.white70),
                    tooltip: 'Copy Reference ID',
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: res.id));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          backgroundColor: AppTheme.brand500,
                          content: Text('Reservation ID copied to clipboard'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.red.withAlpha(30),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.red),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppTheme.red, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Color(0xFFF87171), fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 20),

            // 2. Customer Information Card
            _buildSectionHeader(Icons.person_outline, 'Customer Information'),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Column(
                children: [
                  _buildDetailRow('Guest Name', res.userName ?? 'Guest Diner'),
                  const Divider(color: AppTheme.darkBorder, height: 16),
                  _buildDetailRow('Contact Phone', res.userPhone ?? 'Not Provided'),
                  const Divider(color: AppTheme.darkBorder, height: 16),
                  _buildDetailRow('Email Address', res.userEmail ?? 'Not Provided'),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // 3. Reservation Details Card
            _buildSectionHeader(Icons.calendar_today_outlined, 'Booking Schedule & Seating'),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Column(
                children: [
                  _buildDetailRow('Date', res.formattedDateDisplay),
                  const Divider(color: AppTheme.darkBorder, height: 16),
                  _buildDetailRow('Time Slot', res.formattedTimeDisplay),
                  const Divider(color: AppTheme.darkBorder, height: 16),
                  _buildDetailRow('Party Size', '${res.guestCount} Guests'),
                  const Divider(color: AppTheme.darkBorder, height: 16),
                  _buildDetailRow(
                    'Assigned Table',
                    res.tableNumber != null ? 'Table #${res.tableNumber} (${res.tableCapacity ?? res.guestCount} Seats)' : 'Auto Allocation',
                  ),
                ],
              ),
            ),

            // 4. Special Requests Card
            if (res.specialRequests != null && res.specialRequests!.trim().isNotEmpty) ...[
              const SizedBox(height: 20),
              _buildSectionHeader(Icons.note_alt_outlined, 'Diner Special Requests'),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: AppTheme.cardDecoration(),
                child: Text(
                  res.specialRequests!,
                  style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14, height: 1.4),
                ),
              ),
            ],

            // 5. Pre-Ordered Food Items (if present)
            if (res.hasOrder) ...[
              const SizedBox(height: 20),
              _buildSectionHeader(Icons.restaurant_menu_rounded, 'Pre-Ordered Food & Kitchen Items'),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: AppTheme.cardDecoration(),
                child: Column(
                  children: [
                    ...res.items.map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Icon(
                                item.isVegetarian ? Icons.circle : Icons.change_history,
                                color: item.isVegetarian ? AppTheme.emerald : AppTheme.red,
                                size: 10,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${item.name} × ${item.quantity}',
                                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ),
                              Text(
                                '₹${item.totalPrice.toInt()}',
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        )),
                    const Divider(color: AppTheme.darkBorder, height: 20),
                    _buildDetailRow('Food Subtotal', '₹${res.subtotal.toInt()}'),
                    const SizedBox(height: 6),
                    _buildDetailRow('GST (5%)', '₹${res.tax.toInt()}'),
                    const Divider(color: AppTheme.darkBorder, height: 20),
                    _buildDetailRow('Bill Total', '₹${res.totalAmount.toInt()}'),
                    const SizedBox(height: 8),
                    _buildDetailRow(
                      'Payment Status',
                      res.isPaid ? 'PAID ✓ (${res.paymentMethod ?? "Online"})' : 'NOT PAID (Pay at counter/online)',
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 32),

            // 6. Actions Footer
            _buildStatusActionButtons(statusUpper),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.brand500, size: 18),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildStatusActionButtons(String status) {
    if (_isUpdating) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.brand500),
      );
    }

    if (status == 'PENDING') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () => _handleStatusUpdate('CONFIRMED', 'Confirm this reservation and allocate the table?'),
              icon: const Icon(Icons.check, color: Colors.white),
              label: const Text('CONFIRM RESERVATION', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emerald,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () => _handleStatusUpdate('REJECTED', 'Decline this reservation request?'),
              icon: const Icon(Icons.close, color: AppTheme.red),
              label: const Text('DECLINE RESERVATION', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.red),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      );
    } else if (status == 'CONFIRMED') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () => _handleStatusUpdate('SEATED', 'Mark customer as arrived and seated at table?'),
              icon: const Icon(Icons.chair, color: Colors.white),
              label: const Text('MARK CUSTOMER AS SEATED', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () => _handleStatusUpdate('CANCELLED', 'Cancel this confirmed reservation?'),
              icon: const Icon(Icons.cancel_outlined, color: AppTheme.textSecondary),
              label: const Text('CANCEL RESERVATION', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.darkBorder),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      );
    } else if (status == 'SEATED') {
      return SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton.icon(
          onPressed: () => _handleStatusUpdate('COMPLETED', 'Mark dining session as completed and release table?'),
          icon: const Icon(Icons.done_all, color: Colors.white),
          label: const Text('COMPLETE DINING SESSION', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.blue,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
