package com.paf.backend.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	@GetMapping("/ping")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> ping() {
		return Map.of("message", "ADMIN access granted");
	}
}