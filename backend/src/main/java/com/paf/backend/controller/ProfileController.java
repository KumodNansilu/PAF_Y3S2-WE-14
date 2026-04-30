package com.paf.backend.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.paf.backend.model.AppUser;
import com.paf.backend.repository.AppUserRepository;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final AppUserRepository appUserRepository;

    public ProfileController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @GetMapping
    public AppUser getProfile(Authentication authentication) {
        return appUserRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PatchMapping("/image")
    public AppUser updateProfileImage(@RequestBody Map<String, String> request, Authentication authentication) {
        String base64Image = request.get("image");
        if (base64Image == null) {
            throw new RuntimeException("Image data is required");
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setProfileImage(base64Image);
        user.setUpdatedAt(Instant.now());

        return appUserRepository.save(user);
    }
}
