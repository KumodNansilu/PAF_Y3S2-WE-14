package com.paf.backend.controller;

import com.paf.backend.model.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(
		@NotNull(message = "Status is required")
		TicketStatus status
) {
}
