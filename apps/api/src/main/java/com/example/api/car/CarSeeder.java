package com.example.api.car;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Fills an empty fleet with placeholder cars so the browse view has something to show. Dev only, and
 * a no-op once any car exists, so restarting never duplicates or overwrites.
 *
 * <p>The generator is seeded with a constant: a reset database reproduces the same 80 cars, which
 * keeps screenshots and manual testing stable.
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
class CarSeeder implements ApplicationRunner {
    private static final int FLEET_SIZE = 80;
    private static final long SEED = 42L;

    /**
     * Excludes I, O and Q, which VINs omit to avoid confusion with 1 and 0.
     */
    private static final String VIN_ALPHABET = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

    private static final Map<CarType, List<String>> MODELS = Map.of(
            CarType.SEDAN, List.of(
                    "Toyota Corolla", "Honda Accord", "Skoda Octavia", "Mazda 6",
                    "BMW 320i", "Volkswagen Passat", "Audi A4", "Hyundai Elantra"),
            CarType.SUV, List.of(
                    "Toyota RAV4", "Mazda CX-5", "Nissan Qashqai", "Hyundai Tucson",
                    "Kia Sorento", "Volkswagen Tiguan", "Volvo XC60", "Ford Kuga"),
            CarType.VAN, List.of(
                    "Volkswagen Transporter", "Ford Transit Custom", "Mercedes Vito",
                    "Renault Trafic", "Peugeot Expert", "Opel Vivaro"));

    /**
     * Registration prefixes, cycled. The numeric part is index derived, so plates stay unique.
     */
    private static final List<String> PLATE_PREFIXES =
            List.of("KR", "WA", "GD", "PO", "WR", "LU", "KA", "SK");

    private static final Map<CarType, String> VIN_PREFIX = Map.of(
            CarType.SEDAN, "JTD",
            CarType.SUV, "JM3",
            CarType.VAN, "WV2");

    /**
     * Cheapest plausible day rate per type, before age and jitter.
     */
    private static final Map<CarType, Integer> BASE_PRICE = Map.of(
            CarType.SEDAN, 120,
            CarType.SUV, 200,
            CarType.VAN, 280);

    private final CarRepository cars;

    @Override
    public void run(@NonNull ApplicationArguments args) {
        if (cars.count() > 0) return;

        var fleet = generate();
        cars.saveAll(fleet);
        log.info("Seeded {} cars", fleet.size());
    }

    private static List<Car> generate() {
        var random = new Random(SEED);

        // Mixed so ids are not grouped by type, which would make paging look artificial.
        var types = new ArrayList<CarType>(FLEET_SIZE);
        types.addAll(Collections.nCopies(32, CarType.SEDAN));
        types.addAll(Collections.nCopies(30, CarType.SUV));
        types.addAll(Collections.nCopies(18, CarType.VAN));
        Collections.shuffle(types, random);

        // Cycled rather than randomly picked, so the fleet is stocked evenly across models
        // instead of leaving one model with ten copies and another with one.
        var modelCursor = new EnumMap<CarType, Integer>(CarType.class);

        var fleet = new ArrayList<Car>(FLEET_SIZE);
        for (var index = 0; index < FLEET_SIZE; index++) {
            var type = types.get(index);
            var year = 2015 + random.nextInt(11);

            fleet.add(Car.builder()
                    .model(nextModel(type, modelCursor))
                    .year(year)
                    .registrationNumber(plate(index))
                    .vin(vin(type, index, random))
                    .seats(seats(type, random))
                    .doors(doors(type, random))
                    .pricePerDay(pricePerDay(type, year, random))
                    .status(random.nextInt(100) < 20 ? CarStatus.RENTED : CarStatus.AVAILABLE)
                    .type(type)
                    .build());
        }

        return fleet;
    }

    private static String nextModel(CarType type, Map<CarType, Integer> cursor) {
        var options = MODELS.get(type);
        var next = cursor.merge(type, 1, Integer::sum) - 1;
        return options.get(next % options.size());
    }

    private static byte seats(CarType type, Random random) {
        return switch (type) {
            case SEDAN -> 5;
            case SUV -> random.nextInt(4) == 0 ? (byte) 7 : (byte) 5;
            case VAN -> (byte) (7 + random.nextInt(3));
        };
    }

    private static byte doors(CarType type, Random random) {
        return switch (type) {
            case SEDAN -> 4;
            case SUV -> 5;
            case VAN -> random.nextBoolean() ? (byte) 4 : (byte) 5;
        };
    }

    /**
     * Newer cars cost more, with a little scatter so prices are not a clean ladder.
     */
    private static BigDecimal pricePerDay(CarType type, int year, Random random) {
        var whole = BASE_PRICE.get(type) + (year - 2015) * 9 + random.nextInt(46);
        var quarters = random.nextInt(4) * 25;
        return BigDecimal.valueOf(whole).add(BigDecimal.valueOf(quarters, 2)).setScale(2, RoundingMode.UNNECESSARY);
    }

    private static String plate(int index) {
        return "%s %04d".formatted(PLATE_PREFIXES.get(index % PLATE_PREFIXES.size()), 1000 + index * 11);
    }

    /**
     * 3 char prefix, 8 random chars, then a 6 digit serial off the index so VINs cannot collide.
     */
    private static String vin(CarType type, int index, Random random) {
        var middle = new StringBuilder(8);
        for (var i = 0; i < 8; i++) {
            middle.append(VIN_ALPHABET.charAt(random.nextInt(VIN_ALPHABET.length())));
        }
        return "%s%s%06d".formatted(VIN_PREFIX.get(type), middle, index);
    }
}
