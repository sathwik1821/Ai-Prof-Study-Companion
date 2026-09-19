package com.aiprof.studycompanion.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public AppException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public AppException(String errorCode, String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = errorCode;
    }

    public AppException(HttpStatus status, String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public static AppException notFound(String resource, Object id) {
        return new AppException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, resource + " not found: " + id);
    }

    public static AppException unauthorized(String code, String detail) {
        return new AppException(HttpStatus.UNAUTHORIZED, code, detail);
    }

    public static AppException forbidden(String detail) {
        return new AppException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, detail);
    }

    public static AppException badRequest(String code, String detail) {
        return new AppException(HttpStatus.BAD_REQUEST, code, detail);
    }

    public static AppException conflict(String code, String detail) {
        return new AppException(HttpStatus.CONFLICT, code, detail);
    }

    public static AppException aiFailure(String detail) {
        return new AppException(HttpStatus.BAD_GATEWAY, ErrorCode.AI_SERVICE_FAILURE, detail);
    }

    public static AppException invalidAiOutput(String detail) {
        return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_AI_OUTPUT, detail);
    }
}
