package com.josedev.to_do_simple.services;

import com.josedev.to_do_simple.models.User;
import com.josedev.to_do_simple.repositories.TaskRepository;
import com.josedev.to_do_simple.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    private final TaskRepository taskRepository;

    public UserService(UserRepository userRepository, TaskRepository taskRepository) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    public User findById(Long id) {
        Optional<User> user = this.userRepository.findById(id);
        return user.orElseThrow(
                () -> new RuntimeException("User not found! Id: " + id + ", Typo: " + User.class.getName())
        );
    }

    @Transactional
    public User createUser(User obj) {
        obj.setId(null);
        obj = this.userRepository.save(obj);
        this.taskRepository.saveAll(obj.getTasks());
        return obj;
    }

    @Transactional
    public User updateUser(User obj) {
        User newObj = findById(obj.getId());
        newObj.setPassword(obj.getPassword());
        return this.userRepository.save(newObj);
    }

    public void deleteUser(Long id) {
        findById(id);

        try {
            this.userRepository.deleteById(id);
        } catch (Exception ex) {
            throw new RuntimeException("Não é possível excluir pois há entidades relacionadas!");
        }
    }
}
