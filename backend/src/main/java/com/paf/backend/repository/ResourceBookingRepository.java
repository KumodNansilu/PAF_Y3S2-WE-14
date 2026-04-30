package com.paf.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.paf.backend.model.ResourceBooking;
import com.paf.backend.model.BookingStatus;

@Repository
public interface ResourceBookingRepository extends MongoRepository<ResourceBooking, String> {
    List<ResourceBooking> findByUserEmail(String userEmail);
    org.springframework.data.domain.Page<ResourceBooking> findByUserEmail(String userEmail, org.springframework.data.domain.Pageable pageable);

    List<ResourceBooking> findByResourceId(String resourceId);

    List<ResourceBooking> findByStatus(BookingStatus status);

    List<ResourceBooking> findByResourceIdAndBookingDate(String resourceId, LocalDate bookingDate);

    List<ResourceBooking> findByUserEmailAndStatus(String userEmail, BookingStatus status);

    List<ResourceBooking> findByStatusOrderByCreatedAtDesc(BookingStatus status);
}
