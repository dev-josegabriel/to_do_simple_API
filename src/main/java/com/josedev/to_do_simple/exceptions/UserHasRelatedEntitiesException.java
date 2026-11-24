package com.josedev.to_do_simple.exceptions;

public class UserHasRelatedEntitiesException extends RuntimeException {
    public UserHasRelatedEntitiesException(String message) {
        super(message);
    }
}
