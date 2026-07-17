package com.labproject.service;

import com.labproject.entity.Utilization;
import com.labproject.repository.UtilizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilizationService {

    private final UtilizationRepository utilizationRepository;

    public List<Utilization> findAll() {
        return utilizationRepository.findAll();
    }

    public List<Utilization> findByEquipmentId(Integer equipmentId) {
        return utilizationRepository.findByEquipmentId(equipmentId);
    }
}
