package com.labproject.service;

import com.labproject.entity.Department;
import com.labproject.entity.Institution;
import com.labproject.entity.User;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.InstitutionRepository;
import com.labproject.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private Department sampleDept;
    private Institution sampleInst;

    @BeforeEach
    void setUp() {
        sampleInst = new Institution();
        sampleInst.setId(1);
        sampleInst.setName("Harvard");

        sampleDept = new Department();
        sampleDept.setId(10);
        sampleDept.setName("Genetics");
        sampleDept.setInstitution(sampleInst);

        sampleUser = new User();
        sampleUser.setId(100);
        sampleUser.setName("Alice");
        sampleUser.setEmail("alice@harvard.edu");
        sampleUser.setRole("STUDENT");
        sampleUser.setDepartment(sampleDept);
        sampleUser.setInstitution(sampleInst);
    }

    @Test
    @DisplayName("findByEmail should return user when found")
    void testFindByEmail_Success() {
        when(userRepository.findByEmail("alice@harvard.edu")).thenReturn(Optional.of(sampleUser));

        User found = userService.findByEmail("alice@harvard.edu");

        assertNotNull(found);
        assertEquals("Alice", found.getName());
    }

    @Test
    @DisplayName("create should encode password and set institution via department")
    void testCreate_Success() {
        User newUser = new User();
        newUser.setName("Bob");
        newUser.setEmail("bob@harvard.edu");
        newUser.setPassword("rawPass");

        when(userRepository.findByEmail("bob@harvard.edu")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("rawPass")).thenReturn("encodedPass");
        when(departmentRepository.findById(10)).thenReturn(Optional.of(sampleDept));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User created = userService.create(newUser, 10, null);

        assertNotNull(created);
        assertEquals("encodedPass", created.getPassword());
        assertEquals(sampleDept, created.getDepartment());
        assertEquals(sampleInst, created.getInstitution());
    }

    @Test
    @DisplayName("resetPassword should encode new password and update user")
    void testResetPassword() {
        when(userRepository.findById(100)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("newSecret")).thenReturn("encodedSecret");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User updated = userService.resetPassword(100, "newSecret");

        assertEquals("encodedSecret", updated.getPassword());
    }

    @Test
    @DisplayName("updateRole should modify role successfully")
    void testUpdateRole() {
        when(userRepository.findById(100)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User updated = userService.updateRole(100, "LAB_MANAGER");

        assertEquals("LAB_MANAGER", updated.getRole());
    }
}
