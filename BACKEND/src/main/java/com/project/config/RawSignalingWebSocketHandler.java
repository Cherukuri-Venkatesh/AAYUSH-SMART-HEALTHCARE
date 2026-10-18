package com.project.config;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class RawSignalingWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map roomId -> Set of active WebSocket sessions
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    // Map sessionId -> roomId
    private final Map<String, String> sessionRooms = new ConcurrentHashMap<>();

    // Map sessionId -> userInfo
    private final Map<String, Map<String, Object>> sessionUsers = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Connected
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        if (payload == null || payload.trim().isEmpty()) return;

        Map<String, Object> data = objectMapper.readValue(payload, Map.class);
        String type = (String) data.get("type");
        String roomId = (String) data.get("roomId");

        if (type == null || roomId == null) return;

        if ("join".equalsIgnoreCase(type)) {
            sessionRooms.put(session.getId(), roomId);
            sessionUsers.put(session.getId(), data);

            roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);

            // Notify everyone in the room about participant join
            broadcastToRoom(roomId, session, payload);

            // Send current participant count to this session
            Map<String, Object> ack = new HashMap<>();
            ack.put("type", "joined");
            ack.put("roomId", roomId);
            ack.put("participantCount", roomSessions.get(roomId).size());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));

        } else if ("offer".equalsIgnoreCase(type) ||
                   "answer".equalsIgnoreCase(type) ||
                   "candidate".equalsIgnoreCase(type) ||
                   "chat".equalsIgnoreCase(type) ||
                   "status".equalsIgnoreCase(type) ||
                   "leave".equalsIgnoreCase(type)) {

            // Relay peer message to other participants in the room
            broadcastToRoom(roomId, session, payload);
        }
    }

    private void broadcastToRoom(String roomId, WebSocketSession senderSession, String messagePayload) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) return;

        for (WebSocketSession s : sessions) {
            if (s.isOpen() && !s.getId().equals(senderSession.getId())) {
                try {
                    synchronized (s) {
                        s.sendMessage(new TextMessage(messagePayload));
                    }
                } catch (IOException e) {
                    // Ignore session send error
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomId = sessionRooms.remove(session.getId());
        Map<String, Object> userData = sessionUsers.remove(session.getId());

        if (roomId != null && roomSessions.containsKey(roomId)) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            sessions.remove(session);

            // Notify remaining peers about user disconnect
            Map<String, Object> leaveNotice = new HashMap<>();
            leaveNotice.put("type", "peer-disconnected");
            leaveNotice.put("roomId", roomId);
            if (userData != null) {
                leaveNotice.put("userRole", userData.get("userRole"));
                leaveNotice.put("userName", userData.get("userName"));
            }

            String payload = objectMapper.writeValueAsString(leaveNotice);
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        synchronized (s) {
                            s.sendMessage(new TextMessage(payload));
                        }
                    } catch (IOException ignored) {}
                }
            }

            if (sessions.isEmpty()) {
                roomSessions.remove(roomId);
            }
        }
    }
}
