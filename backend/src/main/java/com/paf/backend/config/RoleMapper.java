package com.paf.backend.config;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

public final class RoleMapper {

	private RoleMapper() {
	}

	public static Set<SimpleGrantedAuthority> authoritiesFor(String email, AppProperties appProperties) {
		Set<SimpleGrantedAuthority> authorities = new HashSet<>();
		authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

		if (matchesEmail(email, appProperties.getSecurity().getAdminEmails())) {
			authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
		}

		if (matchesEmail(email, appProperties.getSecurity().getTechnicianEmails())) {
			authorities.add(new SimpleGrantedAuthority("ROLE_TECHNICIAN"));
		}

		return authorities;
	}

	private static boolean matchesEmail(String email, String configuredEmails) {
		if (email == null || email.isBlank() || configuredEmails == null || configuredEmails.isBlank()) {
			return false;
		}

		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
		for (String candidate : configuredEmails.split(",")) {
			if (normalizedEmail.equals(candidate.trim().toLowerCase(Locale.ROOT))) {
				return true;
			}
		}
		return false;
	}
}