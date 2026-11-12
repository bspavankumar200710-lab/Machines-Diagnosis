package com.predictive.backend.repository;

import com.predictive.backend.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SensorRepository extends JpaRepository<Sensor, Long> {

    Optional<Sensor> findFirstByMachine_Id(Long machineId);
}