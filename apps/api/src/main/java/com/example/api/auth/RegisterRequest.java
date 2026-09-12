package com.example.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Locale;

/**
 * @param password capped at 72 bytes because BCrypt silently truncates past that, which would
 *                 make anything longer indistinguishable from its own prefix
 */
public record RegisterRequest(
        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
    public RegisterRequest {
        email = normalize(email);
    }

    /// Stored emails are lowercase, so the unique index and the login lookup agree on casing.
    private static String normalize(String email) {
        return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
