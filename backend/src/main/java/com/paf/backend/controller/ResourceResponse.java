package com.paf.backend.controller;

import java.time.Instant;
import java.util.List;

import com.paf.backend.model.ResourceStatus;
import com.paf.backend.model.ResourceType;

public record ResourceResponse(
		String id,
		String name,
		ResourceType type,
		int capacity,
		String location,
		ResourceStatus status,
		List<AvailabilityWindowResponse> availabilityWindows,
		Instant createdAt,
		Instant updatedAt) {

	public record AvailabilityWindowResponse(String dayOfWeek, String startTime, String endTime) {
	}
}
