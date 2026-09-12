package com.example.api.car;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Locale;

/**
 * @param vin         17 chars, excluding I, O and Q to avoid digit confusion
 * @param pricePerDay matches the NUMERIC(10,2) price column: 8 integer digits, 2 fractional
 */
public record CreateCarRequest(
        @NotBlank
        @Size(max = 64)
        String model,

        @NotNull
        @Min(1900)
        @Max(2100)
        Integer year,

        @NotBlank
        @Size(max = 16)
        String registrationNumber,

        @NotBlank
        @Pattern(regexp = "^[A-HJ-NPR-Z0-9]{17}$", message = "must be a valid 17 character VIN")
        String vin,

        @NotNull
        @Min(1)
        @Max(9)
        Byte seats,

        @NotNull
        @Min(1)
        @Max(6)
        Byte doors,

        @NotNull
        @DecimalMin(value = "0.00", inclusive = false)
        @Digits(integer = 8, fraction = 2)
        BigDecimal pricePerDay,

        @NotNull
        CarType type
) {
    public CreateCarRequest {
        registrationNumber = normalize(registrationNumber);
        vin = normalize(vin);
    }

    private static String normalize(String value) {
        return value == null ? null
                : value.strip().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }
}
