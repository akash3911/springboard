package com.labproject.repository;

import com.labproject.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
    List<User> findByDepartmentId(Integer departmentId);
    List<User> findByDepartmentInstitutionId(Integer institutionId);
}
