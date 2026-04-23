package com.paf.backend.controller;

import jakarta.validation.constraints.NotBlank;

public record ResolveTicketRequest(
		@NotBlank(message = "Resolution notes are required")
		String resolutionNotes
) {
}
