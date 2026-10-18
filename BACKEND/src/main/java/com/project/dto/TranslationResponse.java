package com.project.dto;

import java.util.List;

public class TranslationResponse {

    private String originalText;
    private String translatedText;
    private List<String> translatedTexts;
    private String targetLanguage;
    private boolean cached;

    public TranslationResponse() {}

    public TranslationResponse(String originalText, String translatedText, String targetLanguage, boolean cached) {
        this.originalText = originalText;
        this.translatedText = translatedText;
        this.targetLanguage = targetLanguage;
        this.cached = cached;
    }

    public TranslationResponse(List<String> translatedTexts, String targetLanguage, boolean cached) {
        this.translatedTexts = translatedTexts;
        this.targetLanguage = targetLanguage;
        this.cached = cached;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getTranslatedText() {
        return translatedText;
    }

    public void setTranslatedText(String translatedText) {
        this.translatedText = translatedText;
    }

    public List<String> getTranslatedTexts() {
        return translatedTexts;
    }

    public void setTranslatedTexts(List<String> translatedTexts) {
        this.translatedTexts = translatedTexts;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }

    public void setTargetLanguage(String targetLanguage) {
        this.targetLanguage = targetLanguage;
    }

    public boolean isCached() {
        return cached;
    }

    public void setCached(boolean cached) {
        this.cached = cached;
    }
}
