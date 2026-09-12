package com.example.api.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping(value = "/auth", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final AccountService accountService;
    private final SecurityContextRepository securityContexts = new HttpSessionSecurityContextRepository();

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    CurrentUser register(@Valid @RequestBody RegisterRequest body) {
        return CurrentUser.from(accountService.register(body));
    }

    @PostMapping("/login")
    CurrentUser login(@Valid @RequestBody LoginRequest body,
                      HttpServletRequest request, HttpServletResponse response) {
        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.password()));

        if (request.getSession(false) != null) {
            request.changeSessionId();
        }

        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContexts.saveContext(context, request, response);

        return CurrentUser.from(authentication);
    }

    @GetMapping("/me")
    CurrentUser me(Authentication authentication) {
        return CurrentUser.from(authentication);
    }

    record LoginRequest(
            @NotBlank
            String email,

            @NotBlank
            String password
    ) {
        LoginRequest {
            email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        }
    }

    record CurrentUser(@NotNull String email, @NotNull List<String> roles) {
        static CurrentUser from(Authentication authentication) {
            var roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();

            return new CurrentUser(authentication.getName(), roles);
        }

        static CurrentUser from(Account account) {
            return new CurrentUser(account.getEmail(), List.of("ROLE_" + account.getRole().name()));
        }
    }
}
