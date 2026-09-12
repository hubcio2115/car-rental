package com.example.api.error;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/// Maps unique index violations onto 409s naming the offending field.
@RestControllerAdvice
class PersistenceExceptionHandler {

    private static final Map<String, String> FIELD_BY_CONSTRAINT = Map.of(
            "uq_cars_vin", "vin",
            "uq_cars_registration_number", "registrationNumber"
    );

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail onDataIntegrityViolation(DataIntegrityViolationException ex) {
        var field = ex.getCause() instanceof ConstraintViolationException cve
                ? FIELD_BY_CONSTRAINT.get(cve.getConstraintName())
                : null;

        if (field == null) {
            return ProblemDetail.forStatusAndDetail(
                    HttpStatus.CONFLICT, "Request conflicts with existing data");
        }

        var problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "A car with this " + field + " already exists");
        problem.setProperty("field", field);
        return problem;
    }
}
