package com.example.api.rental;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

interface RentalRepository extends JpaRepository<Rental, Long> {
    List<Rental> findByCarIdAndEndDateGreaterThanEqualOrderByStartDate(Long carId, LocalDate date);

    Optional<Rental> findByIdAndAccountId(Long id, Long accountId);

    @Query("""
            select new com.example.api.rental.RentalView(
                r.id, c.id, c.model, c.registrationNumber, r.startDate, r.endDate, r.totalPrice)
            from Rental r join Car c on c.id = r.carId
            where r.accountId = :accountId
            order by r.startDate desc""")
    List<RentalView> findViewsByAccountId(Long accountId);
}
