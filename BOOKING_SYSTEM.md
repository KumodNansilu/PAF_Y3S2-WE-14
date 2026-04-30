# Resource Booking System Documentation

## Overview

The Resource Booking System allows users to request bookings for resources (lecture halls, labs, meeting rooms, equipment) that require admin approval. The system provides real-time notifications and status tracking for both users and administrators.

## Features

### For Users

- **Browse Resources**: View available resources with filters (type, location, capacity)
- **Book Resources**: Request bookings by selecting date, time, and purpose
- **Track Bookings**: View booking history and current status
- **Cancel Bookings**: Cancel pending or approved bookings
- **Receive Notifications**: Get instant notifications when bookings are approved/rejected

### For Administrators

- **Pending Bookings**: Review all pending booking requests
- **Approve/Reject**: Accept or reject bookings with optional rejection reasons
- **Notifications**: Receive notifications when new bookings are requested or cancelled

### Notifications

The system supports automatic notifications for:

- **New Booking Request**: When a user submits a new booking
- **Booking Approved**: When an admin approves a booking
- **Booking Rejected**: When an admin rejects a booking with reason
- **Booking Cancelled**: When a user cancels a booking

## User Guide

### How to Book a Resource

1. **Navigate to Bookings**
   - Click on the "📅 Resource Booking System" in the main navigation

2. **Browse Resources Tab**
   - Use filters to find resources (type, location)
   - Click "Book Now" on the desired resource

3. **Fill Booking Form**
   - **Booking Date**: Select the desired date (cannot be in the past)
   - **Start Time**: Enter the start time (HH:MM format)
   - **End Time**: Enter the end time (must be after start time)
   - **Purpose**: Describe why you need the resource

4. **Submit Request**
   - Click "Submit Booking Request"
   - You'll receive a confirmation message

5. **Track Status**
   - Go to "My Bookings" tab to view all your bookings
   - Check the status column for updates (PENDING, APPROVED, REJECTED, CANCELLED)

### How to Cancel a Booking

1. Go to "My Bookings" tab
2. Find the booking you want to cancel
3. Click "Cancel" button (available only for PENDING or APPROVED bookings)
4. Confirm the cancellation

## Admin Guide

### How to Review and Approve Bookings

1. **Navigate to Admin Dashboard**
   - Click on the admin profile icon or use `/admin` route
   - Click on "📅 Resource Bookings" tab

2. **View Pending Bookings**
   - The page shows all pending bookings that need approval
   - Shows: Resource, User info, Date, Time, and Purpose

3. **Approve a Booking**
   - Click "✓ Approve" button
   - The user will be notified immediately
   - Booking status changes to APPROVED

4. **Reject a Booking**
   - Click "✗ Reject" button
   - A modal will appear asking for rejection reason
   - Enter the reason (e.g., "Resource already booked", "Invalid time slot")
   - Click "Confirm Rejection"
   - The user will receive notification with the reason

## API Endpoints

### Booking Management

#### Create Booking

```
POST /api/bookings
Content-Type: application/json
Authorization: Bearer <token>

{
  "resourceId": "resource-id",
  "resourceName": "Lecture Hall A",
  "bookingDate": "2026-04-25",
  "startTime": "09:00",
  "endTime": "11:00",
  "purpose": "Class lecture for 50 students"
}
```

#### Get My Bookings

```
GET /api/bookings/user/my-bookings
Authorization: Bearer <token>
```

#### Get All User Bookings

```
GET /api/bookings/user/my-bookings
Authorization: Bearer <token>
```

#### Get Pending Bookings (Admin Only)

```
GET /api/bookings/admin/pending
Authorization: Bearer <admin-token>
```

#### Get All Bookings (Admin Only)

```
GET /api/bookings/admin/all
Authorization: Bearer <admin-token>
```

#### Get Booking by ID

```
GET /api/bookings/{bookingId}
Authorization: Bearer <token>
```

#### Get Resource Bookings

```
GET /api/bookings/resource/{resourceId}
Authorization: Bearer <token>
```

#### Approve/Reject Booking (Admin Only)

```
PUT /api/bookings/{bookingId}/approve
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "approved": true
}

OR for rejection:

{
  "approved": false,
  "rejectionReason": "Time slot is no longer available"
}
```

#### Cancel Booking

```
DELETE /api/bookings/{bookingId}/cancel
Authorization: Bearer <token>
```

## Data Model

### ResourceBooking

```
{
  "id": "booking-id",
  "resourceId": "resource-id",
  "resourceName": "Lecture Hall A",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "bookingDate": "2026-04-25",
  "startTime": "09:00",
  "endTime": "11:00",
  "purpose": "Class lecture",
  "status": "PENDING",
  "rejectionReason": null,
  "createdAt": "2026-04-24T10:30:00Z",
  "updatedAt": "2026-04-24T10:30:00Z",
  "approvedByEmail": null,
  "approvedAt": null
}
```

### BookingStatus

- **PENDING**: Booking is awaiting admin approval
- **APPROVED**: Booking has been approved
- **REJECTED**: Booking has been rejected
- **CANCELLED**: Booking has been cancelled by user

## Notification Types

- **BOOKING_REQUEST**: New booking request submitted
- **BOOKING_APPROVED**: Booking has been approved
- **BOOKING_REJECTED**: Booking has been rejected
- **BOOKING_CANCELLED**: Booking has been cancelled

## File Structure

### Backend

```
backend/src/main/java/com/paf/backend/
├── model/
│   ├── ResourceBooking.java
│   └── BookingStatus.java
├── repository/
│   └── ResourceBookingRepository.java
├── service/
│   └── BookingService.java
└── controller/
    ├── BookingController.java
    ├── CreateBookingRequest.java
    ├── ApproveBookingRequest.java
    └── BookingResponse.java
```

### Frontend

```
frontend/src/
├── pages/
│   └── ResourceBookingPage.jsx
├── services/
│   └── api.js (updated with booking endpoints)
└── styles/
    └── ResourceBookingPage.css
```

## Database Collections

### resource_bookings

MongoDB collection storing all resource bookings

```
db.resource_bookings.find()
```

### Create Index for Performance

```
db.resource_bookings.createIndex({ "status": 1 })
db.resource_bookings.createIndex({ "userEmail": 1 })
db.resource_bookings.createIndex({ "resourceId": 1 })
db.resource_bookings.createIndex({ "bookingDate": 1 })
```

## Workflow Diagram

```
┌─────────────────┐
│  User Submits   │
│  Booking        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Booking Created        │
│  Status: PENDING        │
│  Notification to Admin  │
└────────┬────────────────┘
         │
         ▼
  ┌──────────────────────┐
  │  Admin Reviews in    │
  │  Dashboard           │
  └──────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌────────┐
│Approve │  │ Reject │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────────────────────┐
│Status Update + Message │
│to User                 │
└────────┬───────────────┘
         │
         ▼
┌──────────────────────┐
│User Views Status in  │
│My Bookings Tab       │
└──────────────────────┘
```

## Best Practices

### For Users

1. **Plan Ahead**: Book resources in advance when possible
2. **Accurate Purpose**: Provide clear booking purpose for admin review
3. **Check Notifications**: Monitor notifications for booking status updates
4. **Cancel Early**: Cancel bookings you no longer need to free up resources

### For Admins

1. **Regular Review**: Check pending bookings regularly
2. **Provide Reasons**: Always give clear rejection reasons
3. **Communicate**: Use rejection reasons to guide users on proper booking procedures
4. **Track Patterns**: Monitor booking patterns to identify peak usage times

## Troubleshooting

### Booking Not Appearing in Dashboard

- Refresh the page or wait up to 30 seconds for notifications to sync
- Check if you have the correct role (must be USER role to book)

### Cannot Book a Resource

- Ensure the resource status is "ACTIVE"
- Check that the booking date is in the future
- Verify end time is after start time

### Missing Notifications

- Check your notification settings
- Ensure your email address is correct in your profile
- Wait for the 30-second notification poll interval

### Rejected Booking Issues

- Read the rejection reason carefully
- Contact your admin if the reason is unclear
- Try rebooking with a different time or resource

## Configuration

### Notification Poll Interval

Currently set to 30 seconds. To change, edit `App.js`:

```javascript
const interval = setInterval(fetchNotifications, 30000); // Change 30000 to desired milliseconds
```

### Date Format

Bookings use ISO date format (YYYY-MM-DD) and 24-hour time format (HH:MM)

## Support

For technical issues or feature requests, please contact your system administrator.

---

Last Updated: April 24, 2026
