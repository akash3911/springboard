package com.labproject.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "mySecretKeyForJWTTokenGenerationThatIsLongEnough123456789");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L);
    }

    @Test
    @DisplayName("Generate token should create valid JWT containing subject email")
    void testGenerateAndExtractToken() {
        String email = "researcher@university.edu";
        String token = jwtUtil.generateToken(email);

        assertNotNull(token);
        assertFalse(token.trim().isEmpty());

        String extractedEmail = jwtUtil.extractEmail(token);
        assertEquals(email, extractedEmail);
    }

    @Test
    @DisplayName("ValidateToken should return true for freshly generated valid token")
    void testValidateToken_Success() {
        String token = jwtUtil.generateToken("user@domain.com");
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    @DisplayName("ValidateToken should return false for tampered token")
    void testValidateToken_InvalidToken() {
        String token = jwtUtil.generateToken("user@domain.com");
        String tamperedToken = token + "invalid";

        assertFalse(jwtUtil.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("ValidateToken should return false for completely malformed string")
    void testValidateToken_Malformed() {
        assertFalse(jwtUtil.validateToken("not-a-jwt-token"));
    }
}
