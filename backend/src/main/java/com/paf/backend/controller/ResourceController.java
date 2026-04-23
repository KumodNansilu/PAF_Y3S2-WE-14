package com.paf.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.paf.backend.model.Resource;
import com.paf.backend.model.ResourceStatus;
import com.paf.backend.model.ResourceType;
import com.paf.backend.service.ResourceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/resources")
@Validated
public class ResourceController {

	private final ResourceService resourceService;

	public ResourceController(ResourceService resourceService) {
		this.resourceService = resourceService;
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public List<ResourceResponse> searchResources(
			@RequestParam(required = false) ResourceType type,
			@RequestParam(required = false) ResourceStatus status,
			@RequestParam(required = false) String location,
			@RequestParam(required = false) Integer capacityMin,
			@RequestParam(required = false) Integer capacityMax,
			@RequestParam(required = false, name = "q") String query) {
		return resourceService.searchResources(type, status, location, capacityMin, capacityMax, query).stream()
				.map(this::toResponse)
				.toList();
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public ResourceResponse getById(@PathVariable String id) {
		return toResponse(resourceService.getById(id));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse create(@Valid @RequestBody ResourceRequest request) {
		return toResponse(resourceService.create(request));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse update(@PathVariable String id, @Valid @RequestBody ResourceRequest request) {
		return toResponse(resourceService.update(id, request));
	}

	@PatchMapping("/{id}/status")
	@PreAuthorize("hasRole('ADMIN')")
	public ResourceResponse updateStatus(@PathVariable String id, @Valid @RequestBody UpdateResourceStatusRequest request) {
		return toResponse(resourceService.updateStatus(id, request.status()));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(@PathVariable String id) {
		resourceService.delete(id);
	}

	private ResourceResponse toResponse(Resource resource) {
		List<ResourceResponse.AvailabilityWindowResponse> windows = resource.getAvailabilityWindows() == null
				? List.of()
				: resource.getAvailabilityWindows().stream()
						.map(window -> new ResourceResponse.AvailabilityWindowResponse(
								window.getDayOfWeek(),
								window.getStartTime(),
								window.getEndTime()))
						.toList();

		return new ResourceResponse(
				resource.getId(),
				resource.getName(),
				resource.getType(),
				resource.getCapacity(),
				resource.getLocation(),
				resource.getStatus(),
				windows,
				resource.getCreatedAt(),
				resource.getUpdatedAt());
	}
}
