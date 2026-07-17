package com.labproject.service;

import com.labproject.entity.Institution;
import com.labproject.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;

    public List<Institution> findAll() {
        return institutionRepository.findAll();
    }

    public Institution findById(Integer id) {
        return institutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Institution not found"));
    }

    public Institution create(Institution institution) {
        return institutionRepository.save(institution);
    }

    public Institution update(Integer id, Institution updated) {
        Institution institution = findById(id);
        institution.setName(updated.getName());
        institution.setAddress(updated.getAddress());
        institution.setEmail(updated.getEmail());
        institution.setPhone(updated.getPhone());
        return institutionRepository.save(institution);
    }

    public void delete(Integer id) {
        institutionRepository.deleteById(id);
    }
}
