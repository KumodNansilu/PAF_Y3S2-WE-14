package com.paf.backend.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final com.paf.backend.repository.AppUserRepository appUserRepository;

	public AdminController(com.paf.backend.repository.AppUserRepository appUserRepository) {
		this.appUserRepository = appUserRepository;
	}

	@GetMapping("/ping")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> ping() {
		return Map.of("message", "ADMIN access granted");
	}

	@GetMapping("/users")
	@PreAuthorize("hasRole('ADMIN')")
	public java.util.List<com.paf.backend.model.AppUser> getAllUsers() {
		return appUserRepository.findAll();
	}

	@GetMapping("/users/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public com.paf.backend.model.AppUser getUserById(@PathVariable String id) {
		return appUserRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("User not found"));
	}

	@PutMapping("/users/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public com.paf.backend.model.AppUser updateUser(@PathVariable String id, @RequestBody com.paf.backend.model.AppUser userDetails) {
		com.paf.backend.model.AppUser user = appUserRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("User not found"));

		user.setName(userDetails.getName());
		user.setRoles(userDetails.getRoles());
		user.setUpdatedAt(java.time.Instant.now());

		return appUserRepository.save(user);
	}

	@org.springframework.web.bind.annotation.DeleteMapping("/users/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	@org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
	public void deleteUser(@PathVariable String id) {
		if (!appUserRepository.existsById(id)) {
			throw new RuntimeException("User not found");
		}
		appUserRepository.deleteById(id);
	}
}