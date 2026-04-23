package com.paf.backend.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.paf.backend.controller.AnalyticsResponse;
import com.paf.backend.model.Ticket;
import com.paf.backend.model.TicketPriority;
import com.paf.backend.model.TicketStatus;
import com.paf.backend.repository.TicketRepository;

@Service
public class AnalyticsService {

	private final TicketRepository ticketRepository;

	public AnalyticsService(TicketRepository ticketRepository) {
		this.ticketRepository = ticketRepository;
	}

	public AnalyticsResponse getAnalytics() {
		List<Ticket> allTickets = ticketRepository.findAllByOrderByCreatedAtDesc();

		long totalOpen = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.OPEN).count();
		long totalInProgress = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS).count();
		long totalResolved = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED).count();
		long totalHighPriority = allTickets.stream().filter(t -> t.getPriority() == TicketPriority.HIGH).count();

		List<Ticket> resolvedTickets = allTickets.stream()
				.filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
				.toList();

		Double avgResolutionHours = null;
		if (!resolvedTickets.isEmpty()) {
			double totalHours = 0;
			for (Ticket t : resolvedTickets) {
				if (t.getCreatedAt() != null && t.getUpdatedAt() != null) {
					totalHours += Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toMinutes() / 60.0;
				}
			}
			avgResolutionHours = totalHours / resolvedTickets.size();
		}

		Map<String, Long> technicianPerformance = resolvedTickets.stream()
				.filter(t -> t.getAssignedTechnicianEmail() != null && !t.getAssignedTechnicianEmail().isBlank())
				.collect(Collectors.groupingBy(Ticket::getAssignedTechnicianEmail, Collectors.counting()));

		return new AnalyticsResponse(
				totalOpen,
				totalInProgress,
				totalResolved,
				totalHighPriority,
				avgResolutionHours,
				technicianPerformance
		);
	}
}
