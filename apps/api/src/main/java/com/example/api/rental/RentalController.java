package com.example.api.rental;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Rentals")
public class RentalController {
    private final RentalService rentalService;

    @PostMapping("/car/{carId}/rentals")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Rent a car for a range of whole days")
    public RentalView rent(@PathVariable Long carId, @Valid @RequestBody CreateRentalRequest request,
                           Authentication authentication) {
        return rentalService.create(carId, request, authentication.getName());
    }

    @GetMapping("/car/{carId}/rentals")
    @Operation(summary = "List a car's current and upcoming bookings")
    public List<Booking> bookings(@PathVariable Long carId, Authentication authentication) {
        return rentalService.bookingsForCar(carId, authentication.getName());
    }

    @GetMapping("/rentals")
    @Operation(summary = "List the signed-in user's rentals, newest first")
    public List<RentalView> mine(Authentication authentication) {
        return rentalService.mine(authentication.getName());
    }
}
