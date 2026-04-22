package com.paf.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.paf.backend.model.Ticket;

public interface TicketRepository extends MongoRepository<Ticket, String> {
	List<Ticket> findByCreatedByEmailOrderByCreatedAtDesc(String createdByEmail);
}
