package com.labproject.security;

import com.labproject.entity.User;
import com.labproject.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    private UserDetailsServiceImpl userDetailsService;

    @BeforeEach
    void setUp() {
        userDetailsService = new UserDetailsServiceImpl(userRepository);
    }

    @Test
    @DisplayName("loadUserByUsername should return UserDetails when user exists")
    void testLoadUserByUsername_Success() {
        User user = new User();
        user.setEmail("admin@lab.org");
        user.setPassword("secretHash");
        user.setRole("LAB_MANAGER");

        when(userRepository.findByEmail("admin@lab.org")).thenReturn(Optional.of(user));

        UserDetails userDetails = userDetailsService.loadUserByUsername("admin@lab.org");

        assertNotNull(userDetails);
        assertEquals("admin@lab.org", userDetails.getUsername());
        assertEquals("secretHash", userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LAB_MANAGER")));
    }

    @Test
    @DisplayName("loadUserByUsername should throw UsernameNotFoundException when user does not exist")
    void testLoadUserByUsername_NotFound() {
        when(userRepository.findByEmail("unknown@lab.org")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userDetailsService.loadUserByUsername("unknown@lab.org")
        );
    }
}
