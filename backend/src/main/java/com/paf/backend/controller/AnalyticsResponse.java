package com.paf.backend.controller;

import java.util.Map;

public record AnalyticsResponse(
		long totalOpen,
		long totalInProgress,
		long totalResolved,
		long totalHighPriority,
		Double averageResolutionTimeHours,
		Map<String, Long> technicianPerformance
) {
}
