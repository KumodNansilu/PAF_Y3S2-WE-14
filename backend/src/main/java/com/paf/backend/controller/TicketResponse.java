package com.paf.backend.controller;

import java.time.Instant;

import com.paf.backend.model.TicketPriority;
import com.paf.backend.model.TicketStatus;

public record TicketResponse(
		String id,
		String resourceOrLocation,
		String category,
		TicketPriority priority,
		String description,
		String contactName,
		String contactEmail,
		String contactPhone,
		TicketStatus status,
		String createdByEmail,
		String assignedTechnicianEmail,
		int imageCount,
		Instant createdAt) {
}
