package com.paf.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.paf.backend.model.Ticket;
import com.paf.backend.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tickets")
@Validated
public class TicketController {

	private final TicketService ticketService;

	public TicketController(TicketService ticketService) {
		this.ticketService = ticketService;
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public List<TicketResponse> getTickets(Authentication authentication) {
		return ticketService.getTicketsForCurrentRole(authentication).stream()
				.map(ticket -> new TicketResponse(
						ticket.getId(),
						ticket.getResourceOrLocation(),
						ticket.getCategory(),
						ticket.getPriority(),
						ticket.getDescription(),
						ticket.getContactName(),
						ticket.getContactEmail(),
						ticket.getContactPhone(),
						ticket.getStatus(),
						ticket.getCreatedByEmail(),
						ticket.getImages().size(),
						ticket.getCreatedAt()))
				.toList();
	}

	@GetMapping("/my")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public List<TicketResponse> getMyTickets(Authentication authentication) {
		return ticketService.getTicketsForUser(authentication.getName()).stream()
				.map(ticket -> new TicketResponse(
						ticket.getId(),
						ticket.getResourceOrLocation(),
						ticket.getCategory(),
						ticket.getPriority(),
						ticket.getDescription(),
						ticket.getContactName(),
						ticket.getContactEmail(),
						ticket.getContactPhone(),
						ticket.getStatus(),
						ticket.getCreatedByEmail(),
						ticket.getImages().size(),
						ticket.getCreatedAt()))
				.toList();
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public TicketResponse createTicket(
			Authentication authentication,
			@Valid @RequestPart("payload") CreateTicketRequest payload,
			@RequestPart(value = "images", required = false) List<MultipartFile> images) {
		Ticket savedTicket = ticketService.createTicket(payload, images, authentication.getName());
		return new TicketResponse(
				savedTicket.getId(),
				savedTicket.getResourceOrLocation(),
				savedTicket.getCategory(),
				savedTicket.getPriority(),
				savedTicket.getDescription(),
				savedTicket.getContactName(),
				savedTicket.getContactEmail(),
				savedTicket.getContactPhone(),
				savedTicket.getStatus(),
				savedTicket.getCreatedByEmail(),
				savedTicket.getImages().size(),
				savedTicket.getCreatedAt());
	}
}
