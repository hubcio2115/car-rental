package com.example.api.rental;

import com.example.api.auth.AccountService;
import com.example.api.auth.RegisterRequest;
import com.example.api.car.Car;
import com.example.api.car.CarRepository;
import com.example.api.car.CarType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the booking rules end to end: inclusive day counting and pricing, that the database refuses
 * overlapping days, which ranges are rejected up front, what a renter can see of other rentals, and
 * cancelling or finishing a rental early.
 *
 * <p>Transactional, so the accounts, car and rentals it creates roll back. Dates are relative to
 * today because the API rejects rentals that start in the past. Rentals that are already running
 * are inserted directly for the same reason.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RentalControllerTest {
    private static final String RENTER = "renter@rental-test.example";
    private static final String OTHER = "other@rental-test.example";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarRepository cars;

    @Autowired
    private RentalRepository rentals;

    @Autowired
    private AccountService accounts;

    @Autowired
    private EntityManager em;

    private final LocalDate today = LocalDate.now();
    private Car car;
    private Long renterId;
    private Long otherId;

    @BeforeEach
    void seed() {
        renterId = accounts.register(new RegisterRequest(RENTER, "password123")).getId();
        otherId = accounts.register(new RegisterRequest(OTHER, "password123")).getId();

        car = cars.save(Car.builder()
                .model("Mazda CX-5")
                .year(2022)
                .registrationNumber("TST 0001")
                .vin("TSTRENTAL00000001")
                .seats((byte) 5)
                .doors((byte) 5)
                .pricePerDay(new BigDecimal("200.00"))
                .type(CarType.SUV)
                .build());
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("a rental costs price per day times its inclusive day count, and one covering today marks the car RENTED")
    void rentingPricesDaysAndFlipsStatus() throws Exception {
        rent(today, today.plusDays(2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPrice").value(600.0))
                .andExpect(jsonPath("$.carModel").value("Mazda CX-5"));

        // The test transaction shares one persistence context, which would hand back the cached car
        // instead of deriving its status again.
        em.clear();

        mockMvc.perform(get("/car/{carId}", car.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RENTED"));
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("ranges include both end days, so sharing a single day is a conflict")
    void overlappingDaysConflict() throws Exception {
        rent(today.plusDays(3), today.plusDays(5)).andExpect(status().isCreated());
        rent(today.plusDays(6), today.plusDays(7)).andExpect(status().isCreated());

        // Last on purpose: the constraint violation aborts the surrounding Postgres transaction.
        rent(today.plusDays(5), today.plusDays(6))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("This car is already rented on some of those dates"));
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("past starts, reversed ranges and rentals longer than 14 days are rejected")
    void invalidRangesAreRejected() throws Exception {
        rent(today.minusDays(1), today.plusDays(1)).andExpect(status().isBadRequest());
        rent(today.plusDays(4), today.plusDays(2)).andExpect(status().isBadRequest());
        rent(today.plusDays(1), today.plusDays(15)).andExpect(status().isBadRequest());

        rent(today.plusDays(1), today.plusDays(14)).andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("a car's calendar shows other renters' dates, but only the caller's rentals are listed as theirs")
    void bookingsAreSharedButRentalsArePrivate() throws Exception {
        book(otherId, today.plusDays(1), today.plusDays(2), "400.00");
        rent(today.plusDays(4), today.plusDays(4)).andExpect(status().isCreated());

        mockMvc.perform(get("/car/{carId}/rentals", car.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].mine").value(false))
                .andExpect(jsonPath("$[1].mine").value(true));

        mockMvc.perform(get("/rentals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].startDate").value(today.plusDays(4).toString()));
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("cancelling an upcoming rental deletes it and frees its days")
    void cancellingFreesDays() throws Exception {
        var upcoming = book(renterId, today.plusDays(2), today.plusDays(3), "400.00");

        cancel(upcoming).andExpect(status().isNoContent());

        // Listing makes Hibernate flush the pending delete. Otherwise, the next rental's insert could
        // reach the database first, since everything here shares one test transaction.
        mockMvc.perform(get("/rentals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        rent(today.plusDays(2), today.plusDays(3)).andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("only upcoming rentals can be cancelled, and only by their renter")
    void cancellingIsLimitedToOwnUpcomingRentals() throws Exception {
        var active = book(renterId, today.minusDays(1), today.plusDays(1), "600.00");
        var others = book(otherId, today.plusDays(3), today.plusDays(4), "400.00");

        cancel(active).andExpect(status().isConflict());
        cancel(others).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("finishing early shortens the rental, charges the booked daily rate for the days kept and frees the rest")
    void finishingEarlyRepricesAndFreesDays() throws Exception {
        // Booked at 100 a day, while the car now costs 200.
        var active = book(renterId, today.minusDays(1), today.plusDays(3), "500.00");

        finish(active, today.plusDays(1)).andExpect(status().isNoContent());

        // Listing also flushes the update ahead of the next insert, see cancellingFreesDays.
        mockMvc.perform(get("/rentals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].endDate").value(today.plusDays(1).toString()))
                .andExpect(jsonPath("$[0].totalPrice").value(300.0));

        rent(today.plusDays(2), today.plusDays(3)).andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(RENTER)
    @DisplayName("a rental can finish between today and its current end, and only once it has started")
    void invalidFinishesAreRejected() throws Exception {
        var active = book(renterId, today.minusDays(1), today.plusDays(2), "800.00");
        var upcoming = book(renterId, today.plusDays(5), today.plusDays(6), "400.00");

        finish(active, today.minusDays(1)).andExpect(status().isBadRequest());
        finish(active, today.plusDays(2)).andExpect(status().isBadRequest());
        finish(upcoming, today.plusDays(5)).andExpect(status().isConflict());
    }

    /// Inserts a rental directly, skipping the API's rules, e.g. to get one that is already running.
    private Rental book(Long accountId, LocalDate start, LocalDate end, String totalPrice) {
        return rentals.save(Rental.builder()
                .carId(car.getId())
                .accountId(accountId)
                .startDate(start)
                .endDate(end)
                .totalPrice(new BigDecimal(totalPrice))
                .build());
    }

    private ResultActions rent(LocalDate start, LocalDate end) throws Exception {
        return mockMvc.perform(post("/car/{carId}/rentals", car.getId())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"startDate": "%s", "endDate": "%s"}""".formatted(start, end)));
    }

    private ResultActions cancel(Rental rental) throws Exception {
        return mockMvc.perform(delete("/rentals/{rentalId}", rental.getId()).with(csrf()));
    }

    private ResultActions finish(Rental rental, LocalDate endDate) throws Exception {
        return mockMvc.perform(post("/rentals/{rentalId}/finish", rental.getId())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"endDate": "%s"}""".formatted(endDate)));
    }
}
