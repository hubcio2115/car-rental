package com.example.api.car;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/car", produces = MediaType.APPLICATION_JSON_VALUE)
@AllArgsConstructor
@Tag(name = "Cars")
public class CarController {
    private final CarService carService;

    @GetMapping
    @Operation(summary = "List cars matching the given filters")
    public Page<Car> getCars(
            @Valid @ParameterObject @ModelAttribute CarFilter filter,
            @ParameterObject @PageableDefault(size = 12, sort = "id") Pageable pageable) {
        return carService.list(filter, pageable);
    }

    @GetMapping(value = "/{carId}")
    @Operation(summary = "Get one car by id")
    public Car getCarById(@PathVariable Long carId) {
        return carService.getById(carId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a car")
    public Car createCar(@Valid @RequestBody CreateCarRequest request) {
        return carService.create(request);
    }

    @DeleteMapping(value = "/{carId}")
    @Operation(summary = "Delete a car by id")
    public void deleteById(@PathVariable Long carId) {
        carService.deleteById(carId);
    }
}
