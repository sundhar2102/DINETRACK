enum SlotPeriod {
  lunch,
  dinner;

  String get label {
    switch (this) {
      case SlotPeriod.lunch:
        return 'Lunch Slots';
      case SlotPeriod.dinner:
        return 'Dinner Slots';
    }
  }
}

class TimeSlotModel {
  final String time; // e.g. '12:00', '19:30'
  final SlotPeriod period;
  final bool isAvailable;

  const TimeSlotModel({
    required this.time,
    required this.period,
    this.isAvailable = true,
  });

  String get formattedDisplay {
    final parts = time.split(':');
    if (parts.length < 2) return time;
    final hour = int.tryParse(parts[0]) ?? 12;
    final minute = parts[1];
    final isPm = hour >= 12;
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    final periodStr = isPm ? 'PM' : 'AM';
    return '$displayHour:$minute $periodStr';
  }

  static List<TimeSlotModel> getStandardSlots() {
    return const [
      // Lunch
      TimeSlotModel(time: '12:00', period: SlotPeriod.lunch),
      TimeSlotModel(time: '12:30', period: SlotPeriod.lunch),
      TimeSlotModel(time: '13:00', period: SlotPeriod.lunch),
      TimeSlotModel(time: '13:30', period: SlotPeriod.lunch),
      TimeSlotModel(time: '14:00', period: SlotPeriod.lunch),
      TimeSlotModel(time: '14:30', period: SlotPeriod.lunch),
      // Dinner
      TimeSlotModel(time: '18:30', period: SlotPeriod.dinner),
      TimeSlotModel(time: '19:00', period: SlotPeriod.dinner),
      TimeSlotModel(time: '19:30', period: SlotPeriod.dinner),
      TimeSlotModel(time: '20:00', period: SlotPeriod.dinner),
      TimeSlotModel(time: '20:30', period: SlotPeriod.dinner),
      TimeSlotModel(time: '21:00', period: SlotPeriod.dinner),
      TimeSlotModel(time: '21:30', period: SlotPeriod.dinner),
    ];
  }
}
