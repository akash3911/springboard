package com.labproject.service;

import com.labproject.entity.User;
import com.labproject.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User findById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> findByRole(String role) {
        return userRepository.findByRole(role);
    }

    public List<User> findByDepartmentId(Integer departmentId) {
        return userRepository.findByDepartmentId(departmentId);
    }

    public List<User> findByInstitutionId(Integer institutionId) {
        return userRepository.findByDepartmentInstitutionId(institutionId);
    }

    public User updateRole(Integer id, String role) {
        User user = findById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    public User resetPassword(Integer id, String rawPassword) {
        User user = findById(id);
        user.setPassword(passwordEncoder.encode(rawPassword));
        return userRepository.save(user);
    }

    public User create(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User update(Integer id, User updated) {
        User user = findById(id);
        user.setName(updated.getName());
        user.setEmail(updated.getEmail());
        if (updated.getDepartment() != null) {
            user.setDepartment(updated.getDepartment());
        }
        return userRepository.save(user);
    }

    public void delete(Integer id) {
        userRepository.deleteById(id);
    }
}
