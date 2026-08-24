import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/app_theme.dart';
import '../../models/reservation_model.dart';
import '../../services/api_service.dart';

class BookingDetailsScreen extends StatefulWidget {
  final ReservationModel reservation;
  final ApiService? apiService;

  const BookingDetailsScreen({
    super.key,
    required this.reservation,
    this.apiService,
  });

  @override
  State<BookingDetailsScreen> createState() => _BookingDetailsScreenState();
}

class _BookingDetailsScreenState extends State<BookingDetailsScreen> {
  late final ApiService _apiService;
  late ReservationModel _reservation;
  bool _isLoadingDetails = false;
  bool _isCancelling = false;
  bool _isProcessingPayment = false;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? ApiService();
    _reservation = widget.reservation;
    _refreshReservationDetails();
  }

  Future<void> _refreshReservationDetails() async {
    setState(() => _isLoadingDetails = true);
    try {
      final updated = await _apiService.getReservationById(_reservation.id);
      if (mounted) {
        setState(() {
          _reservation = updated;
          _isLoadingDetails = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingDetails = false);
      }
    }
  }

  Future<void> _handleCancelReservation() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.darkBorder),
        ),
        title: const Text(
          'Cancel Reservation?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        content: Text(
          'Are you sure you want to cancel your table reservation at ${_reservation.restaurantName ?? "this restaurant"} for ${_reservation.formattedDateDisplay} at ${_reservation.formattedTimeDisplay}?',
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep Reservation', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Cancel Reservation', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isCancelling = true);

    try {
      final updated = await _apiService.cancelReservation(_reservation.id);
      if (mounted) {
        setState(() {
          _reservation = updated;
          _isCancelling = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reservation successfully cancelled.'),
            backgroundColor: AppTheme.emerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCancelling = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppTheme.red,
          ),
        );
      }
    }
  }

  /// Launch Razorpay Online Payment Checkout Flow
  Future<void> _handlePayOnline() async {
    setState(() => _isProcessingPayment = true);

    try {
      // 1. Authoritative Backend Order Creation
      final paymentOrder = await _apiService.createPaymentOrder(
        reservationId: _reservation.id,
        orderId: _reservation.orderId,
      );

      if (paymentOrder['alreadyPaid'] == true) {
        await _refreshReservationDetails();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('This booking has already been paid.'),
              backgroundColor: AppTheme.emerald,
            ),
          );
        }
        return;
      }

      final amount = (paymentOrder['amount'] as num?)?.toDouble() ?? _reservation.totalAmount;
      final gatewayOrderId = paymentOrder['gatewayOrderId']?.toString() ?? 'order_${DateTime.now().millisecondsSinceEpoch}';
      final keyId = paymentOrder['keyId']?.toString() ?? 'rzp_test_DineTrack';
      final restaurantName = paymentOrder['restaurantName']?.toString() ?? (_reservation.restaurantName ?? 'Restaurant');

      if (!mounted) return;

      // 2. Open Razorpay In-App Payment Gateway Modal
      final paymentResult = await showModalBottomSheet<Map<String, dynamic>>(
        context: context,
        isScrollControlled: true,
        backgroundColor: AppTheme.darkBg,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        builder: (ctx) => _buildPaymentModalSheet(
          amount: amount,
          gatewayOrderId: gatewayOrderId,
          keyId: keyId,
          restaurantName: restaurantName,
        ),
      );

      if (paymentResult != null && paymentResult['success'] == true) {
        // 3. Verify Payment with Backend
        final verification = await _apiService.verifyPayment(
          reservationId: _reservation.id,
          orderId: _reservation.orderId,
          razorpayOrderId: gatewayOrderId,
          razorpayPaymentId: paymentResult['paymentId']?.toString() ?? 'pay_${DateTime.now().millisecondsSinceEpoch}',
          razorpaySignature: paymentResult['signature']?.toString(),
          paymentMethod: paymentResult['paymentMethod']?.toString() ?? 'ONLINE_UPI',
        );

        // 4. Refresh reservation details instantly
        await _refreshReservationDetails();

        if (mounted) {
          _showPaymentSuccessDialog(
            amount: amount,
            txnRef: verification['transactionReference']?.toString() ?? 'TXN_${DateTime.now().millisecondsSinceEpoch}',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppTheme.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessingPayment = false);
      }
    }
  }

  void _showPaymentSuccessDialog({required double amount, required String txnRef}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppTheme.emerald, width: 1.5),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.emerald.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppTheme.emerald, size: 48),
            ),
            const SizedBox(height: 16),
            const Text(
              'Payment Successful!',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 6),
            Text(
              'Paid ₹${amount.toInt()} via Online Payment',
              style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 10),
            Text(
              'Ref ID: $txnRef',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emerald,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('View Updated Booking', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
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
          onPressed: () => Navigator.pop(context, _reservation),
        ),
        title: const Text(
          'Reservation Details',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textSecondary),
            onPressed: _refreshReservationDetails,
          ),
        ],
      ),
      body: Column(
        children: [
          if (_isLoadingDetails)
            const LinearProgressIndicator(
              minHeight: 2,
              backgroundColor: AppTheme.darkSurface,
              color: AppTheme.brand500,
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refreshReservationDetails,
              color: AppTheme.brand500,
              backgroundColor: AppTheme.darkSurface,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Status Banner Card
                    _buildStatusBanner(),
                    const SizedBox(height: 16),

                    // 2. Restaurant Header Card
                    _buildRestaurantHeader(),
                    const SizedBox(height: 16),

                    // 3. Reservation Summary Card (No overflow)
                    _buildReservationCard(),
                    const SizedBox(height: 16),

                    // 4. Special Requests Card (if any)
                    if (_reservation.specialRequests != null && _reservation.specialRequests!.trim().isNotEmpty) ...[
                      _buildSpecialRequestsCard(),
                      const SizedBox(height: 16),
                    ],

                    // 5. Ordered Items Section
                    _buildOrderedItemsCard(),
                    const SizedBox(height: 16),

                    // 6. Bill Summary Card
                    _buildBillSummaryCard(),
                    const SizedBox(height: 16),

                    // 7. Payment Status & Pay Online Card
                    _buildPaymentCard(),
                    const SizedBox(height: 24),

                    // 8. Cancellation CTA
                    if (_reservation.canBeCancelled) ...[
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _isCancelling ? null : _handleCancelReservation,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.red),
                            foregroundColor: AppTheme.red,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: _isCancelling
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(color: AppTheme.red, strokeWidth: 2),
                                )
                              : const Icon(Icons.cancel_outlined, size: 18),
                          label: Text(
                            _isCancelling ? 'Cancelling...' : 'Cancel Reservation',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _reservation.statusColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _reservation.statusColor.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _reservation.statusColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _reservation.isConfirmed
                  ? Icons.check_circle_rounded
                  : _reservation.isPending
                      ? Icons.hourglass_top_rounded
                      : Icons.info_outline_rounded,
              color: _reservation.statusColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _reservation.formattedStatus,
                  style: TextStyle(
                    color: _reservation.statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _reservation.isConfirmed
                      ? 'Your table is confirmed by the restaurant.'
                      : _reservation.isPending
                          ? 'Awaiting restaurant confirmation.'
                          : _reservation.isCancelled
                              ? 'This reservation was cancelled.'
                              : 'Status: ${_reservation.status}',
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRestaurantHeader() {
    final restName = _reservation.restaurantName ?? 'Restaurant';
    final restAddr = _reservation.fullAddress;
    final restImage = _reservation.restaurantImageUrl;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.darkSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: restImage != null && restImage.isNotEmpty
                ? Image.network(
                    restImage,
                    width: 60,
                    height: 60,
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
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReservationCard() {
    // Truncate long UUID display so it never overflows screen
    final shortId = _reservation.id.length > 12
        ? '${_reservation.id.substring(0, 8)}...${_reservation.id.substring(_reservation.id.length - 4)}'
        : _reservation.id;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Booking Reference with Copy Action (Fixed Overflow)
          Row(
            children: [
              const Text(
                'Booking Reference',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              InkWell(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: _reservation.id));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Reservation ID copied to clipboard'),
                      duration: Duration(seconds: 1),
                      backgroundColor: AppTheme.brand500,
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.brand500.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '#$shortId',
                        style: const TextStyle(color: AppTheme.brand500, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.copy_rounded, color: AppTheme.brand500, size: 13),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const Divider(color: AppTheme.darkBorder, height: 20),

          _detailRow(Icons.calendar_month_rounded, 'Date', _reservation.formattedDateDisplay),
          const SizedBox(height: 12),
          _detailRow(Icons.access_time_rounded, 'Time Slot', '${_reservation.formattedTimeDisplay} (${_reservation.reservationTime})'),
          const SizedBox(height: 12),
          _detailRow(Icons.people_rounded, 'Party Size', '${_reservation.guestCount} Guests'),
          const SizedBox(height: 12),
          _detailRow(
            Icons.table_restaurant_rounded,
            'Table',
            _reservation.tableNumber != null && _reservation.tableNumber!.isNotEmpty
                ? 'Table #${_reservation.tableNumber}'
                : 'Auto-Assigned Table',
          ),
          if (_reservation.createdAt != null && _reservation.createdAt!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _detailRow(Icons.schedule_rounded, 'Booked On', _reservation.createdAt!),
          ],
        ],
      ),
    );
  }

  /// 5. Ordered Items Section
  Widget _buildOrderedItemsCard() {
    final hasItems = _reservation.items.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.restaurant_menu_rounded, color: AppTheme.brand500, size: 18),
              const SizedBox(width: 8),
              const Text(
                'Ordered Items',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const Spacer(),
              if (hasItems)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.brand500.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${_reservation.items.length} ${(_reservation.items.length == 1 ? "Dish" : "Dishes")}',
                    style: const TextStyle(color: AppTheme.brand500, fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
            ],
          ),
          const Divider(color: AppTheme.darkBorder, height: 20),

          if (!hasItems)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, size: 16, color: AppTheme.textMuted),
                  SizedBox(width: 8),
                  Text(
                    'No food items pre-ordered for this table.',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _reservation.items.length,
              separatorBuilder: (context, index) => const Divider(color: Color(0xFF1E293B), height: 16),
              itemBuilder: (context, index) {
                final item = _reservation.items[index];
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Veg / Non-Veg Icon
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Icon(
                        item.isVegetarian ? Icons.circle : Icons.change_history,
                        color: item.isVegetarian ? AppTheme.emerald : AppTheme.red,
                        size: 10,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${item.quantity} × ₹${item.unitPrice.toInt()}',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₹${item.totalPrice.toInt()}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  /// 6. Bill Summary Card
  Widget _buildBillSummaryCard() {
    final hasOrder = _reservation.hasOrder;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.receipt_long_rounded, color: AppTheme.emerald, size: 18),
              SizedBox(width: 8),
              Text(
                'Bill Summary',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ],
          ),
          const Divider(color: AppTheme.darkBorder, height: 20),

          if (!hasOrder)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No bill generated (Table booking only).',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
            )
          else ...[
            _billRow('Food Subtotal', '₹${_reservation.subtotal.toInt()}'),
            const SizedBox(height: 8),
            _billRow('GST (5%)', '₹${_reservation.tax.toInt()}'),
            const Divider(color: AppTheme.darkBorder, height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total Amount:',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  '₹${_reservation.totalAmount.toInt()}',
                  style: const TextStyle(
                    color: AppTheme.emerald,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// 7. Payment Status & Pay Online CTA Card
  Widget _buildPaymentCard() {
    final hasOrder = _reservation.hasOrder;
    final isPaid = _reservation.isPaid;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPaid ? AppTheme.emerald.withValues(alpha: 0.4) : AppTheme.darkBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.payment_rounded, color: AppTheme.amber, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Payment Status',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _reservation.paymentStatusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _reservation.paymentStatusColor.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isPaid
                          ? Icons.check_circle_rounded
                          : !hasOrder
                              ? Icons.check_circle_outline
                              : Icons.hourglass_bottom_rounded,
                      size: 12,
                      color: _reservation.paymentStatusColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _reservation.formattedPaymentStatus,
                      style: TextStyle(
                        color: _reservation.paymentStatusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(color: AppTheme.darkBorder, height: 20),

          if (!hasOrder)
            const Text(
              'No payment required. You can order food at the table when you arrive.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            )
          else if (_reservation.isCancelled) ...[
            if (_reservation.paymentStatus == 'REFUND_PENDING') ...[
              _detailRow(Icons.currency_rupee_rounded, 'Refund Amount', '₹${_reservation.totalAmount.toInt()}'),
              const SizedBox(height: 8),
              _detailRow(Icons.hourglass_top_rounded, 'Status', 'Refund Pending'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.amber.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'Your reservation was cancelled. The refund of your pre-order has been queued for reversal.',
                  style: TextStyle(color: AppTheme.amber, fontSize: 11, height: 1.3),
                ),
              ),
            ] else if (_reservation.paymentStatus == 'REFUNDED') ...[
              _detailRow(Icons.currency_rupee_rounded, 'Refunded Amount', '₹${_reservation.totalAmount.toInt()}'),
              const SizedBox(height: 8),
              _detailRow(Icons.check_circle_rounded, 'Status', 'Refunded Successfully'),
              if (_reservation.transactionReference != null) ...[
                const SizedBox(height: 8),
                _detailRow(Icons.tag_rounded, 'Ref #', _reservation.transactionReference!),
              ],
            ] else ...[
              const Text(
                'This reservation and food order have been cancelled. No payment is required.',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
              ),
            ],
          ] else if (isPaid) ...[
            _detailRow(Icons.check_circle_outline_rounded, 'Paid Amount', '₹${_reservation.totalAmount.toInt()}'),
            const SizedBox(height: 8),
            _detailRow(Icons.credit_card_rounded, 'Method', _reservation.paymentMethod ?? 'Online UPI'),
            if (_reservation.transactionReference != null) ...[
              const SizedBox(height: 8),
              _detailRow(Icons.tag_rounded, 'Ref #', _reservation.transactionReference!),
            ],
            if (_reservation.paidAt != null) ...[
              const SizedBox(height: 8),
              _detailRow(Icons.access_time_rounded, 'Paid On', _reservation.paidAt!),
            ],
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Amount Payable:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(
                      '₹${_reservation.totalAmount.toInt()}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: _isProcessingPayment ? null : _handlePayOnline,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.brand500,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  icon: _isProcessingPayment
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.lock_outline_rounded, size: 16),
                  label: Text(
                    _isProcessingPayment ? 'Connecting...' : 'Pay Online',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// Interactive Razorpay Online Payment Bottom Sheet
  Widget _buildPaymentModalSheet({
    required double amount,
    required String gatewayOrderId,
    required String keyId,
    required String restaurantName,
  }) {
    String selectedMethod = 'UPI';

    return StatefulBuilder(
      builder: (context, setSheetState) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.brand500.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.shield_rounded, color: AppTheme.brand500, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Razorpay Secure Checkout',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            Text(
                              'Test Mode Sandbox • $restaurantName',
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(color: AppTheme.darkBorder, height: 24),

                // Amount Summary
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.darkSurface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.darkBorder),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Payable Amount:',
                        style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                      ),
                      Text(
                        '₹${amount.toInt()}',
                        style: const TextStyle(
                          color: AppTheme.emerald,
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                const Text(
                  'Select Payment Method:',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 10),

                // Payment Options
                _paymentMethodTile(
                  title: 'UPI / Google Pay / PhonePe',
                  subtitle: 'Instant payment with 0% fee',
                  icon: Icons.account_balance_wallet_rounded,
                  iconColor: AppTheme.emerald,
                  value: 'UPI',
                  groupValue: selectedMethod,
                  onChanged: (v) => setSheetState(() => selectedMethod = v!),
                ),
                const SizedBox(height: 8),
                _paymentMethodTile(
                  title: 'Credit / Debit Card',
                  subtitle: 'Visa, MasterCard, RuPay',
                  icon: Icons.credit_card_rounded,
                  iconColor: AppTheme.brand500,
                  value: 'CARD',
                  groupValue: selectedMethod,
                  onChanged: (v) => setSheetState(() => selectedMethod = v!),
                ),
                const SizedBox(height: 8),
                _paymentMethodTile(
                  title: 'NetBanking / Wallet',
                  subtitle: 'All major Indian banks supported',
                  icon: Icons.account_balance_rounded,
                  iconColor: AppTheme.amber,
                  value: 'NETBANKING',
                  groupValue: selectedMethod,
                  onChanged: (v) => setSheetState(() => selectedMethod = v!),
                ),
                const SizedBox(height: 20),

                // Pay CTA
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context, {
                        'success': true,
                        'paymentId': 'pay_${DateTime.now().millisecondsSinceEpoch}',
                        'paymentMethod': selectedMethod,
                        'signature': 'test_sig_${DateTime.now().millisecondsSinceEpoch}',
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.emerald,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.lock_rounded, size: 18),
                    label: Text(
                      'Authorize & Pay ₹${amount.toInt()}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Center(
                  child: Text(
                    '🔒 256-bit SSL Encrypted • Powered by Razorpay',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 10),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _paymentMethodTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required String value,
    required String groupValue,
    required ValueChanged<String?> onChanged,
  }) {
    final isSelected = value == groupValue;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.brand500.withValues(alpha: 0.1) : AppTheme.darkSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: isSelected ? AppTheme.brand500 : AppTheme.textMuted,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecialRequestsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.notes_rounded, color: Color(0xFFA855F7), size: 18),
              SizedBox(width: 8),
              Text(
                'Special Requests & Notes',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _reservation.specialRequests ?? '',
            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF64748B), size: 16),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
        const Spacer(),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _billRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 60,
      height: 60,
      color: const Color(0xFF0F172A),
      child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 28),
    );
  }
}
