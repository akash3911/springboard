package com.labproject.repository;

import com.labproject.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstitutionRepository extends JpaRepository<Institution, Integer> {
}
