package com.paf.backend.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.paf.backend.model.TicketPriority;

public record UpdateTicketDetailsRequest(
		@NotBlank(message = "Description is required")
		String description,

		@NotNull(message = "Priority is required")
		TicketPriority priority,

		@NotBlank(message = "Contact name is required")
		String contactName,

		@NotBlank(message = "Contact email is required")
		String contactEmail,

		@NotBlank(message = "Contact phone is required")
		String contactPhone
) {
}
