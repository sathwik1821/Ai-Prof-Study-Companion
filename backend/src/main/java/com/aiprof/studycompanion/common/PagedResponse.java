package com.aiprof.studycompanion.common;

import lombok.Getter;

import java.util.List;

/**
 * Paginated response wrapper for list endpoints.
 */
@Getter
public class PagedResponse<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean last;

    public PagedResponse(List<T> content, int page, int size, long totalElements) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = (int) Math.ceil((double) totalElements / size);
        this.last = page >= this.totalPages - 1;
    }
}
