package com.example.api.rental;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FinishRentalRequest(
        @NotNull
        LocalDate endDate
) {
}
