package com.josedev.to_do_simple.services;

import com.josedev.to_do_simple.models.Task;
import com.josedev.to_do_simple.models.User;
import com.josedev.to_do_simple.repositories.TaskRepository;
import com.josedev.to_do_simple.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    private final TaskRepository taskRepository;

    private final UserService userService;

    public TaskService(TaskRepository taskRepository, UserService userService) {
        this.taskRepository = taskRepository;
        this.userService = userService;
    }

    public List<Task> findAllByUserId(Long userId) {
        List<Task> tasks = this.taskRepository.findByUser_Id(userId);
        return tasks;
    }

    public Task findById(Long id) {
        Optional<Task> task = this.taskRepository.findById(id);
        return task.orElseThrow(
                () -> new RuntimeException("Task not found! Id: " + id + ", Typo: " + Task.class.getName())
        );
    }

    @Transactional
    public Task createTask(Task obj) {
        User user = this.userService.findById(obj.getUser().getId());
        obj.setId(null);
        obj.setUser(user);
        obj = this.taskRepository.save(obj);
        return obj;
    }

    @Transactional
    public Task updateTask(Task obj) {
        Task newObj = findById(obj.getId());
        newObj.setDescription(obj.getDescription());
        return this.taskRepository.save(obj);
    }

    public void deleteTask(Long id) {
        findById(id);
        try {
            this.taskRepository.deleteById(id);
        } catch (Exception ex) {
            throw new RuntimeException("Não é possível excluir pois há entidades relacionadas!");
        }
    }
}
