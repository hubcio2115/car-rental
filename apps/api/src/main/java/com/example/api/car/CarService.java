package com.example.api.car;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

@Service
@Validated
@RequiredArgsConstructor
public class CarService {
    private final CarRepository cars;

    public Car getById(Long id) {
        return cars.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public void deleteById(Long id) {
        cars.deleteById(id);
    }

    public Car create(@Valid CreateCarRequest request) {
        if (cars.existsByVin(request.vin())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "VIN already registered");
        }

        if (cars.existsByRegistrationNumber(request.registrationNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already registered");
        }

        var newCar = Car.builder()
                .model(request.model())
                .year(request.year())
                .registrationNumber(request.registrationNumber())
                .vin(request.vin())
                .seats(request.seats())
                .doors(request.doors())
                .pricePerDay(request.pricePerDay())
                .type(request.type())
                .build();

        return cars.save(newCar);
    }

    public Page<Car> list(Pageable pageable) {
        return cars.findAll(pageable);
    }
}