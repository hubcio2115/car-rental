package com.example.api.car;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/car")
@AllArgsConstructor
public class CarController {
    private final CarService carService;

    @GetMapping
    public Page<Car> getCars(@PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return carService.list(pageable);
    }

    @GetMapping(value = "/{carId}")
    public Car getCarById(@PathVariable Long carId) {
        return carService.getById(carId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Car createCar(@Valid @RequestBody CreateCarRequest request) {
        return carService.create(request);
    }

    @DeleteMapping(value = "/{carId}")
    public void deleteById(@PathVariable Long carId) {
        carService.deleteById(carId);
    }
}
