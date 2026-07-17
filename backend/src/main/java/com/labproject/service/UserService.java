package com.labproject.service;

import com.labproject.entity.User;
import com.labproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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

    public void delete(Integer id) {
        userRepository.deleteById(id);
    }
}
