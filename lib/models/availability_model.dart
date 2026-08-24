class AvailabilityModel {
  final String restaurantId;
  final int partySize;
  final int estimatedWaitTime;
  final int minimumWaitTime;
  final int maximumWaitTime;
  final String confidence;
  final String crowdLevel;
  final int queueLength;
  final int totalTables;
  final int availableTablesCount;
  final int occupiedTablesCount;
  final String lastUpdated;

  const AvailabilityModel({
    required this.restaurantId,
    required this.partySize,
    this.estimatedWaitTime = 0,
    this.minimumWaitTime = 0,
    this.maximumWaitTime = 0,
    this.confidence = 'HIGH',
    this.crowdLevel = 'LOW',
    this.queueLength = 0,
    this.totalTables = 0,
    this.availableTablesCount = 0,
    this.occupiedTablesCount = 0,
    this.lastUpdated = '',
  });

  bool get hasImmediateTable => availableTablesCount > 0 && estimatedWaitTime == 0;
  bool get isClosed => confidence == 'CLOSED' || crowdLevel == 'CLOSED';

  String get formattedStatus {
    if (isClosed) return 'Restaurant Closed';
    if (hasImmediateTable) return 'Immediate Seating Available';
    if (estimatedWaitTime > 0) return '~$estimatedWaitTime mins estimated wait';
    return '$availableTablesCount tables available';
  }

  factory AvailabilityModel.fromJson(Map<String, dynamic> json) {
    return AvailabilityModel(
      restaurantId: (json['restaurantId'] ?? json['restaurant_id'] ?? '').toString(),
      partySize: (json['partySize'] is num) ? (json['partySize'] as num).toInt() : int.tryParse(json['partySize']?.toString() ?? '2') ?? 2,
      estimatedWaitTime: (json['estimatedWaitTime'] is num) ? (json['estimatedWaitTime'] as num).toInt() : 0,
      minimumWaitTime: (json['minimumWaitTime'] is num) ? (json['minimumWaitTime'] as num).toInt() : 0,
      maximumWaitTime: (json['maximumWaitTime'] is num) ? (json['maximumWaitTime'] as num).toInt() : 0,
      confidence: (json['confidence'] ?? 'HIGH').toString(),
      crowdLevel: (json['crowdLevel'] ?? 'LOW').toString(),
      queueLength: (json['queueLength'] is num) ? (json['queueLength'] as num).toInt() : 0,
      totalTables: (json['totalTables'] is num) ? (json['totalTables'] as num).toInt() : 0,
      availableTablesCount: (json['availableTablesCount'] is num) ? (json['availableTablesCount'] as num).toInt() : 0,
      occupiedTablesCount: (json['occupiedTablesCount'] is num) ? (json['occupiedTablesCount'] as num).toInt() : 0,
      lastUpdated: (json['lastUpdated'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'restaurantId': restaurantId,
      'partySize': partySize,
      'estimatedWaitTime': estimatedWaitTime,
      'minimumWaitTime': minimumWaitTime,
      'maximumWaitTime': maximumWaitTime,
      'confidence': confidence,
      'crowdLevel': crowdLevel,
      'queueLength': queueLength,
      'totalTables': totalTables,
      'availableTablesCount': availableTablesCount,
      'occupiedTablesCount': occupiedTablesCount,
      'lastUpdated': lastUpdated,
    };
  }
}
