package com.labproject.service;

import com.labproject.entity.Utilization;
import com.labproject.repository.UtilizationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UtilizationService {

    private final UtilizationRepository utilizationRepository;

    public UtilizationService(UtilizationRepository utilizationRepository) {
        this.utilizationRepository = utilizationRepository;
    }

    public List<Utilization> findAll() {
        return utilizationRepository.findAll();
    }

    public List<Utilization> findByEquipmentId(Integer equipmentId) {
        return utilizationRepository.findByEquipmentId(equipmentId);
    }
}
