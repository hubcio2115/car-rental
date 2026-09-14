package com.example.api.car;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.Formula;

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
    @Formula("""
            (CASE WHEN EXISTS (
                SELECT 1 FROM rentals r
                WHERE r.car_id = id AND daterange(r.start_date, r.end_date, '[]') @> CURRENT_DATE
            ) THEN 'RENTED' ELSE 'AVAILABLE' END)""")
    @Builder.Default
    @Setter(AccessLevel.NONE)
    private CarStatus status = CarStatus.AVAILABLE;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CarType type;
}
