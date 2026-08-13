package com.labproject.service;

import com.labproject.entity.Department;
import com.labproject.entity.Institution;
import com.labproject.entity.User;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.InstitutionRepository;
import com.labproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;

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
        // Find users directly associated with the institution OR via their department
        List<User> direct = userRepository.findByDepartmentInstitutionId(institutionId);
        List<User> all = userRepository.findAll();
        return all.stream()
                .filter(u -> {
                    if (u.getInstitution() != null && u.getInstitution().getId().equals(institutionId)) {
                        return true;
                    }
                    if (u.getDepartment() != null && u.getDepartment().getInstitution() != null &&
                            u.getDepartment().getInstitution().getId().equals(institutionId)) {
                        return true;
                    }
                    return false;
                }).toList();
    }

    public User create(User user, Integer departmentId, Integer institutionId) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (departmentId != null) {
            Department dept = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
            user.setInstitution(dept.getInstitution());
        } else if (institutionId != null) {
            Institution inst = institutionRepository.findById(institutionId)
                    .orElseThrow(() -> new RuntimeException("Institution not found"));
            user.setInstitution(inst);
            user.setDepartment(null);
        }

        return userRepository.save(user);
    }

    public User update(Integer id, User details, Integer departmentId, Integer institutionId) {
        User user = findById(id);
        user.setName(details.getName());
        user.setEmail(details.getEmail());

        if (details.getRole() != null) {
            user.setRole(details.getRole());
        }

        if (departmentId != null) {
            Department dept = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
            user.setInstitution(dept.getInstitution());
        } else if (institutionId != null) {
            Institution inst = institutionRepository.findById(institutionId)
                    .orElseThrow(() -> new RuntimeException("Institution not found"));
            user.setInstitution(inst);
            user.setDepartment(null);
        } else {
            user.setDepartment(null);
            // keep the previous institution if set, or keep it null
        }

        return userRepository.save(user);
    }

    public User resetPassword(Integer id, String password) {
        User user = findById(id);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public User updateRole(Integer id, String role) {
        User user = findById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    public User updateSelfProfile(Integer userId, String name, String newEmail, String gmail, String currentPassword, String newPassword) {
        User user = findById(userId);

        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }

        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(newEmail.trim()).isPresent()) {
                throw new RuntimeException("Email address is already registered");
            }
            user.setEmail(newEmail.trim());
        }

        if (gmail != null) {
            user.setGmail(gmail.trim().isEmpty() ? null : gmail.trim());
        }

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            if (currentPassword == null || currentPassword.isEmpty()) {
                throw new RuntimeException("Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(newPassword.trim()));
        }

        return userRepository.save(user);
    }

    public void delete(Integer id) {
        userRepository.deleteById(id);
    }
}
