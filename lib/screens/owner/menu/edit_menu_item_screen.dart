import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import '../../../models/menu_item_model.dart';
import '../../../services/owner_api_service.dart';

/// Form Screen to Edit Existing Menu Item Properties
class EditMenuItemScreen extends StatefulWidget {
  final MenuItemModel item;
  final OwnerApiService? apiService;

  const EditMenuItemScreen({
    super.key,
    required this.item,
    this.apiService,
  });

  @override
  State<EditMenuItemScreen> createState() => _EditMenuItemScreenState();
}

class _EditMenuItemScreenState extends State<EditMenuItemScreen> {
  final _formKey = GlobalKey<FormState>();
  late final OwnerApiService _apiService;

  late final TextEditingController _nameController;
  late final TextEditingController _descController;
  late final TextEditingController _priceController;
  late final TextEditingController _prepTimeController;
  late final TextEditingController _imageUrlController;

  late bool _isVegetarian;
  late bool _isVegan;
  late bool _isGlutenFree;
  late String _spicinessLevel;

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    final item = widget.item;
    _nameController = TextEditingController(text: item.name);
    _descController = TextEditingController(text: item.description ?? '');
    _priceController = TextEditingController(
      text: item.price == item.price.roundToDouble()
          ? item.price.toInt().toString()
          : item.price.toString(),
    );
    _prepTimeController = TextEditingController(text: item.prepTimeMinutes.toString());
    _imageUrlController = TextEditingController(text: item.imageUrl ?? '');
    _isVegetarian = item.isVegetarian;
    _isVegan = item.isVegan;
    _isGlutenFree = item.isGlutenFree;
    _spicinessLevel = item.spicinessLevel.toUpperCase();
    if (!['NONE', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'].contains(_spicinessLevel)) {
      _spicinessLevel = 'MILD';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _prepTimeController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _submitUpdates() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isSubmitting) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final price = double.parse(_priceController.text.trim());
      final prepTime = int.tryParse(_prepTimeController.text.trim()) ?? 15;

      final updated = await _apiService.updateMenuItem(
        widget.item.id,
        name: _nameController.text.trim(),
        description: _descController.text.trim(),
        price: price,
        prepTimeMinutes: prepTime,
        isVegetarian: _isVegetarian,
        isVegan: _isVegan,
        isGlutenFree: _isGlutenFree,
        imageUrl: _imageUrlController.text.trim(),
        spicinessLevel: _spicinessLevel,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.emerald,
            content: Text('✅ Updated "${updated.name}" successfully!'),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Edit "${widget.item.name}"',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_errorMessage != null) ...[
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
                const SizedBox(height: 16),
              ],

              // 1. Dish Name
              const Text(
                'Dish / Item Name *',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Dish name', icon: Icons.restaurant_menu),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Dish name is required';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // 2. Price & Prep Time
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Price (\$)*',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _priceController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration('Price', icon: Icons.attach_money),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return 'Required';
                            final parsed = double.tryParse(val.trim());
                            if (parsed == null || parsed <= 0) return 'Invalid price';
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Prep Time (mins)',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _prepTimeController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration('Minutes', icon: Icons.timer_outlined),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 3. Description
              const Text(
                'Description & Ingredients',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Describe flavors, dietary attributes, allergens...'),
              ),
              const SizedBox(height: 16),

              // 4. Spiciness Level
              const Text(
                'Spiciness Level',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _spicinessLevel,
                dropdownColor: AppTheme.darkCard,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Spiciness', icon: Icons.local_fire_department_outlined),
                items: const [
                  DropdownMenuItem(value: 'NONE', child: Text('None / Non-Spicy')),
                  DropdownMenuItem(value: 'MILD', child: Text('Mild (⭐)')),
                  DropdownMenuItem(value: 'MEDIUM', child: Text('Medium (⭐⭐)')),
                  DropdownMenuItem(value: 'HOT', child: Text('Hot (⭐⭐⭐)')),
                  DropdownMenuItem(value: 'EXTRA_HOT', child: Text('Extra Hot (🔥🔥🔥)')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _spicinessLevel = val);
                },
              ),
              const SizedBox(height: 16),

              // 5. Image URL
              const Text(
                'Food Image URL',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _imageUrlController,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Image URL', icon: Icons.image_outlined),
              ),
              const SizedBox(height: 20),

              // 6. Dietary Switches
              Material(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.darkBorder),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        activeTrackColor: AppTheme.emerald,
                        title: const Text('Vegetarian Dish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                        subtitle: const Text('Marks item with green vegetarian indicator', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                        value: _isVegetarian,
                        onChanged: (val) => setState(() => _isVegetarian = val),
                      ),
                      const Divider(color: AppTheme.darkBorder),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        activeTrackColor: AppTheme.emerald,
                        title: const Text('Vegan Dish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                        subtitle: const Text('Contains no dairy or animal products', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                        value: _isVegan,
                        onChanged: (val) => setState(() => _isVegan = val),
                      ),
                      const Divider(color: AppTheme.darkBorder),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        activeTrackColor: AppTheme.brand500,
                        title: const Text('Gluten-Free', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                        subtitle: const Text('Suitable for diners with gluten intolerance', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                        value: _isGlutenFree,
                        onChanged: (val) => setState(() => _isGlutenFree = val),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 30),

              // Save Changes Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitUpdates,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.brand500,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppTheme.darkBorder,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text(
                          'Save Changes',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, {IconData? icon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
      prefixIcon: icon != null ? Icon(icon, color: AppTheme.textSecondary, size: 20) : null,
      filled: true,
      fillColor: AppTheme.darkInput,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.brand500, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.red),
      ),
    );
  }
}
