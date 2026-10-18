import React, { useState, useRef, useEffect } from 'react';
import { BACKENDURL } from '../lib';
import './AiChatWidget.css';

const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_user_api_key') || '');
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! 👋 I am your Aayush Smart Healthcare AI Assistant powered by Google Gemini. How can I help you with symptoms, booking doctors, finding PHC clinics, or answering health questions today?'
    }
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat history viewport to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isStreaming, isOpen]);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_user_api_key', geminiApiKey.trim());
    setShowSettings(false);
  };

  // Real-Time Fetch API Streaming Reader
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = inputMessage.trim();
    if (!messageText || isStreaming) return;

    // 1. Append user message and placeholder for assistant
    const userMsgId = 'usr_' + Date.now();
    const assistantMsgId = 'ast_' + Date.now();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: messageText },
      { id: assistantMsgId, role: 'assistant', content: '' }
    ]);

    setInputMessage('');
    setIsStreaming(true);

    try {
      // 2. Call backend streaming endpoint
      const baseUrl = BACKENDURL ? BACKENDURL.replace(/\/+$/, '') : 'http://localhost:8080/api';
      const keyParam = geminiApiKey.trim() ? `&apiKey=${encodeURIComponent(geminiApiKey.trim())}` : '';
      const endpoint = `${baseUrl}/chat/stream?message=${encodeURIComponent(messageText)}${keyParam}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream, text/plain, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // 3. Obtain the ReadableStream Reader and UTF-8 Decoder
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      // 4. Stream chunks and update the assistant message token-by-token
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: !done });

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat streaming failed:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: '⚠️ I am here to help! Please check if our clinical backend is online, or configure your Gemini API Key in the ⚙️ settings.'
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="ai-widget-wrapper">
      {/* 1. Chat Window Viewport */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">🤖</div>
              <div>
                <h4 className="ai-chat-title">Aayush Smart Healthcare AI</h4>
                <span className="ai-chat-status">
                  {geminiApiKey ? 'Gemini Live Key Connected' : 'Clinical AI Engine Active'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="ai-chat-close-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Configure Gemini API Key"
                style={{ fontSize: '16px' }}
              >
                ⚙️
              </button>
              <button
                type="button"
                className="ai-chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Settings Panel if toggled */}
          {showSettings && (
            <div style={{ padding: '12px 16px', background: '#e0e7ff', borderBottom: '1px solid #c7d2fe' }}>
              <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#312e81' }}>
                  Google AI Studio Gemini API Key (Optional):
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #a5b4fc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#4338ca',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Key
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Messages Feed */}
          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message ${
                  msg.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'
                }`}
              >
                {msg.content}
                {isStreaming && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id && (
                  <span className="ai-typing-indicator" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="ai-chat-footer">
            <form onSubmit={handleSendMessage} className="ai-chat-form">
              <input
                type="text"
                className="ai-chat-input"
                placeholder="Ask about symptoms, doctors, booking..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isStreaming}
                autoFocus
              />
              <button
                type="submit"
                className="ai-chat-send-btn"
                disabled={!inputMessage.trim() || isStreaming}
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Floating Launcher Button (Static in bottom-right corner) */}
      <button
        type="button"
        className={`ai-widget-launcher ${!isOpen ? 'ai-widget-launcher-pulse' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle AI Healthcare Chat"
        title="Chat with Aayush Smart Healthcare AI"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default AiChatWidget;
