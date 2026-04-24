package com.paf.backend.controller;

import com.paf.backend.model.ResourceStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateResourceStatusRequest(
		@NotNull(message = "Status is required")
		ResourceStatus status) {
}
