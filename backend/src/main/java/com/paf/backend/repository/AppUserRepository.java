package com.paf.backend.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.paf.backend.model.AppUser;

public interface AppUserRepository extends MongoRepository<AppUser, String> {

	Optional<AppUser> findByEmailIgnoreCase(String email);
}
