package com.predictive.backend.repository;

import com.predictive.backend.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SensorReadingRepository
        extends JpaRepository<SensorReading, Long> {

    List<SensorReading> findByMachineId(Long machineId);
}
