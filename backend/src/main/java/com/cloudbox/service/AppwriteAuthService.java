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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AppwriteAuthService {
    private static final Logger logger = LoggerFactory.getLogger(AppwriteAuthService.class);
    private final RestClient restClient;
    private final String endpoint;

    @Value("${appwrite.project-id:}")
    private String projectId;

    public AppwriteAuthService(@Value("${appwrite.endpoint:}") String endpoint) {
        this.endpoint = endpoint;
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
                jwt = authorization.substring("Bearer ".length()).trim();
            }
        }
        if (jwt == null || jwt.isBlank()) {
            logger.warn("Authentication failed: No JWT token found in request headers");
            throw new ResponseStatusException(UNAUTHORIZED, "Authentication token is missing");
        }
        if (projectId == null || projectId.isBlank()) {
            logger.error("Authentication failed: APPWRITE_PROJECT_ID is not configured in backend");
            throw new ResponseStatusException(UNAUTHORIZED, "Server Appwrite project configuration is missing");
        }

        JsonNode account;
        try {
            logger.debug("Verifying JWT with Appwrite endpoint: {} for project: {}", endpoint, projectId);
            account = restClient.get()
                    .uri("/account")
                    .header("X-Appwrite-Project", projectId)
                    .header("X-Appwrite-JWT", jwt)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            logger.error("Appwrite token verification rejected: status={}, response={}", 
                    exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid authentication token: " + exception.getResponseBodyAsString(), exception);
        } catch (RestClientException exception) {
            logger.error("Appwrite service connection failed: {}", exception.getMessage(), exception);
            throw new ResponseStatusException(UNAUTHORIZED, "Authentication service unavailable: " + exception.getMessage(), exception);
        }
        if (account == null || account.path("$id").asText().isBlank()) {
            logger.warn("Appwrite returned empty or invalid account data");
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid authentication token");
        }
        String id = account.path("$id").asText();
        String email = account.path("email").asText("");
        logger.info("Appwrite authenticated successfully for user id={}, email={}", id, email);
        return new AccountDetails(id, email);
    }

    public record AccountDetails(String id, String email) {}
}
