package com.paf.backend.controller;

public record RegistrationResponse(boolean registered, String message, String email) {
}