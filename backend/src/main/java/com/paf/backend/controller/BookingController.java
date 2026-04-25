package com.paf.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.paf.backend.service.BookingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('USER')")
    public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        // Get the user's name from the principal or use email as fallback
        String userName = userEmail;
        if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
            UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication
                    .getPrincipal();
            userName = userDetails.getUsername();
        }
        return bookingService.createBooking(request, userEmail, userName);
    }

    @GetMapping("/user/my-bookings")
    @PreAuthorize("hasRole('USER')")
    public List<BookingResponse> getUserBookings(@RequestParam(value = "page", required = false) Integer page, Authentication authentication) {
        String userEmail = authentication.getName();
        if (page != null) {
            return bookingService.getUserBookings(userEmail, page);
        }
        return bookingService.getUserBookings(userEmail);
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookingResponse> getPendingBookings() {
        return bookingService.getPendingBookings();
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookingResponse> getAllBookings(@RequestParam(value = "page", required = false) Integer page) {
        if (page != null) {
            return bookingService.getAllBookings(page);
        }
        return bookingService.getAllBookings();
    }

    @GetMapping("/resource/{resourceId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public List<BookingResponse> getResourceBookings(@PathVariable String resourceId) {
        return bookingService.getResourceBookings(resourceId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public BookingResponse getBooking(@PathVariable String id) {
        return bookingService.getBookingById(id);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponse approveBooking(@PathVariable String id, @Valid @RequestBody ApproveBookingRequest request,
            Authentication authentication) {
        request.setBookingId(id);
        String adminEmail = authentication.getName();
        return bookingService.approveBooking(request, adminEmail);
    }

    @DeleteMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public BookingResponse cancelBooking(@PathVariable String id, Authentication authentication) {
        String userEmail = authentication.getName();
        return bookingService.cancelBooking(id, userEmail);
    }
}
