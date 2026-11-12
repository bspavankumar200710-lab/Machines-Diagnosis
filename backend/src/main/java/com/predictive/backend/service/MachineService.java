package com.predictive.backend.service;

import com.predictive.backend.entity.Machine;
import com.predictive.backend.repository.MachineRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineService {

    private final MachineRepository machineRepository;

    // Constructor injection
    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    // Get all machines
    public List<Machine> getAllMachines() {
        return machineRepository.findAll();
    }

    // Get machine by ID
    public Machine getMachineById(Long id) {
        return machineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Machine not found with ID: " + id));
    }

    // Add a new machine
    public Machine addMachine(Machine machine) {
        return machineRepository.save(machine);
    }

    // Update an existing machine
    public Machine updateMachine(Long id, Machine updatedMachine) {

        Machine existingMachine = getMachineById(id);

        existingMachine.setMachineName(updatedMachine.getMachineName());
        existingMachine.setMachineCode(updatedMachine.getMachineCode());
        existingMachine.setMachineType(updatedMachine.getMachineType());
        existingMachine.setLocation(updatedMachine.getLocation());
        existingMachine.setStatus(updatedMachine.getStatus());
        existingMachine.setInstallationDate(updatedMachine.getInstallationDate());

        return machineRepository.save(existingMachine);
    }

    // Delete a machine
    public void deleteMachine(Long id) {
        Machine machine = getMachineById(id);
        machineRepository.delete(machine);
    }
}
