package com.paf.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.paf.backend.controller.ResourceRequest;
import com.paf.backend.model.AvailabilityWindow;
import com.paf.backend.model.Resource;
import com.paf.backend.model.ResourceStatus;
import com.paf.backend.model.ResourceType;
import com.paf.backend.repository.ResourceRepository;

@Service
public class ResourceService {

	private final ResourceRepository resourceRepository;

	public ResourceService(ResourceRepository resourceRepository) {
		this.resourceRepository = resourceRepository;
	}

	public List<Resource> searchResources(
			ResourceType type,
			ResourceStatus status,
			String location,
			Integer capacityMin,
			Integer capacityMax,
			String query) {
		if (capacityMin != null && capacityMax != null && capacityMin > capacityMax) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "capacityMin cannot be greater than capacityMax");
		}

		String normalizedLocation = normalize(location);
		String normalizedQuery = normalize(query);

		return resourceRepository.findAllByOrderByNameAsc().stream()
				.filter(resource -> type == null || (resource.getType() != null && resource.getType() == type))
				.filter(resource -> status == null || (resource.getStatus() != null && resource.getStatus() == status))
				.filter(resource -> capacityMin == null || resource.getCapacity() >= capacityMin)
				.filter(resource -> capacityMax == null || resource.getCapacity() <= capacityMax)
				.filter(resource -> normalizedLocation.isBlank() || containsIgnoreCase(resource.getLocation(), normalizedLocation))
				.filter(resource -> {
					if (normalizedQuery.isBlank()) {
						return true;
					}
					String typeName = resource.getType() == null ? null : resource.getType().name();
					return containsIgnoreCase(resource.getName(), normalizedQuery)
							|| containsIgnoreCase(resource.getLocation(), normalizedQuery)
							|| containsIgnoreCase(typeName, normalizedQuery);
				})
				.toList();
	}

	public Resource getById(String id) {
		return resourceRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
	}

	public Resource create(ResourceRequest request) {
		Resource resource = new Resource();
		applyRequest(resource, request);
		resource.setCreatedAt(Instant.now());
		resource.setUpdatedAt(Instant.now());
		return resourceRepository.save(resource);
	}

	public Resource update(String id, ResourceRequest request) {
		Resource existing = getById(id);
		applyRequest(existing, request);
		existing.setUpdatedAt(Instant.now());
		return resourceRepository.save(existing);
	}

	public Resource updateStatus(String id, ResourceStatus status) {
		Resource resource = getById(id);
		resource.setStatus(status);
		resource.setUpdatedAt(Instant.now());
		return resourceRepository.save(resource);
	}

	public void delete(String id) {
		Resource existing = getById(id);
		resourceRepository.delete(existing);
	}

	private void applyRequest(Resource resource, ResourceRequest request) {
		validateAvailabilityWindows(request.availabilityWindows());

		resource.setName(request.name().trim());
		resource.setType(request.type());
		resource.setCapacity(request.capacity());
		resource.setLocation(request.location().trim());
		resource.setStatus(request.status());
		resource.setAvailabilityWindows(request.availabilityWindows().stream()
				.map(window -> {
					AvailabilityWindow availabilityWindow = new AvailabilityWindow();
					String normalizedDate = normalizeDate(window.date());
					availabilityWindow.setDate(normalizedDate);
					availabilityWindow.setDayOfWeek(resolveDayOfWeek(window, normalizedDate));
					availabilityWindow.setStartTime(window.startTime().trim());
					availabilityWindow.setEndTime(window.endTime().trim());
					return availabilityWindow;
				})
				.toList());
	}

	private void validateAvailabilityWindows(List<ResourceRequest.AvailabilityWindowRequest> windows) {
		for (ResourceRequest.AvailabilityWindowRequest window : windows) {
			if (window.date() != null && !window.date().isBlank()) {
				LocalDate.parse(window.date().trim());
			}

			LocalTime start = LocalTime.parse(window.startTime());
			LocalTime end = LocalTime.parse(window.endTime());
			if (!start.isBefore(end)) {
				throw new ResponseStatusException(
						HttpStatus.BAD_REQUEST,
						"Availability window startTime must be earlier than endTime");
			}
		}
	}

	private String normalizeDate(String date) {
		if (date == null) {
			return null;
		}

		String trimmed = date.trim();
		return trimmed.isBlank() ? null : trimmed;
	}

	private String resolveDayOfWeek(ResourceRequest.AvailabilityWindowRequest window, String normalizedDate) {
		if (normalizedDate != null) {
			return LocalDate.parse(normalizedDate).getDayOfWeek().name();
		}

		return window.dayOfWeek().trim().toUpperCase(Locale.ROOT);
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
	}

	private boolean containsIgnoreCase(String value, String filter) {
		if (value == null) {
			return false;
		}
		return value.toLowerCase(Locale.ROOT).contains(filter);
	}
}
