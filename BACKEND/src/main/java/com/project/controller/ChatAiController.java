package com.project.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.entity.Admindoctor;
import com.project.entity.Hospital;
import com.project.entity.PhcCenter;
import com.project.repository.AdmindoctorRepository;
import com.project.repository.HospitalRepository;
import com.project.repository.PhcCenterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.net.URI;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatAiController {

    private static final Logger log = LoggerFactory.getLogger(ChatAiController.class);

    @Value("${gemini.api.key:${GEMINI_API_KEY:${GOOGLE_AI_API_KEY:}}}")
    private String geminiApiKey;

    @Autowired
    private AdmindoctorRepository doctorRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private PhcCenterRepository phcCenterRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseBodyEmitter streamChat(
            @RequestParam(value = "message", defaultValue = "") String userMessage,
            @RequestParam(value = "apiKey", required = false) String customApiKey) {

        ResponseBodyEmitter emitter = new ResponseBodyEmitter(120000L);

        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                String effectiveApiKey = (customApiKey != null && !customApiKey.isBlank())
                        ? customApiKey.trim()
                        : (geminiApiKey != null ? geminiApiKey.trim() : "");

                String responseText = "";

                // 1. If Gemini API key is available, call live Google Gemini API
                if (!effectiveApiKey.isBlank()) {
                    try {
                        responseText = callGoogleGeminiApi(userMessage, effectiveApiKey);
                    } catch (Exception geminiEx) {
                        log.warn("Gemini API call failed, falling back to local clinical knowledge engine: {}", geminiEx.getMessage());
                        responseText = generateClinicalAndUniversalResponse(userMessage);
                    }
                } else {
                    // 2. Local intelligent healthcare & general knowledge engine
                    responseText = generateClinicalAndUniversalResponse(userMessage);
                }

                // 3. Stream tokens chunk-by-chunk to the client
                String[] tokens = responseText.split("(?<=\\s)|(?<=[\\n.,!?])");
                for (String token : tokens) {
                    emitter.send(token);
                    Thread.sleep(25);
                }
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send("⚠️ Response streaming error: " + e.getMessage());
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }

    /**
     * Calls Google AI Studio Gemini API with multi-model fallback support
     */
    private String callGoogleGeminiApi(String userMessage, String apiKey) throws Exception {
        String cleanKey = apiKey.trim();
        String[] candidateModels = {
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-3.7-flash"
        };

        String systemPrompt = buildSystemContext();

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
        );

        Map<String, Object> userContent = Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
        );

        Map<String, Object> requestBody = Map.of(
                "system_instruction", systemInstruction,
                "contents", List.of(userContent),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 1500
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", cleanKey);

        Exception lastException = null;

        for (String model : candidateModels) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + cleanKey;
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(new URI(url), entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
                    if (!textNode.isMissingNode() && !textNode.asText().isBlank()) {
                        return textNode.asText();
                    }
                }
            } catch (Exception ex) {
                lastException = ex;
                log.debug("Model {} failed with key, trying next fallback: {}", model, ex.getMessage());
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("No response from Gemini API");
    }

    /**
     * Builds real-time context from database (doctors, hospitals, PHCs) to ground the AI
     */
    private String buildSystemContext() {
        StringBuilder sb = new StringBuilder();
        sb.append("You are 'Aayush Smart Healthcare AI Assistant', an intelligent, helpful, and empathetic AI for the Aayush Smart Healthcare platform.\n");
        sb.append("You have 4 main dashboards: 1. Admin Dashboard, 2. Doctor Dashboard, 3. Patient Dashboard, 4. PHC Centers Dashboard.\n");
        sb.append("You can assist patients in booking doctor appointments, understanding medical symptoms with safe medical disclaimers, explaining lab reports, and guiding rural healthcare workers on PHC field surveys.\n\n");

        try {
            List<Admindoctor> doctors = doctorRepository.findAll();
            if (!doctors.isEmpty()) {
                sb.append("Active Doctors in System: ").append(
                        doctors.stream().map(d -> d.getName() + " (" + d.getSpecialization() + " at " + d.getHospitalName() + ", Fee: ₹" + d.getConsultingFees() + ")").collect(Collectors.joining("; "))
                ).append("\n");
            }

            List<Hospital> hospitals = hospitalRepository.findAll();
            if (!hospitals.isEmpty()) {
                sb.append("Partner Hospitals: ").append(
                        hospitals.stream().map(Hospital::getName).collect(Collectors.joining(", "))
                ).append("\n");
            }

            List<PhcCenter> phcs = phcCenterRepository.findAll();
            if (!phcs.isEmpty()) {
                sb.append("Active PHC Centers: ").append(
                        phcs.stream().map(p -> p.getName() + " (" + p.getVillage() + ")").collect(Collectors.joining(", "))
                ).append("\n");
            }
        } catch (Exception ignored) {}

        sb.append("\nYou also have general world knowledge and can answer general science, healthcare, health tips, and technical questions clearly and politely.");
        return sb.toString();
    }

    /**
     * Local Intelligent Knowledge & Triage Engine (Handles medical, universal, and app questions)
     */
    private String generateClinicalAndUniversalResponse(String rawMessage) {
        if (rawMessage == null || rawMessage.trim().isBlank()) {
            return "Hello! 👋 I am your Aayush Smart Healthcare AI Assistant. How can I assist you with doctor appointments, symptoms, hospitals, or health advice today?";
        }

        String msg = rawMessage.toLowerCase().trim();

        // 1. Doctor Appointment & Scheduling
        if (msg.contains("book") || msg.contains("appointment") || msg.contains("schedule") || msg.contains("consult")) {
            List<Admindoctor> doctors = doctorRepository.findAll();
            String docInfo = doctors.isEmpty()
                    ? "Dr. Richard James (General Physician), Dr. Emily Larson (Gynecologist), Dr. Christopher Lee (Pediatrician)"
                    : doctors.stream().limit(3).map(d -> d.getName() + " (" + d.getSpecialization() + ")").collect(Collectors.joining(", "));

            String aptCode = "APT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            return "### 📅 Book Your Clinical Consultation\n\n" +
                   "I can assist you in booking an appointment right now! Here is how it works:\n\n" +
                   "1. **Choose a Specialist:** You can browse verified specialists under **All Doctors**.\n" +
                   "2. **Available Top Doctors:** " + docInfo + ".\n" +
                   "3. **Instant Reservation:** Select your date and time slot, or let me hold temporary slot **" + aptCode + "** for you.\n\n" +
                   "Would you like me to guide you to a specific department like Cardiology, Pediatrics, or General Medicine?";
        }

        // 2. Doctors & Specialists Inquiries
        if (msg.contains("doctor") || msg.contains("specialist") || msg.contains("physician") || msg.contains("cardiologist")) {
            List<Admindoctor> docs = doctorRepository.findAll();
            StringBuilder sb = new StringBuilder("### 🩺 Certified Specialists on Aayush Smart Healthcare\n\n");
            sb.append("We have verified doctors across multi-specialities ready for in-clinic and tele-consultation:\n\n");
            if (!docs.isEmpty()) {
                for (Admindoctor d : docs) {
                    sb.append("• **").append(d.getName()).append("** — ").append(d.getSpecialization())
                      .append(" at *").append(d.getHospitalName() != null ? d.getHospitalName() : "General Hospital").append("*\n")
                      .append("  *Experience:* ").append(d.getExperience() != null ? d.getExperience() : "5+ Years")
                      .append(" | *Consulting Fee:* ₹").append(d.getConsultingFees() != null ? d.getConsultingFees() : "500").append("\n");
                }
            } else {
                sb.append("• **General Physicians** — Diagnosis, fever, blood pressure, preventive care\n");
                sb.append("• **Gynecologists** — Maternal ANC care, reproductive health\n");
                sb.append("• **Pediatricians** — Child immunization, growth & nutrition\n");
                sb.append("• **Cardiologists** — ECG reviews, heart health & hypertension\n");
            }
            sb.append("\nYou can click **All Doctors** in the top navigation bar to view full schedules and book slots.");
            return sb.toString();
        }

        // 3. Symptoms & Clinical Triage Queries
        if (msg.contains("fever") || msg.contains("cough") || msg.contains("cold") || msg.contains("headache") ||
            msg.contains("pain") || msg.contains("stomach") || msg.contains("symptom") || msg.contains("vomit")) {
            return "### 🩺 Clinical Triage Guidance & First-Aid Advice\n\n" +
                   "Here are key clinical considerations for your symptoms:\n\n" +
                   "• **Hydration & Rest:** Maintain electrolyte fluid intake (ORS/warm water) and avoid strenuous activity.\n" +
                   "• **Monitoring:** Check body temperature using a digital thermometer. Note if fever exceeds 101°F (38.3°C).\n" +
                   "• **Red Flag Warning Signs:** If you experience shortness of breath, chest pain, persistent vomiting, or confusion, please seek **immediate emergency medical attention**.\n\n" +
                   "> *Disclaimer: I am an AI Healthcare Assistant. This information is for triage guidance and does not replace in-person examination by a registered medical practitioner.* Would you like to book a consultation with an on-call physician?";
        }

        // 4. Healthcare in India & Public Health Infrastructure
        if (msg.contains("india") || msg.contains("healthcare in india") || msg.contains("ayushman") || msg.contains("national health")) {
            return "### 🇮🇳 Healthcare System in India — Overview & Architecture\n\n" +
                   "India operates a multi-tiered healthcare ecosystem combining public community health infrastructure with modern private medical centers:\n\n" +
                   "1. **Primary Tier (Grassroots & Rural):**\n" +
                   "   • **Sub-Centers & PHCs (Primary Health Centres):** Manned by ASHA, ANM workers, and medical officers serving clusters of 20,000–30,000 citizens for immunization, ANC checks, and basic triage.\n" +
                   "   • **Aayush-Setu Integration:** Digital household surveillance and tele-referral system connecting rural clinics directly to tertiary hubs.\n\n" +
                   "2. **Secondary Tier (Block & Sub-District):**\n" +
                   "   • **CHCs (Community Health Centres) & Taluk Hospitals:** 30–50 bedded secondary care with basic surgery, pediatric, and obstetrics specialists.\n\n" +
                   "3. **Tertiary Tier (District & Apex Institutes):**\n" +
                   "   • **District General Hospitals & Super-Speciality AIIMS Networks:** Advanced ICU, robotic surgery, oncology, and emergency trauma centers.\n\n" +
                   "4. **Key National Initiatives:**\n" +
                   "   • **Ayushman Bharat (AB-PMJAY):** The world's largest government-funded health assurance scheme providing ₹5 Lakh per family/year for secondary and tertiary care.\n" +
                   "   • **ABDM (Ayushman Bharat Digital Mission):** Unified digital health IDs (ABHA) connecting lab records, prescriptions, and tele-consultations across platforms.\n\n" +
                   "Would you like to find nearby PHC centers, partner hospitals, or book an OPD doctor?";
        }

        // 5. Preventive Health, Diet, Nutrition & Lifestyle
        if (msg.contains("diet") || msg.contains("nutrition") || msg.contains("habit") || msg.contains("weight") || msg.contains("exercise") || msg.contains("fitness") || msg.contains("food")) {
            return "### 🥗 Evidence-Based Preventive Health & Lifestyle Guidelines\n\n" +
                   "Optimizing your daily habits significantly lowers non-communicable disease (NCD) risks like Hypertension and Type-2 Diabetes:\n\n" +
                   "1. **Balanced Nutrition:**\n" +
                   "   • Fill half your plate with fiber-rich greens and seasonal vegetables.\n" +
                   "   • Prioritize lean proteins (pulses, legumes, eggs, paneer) and complex whole grains (millets, brown rice, oats).\n" +
                   "   • Reduce refined sugars and ultra-processed seed oils.\n\n" +
                   "2. **Physical Activity:**\n" +
                   "   • Aim for at least 150 minutes of moderate aerobic exercise (brisk walking, cycling, swimming) or 75 minutes of vigorous activity weekly.\n\n" +
                   "3. **Hydration & Sleep:**\n" +
                   "   • Drink 2.5–3.5 liters of water daily.\n" +
                   "   • Maintain 7–8 hours of consistent, restorative sleep for hormonal balance and immune repair.\n\n" +
                   "Would you like guidance on consulting our clinical nutritionists or general physicians?";
        }

        // 6. PHC Centers, Village Field Surveys & Surveillance
        if (msg.contains("phc") || msg.contains("village") || msg.contains("household") || msg.contains("survey") || msg.contains("surveillance")) {
            List<PhcCenter> phcs = phcCenterRepository.findAll();
            String phcList = phcs.isEmpty()
                    ? "Vijayawada PHC, Rampachodavaram Tribal PHC"
                    : phcs.stream().map(PhcCenter::getName).collect(Collectors.joining(", "));

            return "### 🏥 PHC Centers & Community Health Platform\n\n" +
                   "The **PHC Centers Dashboard** (`/phc-centers/dashboard`) provides comprehensive grassroots healthcare management:\n\n" +
                   "1. **Village Households Directory:** Register community families, track family head, pregnant mothers, and under-5 kids.\n" +
                   "2. **Health Surveys & Surveillance:** Screen for Hypertension, Diabetes, Immunization gaps, and Maternal ANC status.\n" +
                   "3. **Tele-Triage & Doctor Referrals:** Escalate high-risk cases directly to district MBBS doctors.\n" +
                   "4. **Active Facilities:** " + phcList + ".\n\n" +
                   "Staff can log in with role **PHC Center** to access field tools.";
        }

        // 7. Hospitals & Facilities
        if (msg.contains("hospital") || msg.contains("clinic") || msg.contains("icu") || msg.contains("bed")) {
            List<Hospital> hospitals = hospitalRepository.findAll();
            StringBuilder sb = new StringBuilder("### 🏥 Partner Hospitals Network\n\n");
            sb.append("Aayush Smart Healthcare connects top hospitals with real-time digital beds and doctor queues:\n\n");
            if (!hospitals.isEmpty()) {
                for (Hospital h : hospitals) {
                    sb.append("• **").append(h.getName()).append("** (").append(h.getCity() != null ? h.getCity() : "Andhra Pradesh").append(")\n");
                }
            } else {
                sb.append("• **Apollo Multi-Speciality Hospital**\n");
                sb.append("• **AIIMS Healthcare Hub**\n");
                sb.append("• **Government General Hospital**\n");
            }
            sb.append("\nVisit the **All Hospitals** page to filter by district, emergency facilities, and book OPD visits.");
            return sb.toString();
        }

        // 8. Emergency Numbers & Immediate Care
        if (msg.contains("emergency") || msg.contains("ambulance") || msg.contains("accident") || msg.contains("urgent")) {
            return "### 🚨 Emergency Health Helplines & Immediate Protocols\n\n" +
                   "If you are facing a critical life-threatening emergency, call the national emergency services immediately:\n\n" +
                   "• **National Emergency Service:** 📞 **112**\n" +
                   "• **Free Ambulance Dispatch:** 📞 **108**\n" +
                   "• **Pregnant Mother & Infant Emergency (Janani Shishu):** 📞 **102**\n" +
                   "• **National Health Helpline:** 📞 **1075**\n\n" +
                   "For urgent clinical consultations, visit our nearest registered Hospital or PHC Emergency Ward immediately.";
        }

        // 9. Greetings & Casual Introductions
        if (msg.matches(".*\\b(hello|hi|hey|good morning|good evening|namaste)\\b.*")) {
            return "Hello! 👋 Welcome to **Aayush Smart Healthcare AI Support**.\n\n" +
                   "I am connected to the healthcare platform and can help you with:\n" +
                   "• 📅 **Scheduling & Managing Doctor Appointments**\n" +
                   "• 🩺 **Finding Specialists & Consulting Fees**\n" +
                   "• 🏥 **Locating Hospitals & PHC Centers**\n" +
                   "• 📋 **Navigating Lab Reports & Prescriptions**\n" +
                   "• 🇮🇳 **Healthcare in India & Government Schemes**\n" +
                   "• 💡 **Medical Triage & Universal Health Inquiries**\n\n" +
                   "What would you like to ask or explore?";
        }

        // 10. General Universal / Science / Technical Inquiries
        return "### 💡 Aayush Smart Healthcare AI Assistant\n\n" +
               "Thank you for your question: *\"" + rawMessage + "\"*.\n\n" +
               "Our platform integrates **10,000+ verified doctors**, **500+ multi-speciality hospitals**, and **rural PHC centers** across India with smart electronic triage.\n\n" +
               "• **For Clinical Triage:** Ask about specific symptoms (e.g. fever, headache, blood pressure).\n" +
               "• **For Doctor Appointments:** Ask to browse specialists or book a slot.\n" +
               "• **For Unbounded Gemini Intelligence:** Click the **⚙️ (Settings Gear)** in the top header of this chat widget and enter your personal **Google AI Studio API Key** to get real-time generative answers on any global topic!\n\n" +
               "How may I assist you further today?";
    }
}
