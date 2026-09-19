package com.aiprof.studycompanion.dto.growth;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class GrowthPointDto {
    private LocalDate date;
    private double masteryScore;
    private UUID conceptId;
    private String conceptName;
}
