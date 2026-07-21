package com.labproject.service;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Department;
import com.labproject.entity.Equipment;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final DepartmentRepository departmentRepository;

    public List<Equipment> findAll() {
        return equipmentRepository.findAll();
    }

    public Equipment findById(Integer id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
    }

    public List<Equipment> findByDepartmentId(Integer departmentId) {
        return equipmentRepository.findByDepartmentId(departmentId);
    }

    public List<Equipment> findByInstitutionId(Integer institutionId) {
        return equipmentRepository.findByDepartmentInstitutionId(institutionId);
    }

    public List<Equipment> findByStatus(String status) {
        return equipmentRepository.findByStatus(status);
    }

    public Equipment create(EquipmentRequest request) {
        Equipment equipment = new Equipment();
        mapRequestToEntity(request, equipment);
        return equipmentRepository.save(equipment);
    }

    public Equipment update(Integer id, EquipmentRequest request) {
        Equipment equipment = findById(id);
        mapRequestToEntity(request, equipment);
        return equipmentRepository.save(equipment);
    }

    public void delete(Integer id) {
        equipmentRepository.deleteById(id);
    }

    private void mapRequestToEntity(EquipmentRequest request, Equipment equipment) {
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            equipment.setDepartment(dept);
        }
        equipment.setName(request.getName());
        equipment.setCategory(request.getCategory());
        equipment.setManufacturer(request.getManufacturer());
        equipment.setModel(request.getModel());
        equipment.setSerialNumber(request.getSerialNumber());
        equipment.setStatus(request.getStatus() != null ? request.getStatus() : "AVAILABLE");
        equipment.setPurchaseDate(request.getPurchaseDate());
        equipment.setIsShared(request.getIsShared() != null ? request.getIsShared() : false);
        equipment.setIsRestricted(request.getIsRestricted() != null ? request.getIsRestricted() : false);
        equipment.setRoomNumber(request.getRoomNumber());
        equipment.setContactEmail(request.getContactEmail());
        equipment.setImageUrl(request.getImageUrl());
        equipment.setSpecifications(request.getSpecifications());
        equipment.setDescription(request.getDescription());
    }
}
