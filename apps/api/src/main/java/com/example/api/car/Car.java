package com.example.api.car;

import java.math.BigDecimal;

import jakarta.persistence.*;
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

    private String model;
    private int year;

    @Column(unique = true, nullable = false)
    private String registrationNumber;

    @Column(unique = true, nullable = false, length = 17)
    private String vin;

    private byte seats;
    private byte doors;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CarStatus status = CarStatus.AVAILABLE;

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
