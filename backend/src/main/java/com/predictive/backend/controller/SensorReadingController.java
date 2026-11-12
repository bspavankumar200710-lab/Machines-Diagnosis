
package com.predictive.backend.controller;

import com.predictive.backend.entity.SensorReading;
import com.predictive.backend.service.SensorReadingService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines/{machineId}/readings")
@CrossOrigin(origins = "http://localhost:5173")
public class SensorReadingController {

    private final SensorReadingService sensorReadingService;

    public SensorReadingController(
            SensorReadingService sensorReadingService) {
        this.sensorReadingService = sensorReadingService;
    }

    // Get sensor readings for a machine
    @GetMapping
    public List<SensorReading> getReadings(
            @PathVariable Long machineId) {
        return sensorReadingService.getReadingsByMachine(machineId);
    }

    // Add a sensor reading
    @PostMapping
    public SensorReading addReading(
            @PathVariable Long machineId,
            @RequestBody SensorReading reading) {
        return sensorReadingService.addReading(machineId, reading);
    }
}
