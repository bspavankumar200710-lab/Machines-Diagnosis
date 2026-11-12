
package com.predictive.backend.controller;

import com.predictive.backend.entity.Machine;
import com.predictive.backend.service.MachineService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
@CrossOrigin(origins = "http://localhost:5173")
public class MachineController {

    private final MachineService machineService;

    // Constructor injection
    public MachineController(MachineService machineService) {
        this.machineService = machineService;
    }

    // Get all machines
    @GetMapping
    public List<Machine> getAllMachines() {
        return machineService.getAllMachines();
    }

    // Get machine by ID
    @GetMapping("/{id}")
    public Machine getMachineById(@PathVariable Long id) {
        return machineService.getMachineById(id);
    }

    // Add new machine
    @PostMapping
    public Machine addMachine(@RequestBody Machine machine) {
        return machineService.addMachine(machine);
    }

    // Update machine
    @PutMapping("/{id}")
    public Machine updateMachine(
            @PathVariable Long id,
            @RequestBody Machine machine) {
        return machineService.updateMachine(id, machine);
    }

    // Delete machine
    @DeleteMapping("/{id}")
    public String deleteMachine(@PathVariable Long id) {
        machineService.deleteMachine(id);
        return "Machine deleted successfully";
    }
}
