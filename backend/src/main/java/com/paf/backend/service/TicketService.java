package com.paf.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.AccessDeniedException;

import com.paf.backend.controller.CreateTicketRequest;
import com.paf.backend.model.Ticket;
import com.paf.backend.model.TicketImage;
import com.paf.backend.model.TicketStatus;
import com.paf.backend.repository.TicketRepository;

import org.springframework.http.HttpStatus;

@Service
public class TicketService {

	private static final int MAX_IMAGES = 3;

	private final TicketRepository ticketRepository;

	public TicketService(TicketRepository ticketRepository) {
		this.ticketRepository = ticketRepository;
	}

	public Ticket createTicket(CreateTicketRequest request, List<MultipartFile> images, String createdByEmail) {
		List<MultipartFile> safeImages = images == null ? List.of() : images;

		if (safeImages.size() > MAX_IMAGES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 3 images are allowed");
		}

		Ticket ticket = new Ticket();
		ticket.setResourceOrLocation(request.resourceOrLocation().trim());
		ticket.setCategory(request.category().trim());
		ticket.setPriority(request.priority());
		ticket.setDescription(request.description().trim());
		ticket.setContactName(request.contactName().trim());
		ticket.setContactEmail(request.contactEmail().trim().toLowerCase(Locale.ROOT));
		ticket.setContactPhone(request.contactPhone().trim());
		ticket.setStatus(TicketStatus.OPEN);
		ticket.setCreatedByEmail(createdByEmail);
		ticket.setAssignedTechnicianEmail(null);
		ticket.setCreatedAt(Instant.now());
		ticket.setUpdatedAt(Instant.now());

		for (MultipartFile file : safeImages) {
			if (file == null || file.isEmpty()) {
				continue;
			}

			if (file.getContentType() == null || !file.getContentType().toLowerCase(Locale.ROOT).startsWith("image/")) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
			}

			TicketImage image = new TicketImage();
			image.setFileName(sanitizeFileName(file.getOriginalFilename()));
			image.setContentType(file.getContentType());
			image.setUploadedAt(Instant.now());
			image.setDataBase64(encodeBase64(file));
			ticket.getImages().add(image);
		}

		return ticketRepository.save(ticket);
	}

	public List<Ticket> getTicketsForUser(String createdByEmail) {
		return ticketRepository.findByCreatedByEmailOrderByCreatedAtDesc(createdByEmail);
	}

	public List<Ticket> getTicketsForCurrentRole(Authentication authentication) {
		List<String> authorities = authentication.getAuthorities().stream()
				.map(grantedAuthority -> grantedAuthority.getAuthority())
				.toList();

		if (authorities.contains("ROLE_ADMIN")) {
			return ticketRepository.findAllByOrderByCreatedAtDesc();
		}

		if (authorities.contains("ROLE_TECHNICIAN")) {
			return ticketRepository.findByAssignedTechnicianEmailOrderByCreatedAtDesc(authentication.getName());
		}

		return ticketRepository.findByCreatedByEmailOrderByCreatedAtDesc(authentication.getName());
	}

	public Ticket updateTicketStatus(String ticketId, TicketStatus newStatus, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		List<String> authorities = authentication.getAuthorities().stream()
				.map(grantedAuthority -> grantedAuthority.getAuthority())
				.toList();

		if (authorities.contains("ROLE_ADMIN")) {
			ticket.setStatus(newStatus);
		} else if (authorities.contains("ROLE_TECHNICIAN")) {
			if (ticket.getAssignedTechnicianEmail() == null || !ticket.getAssignedTechnicianEmail().equals(authentication.getName())) {
				throw new AccessDeniedException("Technicians can only update tickets assigned to them");
			}
			if (newStatus != TicketStatus.IN_PROGRESS && newStatus != TicketStatus.RESOLVED) {
				throw new AccessDeniedException("Technicians can only update status to IN_PROGRESS or RESOLVED");
			}
			ticket.setStatus(newStatus);
		} else {
			throw new AccessDeniedException("You do not have permission to update ticket status");
		}

		ticket.setUpdatedAt(Instant.now());
		return ticketRepository.save(ticket);
	}

	private String encodeBase64(MultipartFile file) {
		try {
			return Base64.getEncoder().encodeToString(file.getBytes());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded image", exception);
		}
	}

	private String sanitizeFileName(String fileName) {
		if (fileName == null || fileName.isBlank()) {
			return "image-" + Instant.now().toEpochMilli();
		}
		return fileName.replaceAll("[\\r\\n\\t]", "").getBytes(StandardCharsets.UTF_8).length > 255
				? fileName.substring(0, 255)
				: fileName;
	}
}
