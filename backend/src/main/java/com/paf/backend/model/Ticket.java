package com.paf.backend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tickets")
public class Ticket {

	@Id
	private String id;

	private String resourceOrLocation;
	private String category;
	private TicketPriority priority;
	private String description;
	private String contactName;
	private String contactEmail;
	private String contactPhone;
	private TicketStatus status;
	private String createdByEmail;
	private String assignedTechnicianEmail;
	private List<TicketImage> images = new ArrayList<>();
	private Instant createdAt;
	private Instant updatedAt;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getResourceOrLocation() {
		return resourceOrLocation;
	}

	public void setResourceOrLocation(String resourceOrLocation) {
		this.resourceOrLocation = resourceOrLocation;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public TicketPriority getPriority() {
		return priority;
	}

	public void setPriority(TicketPriority priority) {
		this.priority = priority;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getContactName() {
		return contactName;
	}

	public void setContactName(String contactName) {
		this.contactName = contactName;
	}

	public String getContactEmail() {
		return contactEmail;
	}

	public void setContactEmail(String contactEmail) {
		this.contactEmail = contactEmail;
	}

	public String getContactPhone() {
		return contactPhone;
	}

	public void setContactPhone(String contactPhone) {
		this.contactPhone = contactPhone;
	}

	public TicketStatus getStatus() {
		return status;
	}

	public void setStatus(TicketStatus status) {
		this.status = status;
	}

	public String getCreatedByEmail() {
		return createdByEmail;
	}

	public void setCreatedByEmail(String createdByEmail) {
		this.createdByEmail = createdByEmail;
	}

	public String getAssignedTechnicianEmail() {
		return assignedTechnicianEmail;
	}

	public void setAssignedTechnicianEmail(String assignedTechnicianEmail) {
		this.assignedTechnicianEmail = assignedTechnicianEmail;
	}

	public List<TicketImage> getImages() {
		return images;
	}

	public void setImages(List<TicketImage> images) {
		this.images = images;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
