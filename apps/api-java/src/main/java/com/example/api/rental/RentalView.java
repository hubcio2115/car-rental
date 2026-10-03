package com.example.api.rental;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RentalView(
        @NotNull Long id,
        @NotNull Long carId,
        @NotNull String carModel,
        @NotNull String registrationNumber,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull BigDecimal totalPrice
) {
}
