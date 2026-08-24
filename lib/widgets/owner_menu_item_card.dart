import 'package:flutter/material.dart';
import '../core/app_theme.dart';
import '../models/menu_item_model.dart';

/// Interactive Menu Item Card for Restaurant Owner Management
class OwnerMenuItemCard extends StatelessWidget {
  final MenuItemModel item;
  final String? categoryName;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final ValueChanged<bool>? onToggleAvailability;
  final bool isActionLoading;

  const OwnerMenuItemCard({
    super.key,
    required this.item,
    this.categoryName,
    this.onEdit,
    this.onDelete,
    this.onToggleAvailability,
    this.isActionLoading = false,
  });

  Color _getSpiceColor(String level) {
    switch (level.toUpperCase()) {
      case 'EXTRA_HOT':
      case 'SPICY':
        return AppTheme.red;
      case 'MEDIUM':
        return AppTheme.amber;
      case 'MILD':
      default:
        return AppTheme.emerald;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAvailable = item.isAvailable;

    return Container(
      decoration: AppTheme.cardDecoration(
        borderColor: isAvailable ? AppTheme.darkBorder : AppTheme.red.withValues(alpha: 0.4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Food Image & Main Details
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Food Image with Availability Overlay
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 96,
                        height: 96,
                        color: AppTheme.darkInput,
                        child: (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                            ? Image.network(
                                item.imageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const Center(
                                  child: Icon(Icons.restaurant, color: AppTheme.textMuted, size: 36),
                                ),
                                loadingBuilder: (ctx, child, progress) {
                                  if (progress == null) return child;
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
                                },
                              )
                            : const Center(
                                child: Icon(Icons.restaurant, color: AppTheme.textMuted, size: 36),
                              ),
                      ),
                    ),
                    if (!isAvailable)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: RotatedBox(
                              quarterTurns: 0,
                              child: Text(
                                'SOLD OUT',
                                style: TextStyle(
                                  color: AppTheme.red,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 14),

                // 2. Info details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Veg/Non-Veg icon & Item name
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 2, right: 8),
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: item.isVegetarian
                                    ? AppTheme.emerald
                                    : AppTheme.red,
                                width: 1.5,
                              ),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Icon(
                              Icons.circle,
                              size: 8,
                              color: item.isVegetarian
                                  ? AppTheme.emerald
                                  : AppTheme.red,
                            ),
                          ),
                          Expanded(
                            child: Text(
                              item.name,
                              style: TextStyle(
                                color: isAvailable ? Colors.white : AppTheme.textMuted,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                decoration: isAvailable ? null : TextDecoration.lineThrough,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                      // Description
                      if (item.description != null && item.description!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.description!,
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      const SizedBox(height: 8),

                      // Price and Prep Time
                      Row(
                        children: [
                          Text(
                            item.formattedPrice,
                            style: const TextStyle(
                              color: AppTheme.emerald,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Row(
                            children: [
                              const Icon(Icons.timer_outlined, size: 14, color: AppTheme.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                item.formattedPrepTime,
                                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Middle Row: Dietary Badges & Category
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                if (categoryName != null && categoryName!.isNotEmpty)
                  _buildTag(categoryName!, AppTheme.brand500),
                if (item.isVegetarian)
                  _buildTag('VEG', AppTheme.emerald)
                else
                  _buildTag('NON-VEG', AppTheme.red),
                if (item.isVegan)
                  _buildTag('VEGAN', AppTheme.emerald),
                if (item.isGlutenFree)
                  _buildTag('GLUTEN-FREE', AppTheme.amber),
                _buildTag(item.spicinessLevel, _getSpiceColor(item.spicinessLevel)),
              ],
            ),
          ),

          const SizedBox(height: 10),
          const Divider(color: AppTheme.darkBorder, height: 1),

          // Bottom Action Bar: Availability Toggle, Edit, Delete
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
            child: Row(
              children: [
                // Quick Availability Switch Button
                InkWell(
                  onTap: isActionLoading ? null : () => onToggleAvailability?.call(!isAvailable),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isAvailable
                          ? AppTheme.emerald.withValues(alpha: 0.15)
                          : AppTheme.red.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isAvailable
                            ? AppTheme.emerald.withValues(alpha: 0.4)
                            : AppTheme.red.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isAvailable ? Icons.check_circle : Icons.do_not_disturb_on,
                          size: 14,
                          color: isAvailable ? AppTheme.emerald : AppTheme.red,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isAvailable ? 'AVAILABLE' : 'SOLD OUT',
                          style: TextStyle(
                            color: isAvailable ? AppTheme.emerald : AppTheme.red,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const Spacer(),

                // Edit Button
                IconButton(
                  icon: const Icon(Icons.edit_outlined, color: AppTheme.brand500, size: 20),
                  tooltip: 'Edit Menu Item',
                  onPressed: isActionLoading ? null : onEdit,
                ),

                // Delete Button
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppTheme.red, size: 20),
                  tooltip: 'Delete Menu Item',
                  onPressed: isActionLoading ? null : onDelete,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
