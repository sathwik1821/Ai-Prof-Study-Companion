package com.aiprof.studycompanion.dto.tutor;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SourceReference {
    private String materialName;
    private int pageNumber;
    private String excerpt;
}
