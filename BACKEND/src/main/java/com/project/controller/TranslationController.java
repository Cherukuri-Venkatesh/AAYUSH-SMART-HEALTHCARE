package com.project.controller;

import com.project.dto.TranslationRequest;
import com.project.dto.TranslationResponse;
import com.project.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/translate")
@CrossOrigin(origins = "*")
public class TranslationController {

    @Autowired
    private TranslationService translationService;

    /**
     * Translates single or multiple text strings into the target Indian language
     */
    @PostMapping
    public ResponseEntity<TranslationResponse> translate(@RequestBody TranslationRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().build();
        }

        String targetLang = request.getTargetLanguage() != null ? request.getTargetLanguage() : "en";

        // Single text translation
        if (request.getText() != null) {
            String original = request.getText();
            boolean isCached = translationService.isCached(original, targetLang);
            String translated = translationService.translate(original, targetLang);
            return ResponseEntity.ok(new TranslationResponse(original, translated, targetLang, isCached));
        }

        // Batch text translation
        if (request.getTexts() != null) {
            List<String> translatedList = translationService.translateBatch(request.getTexts(), targetLang);
            return ResponseEntity.ok(new TranslationResponse(translatedList, targetLang, false));
        }

        return ResponseEntity.ok(new TranslationResponse("", "", targetLang, true));
    }

    /**
     * Translates a batch array of texts in one roundtrip
     */
    @PostMapping("/batch")
    public ResponseEntity<TranslationResponse> translateBatch(@RequestBody TranslationRequest request) {
        if (request == null || request.getTexts() == null) {
            return ResponseEntity.badRequest().build();
        }
        String targetLang = request.getTargetLanguage() != null ? request.getTargetLanguage() : "en";
        List<String> translatedList = translationService.translateBatch(request.getTexts(), targetLang);
        return ResponseEntity.ok(new TranslationResponse(translatedList, targetLang, false));
    }

    /**
     * Returns the 9 supported languages with native names
     */
    @GetMapping("/languages")
    public ResponseEntity<List<Map<String, String>>> getSupportedLanguages() {
        List<Map<String, String>> languages = List.of(
                Map.of("code", "en", "name", "English", "nativeName", "English", "symbol", "EN"),
                Map.of("code", "hi", "name", "Hindi", "nativeName", "हिन्दी", "symbol", "हि"),
                Map.of("code", "te", "name", "Telugu", "nativeName", "తెలుగు", "symbol", "తె"),
                Map.of("code", "ta", "name", "Tamil", "nativeName", "தமிழ்", "symbol", "த"),
                Map.of("code", "kn", "name", "Kannada", "nativeName", "ಕನ್ನಡ", "symbol", "ಕ"),
                Map.of("code", "ml", "name", "Malayalam", "nativeName", "മലയാളം", "symbol", "മ"),
                Map.of("code", "bn", "name", "Bengali", "nativeName", "বাংলা", "symbol", "বা"),
                Map.of("code", "mr", "name", "Marathi", "nativeName", "मराठी", "symbol", "म"),
                Map.of("code", "gu", "name", "Gujarati", "nativeName", "ગુજરાતી", "symbol", "ગુ")
        );
        return ResponseEntity.ok(languages);
    }
}
