package com.paf.backend.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

	@GetMapping("/ping")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
	public Map<String, String> ping() {
		return Map.of("message", "USER access granted");
	}
}