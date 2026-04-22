package com.paf.backend.model;

import java.time.Instant;

public class TicketAssignmentHistory {
	private String assignedTechnicianEmail;
	private String assignedByEmail;
	private Instant assignedAt;

	public String getAssignedTechnicianEmail() {
		return assignedTechnicianEmail;
	}

	public void setAssignedTechnicianEmail(String assignedTechnicianEmail) {
		this.assignedTechnicianEmail = assignedTechnicianEmail;
	}

	public String getAssignedByEmail() {
		return assignedByEmail;
	}

	public void setAssignedByEmail(String assignedByEmail) {
		this.assignedByEmail = assignedByEmail;
	}

	public Instant getAssignedAt() {
		return assignedAt;
	}

	public void setAssignedAt(Instant assignedAt) {
		this.assignedAt = assignedAt;
	}
}
