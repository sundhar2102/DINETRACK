import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import '../models/menu_item_model.dart';

/// Professional card widget for displaying a single menu item with interactive Add/Quantity controls
class MenuItemCard extends StatelessWidget {
  final MenuItemModel item;
  final VoidCallback? onTap;
  final int quantity;
  final VoidCallback? onAdd;
  final VoidCallback? onRemove;

  const MenuItemCard({
    super.key,
    required this.item,
    this.onTap,
    this.quantity = 0,
    this.onAdd,
    this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: AppTheme.cardDecoration(),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column: Details, badges, price, description
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Diet indicator (Veg / Non-Veg) & Badges
                      Row(
                        children: [
                          _buildDietIndicator(item.isVegetarian),
                          const SizedBox(width: 8),
                          if (item.isVegan)
                            _buildMiniTag('VEGAN', AppTheme.emerald),
                          if (item.isGlutenFree)
                            _buildMiniTag('GLUTEN FREE', AppTheme.amber),
                          if (item.spicinessLevel == 'SPICY' || item.spicinessLevel == 'VERY_SPICY')
                            _buildMiniTag('🌶️ SPICY', AppTheme.red),
                        ],
                      ),
                      const SizedBox(height: 6),

                      // Dish Name
                      Text(
                        item.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          letterSpacing: -0.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),

                      // Price & Prep Time
                      Row(
                        children: [
                          Text(
                            item.formattedPrice,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.emerald,
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Icon(
                            Icons.timer_outlined,
                            size: 14,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.formattedPrepTime,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),

                      // Description (if present)
                      if (item.description != null && item.description!.trim().isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          item.description!.trim(),
                          style: const TextStyle(
                            fontSize: 12,
                            height: 1.35,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(width: 12),

                // Right Column: Dish Image & Add / Quantity Button
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: 86,
                            height: 86,
                            color: AppTheme.darkInput,
                            child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                                ? Image.network(
                                    item.imageUrl!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                                    loadingBuilder: (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return const Center(
                                        child: SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.brand500),
                                          ),
                                        ),
                                      );
                                    },
                                  )
                                : _buildPlaceholder(),
                          ),
                        ),

                        if (!item.isAvailable)
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.65),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: const Text(
                                'SOLD OUT',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),

                    // Add Button / Quantity Selector
                    if (item.isAvailable && onAdd != null) ...[
                      const SizedBox(height: 8),
                      if (quantity == 0)
                        ElevatedButton.icon(
                          onPressed: onAdd,
                          icon: const Icon(Icons.add_rounded, size: 14),
                          label: const Text('ADD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.brand500,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            minimumSize: const Size(86, 30),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                        )
                      else
                        Container(
                          width: 86,
                          height: 30,
                          decoration: BoxDecoration(
                            color: AppTheme.darkInput,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.brand500, width: 1.5),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              InkWell(
                                onTap: onRemove,
                                borderRadius: const BorderRadius.horizontal(left: Radius.circular(6)),
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                  child: Icon(Icons.remove_rounded, size: 14, color: Colors.white),
                                ),
                              ),
                              Text(
                                '$quantity',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              InkWell(
                                onTap: onAdd,
                                borderRadius: const BorderRadius.horizontal(right: Radius.circular(6)),
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                  child: Icon(Icons.add_rounded, size: 14, color: AppTheme.brand500),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Diet indicator: Green square with green dot (Veg) or Red square with red triangle/dot (Non-Veg)
  Widget _buildDietIndicator(bool isVeg) {
    final color = isVeg ? AppTheme.emerald : AppTheme.red;
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        border: Border.all(color: color, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
      alignment: Alignment.center,
      child: Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(
          color: color,
          shape: isVeg ? BoxShape.circle : BoxShape.rectangle,
          borderRadius: isVeg ? null : BorderRadius.circular(1),
        ),
      ),
    );
  }

  Widget _buildMiniTag(String label, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return const Icon(
      Icons.restaurant_menu_rounded,
      size: 36,
      color: AppTheme.textMuted,
    );
  }
}
