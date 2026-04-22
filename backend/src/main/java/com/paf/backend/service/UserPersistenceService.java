package com.paf.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.paf.backend.model.AppUser;
import com.paf.backend.repository.AppUserRepository;

@Service
public class UserPersistenceService {

	private final AppUserRepository appUserRepository;

	public UserPersistenceService(AppUserRepository appUserRepository) {
		this.appUserRepository = appUserRepository;
	}

	public void upsertOAuthLoginUser(String email, String name, String picture, String provider, List<String> roles) {
		if (email == null || email.isBlank()) {
			return;
		}

		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
		Instant now = Instant.now();

		AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedEmail)
				.orElseGet(AppUser::new);

		if (user.getCreatedAt() == null) {
			user.setCreatedAt(now);
		}

		List<String> normalizedRoles = new ArrayList<>(roles);
		normalizedRoles.sort(Comparator.naturalOrder());

		user.setEmail(normalizedEmail);
		user.setName(name);
		user.setPicture(picture);
		user.setProvider(provider);
		user.setRoles(normalizedRoles);
		user.setLastLoginAt(now);
		user.setUpdatedAt(now);

		appUserRepository.save(user);
	}
}
