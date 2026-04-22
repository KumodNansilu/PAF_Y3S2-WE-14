package com.paf.backend.controller;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
		@NotBlank(message = "Comment text is required")
		String text
) {
}
