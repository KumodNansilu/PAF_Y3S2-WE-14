package com.paf.backend.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@GetMapping("/me")
	public AuthResponse me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
			return AuthResponse.unauthenticated();
		}

		String email = String.valueOf(oauth2User.getAttributes().getOrDefault("email", ""));
		String name = String.valueOf(oauth2User.getAttributes().getOrDefault("name", email));
		List<String> roles = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

		return new AuthResponse(true, name, email, roles);
	}
}