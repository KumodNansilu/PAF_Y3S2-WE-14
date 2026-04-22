package com.paf.backend.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.server.ResponseStatusException;

import com.paf.backend.model.AppUser;
import com.paf.backend.repository.AppUserRepository;
import com.paf.backend.service.UserPersistenceService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UserPersistenceService userPersistenceService;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final AppUserRepository appUserRepository;

	public AuthController(
			UserPersistenceService userPersistenceService,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			AppUserRepository appUserRepository) {
		this.userPersistenceService = userPersistenceService;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.appUserRepository = appUserRepository;
	}

	@GetMapping("/me")
	public AuthResponse me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return AuthResponse.unauthenticated();
		}

		if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
			String email = String.valueOf(oauth2User.getAttributes().getOrDefault("email", ""));
			String name = String.valueOf(oauth2User.getAttributes().getOrDefault("name", email));
			List<String> roles = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

			return new AuthResponse(true, name, email, roles);
		}

		if (authentication.getPrincipal() instanceof UserDetails userDetails) {
			String email = userDetails.getUsername();
			AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
			String name = user != null && user.getName() != null && !user.getName().isBlank() ? user.getName() : email;
			List<String> roles = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

			return new AuthResponse(true, name, email, roles);
		}

		return AuthResponse.unauthenticated();
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
		Authentication authentication;

		try {
			authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(
							request.email().trim().toLowerCase(Locale.ROOT),
							request.password()));
		} catch (AuthenticationException exception) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password", exception);
		}

		SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
		securityContext.setAuthentication(authentication);
		SecurityContextHolder.setContext(securityContext);
		httpServletRequest.getSession(true)
				.setAttribute("SPRING_SECURITY_CONTEXT", securityContext);

		String email = authentication.getName();
		AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
		String name = user != null && user.getName() != null && !user.getName().isBlank() ? user.getName() : email;
		List<String> roles = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

		return ResponseEntity.ok(new AuthResponse(true, name, email, roles));
	}

	@PostMapping("/register")
	public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegistrationRequest request) {
		if (!request.password().equals(request.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
		}

		try {
			userPersistenceService.createLocalUser(
					request.fullName(),
					request.email(),
					passwordEncoder.encode(request.password()));
		} catch (IllegalStateException exception) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage(), exception);
		}

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new RegistrationResponse(true, "Registration completed successfully", request.email().trim().toLowerCase()));
	}
}