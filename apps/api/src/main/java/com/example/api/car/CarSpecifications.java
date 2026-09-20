package com.example.api.car;

import jakarta.persistence.criteria.Predicate;
import lombok.experimental.UtilityClass;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Locale;

@UtilityClass
class CarSpecifications {
    private static final char ESCAPE = '\\';

    /**
     * Combines the filter's populated fields with AND. Within a single set field
     * the values are OR'd, so {@code ?type=SUV,SEDAN&minYear=2020} reads as "an SUV
     * or a sedan, from 2020 or later".
     *
     * <p>
     * Predicates are collected imperatively rather than through
     * {@code Specification.allOf} or {@code Specification.where(null)}, whose null
     * handling has shifted between Spring Data versions.
     */
    static Specification<Car> matching(CarFilter filter) {
        return (root, _, cb) -> {
            var predicates = new ArrayList<Predicate>();

            if (StringUtils.hasText(filter.q())) {
                var pattern = "%" + escapeLike(filter.q().strip().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.like(cb.lower(root.get("model")), pattern, ESCAPE));
            }

            if (isPopulated(filter.type()))
                predicates.add(root.get("type").in(filter.type()));
            if (isPopulated(filter.status()))
                predicates.add(root.get("status").in(filter.status()));
            if (isPopulated(filter.seats()))
                predicates.add(root.get("seats").in(filter.seats()));
            if (isPopulated(filter.doors()))
                predicates.add(root.get("doors").in(filter.doors()));

            if (filter.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerDay"), filter.minPrice()));
            }
            if (filter.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerDay"), filter.maxPrice()));
            }
            if (filter.minYear() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("year"), filter.minYear()));
            }
            if (filter.maxYear() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("year"), filter.maxYear()));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static boolean isPopulated(Collection<?> values) {
        return values != null && !values.isEmpty();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
