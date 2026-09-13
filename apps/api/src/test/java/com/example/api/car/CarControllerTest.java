package com.example.api.car;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the request binding and guards that would otherwise fail silently or as a 500: how the
 * multi value params arrive, that an unknown sort is dropped rather than reaching the Criteria API,
 * that out of range input is rejected before it becomes a query, and that a missing car is a 404.
 *
 * <p>Transactional, so the rows it inserts roll back and the seeded dev fleet is untouched.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CarControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarRepository cars;

    @Test
    @WithMockUser
    @DisplayName("a comma separated enum list binds as several values, not one")
    void commaSeparatedEnumsBind() throws Exception {
        cars.deleteAll();
        cars.save(car("Toyota Corolla", CarType.SEDAN, "150.00"));
        cars.save(car("Toyota RAV4", CarType.SUV, "250.00"));
        cars.save(car("Mercedes Vito", CarType.VAN, "400.00"));

        mockMvc.perform(get("/car").param("type", "SUV,SEDAN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(2));

        // The repeated form has to mean the same thing, since that is what URLSearchParams produces.
        mockMvc.perform(get("/car").param("type", "SUV").param("type", "SEDAN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(2));
    }

    @Test
    @WithMockUser
    @DisplayName("an unknown sort property falls back instead of failing the request")
    void unknownSortFallsBack() throws Exception {
        mockMvc.perform(get("/car").param("sort", "bogusColumn,asc"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    @DisplayName("a year outside the allowed range is rejected as bad input")
    void outOfRangeYearIsRejected() throws Exception {
        mockMvc.perform(get("/car").param("minYear", "1500"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("listing cars still requires a session")
    void listingRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/car")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    @DisplayName("the response uses the stable paged envelope, not the raw Page shape")
    void responseUsesPagedEnvelope() throws Exception {
        mockMvc.perform(get("/car").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page.size").value(5))
                .andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$.page.totalElements").exists());
    }

    @Test
    @WithMockUser
    @DisplayName("a car can be fetched by id")
    void getsCarById() throws Exception {
        var saved = cars.save(car("Skoda Octavia", CarType.SEDAN, "180.00"));

        mockMvc.perform(get("/car/{carId}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.model").value("Skoda Octavia"))
                .andExpect(jsonPath("$.vin").value(saved.getVin()));
    }

    @Test
    @WithMockUser
    @DisplayName("an unknown id is a 404, which the details page renders as not found")
    void unknownCarIsNotFound() throws Exception {
        mockMvc.perform(get("/car/{carId}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    private static Car car(String model, CarType type, String pricePerDay) {
        var slug = Integer.toHexString(model.hashCode()).toUpperCase();

        return Car.builder()
                .model(model)
                .year(2022)
                .registrationNumber("REG" + slug)
                .vin(("VIN" + slug + "00000000000000").substring(0, 17))
                .seats((byte) 5)
                .doors((byte) 4)
                .pricePerDay(new java.math.BigDecimal(pricePerDay))
                .status(CarStatus.AVAILABLE)
                .type(type)
                .build();
    }
}
