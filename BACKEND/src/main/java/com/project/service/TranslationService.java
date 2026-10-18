package com.project.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationService.class);

    @Value("${gemini.api.key:${GEMINI_API_KEY:${GOOGLE_AI_API_KEY:}}}")
    private String geminiApiKey;

    // High performance in-memory LRU/Concurrent cache for translations
    private final Map<String, String> translationCache = new ConcurrentHashMap<>();

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map language codes to full names for LLM prompts
    private static final Map<String, String> LANGUAGE_NAME_MAP = Map.of(
            "en", "English",
            "hi", "Hindi (हिन्दी)",
            "te", "Telugu (తెలుగు)",
            "ta", "Tamil (தமிழ்)",
            "kn", "Kannada (ಕನ್ನಡ)",
            "ml", "Malayalam (മലയാളം)",
            "bn", "Bengali (বাংলা)",
            "mr", "Marathi (मराठी)",
            "gu", "Gujarati (ગુજરાતી)"
    );

    public TranslationService() {
        seedCoreHealthDictionary();
    }

    /**
     * Translates a single text string into target language with caching and Gemini LLM fallback
     */
    public String translate(String text, String targetLang) {
        if (text == null || text.trim().isEmpty()) {
            return "";
        }

        String langCode = normalizeLangCode(targetLang);
        if ("en".equalsIgnoreCase(langCode)) {
            return text;
        }

        String trimmed = text.trim();
        String cacheKey = langCode + "::" + trimmed;
        if (translationCache.containsKey(cacheKey)) {
            return translationCache.get(cacheKey);
        }

        String dictionaryFallback = dictionaryLookup(trimmed, langCode);
        if (dictionaryFallback != null && !dictionaryFallback.equals(trimmed)) {
            translationCache.put(cacheKey, dictionaryFallback);
            return dictionaryFallback;
        }

        String tokenFallback = translateByTokens(trimmed, langCode);
        if (tokenFallback != null && !tokenFallback.equals(trimmed)) {
            translationCache.put(cacheKey, tokenFallback);
            return tokenFallback;
        }

        try {
            String translated = callGeminiTranslateApi(trimmed, langCode);
            if (translated != null && !translated.isBlank()) {
                translationCache.put(cacheKey, translated);
                return translated;
            }
        } catch (Exception e) {
            log.warn("Gemini dynamic translation failed for lang [{}], text snippet: '{}' - Reason: {}",
                    langCode, trimmed.length() > 30 ? trimmed.substring(0, 30) + "..." : trimmed, e.getMessage());
        }

        return tokenFallback != null ? tokenFallback : trimmed;
    }

    /**
     * Translates a batch list of texts efficiently
     */
    public List<String> translateBatch(List<String> texts, String targetLang) {
        if (texts == null || texts.isEmpty()) {
            return Collections.emptyList();
        }

        String langCode = normalizeLangCode(targetLang);
        if ("en".equalsIgnoreCase(langCode)) {
            return texts;
        }

        List<String> results = new ArrayList<>(texts.size());
        List<String> uncachedTexts = new ArrayList<>();
        List<Integer> uncachedIndices = new ArrayList<>();

        for (int i = 0; i < texts.size(); i++) {
            String original = texts.get(i);
            if (original == null || original.trim().isEmpty()) {
                results.add("");
                continue;
            }
            String cacheKey = langCode + "::" + original.trim();
            if (translationCache.containsKey(cacheKey)) {
                results.add(translationCache.get(cacheKey));
            } else {
                results.add(null); // placeholder
                uncachedTexts.add(original);
                uncachedIndices.add(i);
            }
        }

        // If there are uncached texts, translate them
        for (int j = 0; j < uncachedTexts.size(); j++) {
            int originalIndex = uncachedIndices.get(j);
            String translated = translate(uncachedTexts.get(j), langCode);
            results.set(originalIndex, translated);
        }

        return results;
    }

    public boolean isCached(String text, String targetLang) {
        if (text == null) return true;
        String langCode = normalizeLangCode(targetLang);
        return "en".equalsIgnoreCase(langCode) || translationCache.containsKey(langCode + "::" + text.trim());
    }

    /**
     * Calls Google AI Studio Gemini API with strict localization system instruction
     */
    private String callGeminiTranslateApi(String text, String targetLangCode) throws Exception {
        String cleanKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        if (cleanKey.isBlank()) {
            throw new IllegalStateException("Gemini API key is not configured for dynamic translations");
        }

        String targetLangName = LANGUAGE_NAME_MAP.getOrDefault(targetLangCode, targetLangCode);

        String systemPrompt = "You are a professional localization API. Translate the provided input text exactly into the requested Indian language: " 
                + targetLangName + " (" + targetLangCode + "). Maintain formatting, numbers, clinical terms accuracy, and tone. Return ONLY the raw translated string. Do not include quotes, explanatory notes, or pleasantries.";

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
        );

        Map<String, Object> userContent = Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", text))
        );

        Map<String, Object> requestBody = Map.of(
                "system_instruction", systemInstruction,
                "contents", List.of(userContent),
                "generationConfig", Map.of(
                        "temperature", 0.1, // low temperature for exact translation consistency
                        "maxOutputTokens", 1000
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", cleanKey);

        String[] candidateModels = {"gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3.7-flash"};

        for (String model : candidateModels) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + cleanKey;
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(new URI(url), entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
                    if (!textNode.isMissingNode() && !textNode.asText().isBlank()) {
                        return textNode.asText().trim();
                    }
                }
            } catch (Exception ex) {
                log.debug("Gemini translation model {} failed: {}", model, ex.getMessage());
            }
        }

        throw new RuntimeException("All Gemini translation model endpoints failed");
    }

    private String normalizeLangCode(String lang) {
        if (lang == null) return "en";
        String clean = lang.trim().toLowerCase();
        return switch (clean) {
            case "hindi", "hi" -> "hi";
            case "telugu", "te" -> "te";
            case "tamil", "ta" -> "ta";
            case "kannada", "kn" -> "kn";
            case "malayalam", "ml" -> "ml";
            case "bengali", "bn" -> "bn";
            case "marathi", "mr" -> "mr";
            case "gujarati", "gu" -> "gu";
            default -> "en";
        };
    }

    private String translateByTokens(String text, String langCode) {
        if (text == null || text.isBlank()) return text;

        Map<String, String> tokenMap = switch (langCode) {
            case "hi" -> Map.ofEntries(
                    Map.entry("appointment", "अपॉइंटमेंट"),
                    Map.entry("appointments", "अपॉइंटमेंट्स"),
                    Map.entry("book", "बुक करें"),
                    Map.entry("doctor", "डॉक्टर"),
                    Map.entry("doctors", "डॉक्टर"),
                    Map.entry("patient", "मरीज़"),
                    Map.entry("patients", "मरीज़"),
                    Map.entry("home", "होम"),
                    Map.entry("about", "हमारे बारे में"),
                    Map.entry("contact", "संपर्क"),
                    Map.entry("schedule", "शेड्यूल"),
                    Map.entry("hospital", "अस्पताल"),
                    Map.entry("profile", "प्रोफ़ाइल"),
                    Map.entry("dashboard", "डैशबोर्ड"),
                    Map.entry("login", "लॉगिन"),
                    Map.entry("signup", "साइन अप"),
                    Map.entry("find", "खोजें"),
                    Map.entry("view", "देखें"),
                    Map.entry("my", "मेरा"),
                    Map.entry("consultation", "कंसल्टेशन")
            );
            case "te" -> Map.ofEntries(
                    Map.entry("appointment", "అపాయింట్‌మెంట్"),
                    Map.entry("appointments", "అపాయింట్‌మెంట్లు"),
                    Map.entry("book", "బుక్ చేయండి"),
                    Map.entry("doctor", "వైద్యుడు"),
                    Map.entry("doctors", "వైద్యులు"),
                    Map.entry("patient", "రోగి"),
                    Map.entry("patients", "రోగులు"),
                    Map.entry("home", "హోమ్"),
                    Map.entry("about", "మా గురించి"),
                    Map.entry("contact", "సంప్రదించండి"),
                    Map.entry("schedule", "షెడ్యూల్"),
                    Map.entry("hospital", "ఆసుపత్రి"),
                    Map.entry("profile", "ప్రొఫైల్"),
                    Map.entry("dashboard", "డాష్‌బోర్డ్"),
                    Map.entry("login", "లాగిన్"),
                    Map.entry("signup", "సైన్ అప్"),
                    Map.entry("find", "కనుగొనండి"),
                    Map.entry("view", "చూడండి"),
                    Map.entry("my", "నా"),
                    Map.entry("consultation", "కన్సల్టేషన్")
            );
            case "ta" -> Map.ofEntries(
                    Map.entry("appointment", "முன்பதிவு"),
                    Map.entry("appointments", "முன்பதிவுகள்"),
                    Map.entry("book", "பதிவு செய்யவும்"),
                    Map.entry("doctor", "மருத்துவர்"),
                    Map.entry("doctors", "மருத்துவர்கள்"),
                    Map.entry("patient", "நோயாளி"),
                    Map.entry("patients", "நோயாளிகள்"),
                    Map.entry("home", "முகப்பு"),
                    Map.entry("about", "எங்களைப் பற்றி"),
                    Map.entry("contact", "தொடர்பு"),
                    Map.entry("schedule", "அட்டவணை"),
                    Map.entry("hospital", "மருத்துவமனை"),
                    Map.entry("profile", "சுயவிவரம்"),
                    Map.entry("dashboard", "டாஷ்போர்டு"),
                    Map.entry("login", "உள்நுழைக"),
                    Map.entry("signup", "பதிவு செய்யவும்"),
                    Map.entry("find", "கண்டுபிடி"),
                    Map.entry("view", "பார்க்கவும்"),
                    Map.entry("my", "என்"),
                    Map.entry("consultation", "மருத்துவ ஆலோசனை")
            );
            default -> Map.of();
        };

        StringBuilder translated = new StringBuilder();
        boolean changed = false;
        for (String word : text.split("\\s+")) {
            String key = word.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
            String translatedWord = tokenMap.getOrDefault(key, word);
            if (!translatedWord.equals(word)) {
                changed = true;
            }
            if (translated.length() > 0) {
                translated.append(' ');
            }
            translated.append(translatedWord);
        }

        return changed ? translated.toString() : null;
    }

    private String dictionaryLookup(String text, String langCode) {
        String key = text.trim();
        if (key.isEmpty()) return null;

        Map<String, String> termMap = switch (langCode) {
            case "hi" -> Map.ofEntries(
                    Map.entry("Book Appointment", "अपॉइंटमेंट बुक करें"),
                    Map.entry("View Schedule", "शेड्यूल देखें"),
                    Map.entry("Login", "लॉगिन"),
                    Map.entry("Sign Up", "साइन अप"),
                    Map.entry("Home", "होम"),
                    Map.entry("About", "हमारे बारे में"),
                    Map.entry("Contact", "संपर्क"),
                    Map.entry("Doctors", "डॉक्टर"),
                    Map.entry("Appointments", "अपॉइंटमेंट्स"),
                    Map.entry("Hospital", "अस्पताल"),
                    Map.entry("Doctor", "डॉक्टर"),
                    Map.entry("Patient", "मरीज़"),
                    Map.entry("General Physician", "जनरल फिजिशियन"),
                    Map.entry("Email", "ईमेल"),
                    Map.entry("Password", "पासवर्ड"),
                    Map.entry("Search", "खोजें"),
                    Map.entry("Book", "बुक करें"),
                    Map.entry("Schedule", "शेड्यूल"),
                    Map.entry("Profile", "प्रोफ़ाइल"),
                    Map.entry("Dashboard", "डैशबोर्ड"),
                    Map.entry("Find a Doctor", "डॉक्टर खोजें"),
                    Map.entry("My Appointments", "मेरे अपॉइंटमेंट्स"),
                    Map.entry("Consultation Ready", "कंसल्टेशन तैयार"),
                    Map.entry("Verified Specialist", "सत्यापित विशेषज्ञ"),
                    Map.entry("Doctor ID:", "डॉक्टर ID:"),
                    Map.entry("Degree:", "डिग्री:"),
                    Map.entry("Experience:", "अनुभव:"),
                    Map.entry("Hospital:", "अस्पताल:"),
                    Map.entry("Hospital ID:", "अस्पताल ID:"),
                    Map.entry("Address:", "पता:"),
                    Map.entry("Consultation Fee", "परामर्श शुल्क"),
                    Map.entry("N/A", "लागू नहीं")
            );
            case "te" -> Map.ofEntries(
                    Map.entry("Book Appointment", "అపాయింట్‌మెంట్ బుక్ చేయండి"),
                    Map.entry("View Schedule", "షెడ్యూల్ చూడండి"),
                    Map.entry("Login", "లాగిన్"),
                    Map.entry("Sign Up", "సైన్ అప్"),
                    Map.entry("Home", "హోమ్"),
                    Map.entry("About", "మా గురించి"),
                    Map.entry("Contact", "సంప్రదించండి"),
                    Map.entry("Doctors", "వైద్యులు"),
                    Map.entry("Appointments", "అపాయింట్‌మెంట్లు"),
                    Map.entry("Hospital", "ఆసుపత్రి"),
                    Map.entry("Doctor", "వైద్యుడు"),
                    Map.entry("Patient", "రోగి"),
                    Map.entry("General Physician", "జనరల్ ఫిజిషియన్"),
                    Map.entry("Email", "ఈమెయిల్"),
                    Map.entry("Password", "పాస్‌వర్డ్"),
                    Map.entry("Search", "శోధించండి"),
                    Map.entry("Book", "బుక్ చేయండి"),
                    Map.entry("Schedule", "షెడ్యూల్"),
                    Map.entry("Profile", "ప్రొఫైల్"),
                    Map.entry("Dashboard", "డాష్‌బోర్డ్"),
                    Map.entry("Find a Doctor", "వైద్యుడిని కనుగొనండి"),
                    Map.entry("My Appointments", "నా అపాయింట్‌మెంట్లు"),
                    Map.entry("Consultation Ready", "కన్సల్టేషన్ సిద్ధంగా ఉంది"),
                    Map.entry("Verified Specialist", "ధృవీకృత విశేషవేత్త"),
                    Map.entry("Doctor ID:", "డాక్టర్ ID:"),
                    Map.entry("Degree:", "డిగ్రీ:"),
                    Map.entry("Experience:", "అనుభవం:"),
                    Map.entry("Hospital:", "ఆసుపత్రి:"),
                    Map.entry("Hospital ID:", "ఆసుపత్రి ID:"),
                    Map.entry("Address:", "చిరునామా:"),
                    Map.entry("Consultation Fee", "సలహా ఫీ"),
                    Map.entry("N/A", "లేనిది")
            );
            case "ta" -> Map.ofEntries(
                    Map.entry("Book Appointment", "முன்பதிவு செய்யவும்"),
                    Map.entry("View Schedule", "அட்டவணை பார்க்கவும்"),
                    Map.entry("Login", "உள்நுழைக"),
                    Map.entry("Sign Up", "பதிவு செய்யவும்"),
                    Map.entry("Home", "முகப்பு"),
                    Map.entry("About", "எங்களைப் பற்றி"),
                    Map.entry("Contact", "அரைப்படுத்தவும்"),
                    Map.entry("Doctors", "மருத்துவர்கள்"),
                    Map.entry("Appointments", "முன்பதிவுகள்"),
                    Map.entry("Hospital", "மருத்துவமனை"),
                    Map.entry("Doctor", "மருத்துவர்"),
                    Map.entry("Patient", "நோயாளி"),
                    Map.entry("General Physician", "பொது மருத்துவர்"),
                    Map.entry("Email", "மின்னஞ்சல்"),
                    Map.entry("Password", "கடவுச்சொல்"),
                    Map.entry("Search", "தேடுக"),
                    Map.entry("Book", "பதிவு"),
                    Map.entry("Schedule", "அட்டவணை"),
                    Map.entry("Profile", "சுயவிவரம்"),
                    Map.entry("Dashboard", "டாஷ்போர்டு"),
                    Map.entry("Find a Doctor", "மருத்துவரை கண்டுபிடி"),
                    Map.entry("My Appointments", "என் முன்பதிவுகள்"),
                    Map.entry("Consultation Ready", "மருத்துவ ஆலோசனை தயார்"),
                    Map.entry("Verified Specialist", "சரிபார்க்கப்பட்ட விசேஷஜ்ஞர்"),
                    Map.entry("Doctor ID:", "மருத்துவர் ID:"),
                    Map.entry("Degree:", "பட்டம்:"),
                    Map.entry("Experience:", "அனுபவம்:"),
                    Map.entry("Hospital:", "மருத்துவமனை:"),
                    Map.entry("Hospital ID:", "மருத்துவமனை ID:"),
                    Map.entry("Address:", "முகவரி:"),
                    Map.entry("Consultation Fee", "மருத்துவ ஆலோசனை கட்டணம்"),
                    Map.entry("N/A", "பொருந்தாது")
            );
            default -> Map.of();
        };

        String direct = termMap.get(key);
        if (direct != null) {
            return direct;
        }

        return null;
    }

    /**
     * Seeds common high-frequency healthcare and dashboard terms for instant zero-latency responses
     */
    private void seedCoreHealthDictionary() {
        // Hindi (hi)
        translationCache.put("hi::Book Appointment", "अपॉइंटमेंट बुक करें");
        translationCache.put("hi::View Schedule", "शेड्यूल देखें");
        translationCache.put("hi::Dashboard", "डैशबोर्ड");
        translationCache.put("hi::Admin Panel", "एडमिन पैनल");
        translationCache.put("hi::Doctors Management", "डॉक्टर प्रबंधन");
        translationCache.put("hi::Patients Management", "मरीज़ प्रबंधन");
        translationCache.put("hi::Add Doctor", "डॉक्टर जोड़ें");
        translationCache.put("hi::Add Hospital", "अस्पताल जोड़ें");
        translationCache.put("hi::Add PHC Centre", "पीएचसी केंद्र जोड़ें");
        translationCache.put("hi::PHC Management", "पीएचसी प्रबंधन");
        translationCache.put("hi::Community Health", "सामुदायिक स्वास्थ्य");
        translationCache.put("hi::Total Patients", "कुल मरीज़");
        translationCache.put("hi::Total Doctors", "कुल डॉक्टर");
        translationCache.put("hi::Total Appointments", "कुल अपॉइंटमेंट्स");
        translationCache.put("hi::Total Revenue", "कुल राजस्व");
        translationCache.put("hi::Completed", "पूर्ण");
        translationCache.put("hi::Pending", "लंबित");
        translationCache.put("hi::Cancelled", "रद्द");

        // Telugu (te)
        translationCache.put("te::Book Appointment", "అపాయింట్‌మెంట్ బుక్ చేయండి");
        translationCache.put("te::View Schedule", "షెడ్యూల్ చూడండి");
        translationCache.put("te::Dashboard", "డ్యాష్‌బోర్డ్");
        translationCache.put("te::Admin Panel", "అడ్మిన్ ప్యానెల్");
        translationCache.put("te::Doctors Management", "వైద్యుల నిర్వహణ");
        translationCache.put("te::Patients Management", "రోగుల నిర్వహణ");
        translationCache.put("te::Add Doctor", "వైద్యుడిని జోడించండి");
        translationCache.put("te::Add Hospital", "ఆసుపత్రిని జోడించండి");
        translationCache.put("te::Add PHC Centre", "పీహెచ్‌సీ కేంద్రాన్ని జోడించండి");
        translationCache.put("te::PHC Management", "పీహెచ్‌సీ నిర్వహణ");
        translationCache.put("te::Community Health", "సమాజ ఆరోగ్యం");
        translationCache.put("te::Total Patients", "మొత్తం రోగులు");
        translationCache.put("te::Total Doctors", "మొత్తం వైద్యులు");
        translationCache.put("te::Total Appointments", "మొత్తం అపాయింట్‌మెంట్లు");
        translationCache.put("te::Total Revenue", "మొత్తం ఆదాయం");
        translationCache.put("te::Completed", "పూర్తయింది");
        translationCache.put("te::Pending", "వేచివుంది");
        translationCache.put("te::Cancelled", "రద్దు చేయబడింది");

        // Tamil (ta)
        translationCache.put("ta::Dashboard", "டாஷ்போர்டு");
        translationCache.put("ta::Admin Panel", "நிர்வாக குழு");
        translationCache.put("ta::Doctors Management", "மருத்துவர்கள் மேலாண்மை");
        translationCache.put("ta::Patients Management", "நோயாளி மேலாண்மை");
        translationCache.put("ta::Add Doctor", "மருத்துவரைச் சேர்க்கவும்");
        translationCache.put("ta::Add Hospital", "மருத்துவமனையைச் சேர்க்கவும்");
        translationCache.put("ta::Add PHC Centre", "பிஎச்சி மையத்தைச் சேர்க்கவும்");
        translationCache.put("ta::PHC Management", "பிஎச்சி மேலாண்மை");
        translationCache.put("ta::Community Health", "சமூக சுகாதாரம்");
        translationCache.put("ta::Total Patients", "மொத்த நோயாளிகள்");
        translationCache.put("ta::Total Doctors", "மொத்த மருத்துவர்கள்");
        translationCache.put("ta::Total Appointments", "மொத்த முன்பதிவுகள்");
        translationCache.put("ta::Total Revenue", "மொத்த வருவாய்");

        // Kannada (kn)
        translationCache.put("kn::Dashboard", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್");
        translationCache.put("kn::Admin Panel", "ನಿರ್ವಾಹಕ ಫಲಕ");
        translationCache.put("kn::Doctors Management", "ವೈದ್ಯರ ನಿರ್ವಹಣೆ");
        translationCache.put("kn::Patients Management", "ರೋಗಿಗಳ ನಿರ್ವಹಣೆ");
        translationCache.put("kn::Add Doctor", "ವೈದ್ಯರನ್ನು ಸೇರಿಸಿ");
        translationCache.put("kn::Add Hospital", "ಆಸ್ಪತ್ರೆಯನ್ನು ಸೇರಿಸಿ");
        translationCache.put("kn::Add PHC Centre", "ಪಿಎಚ್‌ಸಿ ಕೇಂದ್ರವನ್ನು ಸೇರಿಸಿ");
        translationCache.put("kn::PHC Management", "ಪಿಎಚ್‌ಸಿ ನಿರ್ವಹಣೆ");
        translationCache.put("kn::Community Health", "ಸಮುದಾಯ ಆರೋಗ್ಯ");

        // Marathi (mr)
        translationCache.put("mr::Dashboard", "डॅशबोर्ड");
        translationCache.put("mr::Admin Panel", "प्रशासक पॅनेल");
        translationCache.put("mr::Doctors Management", "डॉक्टर व्यवस्थापन");
        translationCache.put("mr::Patients Management", "रुग्ण व्यवस्थापन");
        translationCache.put("mr::Add Doctor", "डॉक्टर जोडा");
        translationCache.put("mr::Add Hospital", "रुग्णालय जोडा");
        translationCache.put("mr::Add PHC Centre", "पीएचसी केंद्र जोडा");
        translationCache.put("mr::PHC Management", "पीएचसी व्यवस्थापन");
        translationCache.put("mr::Community Health", "सामुदायिक आरोग्य");

        // Bengali (bn)
        translationCache.put("bn::Dashboard", "ড্যাশবোর্ড");
        translationCache.put("bn::Admin Panel", "অ্যাডমিন প্যানেল");
        translationCache.put("bn::Doctors Management", "ডাক্তার ব্যবস্থাপনা");
        translationCache.put("bn::Patients Management", "রোগী ব্যবস্থাপনা");
        translationCache.put("bn::Add Doctor", "ডাক্তার যোগ করুন");
        translationCache.put("bn::Add Hospital", "হাসপাতাল যোগ করুন");
        translationCache.put("bn::Add PHC Centre", "পিএইচসি কেন্দ্র যোগ করুন");
        translationCache.put("bn::Community Health", "কমিউনিটি স্বাস্থ্য");

        // Gujarati (gu)
        translationCache.put("gu::Dashboard", "ડેશબોર્ડ");
        translationCache.put("gu::Admin Panel", "એડમિન પેનલ");
        translationCache.put("gu::Doctors Management", "ડોકટરોનું સંચાલન");
        translationCache.put("gu::Patients Management", "દર્દીઓનું સંચાલન");
        translationCache.put("gu::Add Doctor", "ડૉક્ટર ઉમેરો");
        translationCache.put("gu::Add Hospital", "હોસ્પિટલ ઉમેરો");
        translationCache.put("gu::Add PHC Centre", "પીએચસી કેન્દ્ર ઉમેરો");

        // Malayalam (ml)
        translationCache.put("ml::Dashboard", "ഡാഷ്‌ബോർഡ്");
        translationCache.put("ml::Admin Panel", "അഡ്മിൻ പാനൽ");
        translationCache.put("ml::Doctors Management", "ഡോക്ടർമാരുടെ മാനേജ്മെന്റ്");
        translationCache.put("ml::Patients Management", "രോഗികളുടെ മാനേജ്മെന്റ്");
        translationCache.put("ml::Add Doctor", "ഡോക്ടറെ ചേർക്കുക");
        translationCache.put("ml::Add Hospital", "ആശുപത്രി ചേർക്കുക");
        translationCache.put("ml::Add PHC Centre", "പിഎച്ച്സി കേന്ദ്രം ചേർക്കുക");
    }
}
