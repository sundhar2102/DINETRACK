import '../utils/json_parser.dart';

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
      partySize: JsonParser.parseInt(json['partySize'], 2),
      estimatedWaitTime: JsonParser.parseInt(json['estimatedWaitTime'], 0),
      minimumWaitTime: JsonParser.parseInt(json['minimumWaitTime'], 0),
      maximumWaitTime: JsonParser.parseInt(json['maximumWaitTime'], 0),
      confidence: (json['confidence'] ?? 'HIGH').toString(),
      crowdLevel: (json['crowdLevel'] ?? 'LOW').toString(),
      queueLength: JsonParser.parseInt(json['queueLength'], 0),
      totalTables: JsonParser.parseInt(json['totalTables'], 0),
      availableTablesCount: JsonParser.parseInt(json['availableTablesCount'], 0),
      occupiedTablesCount: JsonParser.parseInt(json['occupiedTablesCount'], 0),
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
