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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the booking rules end to end: inclusive day counting and pricing, that the database refuses
 * overlapping days, which ranges are rejected up front, and what a renter can see of other rentals.
 *
 * <p>Transactional, so the accounts, car and rentals it creates roll back. Dates are relative to
 * today because the API rejects rentals that start in the past.
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
    private Long otherId;

    @BeforeEach
    void seed() {
        accounts.register(new RegisterRequest(RENTER, "password123"));
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
        rentals.save(Rental.builder()
                .carId(car.getId())
                .accountId(otherId)
                .startDate(today.plusDays(1))
                .endDate(today.plusDays(2))
                .totalPrice(new BigDecimal("400.00"))
                .build());
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

    private ResultActions rent(LocalDate start, LocalDate end) throws Exception {
        return mockMvc.perform(post("/car/{carId}/rentals", car.getId())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"startDate": "%s", "endDate": "%s"}""".formatted(start, end)));
    }
}
