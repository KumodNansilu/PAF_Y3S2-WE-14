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
import com.paf.backend.controller.UpdateTicketDetailsRequest;
import com.paf.backend.model.Ticket;
import com.paf.backend.model.TicketImage;
import com.paf.backend.model.TicketStatus;
import com.paf.backend.model.TicketAssignmentHistory;
import com.paf.backend.model.TicketComment;
import com.paf.backend.repository.TicketRepository;
import java.util.UUID;

import org.springframework.http.HttpStatus;

@Service
public class TicketService {

	private static final int MAX_IMAGES = 3;

	private final TicketRepository ticketRepository;
	private final NotificationService notificationService;

	public TicketService(TicketRepository ticketRepository, NotificationService notificationService) {
		this.ticketRepository = ticketRepository;
		this.notificationService = notificationService;
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

			if (file.getSize() > 5 * 1024 * 1024) { // 5MB limit
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image size must be less than 5MB");
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

		if (authorities.contains("ROLE_ADMIN") || authorities.contains("ROLE_MANAGER")) {
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

		if (authorities.contains("ROLE_ADMIN") || authorities.contains("ROLE_MANAGER")) {
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
		Ticket savedTicket = ticketRepository.save(ticket);

		// Notify Creator
		notificationService.createNotification(
				savedTicket.getCreatedByEmail(),
				"Ticket Status Updated",
				"Your ticket #" + savedTicket.getId().substring(0, 8) + " is now " + savedTicket.getStatus(),
				"TICKET_STATUS",
				savedTicket.getId());

		return savedTicket;
	}

	public Ticket updateTicketDetails(String ticketId, UpdateTicketDetailsRequest request, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		List<String> authorities = authentication.getAuthorities().stream()
				.map(grantedAuthority -> grantedAuthority.getAuthority())
				.toList();

		if (!authorities.contains("ROLE_ADMIN")) {
			if (!ticket.getCreatedByEmail().equals(authentication.getName())) {
				throw new AccessDeniedException("You can only edit your own tickets");
			}
			if (ticket.getStatus() != TicketStatus.OPEN) {
				throw new AccessDeniedException("You can only edit tickets before they begin processing (OPEN status)");
			}
		}

		ticket.setDescription(request.description().trim());
		ticket.setPriority(request.priority());
		ticket.setContactName(request.contactName().trim());
		ticket.setContactEmail(request.contactEmail().trim().toLowerCase(Locale.ROOT));
		ticket.setContactPhone(request.contactPhone().trim());
		ticket.setUpdatedAt(Instant.now());

		return ticketRepository.save(ticket);
	}

	public Ticket assignTechnician(String ticketId, String technicianEmail, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		List<String> authorities = authentication.getAuthorities().stream()
				.map(grantedAuthority -> grantedAuthority.getAuthority())
				.toList();

		if (!authorities.contains("ROLE_ADMIN")) {
			throw new AccessDeniedException("Only admins can assign technicians");
		}

		ticket.setAssignedTechnicianEmail(technicianEmail);

		TicketAssignmentHistory history = new TicketAssignmentHistory();
		history.setAssignedTechnicianEmail(technicianEmail);
		history.setAssignedByEmail(authentication.getName());
		history.setAssignedAt(Instant.now());
		ticket.getAssignmentHistory().add(history);

		ticket.setUpdatedAt(Instant.now());
		Ticket savedTicket = ticketRepository.save(ticket);

		// Notify Assigned Technician
		notificationService.createNotification(
				technicianEmail,
				"New Ticket Assigned",
				"You have been assigned to ticket #" + savedTicket.getId().substring(0, 8),
				"TICKET_ASSIGN",
				savedTicket.getId());

		return savedTicket;
	}

	public Ticket resolveTicket(String ticketId, String resolutionNotes, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		List<String> authorities = authentication.getAuthorities().stream()
				.map(grantedAuthority -> grantedAuthority.getAuthority())
				.toList();

		if (authorities.contains("ROLE_TECHNICIAN")) {
			if (ticket.getAssignedTechnicianEmail() == null || !ticket.getAssignedTechnicianEmail().equals(authentication.getName())) {
				throw new AccessDeniedException("You can only resolve tickets assigned to you");
			}
		} else if (!authorities.contains("ROLE_ADMIN") && !authorities.contains("ROLE_MANAGER")) {
			throw new AccessDeniedException("Only admins, managers and assigned technicians can resolve tickets");
		}

		ticket.setResolutionNotes(resolutionNotes);
		ticket.setStatus(TicketStatus.RESOLVED);
		ticket.setUpdatedAt(Instant.now());
		Ticket savedTicket = ticketRepository.save(ticket);

		// Notify Creator
		notificationService.createNotification(
				savedTicket.getCreatedByEmail(),
				"Ticket Resolved",
				"Your ticket #" + savedTicket.getId().substring(0, 8) + " has been marked as RESOLVED.",
				"TICKET_STATUS",
				savedTicket.getId());

		return savedTicket;
	}

	public Ticket addComment(String ticketId, String text, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		TicketComment comment = new TicketComment();
		comment.setId(UUID.randomUUID().toString());
		comment.setText(text.trim());
		comment.setAuthorEmail(authentication.getName());
		comment.setCreatedAt(Instant.now());
		comment.setUpdatedAt(Instant.now());

		ticket.getComments().add(comment);
		ticket.setUpdatedAt(Instant.now());
		Ticket savedTicket = ticketRepository.save(ticket);

		// Notify relevant party (Creator or Assigned Tech)
		String recipient = savedTicket.getCreatedByEmail().equals(authentication.getName())
				? savedTicket.getAssignedTechnicianEmail()
				: savedTicket.getCreatedByEmail();

		if (recipient != null) {
			notificationService.createNotification(
					recipient,
					"New Comment on Ticket",
					"New comment on ticket #" + savedTicket.getId().substring(0, 8) + " by " + authentication.getName(),
					"TICKET_COMMENT",
					savedTicket.getId());
		}

		return savedTicket;
	}

	public Ticket editComment(String ticketId, String commentId, String text, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		TicketComment comment = ticket.getComments().stream()
				.filter(c -> c.getId().equals(commentId))
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

		if (!comment.getAuthorEmail().equals(authentication.getName())) {
			throw new AccessDeniedException("You can only edit your own comments");
		}

		comment.setText(text.trim());
		comment.setUpdatedAt(Instant.now());
		ticket.setUpdatedAt(Instant.now());
		return ticketRepository.save(ticket);
	}

	public Ticket deleteComment(String ticketId, String commentId, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		TicketComment comment = ticket.getComments().stream()
				.filter(c -> c.getId().equals(commentId))
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

		List<String> authorities = authentication.getAuthorities().stream()
				.map(a -> a.getAuthority())
				.toList();

		if (!comment.getAuthorEmail().equals(authentication.getName()) && !authorities.contains("ROLE_ADMIN")) {
			throw new AccessDeniedException("Only the author or an admin can delete this comment");
		}

		ticket.getComments().removeIf(c -> c.getId().equals(commentId));
		ticket.setUpdatedAt(Instant.now());
		return ticketRepository.save(ticket);
	}

	public List<TicketImage> getTicketImages(String ticketId, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
		return ticket.getImages();
	}

	public void deleteTicketImage(String ticketId, String fileName, Authentication authentication) {
		Ticket ticket = ticketRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		List<String> authorities = authentication.getAuthorities().stream()
				.map(a -> a.getAuthority())
				.toList();

		if (!ticket.getCreatedByEmail().equals(authentication.getName()) && !authorities.contains("ROLE_ADMIN")) {
			throw new AccessDeniedException("Only the author or an admin can delete attachments");
		}

		boolean removed = ticket.getImages().removeIf(img -> img.getFileName().equals(fileName));
		if (!removed) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
		}

		ticket.setUpdatedAt(Instant.now());
		ticketRepository.save(ticket);
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
