package com.predictive.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings")
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reading_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @Column(name = "reading_value", nullable = false)
    private double readingValue;

    private double temperature;
    private double vibration;
    private double operatingHours;
    private double healthScore;

    private LocalDateTime readingTime;

    public SensorReading() {
    }

    public Long getId() {
        return id;
    }

    public Machine getMachine() {
        return machine;
    }

    public void setMachine(Machine machine) {
        this.machine = machine;
    }

    public Sensor getSensor() {
        return sensor;
    }

    public void setSensor(Sensor sensor) {
        this.sensor = sensor;
    }

    public double getReadingValue() {
        return readingValue;
    }

    public void setReadingValue(double readingValue) {
        this.readingValue = readingValue;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public double getVibration() {
        return vibration;
    }

    public void setVibration(double vibration) {
        this.vibration = vibration;
    }

    public double getOperatingHours() {
        return operatingHours;
    }

    public void setOperatingHours(double operatingHours) {
        this.operatingHours = operatingHours;
    }

    public double getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(double healthScore) {
        this.healthScore = healthScore;
    }

    public LocalDateTime getReadingTime() {
        return readingTime;
    }

    public void setReadingTime(LocalDateTime readingTime) {
        this.readingTime = readingTime;
    }
}
