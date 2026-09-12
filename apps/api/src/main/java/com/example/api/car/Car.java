package com.example.api.car;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "cars")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Car {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private String model;

    @NotNull
    @Column(nullable = false)
    private Integer year;

    @NotNull
    @Column(unique = true, nullable = false)
    private String registrationNumber;

    @NotNull
    @Column(unique = true, nullable = false, length = 17)
    private String vin;

    @NotNull
    @Column(nullable = false)
    @Schema(implementation = Integer.class)
    private Byte seats;

    @NotNull
    @Column(nullable = false)
    @Schema(implementation = Integer.class)
    private Byte doors;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerDay;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CarStatus status = CarStatus.AVAILABLE;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CarType type;

    @PrePersist
    void applyDefaults() {
        if (status == null) status = CarStatus.AVAILABLE;
    }
}

enum CarStatus {
    AVAILABLE,
    RENTED,
}

enum CarType {
    SUV,
    SEDAN,
    VAN
}
