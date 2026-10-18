package com.project.dto;

import java.util.List;

public class TranslationRequest {

    private String text;
    private List<String> texts;
    private String targetLanguage;
    private String sourceLanguage = "en";

    public TranslationRequest() {}

    public TranslationRequest(String text, String targetLanguage) {
        this.text = text;
        this.targetLanguage = targetLanguage;
    }

    public TranslationRequest(List<String> texts, String targetLanguage) {
        this.texts = texts;
        this.targetLanguage = targetLanguage;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<String> getTexts() {
        return texts;
    }

    public void setTexts(List<String> texts) {
        this.texts = texts;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }

    public void setTargetLanguage(String targetLanguage) {
        this.targetLanguage = targetLanguage;
    }

    public String getSourceLanguage() {
        return sourceLanguage;
    }

    public void setSourceLanguage(String sourceLanguage) {
        this.sourceLanguage = sourceLanguage;
    }
}
