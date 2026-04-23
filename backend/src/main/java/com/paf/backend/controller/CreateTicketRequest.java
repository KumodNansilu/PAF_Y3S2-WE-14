package com.paf.backend.controller;

import com.paf.backend.model.TicketPriority;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
		@NotBlank(message = "Resource or location is required")
		@Size(max = 120, message = "Resource or location must be 120 characters or less")
		String resourceOrLocation,

		@NotBlank(message = "Category is required")
		@Size(max = 80, message = "Category must be 80 characters or less")
		String category,

		@NotNull(message = "Priority is required")
		TicketPriority priority,

		@NotBlank(message = "Description is required")
		@Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
		String description,

		@NotBlank(message = "Contact name is required")
		@Size(max = 120, message = "Contact name must be 120 characters or less")
		String contactName,

		@NotBlank(message = "Contact email is required")
		@Email(message = "Contact email is invalid")
		String contactEmail,

		@NotBlank(message = "Contact phone is required")
		@Pattern(regexp = "^[+0-9()\\-\\s]{7,20}$", message = "Contact phone is invalid")
		String contactPhone) {
}
