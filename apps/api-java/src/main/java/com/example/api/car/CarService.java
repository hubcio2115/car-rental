package com.example.api.car;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Service
@Validated
@RequiredArgsConstructor
public class CarService {
    private static final Set<String> SORTABLE = Set.of(
            "id", "model", "year", "type", "registrationNumber",
            "seats", "doors", "pricePerDay", "status");

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.ASC, "id");

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

    public Page<Car> list(CarFilter filter, Pageable pageable) {
        return cars.findAll(CarSpecifications.matching(filter), withSafeSort(pageable));
    }

    private static Pageable withSafeSort(Pageable pageable) {
        var orders = pageable.getSort().stream()
                .filter(order -> SORTABLE.contains(order.getProperty()))
                .toList();

        var sort = orders.isEmpty() ? DEFAULT_SORT : Sort.by(orders);
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }
}
