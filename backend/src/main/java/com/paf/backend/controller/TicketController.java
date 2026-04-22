package com.paf.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
						ticket.getAssignedTechnicianEmail(),
						ticket.getResolutionNotes(),
						ticket.getImages().size(),
						ticket.getComments(),
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
						ticket.getAssignedTechnicianEmail(),
						ticket.getResolutionNotes(),
						ticket.getImages().size(),
						ticket.getComments(),
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
				savedTicket.getAssignedTechnicianEmail(),
				savedTicket.getResolutionNotes(),
				savedTicket.getImages().size(),
				savedTicket.getComments(),
				savedTicket.getCreatedAt());
	}

	@PatchMapping("/{id}/status")
	@PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
	public TicketResponse updateTicketStatus(
			@PathVariable String id,
			@Valid @RequestBody UpdateTicketStatusRequest request,
			Authentication authentication) {
		Ticket updatedTicket = ticketService.updateTicketStatus(id, request.status(), authentication);
		return new TicketResponse(
				updatedTicket.getId(),
				updatedTicket.getResourceOrLocation(),
				updatedTicket.getCategory(),
				updatedTicket.getPriority(),
				updatedTicket.getDescription(),
				updatedTicket.getContactName(),
				updatedTicket.getContactEmail(),
				updatedTicket.getContactPhone(),
				updatedTicket.getStatus(),
				updatedTicket.getCreatedByEmail(),
				updatedTicket.getAssignedTechnicianEmail(),
				updatedTicket.getResolutionNotes(),
				updatedTicket.getImages().size(),
				updatedTicket.getComments(),
				updatedTicket.getCreatedAt());
	}

	@PatchMapping("/{id}/assign")
	@PreAuthorize("hasRole('ADMIN')")
	public TicketResponse assignTechnician(
			@PathVariable String id,
			@Valid @RequestBody AssignTechnicianRequest request,
			Authentication authentication) {
		Ticket updatedTicket = ticketService.assignTechnician(id, request.technicianEmail(), authentication);
		return new TicketResponse(
				updatedTicket.getId(),
				updatedTicket.getResourceOrLocation(),
				updatedTicket.getCategory(),
				updatedTicket.getPriority(),
				updatedTicket.getDescription(),
				updatedTicket.getContactName(),
				updatedTicket.getContactEmail(),
				updatedTicket.getContactPhone(),
				updatedTicket.getStatus(),
				updatedTicket.getCreatedByEmail(),
				updatedTicket.getAssignedTechnicianEmail(),
				updatedTicket.getResolutionNotes(),
				updatedTicket.getImages().size(),
				updatedTicket.getComments(),
				updatedTicket.getCreatedAt());
	}

	@PatchMapping("/{id}/resolve")
	@PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
	public TicketResponse resolveTicket(
			@PathVariable String id,
			@Valid @RequestBody ResolveTicketRequest request,
			Authentication authentication) {
		Ticket updatedTicket = ticketService.resolveTicket(id, request.resolutionNotes(), authentication);
		return new TicketResponse(
				updatedTicket.getId(),
				updatedTicket.getResourceOrLocation(),
				updatedTicket.getCategory(),
				updatedTicket.getPriority(),
				updatedTicket.getDescription(),
				updatedTicket.getContactName(),
				updatedTicket.getContactEmail(),
				updatedTicket.getContactPhone(),
				updatedTicket.getStatus(),
				updatedTicket.getCreatedByEmail(),
				updatedTicket.getAssignedTechnicianEmail(),
				updatedTicket.getResolutionNotes(),
				updatedTicket.getImages().size(),
				updatedTicket.getComments(),
				updatedTicket.getCreatedAt());
	}

	@PostMapping("/{id}/comments")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public TicketResponse addComment(
			@PathVariable String id,
			@Valid @RequestBody CommentRequest request,
			Authentication authentication) {
		Ticket updatedTicket = ticketService.addComment(id, request.text(), authentication);
		return new TicketResponse(
				updatedTicket.getId(),
				updatedTicket.getResourceOrLocation(),
				updatedTicket.getCategory(),
				updatedTicket.getPriority(),
				updatedTicket.getDescription(),
				updatedTicket.getContactName(),
				updatedTicket.getContactEmail(),
				updatedTicket.getContactPhone(),
				updatedTicket.getStatus(),
				updatedTicket.getCreatedByEmail(),
				updatedTicket.getAssignedTechnicianEmail(),
				updatedTicket.getResolutionNotes(),
				updatedTicket.getImages().size(),
				updatedTicket.getComments(),
				updatedTicket.getCreatedAt());
	}

	@PatchMapping("/{id}/comments/{commentId}")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public TicketResponse editComment(
			@PathVariable String id,
			@PathVariable String commentId,
			@Valid @RequestBody CommentRequest request,
			Authentication authentication) {
		Ticket updatedTicket = ticketService.editComment(id, commentId, request.text(), authentication);
		return new TicketResponse(
				updatedTicket.getId(),
				updatedTicket.getResourceOrLocation(),
				updatedTicket.getCategory(),
				updatedTicket.getPriority(),
				updatedTicket.getDescription(),
				updatedTicket.getContactName(),
				updatedTicket.getContactEmail(),
				updatedTicket.getContactPhone(),
				updatedTicket.getStatus(),
				updatedTicket.getCreatedByEmail(),
				updatedTicket.getAssignedTechnicianEmail(),
				updatedTicket.getResolutionNotes(),
				updatedTicket.getImages().size(),
				updatedTicket.getComments(),
				updatedTicket.getCreatedAt());
	}

	@DeleteMapping("/{id}/comments/{commentId}")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public TicketResponse deleteComment(
			@PathVariable String id,
			@PathVariable String commentId,
			Authentication authentication) {
		Ticket updatedTicket = ticketService.deleteComment(id, commentId, authentication);
		return new TicketResponse(
				updatedTicket.getId(),
				updatedTicket.getResourceOrLocation(),
				updatedTicket.getCategory(),
				updatedTicket.getPriority(),
				updatedTicket.getDescription(),
				updatedTicket.getContactName(),
				updatedTicket.getContactEmail(),
				updatedTicket.getContactPhone(),
				updatedTicket.getStatus(),
				updatedTicket.getCreatedByEmail(),
				updatedTicket.getAssignedTechnicianEmail(),
				updatedTicket.getResolutionNotes(),
				updatedTicket.getImages().size(),
				updatedTicket.getComments(),
				updatedTicket.getCreatedAt());
	}
}
