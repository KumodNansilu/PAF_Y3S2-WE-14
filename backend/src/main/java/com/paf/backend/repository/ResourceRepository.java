package com.paf.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.paf.backend.model.Resource;

public interface ResourceRepository extends MongoRepository<Resource, String> {
	List<Resource> findAllByOrderByNameAsc();
}
