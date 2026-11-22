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

    public UserService(UserRepository userRepository, TaskRepository taskRepository) {
        this.userRepository = userRepository;
    }

    public User findById(Long id) {
        Optional<User> user = this.userRepository.findById(id);
        return user.orElseThrow(
                () -> new RuntimeException("Usuário não encontrado! Id: " + id + ", Tipo: " + User.class.getName())
        );
    }

    @Transactional
    public User createUser(User obj) {
        obj.setId(null);
        obj = this.userRepository.save(obj);
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
