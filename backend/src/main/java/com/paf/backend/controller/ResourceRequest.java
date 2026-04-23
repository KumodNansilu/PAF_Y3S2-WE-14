package com.paf.backend.controller;

import java.util.List;

import com.paf.backend.model.ResourceStatus;
import com.paf.backend.model.ResourceType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ResourceRequest(
		@NotBlank(message = "Resource name is required")
		String name,

		@NotNull(message = "Resource type is required")
		ResourceType type,

		@Min(value = 1, message = "Capacity must be at least 1")
		int capacity,

		@NotBlank(message = "Location is required")
		String location,

		@NotNull(message = "Status is required")
		ResourceStatus status,

		@NotEmpty(message = "At least one availability window is required")
		@Valid
		List<AvailabilityWindowRequest> availabilityWindows) {

	public record AvailabilityWindowRequest(
			@NotBlank(message = "Day of week is required")
			@Pattern(
					regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY",
					message = "Day of week must be MONDAY to SUNDAY")
			String dayOfWeek,

			@NotBlank(message = "Start time is required")
			@Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Start time must be HH:mm")
			String startTime,

			@NotBlank(message = "End time is required")
			@Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "End time must be HH:mm")
			String endTime) {
	}
}
