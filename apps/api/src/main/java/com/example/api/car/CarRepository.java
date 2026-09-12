package com.example.api.car;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarRepository extends JpaRepository<Car, Long> {
    boolean existsByVin(String v);

    boolean existsByRegistrationNumber(@NotBlank @Size(max = 16) String s);
}