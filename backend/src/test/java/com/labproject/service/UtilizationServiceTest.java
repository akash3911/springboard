package com.labproject.service;

import com.labproject.entity.Utilization;
import com.labproject.repository.UtilizationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UtilizationServiceTest {

    @Mock
    private UtilizationRepository utilizationRepository;

    @InjectMocks
    private UtilizationService utilizationService;

    @Test
    @DisplayName("findAll should return all utilization metrics")
    void testFindAll() {
        Utilization u = new Utilization();
        u.setId(1);
        u.setUtilizationPercentage(BigDecimal.valueOf(85.5));

        when(utilizationRepository.findAll()).thenReturn(List.of(u));

        List<Utilization> result = utilizationService.findAll();

        assertEquals(1, result.size());
        assertEquals(BigDecimal.valueOf(85.5), result.get(0).getUtilizationPercentage());
    }

    @Test
    @DisplayName("findByEquipmentId should return equipment utilization metrics")
    void testFindByEquipmentId() {
        Utilization u = new Utilization();
        u.setId(1);
        u.setUtilizationPercentage(BigDecimal.valueOf(92.0));

        when(utilizationRepository.findByEquipmentId(100)).thenReturn(List.of(u));

        List<Utilization> result = utilizationService.findByEquipmentId(100);

        assertEquals(1, result.size());
        assertEquals(BigDecimal.valueOf(92.0), result.get(0).getUtilizationPercentage());
    }
}
