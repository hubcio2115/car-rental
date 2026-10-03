package com.example.api.auth;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountDetailsService implements UserDetailsService {
    private final AccountRepository accounts;

    @Override
    public UserDetails loadUserByUsername(@NonNull String email) {
        return accounts.findByEmail(email).map(account ->
                User.withUsername(account.getEmail())
                        .password(account.getPasswordHash())
                        .roles(account.getRole().name())
                        .build()
        ).orElseThrow(() -> new UsernameNotFoundException(email));
    }
}
