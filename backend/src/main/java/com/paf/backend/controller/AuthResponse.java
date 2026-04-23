package com.paf.backend.controller;

import java.util.List;

public record AuthResponse(boolean authenticated, String name, String email, List<String> roles) {

	public static AuthResponse unauthenticated() {
		return new AuthResponse(false, null, null, List.of());
	}
}