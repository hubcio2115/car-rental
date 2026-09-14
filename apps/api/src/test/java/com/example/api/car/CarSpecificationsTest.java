package com.example.api.car;

import com.example.api.auth.Account;
import com.example.api.rental.Rental;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Covers the behaviour of the filter that is not obvious from reading it: how values combine, which
 * bounds are inclusive, that a search term cannot smuggle in SQL wildcards, and that status follows
 * whichever rental covers today.
 *
 * <p>Runs against the real Postgres rather than an embedded database, because the assertions depend
 * on actual SQL semantics: LIKE with an ESCAPE clause, NUMERIC comparison and daterange containment.
 * Requires `docker compose -f docker/compose.yaml up -d`, which is already step one of running the app.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class CarSpecificationsTest {
    @Autowired
    private CarRepository cars;

    @Autowired
    private EntityManager em;

    @BeforeEach
    void seed() {
        em.createQuery("delete from Rental").executeUpdate();
        cars.deleteAll();

        var fleet = cars.saveAll(List.of(
                car("Toyota Corolla", 2020, CarType.SEDAN, (byte) 5, (byte) 4, "150.00"),
                car("Toyota RAV4", 2022, CarType.SUV, (byte) 5, (byte) 5, "250.00"),
                car("Kia Sorento", 2024, CarType.SUV, (byte) 7, (byte) 5, "300.00"),
                car("Mercedes Vito", 2018, CarType.VAN, (byte) 9, (byte) 5, "400.00"),
                car("50% Discount Special", 2021, CarType.SEDAN, (byte) 5, (byte) 4, "99.00")));

        var renter = Account.builder().email("car-specs@test.example").passwordHash("unused").build();
        em.persist(renter);

        var today = LocalDate.now();
        rent(fleet.get(1), renter, today.minusDays(1), today.plusDays(1)); // RAV4, out today
        rent(fleet.get(2), renter, today.minusDays(3), today.minusDays(1)); // Sorento, back yesterday
        rent(fleet.get(3), renter, today.plusDays(1), today.plusDays(2)); // Vito, leaves tomorrow

        // The saved cars stay cached with their in-memory status; drop them so reads derive it.
        em.flush();
        em.clear();
    }

    @Test
    @DisplayName("an empty filter matches the whole fleet")
    void emptyFilterMatchesEverything() {
        assertThat(matching(CarFilter.builder().build())).hasSize(5);
    }

    @Test
    @DisplayName("q matches a substring of the model, ignoring case")
    void searchIsCaseInsensitiveSubstring() {
        assertThat(models(CarFilter.builder().q("corolla").build())).containsExactly("Toyota Corolla");
        assertThat(models(CarFilter.builder().q("TOYOTA").build()))
                .containsExactlyInAnyOrder("Toyota Corolla", "Toyota RAV4");
        assertThat(models(CarFilter.builder().q("oyot").build()))
                .containsExactlyInAnyOrder("Toyota Corolla", "Toyota RAV4");
    }

    @Test
    @DisplayName("wildcards in q are escaped rather than widening the search")
    void searchEscapesLikeWildcards() {
        // Unescaped, "%" would match every row and "_" any single character.
        assertThat(models(CarFilter.builder().q("%").build())).containsExactly("50% Discount Special");
        assertThat(models(CarFilter.builder().q("_").build())).isEmpty();
        assertThat(models(CarFilter.builder().q("50%").build())).containsExactly("50% Discount Special");
    }

    @Test
    @DisplayName("values within one field are OR'd, and separate fields are AND'd")
    void multiValueFieldsOrWithinAndAcrossFields() {
        assertThat(matching(CarFilter.builder().type(Set.of(CarType.SUV, CarType.VAN)).build())).hasSize(3);

        assertThat(models(CarFilter.builder()
                .type(Set.of(CarType.SUV, CarType.VAN))
                .status(Set.of(CarStatus.AVAILABLE))
                .build()))
                .containsExactlyInAnyOrder("Kia Sorento", "Mercedes Vito");
    }

    @Test
    @DisplayName("status is RENTED only while a rental covers today, not the day before or after")
    void statusFollowsTodaysRental() {
        assertThat(models(CarFilter.builder().status(Set.of(CarStatus.RENTED)).build()))
                .containsExactly("Toyota RAV4");

        assertThat(cars.findAll())
                .filteredOn(car -> car.getStatus() == CarStatus.RENTED)
                .extracting(Car::getModel)
                .containsExactly("Toyota RAV4");
    }

    @Test
    @DisplayName("price and year bounds include their endpoints")
    void boundsAreInclusive() {
        assertThat(models(CarFilter.builder().minPrice(new BigDecimal("250.00")).maxPrice(new BigDecimal("300.00")).build()))
                .containsExactlyInAnyOrder("Toyota RAV4", "Kia Sorento");

        assertThat(models(CarFilter.builder().minYear(2020).maxYear(2020).build()))
                .containsExactly("Toyota Corolla");
    }

    @Test
    @DisplayName("seats and doors filter on exact counts")
    void seatsAndDoorsMatchExactCounts() {
        assertThat(models(CarFilter.builder().seats(Set.of(7, 9)).build()))
                .containsExactlyInAnyOrder("Kia Sorento", "Mercedes Vito");

        assertThat(matching(CarFilter.builder().doors(Set.of(4)).build())).hasSize(2);
    }

    private List<Car> matching(CarFilter filter) {
        return cars.findAll(CarSpecifications.matching(filter), Pageable.unpaged()).getContent();
    }

    private List<String> models(CarFilter filter) {
        return matching(filter).stream().map(Car::getModel).toList();
    }

    private void rent(Car car, Account renter, LocalDate start, LocalDate end) {
        em.persist(Rental.builder()
                .carId(car.getId())
                .accountId(renter.getId())
                .startDate(start)
                .endDate(end)
                .totalPrice(BigDecimal.ONE)
                .build());
    }

    private static Car car(String model, int year, CarType type, byte seats, byte doors, String pricePerDay) {
        // Registration and VIN are unique per model here only because the tests never assert on them.
        var slug = Integer.toHexString(model.hashCode()).toUpperCase();

        return Car.builder()
                .model(model)
                .year(year)
                .registrationNumber("REG" + slug)
                .vin(("VIN" + slug + "00000000000000").substring(0, 17))
                .seats(seats)
                .doors(doors)
                .pricePerDay(new BigDecimal(pricePerDay))
                .type(type)
                .build();
    }
}
