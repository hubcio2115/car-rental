package com.example.api.car;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.Set;

@Builder
public record CarFilter(
        @Size(max = 64)
        String q,

        Set<CarType> type,

        Set<CarStatus> status,

        @DecimalMin(value = "0.00")
        @Digits(integer = 8, fraction = 2)
        BigDecimal minPrice,

        @DecimalMin(value = "0.00")
        @Digits(integer = 8, fraction = 2)
        BigDecimal maxPrice,

        Set<@Min(1) @Max(9) Integer> seats,

        Set<@Min(1) @Max(6) Integer> doors,

        @Min(1900) @Max(2100)
        Integer minYear,

        @Min(1900) @Max(2100)
        Integer maxYear
) {
}
