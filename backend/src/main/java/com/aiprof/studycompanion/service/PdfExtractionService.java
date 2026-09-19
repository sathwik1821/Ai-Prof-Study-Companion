package com.aiprof.studycompanion.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PdfExtractionService {

    public record PageContent(int pageNumber, String text) {}

    public List<PageContent> extractPages(File pdfFile) throws IOException {
        List<PageContent> pages = new ArrayList<>();
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int totalPages = document.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();

            for (int p = 1; p <= totalPages; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);
                String pageText = stripper.getText(document).trim();
                pages.add(new PageContent(p, pageText));
            }
        }
        return pages;
    }
}
