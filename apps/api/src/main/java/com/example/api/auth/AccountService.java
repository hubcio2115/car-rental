package com.example.api.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

@Service
@Validated
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;

    public Account register(@Valid RegisterRequest request) {
        if (accounts.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        return accounts.save(Account.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(AccountRole.USER)
                .build());
    }
}
