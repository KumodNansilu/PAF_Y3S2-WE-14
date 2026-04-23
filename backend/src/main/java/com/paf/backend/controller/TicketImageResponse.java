package com.paf.backend.controller;

public record TicketImageResponse(
		String fileName,
		String contentType,
		String dataBase64
) {
}
