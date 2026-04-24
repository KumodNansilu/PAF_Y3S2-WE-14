package com.paf.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.paf.backend.model.AppUser;

public interface AppUserRepository extends MongoRepository<AppUser, String> {

	Optional<AppUser> findByEmailIgnoreCase(String email);

	@Query("{ 'roles': { $in: ['ROLE_ADMIN'] } }")
	List<AppUser> findAdmins();
}
