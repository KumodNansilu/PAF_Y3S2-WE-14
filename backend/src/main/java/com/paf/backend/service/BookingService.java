package com.paf.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.paf.backend.controller.ApproveBookingRequest;
import com.paf.backend.controller.BookingResponse;
import com.paf.backend.controller.CreateBookingRequest;
import com.paf.backend.model.AppUser;
import com.paf.backend.model.BookingStatus;
import com.paf.backend.model.ResourceBooking;
import com.paf.backend.repository.AppUserRepository;
import com.paf.backend.repository.ResourceBookingRepository;

@Service
public class BookingService {

    private final ResourceBookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final AppUserRepository appUserRepository;

    public BookingService(ResourceBookingRepository bookingRepository, NotificationService notificationService,
            AppUserRepository appUserRepository) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.appUserRepository = appUserRepository;
    }

    public BookingResponse createBooking(CreateBookingRequest request, String userEmail, String userName) {
        ResourceBooking booking = new ResourceBooking(
                request.getResourceId(),
                request.getResourceName(),
                userEmail,
                userName,
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getPurpose());

        booking = bookingRepository.save(booking);

        // Create notification for all admins
        List<AppUser> admins = appUserRepository.findAdmins();
        for (AppUser admin : admins) {
            notificationService.createNotification(
                    admin.getEmail(),
                    "New Resource Booking Request",
                    String.format("User %s has requested to book %s on %s from %s to %s",
                            userName, request.getResourceName(), request.getBookingDate(),
                            request.getStartTime(), request.getEndTime()),
                    "BOOKING_REQUEST",
                    booking.getId());
        }

        return toResponse(booking);
    }

    public BookingResponse getBookingById(String bookingId) {
        ResourceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        return toResponse(booking);
    }

    public List<BookingResponse> getUserBookings(String userEmail) {
        List<ResourceBooking> bookings = bookingRepository.findByUserEmail(userEmail);
        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getUserBookings(String userEmail, int page) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, 10);
        org.springframework.data.domain.Page<ResourceBooking> bookingsPage = bookingRepository.findByUserEmail(userEmail, pageable);
        return bookingsPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getPendingBookings() {
        List<ResourceBooking> bookings = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.PENDING);
        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings() {
        List<ResourceBooking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings(int page) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, 10);
        org.springframework.data.domain.Page<ResourceBooking> bookingsPage = bookingRepository.findAll(pageable);
        return bookingsPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getResourceBookings(String resourceId) {
        List<ResourceBooking> bookings = bookingRepository.findByResourceId(resourceId);
        return bookings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse approveBooking(ApproveBookingRequest request, String adminEmail) {
        ResourceBooking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (request.isApproved()) {
            booking.setStatus(BookingStatus.APPROVED);
            booking.setApprovedByEmail(adminEmail);
            booking.setApprovedAt(Instant.now());

            // Notify user of approval
            notificationService.createNotification(
                    booking.getUserEmail(),
                    "Booking Approved",
                    String.format("Your booking for %s on %s from %s to %s has been approved.",
                            booking.getResourceName(), booking.getBookingDate(),
                            booking.getStartTime(), booking.getEndTime()),
                    "BOOKING_APPROVED",
                    booking.getId());
        } else {
            booking.setStatus(BookingStatus.REJECTED);
            booking.setRejectionReason(request.getRejectionReason());

            // Notify user of rejection
            notificationService.createNotification(
                    booking.getUserEmail(),
                    "Booking Rejected",
                    String.format("Your booking for %s on %s has been rejected. Reason: %s",
                            booking.getResourceName(), booking.getBookingDate(),
                            request.getRejectionReason()),
                    "BOOKING_REJECTED",
                    booking.getId());
        }

        booking.setUpdatedAt(Instant.now());
        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    public BookingResponse cancelBooking(String bookingId, String userEmail) {
        ResourceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getUserEmail().equals(userEmail)) {
            throw new IllegalArgumentException("Unauthorized to cancel this booking");
        }

        if (!booking.getStatus().equals(BookingStatus.PENDING) && !booking.getStatus().equals(BookingStatus.APPROVED)) {
            throw new IllegalArgumentException("Cannot cancel a booking with status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(Instant.now());
        booking = bookingRepository.save(booking);

        // Notify all admins
        List<AppUser> admins = appUserRepository.findAdmins();
        for (AppUser admin : admins) {
            notificationService.createNotification(
                    admin.getEmail(),
                    "Booking Cancelled",
                    String.format("User %s has cancelled their booking for %s",
                            booking.getUserName(), booking.getResourceName()),
                    "BOOKING_CANCELLED",
                    booking.getId());
        }

        return toResponse(booking);
    }

    private BookingResponse toResponse(ResourceBooking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setResourceId(booking.getResourceId());
        response.setResourceName(booking.getResourceName());
        response.setUserEmail(booking.getUserEmail());
        response.setUserName(booking.getUserName());
        response.setBookingDate(booking.getBookingDate());
        response.setStartTime(booking.getStartTime());
        response.setEndTime(booking.getEndTime());
        response.setPurpose(booking.getPurpose());
        response.setStatus(booking.getStatus());
        response.setRejectionReason(booking.getRejectionReason());
        response.setCreatedAt(booking.getCreatedAt());
        response.setUpdatedAt(booking.getUpdatedAt());
        response.setApprovedByEmail(booking.getApprovedByEmail());
        response.setApprovedAt(booking.getApprovedAt());
        return response;
    }
}
