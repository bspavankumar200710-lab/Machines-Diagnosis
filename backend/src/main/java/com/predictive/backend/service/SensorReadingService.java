package com.predictive.backend.service;

import com.predictive.backend.entity.Machine;
import com.predictive.backend.entity.Sensor;
import com.predictive.backend.entity.SensorReading;
import com.predictive.backend.repository.MachineRepository;
import com.predictive.backend.repository.SensorReadingRepository;
import com.predictive.backend.repository.SensorRepository;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SensorReadingService {

    private final SensorReadingRepository sensorReadingRepository;
    private final MachineRepository machineRepository;
    private final SensorRepository sensorRepository;

    public SensorReadingService(
            SensorReadingRepository sensorReadingRepository,
            MachineRepository machineRepository,
            SensorRepository sensorRepository) {

        this.sensorReadingRepository = sensorReadingRepository;
        this.machineRepository = machineRepository;
        this.sensorRepository = sensorRepository;
    }

    public List<SensorReading> getReadingsByMachine(Long machineId) {
        return sensorReadingRepository.findByMachineId(machineId);
    }

    public SensorReading addReading(Long machineId, SensorReading reading) {

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        // Find a sensor belonging to this machine
        Sensor sensor = sensorRepository.findFirstByMachine_Id(machineId)
                .orElseGet(() -> {
                    Sensor newSensor = new Sensor();
                    newSensor.setMachine(machine);
                    newSensor.setSensorType("Temperature");
                    return sensorRepository.save(newSensor);
                });

        reading.setMachine(machine);
        reading.setSensor(sensor);

        // Store temperature as the main sensor reading value
        reading.setReadingValue(reading.getTemperature());

        reading.setReadingTime(LocalDateTime.now());

        double temperatureScore = Math.max(0, 100 - reading.getTemperature());

        double vibrationScore = Math.max(0, 100 - reading.getVibration() * 10);

        double healthScore = (temperatureScore + vibrationScore) / 2;

        reading.setHealthScore(healthScore);

        return sensorReadingRepository.save(reading);
    }
}