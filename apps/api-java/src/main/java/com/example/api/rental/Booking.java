package com.example.api.rental;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record Booking(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull boolean mine
) {
}
