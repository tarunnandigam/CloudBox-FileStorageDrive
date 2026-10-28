package com.cloudbox.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import jakarta.servlet.http.HttpServletRequest;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AppwriteAuthService {
    private final RestClient restClient;

    @Value("${appwrite.project-id:}")
    private String projectId;

    public AppwriteAuthService(@Value("${appwrite.endpoint:}") String endpoint) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(10000);
        this.restClient = RestClient.builder().baseUrl(endpoint)
                .requestFactory(requestFactory).build();
    }

    public String requireUserId(HttpServletRequest request) {
        return requireAccount(request).id();
    }

    public AccountDetails requireAccount(HttpServletRequest request) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        String jwt = request.getHeader("X-Appwrite-JWT");
        if (jwt == null || jwt.isBlank()) {
            if (authorization != null && authorization.startsWith("Bearer ")) {
                jwt = authorization.substring("Bearer ".length());
            }
        }
        if (jwt == null || jwt.isBlank() || projectId == null || projectId.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Authentication is required");
        }

        JsonNode account;
        try {
            account = restClient.get()
                    .uri("/account")
                    .header("X-Appwrite-Project", projectId)
                    .header("X-Appwrite-JWT", jwt)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid authentication token", exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(UNAUTHORIZED, "Authentication service unavailable", exception);
        }
        if (account == null || account.path("$id").asText().isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid authentication token");
        }
        return new AccountDetails(account.path("$id").asText(), account.path("email").asText(""));
    }

    public record AccountDetails(String id, String email) {}
}
