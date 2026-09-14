package com.example.api.rental;

import com.example.api.auth.AccountService;
import com.example.api.car.CarService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalService {
    static final int MAX_DAYS = 14;

    private static final String EXCLUSION_VIOLATION = "23P01";

    private final RentalRepository rentals;
    private final CarService carService;
    private final AccountService accountService;

    public RentalView create(Long carId, CreateRentalRequest request, String email) {
        var start = request.startDate();
        var end = request.endDate();

        if (start.isBefore(LocalDate.now())) {
            throw badRequest("A rental can't start in the past");
        }
        if (end.isBefore(start)) {
            throw badRequest("A rental must end on or after its start date");
        }

        var days = ChronoUnit.DAYS.between(start, end) + 1;
        if (days > MAX_DAYS) {
            throw badRequest("A rental can last at most " + MAX_DAYS + " days");
        }

        var car = carService.getById(carId);
        var rental = Rental.builder()
                .carId(car.getId())
                .accountId(accountService.getByEmail(email).getId())
                .startDate(start)
                .endDate(end)
                .totalPrice(car.getPricePerDay().multiply(BigDecimal.valueOf(days)))
                .build();

        try {
            rentals.saveAndFlush(rental);
        } catch (DataIntegrityViolationException ex) {
            if (NestedExceptionUtils.getMostSpecificCause(ex) instanceof SQLException sql
                    && EXCLUSION_VIOLATION.equals(sql.getSQLState())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "This car is already rented on some of those dates");
            }
            throw ex;
        }

        return new RentalView(rental.getId(), car.getId(), car.getModel(), car.getRegistrationNumber(),
                start, end, rental.getTotalPrice());
    }

    /// The car's current and upcoming bookings, flagging the caller's own.
    public List<Booking> bookingsForCar(Long carId, String email) {
        carService.getById(carId);
        var accountId = accountService.getByEmail(email).getId();

        return rentals.findByCarIdAndEndDateGreaterThanEqualOrderByStartDate(carId, LocalDate.now())
                .stream()
                .map(rental -> new Booking(
                        rental.getStartDate(), rental.getEndDate(), rental.getAccountId().equals(accountId)))
                .toList();
    }

    public List<RentalView> mine(String email) {
        return rentals.findViewsByAccountId(accountService.getByEmail(email).getId());
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
