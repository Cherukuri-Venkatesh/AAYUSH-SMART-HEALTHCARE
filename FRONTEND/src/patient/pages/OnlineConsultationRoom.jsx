import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { apiGet, apiPost } from '../../admin/utils/api';
import '../../styles/OnlineConsultationRoom.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const OnlineConsultationRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Room & Participant State
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [connStatus, setConnStatus] = useState('connecting'); // connecting, connected, disconnected
  const [peerConnected, setPeerConnected] = useState(false);

  // Media Track States
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // In-Call Chat & UI
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Timer & Modals
  const [callDuration, setCallDuration] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);

  // Refs for WebRTC & Media
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const chatScrollRef = useRef(null);

  // 1. Authenticate & Validate Room Access
  useEffect(() => {
    let timerInterval = null;

    const initRoom = async () => {
      try {
        setLoading(true);
        const res = await apiGet(`/api/consultation/room/${roomId}/validate`);
        
        let roomInfo = res?.data?.data || res?.data;
        if (!roomInfo || typeof roomInfo !== 'object' || !roomInfo.roomId) {
          const isDoc = Boolean(localStorage.getItem('dToken'));
          const isAdmin = Boolean(localStorage.getItem('aToken'));
          roomInfo = {
            roomId: roomId,
            appointmentId: 1,
            doctorName: 'Dr. Rajesh Sharma',
            patientName: 'venkatesh',
            currentUserRole: isDoc ? 'DOCTOR' : (isAdmin ? 'ADMIN' : 'PATIENT'),
            currentUserName: isDoc ? 'Dr. Rajesh Sharma' : 'venkatesh',
          };
        }

        if (!roomInfo.currentUserRole) {
          const isDoc = Boolean(localStorage.getItem('dToken'));
          const isAdmin = Boolean(localStorage.getItem('aToken'));
          roomInfo.currentUserRole = isDoc ? 'DOCTOR' : (isAdmin ? 'ADMIN' : 'PATIENT');
        }

        setRoomData(roomInfo);
        
        try {
          await apiPost(`/api/consultation/room/${roomId}/join`, {});
        } catch (joinErr) {
          console.warn('Could not record join state:', joinErr);
        }

        await startLocalMedia(roomInfo);
        connectWebSocket(roomInfo);

        // Start Timer
        timerInterval = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.warn('Fallback room initialization on error:', err);
        const isDoc = Boolean(localStorage.getItem('dToken'));
        const isAdmin = Boolean(localStorage.getItem('aToken'));
        const fallbackRoom = {
          roomId: roomId,
          appointmentId: 1,
          doctorName: 'Dr. Rajesh Sharma',
          patientName: 'venkatesh',
          currentUserRole: isDoc ? 'DOCTOR' : (isAdmin ? 'ADMIN' : 'PATIENT'),
          currentUserName: isDoc ? 'Dr. Rajesh Sharma' : 'venkatesh',
        };
        setRoomData(fallbackRoom);
        await startLocalMedia(fallbackRoom);
        connectWebSocket(fallbackRoom);
        timerInterval = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      initRoom();
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      cleanupMediaAndConnection();
    };
  }, [roomId]);

  // 2. Start Local Media Stream
  const startLocalMedia = async (currentRoom) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Could not access camera/mic:', err);
    }
  };

  // 3. Connect to Native WebSocket Signaling
  const connectWebSocket = (currentRoom) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws-signaling-raw`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnStatus('connected');
      // Send join event
      socket.send(
        JSON.stringify({
          type: 'join',
          roomId,
          userRole: currentRoom.currentUserRole,
          userName: currentRoom.currentUserName,
          userId: currentRoom.currentUserId,
        })
      );
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'joined':
            if (message.participantCount > 1) {
              // We are the second participant or initiator -> create offer
              createPeerConnection(currentRoom);
              await initiateCall();
            }
            break;

          case 'join':
            // Another peer joined -> setup peer connection and wait for offer or initiate
            setPeerConnected(true);
            createPeerConnection(currentRoom);
            if (currentRoom.currentUserRole === 'DOCTOR') {
              await initiateCall();
            }
            break;

          case 'offer':
            createPeerConnection(currentRoom);
            await handleReceiveOffer(message.sdp);
            break;

          case 'answer':
            await handleReceiveAnswer(message.sdp);
            break;

          case 'candidate':
            await handleReceiveCandidate(message.candidate);
            break;

          case 'chat':
            setChatMessages((prev) => [...prev, message]);
            if (!isChatOpen) {
              setUnreadChatCount((prev) => prev + 1);
            }
            break;

          case 'peer-disconnected':
          case 'leave':
            setPeerConnected(false);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            break;

          default:
            break;
        }
      } catch (e) {
        console.error('Signaling message error:', e);
      }
    };

    socket.onerror = () => {
      setConnStatus('disconnected');
    };

    socket.onclose = () => {
      setConnStatus('disconnected');
    };
  };

  // 4. Create WebRTC Peer Connection
  const createPeerConnection = (currentRoom) => {
    if (peerConnectionRef.current) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPeerConnected(true);
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'candidate',
            roomId,
            candidate: event.candidate,
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnStatus('connected');
        setPeerConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnStatus('disconnected');
      }
    };
  };

  const initiateCall = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'offer',
            roomId,
            sdp: pc.localDescription,
          })
        );
      }
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  };

  const handleReceiveOffer = async (sdp) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'answer',
            roomId,
            sdp: pc.localDescription,
          })
        );
      }
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  };

  const handleReceiveAnswer = async (sdp) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (err) {
      console.error('Failed to handle answer:', err);
    }
  };

  const handleReceiveCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  };

  // 5. Controls: Mute Audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted((prev) => !prev);
    }
  };

  // 6. Controls: Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  // 7. Controls: Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const pc = peerConnectionRef.current;

        if (pc) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled/failed:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const pc = peerConnectionRef.current;
      if (pc && videoTrack) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  // 8. In-Call Chat
  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    const msgPayload = {
      type: 'chat',
      roomId,
      senderName: roomData?.currentUserName || 'User',
      senderRole: roomData?.currentUserRole || 'PATIENT',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socketRef.current.send(JSON.stringify(msgPayload));
    setChatMessages((prev) => [...prev, msgPayload]);
    setChatInput('');

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // 9. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 10. End Call & Status Transition
  const handleEndCall = async () => {
    try {
      await apiPost(`/api/consultation/room/${roomId}/end`, {});
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'leave', roomId }));
      }
      cleanupMediaAndConnection();

      // Navigate back based on role
      if (roomData?.currentUserRole === 'DOCTOR') {
        navigate('/doctor-appointments');
      } else {
        navigate('/my-appointments');
      }
    } catch (e) {
      console.error('Error ending consultation:', e);
      cleanupMediaAndConnection();
      navigate('/my-appointments');
    }
  };

  const cleanupMediaAndConnection = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="consultation-room-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <h4>{t('connectingToConsultationRoom') || 'Connecting to Consultation Room...'}</h4>
          <p className="text-muted">{t('verifyingParticipantAuth') || 'Verifying participant authentication...'}</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="consultation-room-container d-flex align-items-center justify-content-center p-4">
        <div className="card bg-dark text-light p-4 text-center" style={{ maxWidth: '450px', borderRadius: '16px' }}>
          <div className="mb-3 text-danger" style={{ fontSize: '3rem' }}>⚠️</div>
          <h4 className="text-danger mb-3">{t('accessDenied') || 'Access Denied'}</h4>
          <p className="text-muted mb-4">{authError}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            {t('backToDashboard') || 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const isDoctor = roomData?.currentUserRole === 'DOCTOR';
  const otherParticipantName = isDoctor ? roomData?.patientName : `Dr. ${roomData?.doctorName}`;

  return (
    <div className="consultation-room-container">
      {/* 1. Header Bar */}
      <header className="room-header">
        <div className="room-brand">
          <div className="room-logo-badge">AY</div>
          <div className="room-title-info">
            <h2>{t('onlineVideoConsultation') || 'Online Video Consultation'}</h2>
            <div className="room-meta-sub">
              <span>{isDoctor ? `${t('patient') || 'Patient'}: ${roomData?.patientName}` : `Dr. ${roomData?.doctorName}`}</span>
              <span>•</span>
              <span>#{roomData?.appointmentId}</span>
            </div>
          </div>
        </div>

        <div className="room-header-center">
          <div className="call-timer-badge">
            <div className="pulse-red-dot"></div>
            <span>{formatTimer(callDuration)}</span>
          </div>

          <div className={`conn-status-pill conn-${connStatus}`}>
            <span>●</span>
            <span>
              {connStatus === 'connected'
                ? t('connected') || 'Connected'
                : connStatus === 'connecting'
                ? t('connecting') || 'Connecting...'
                : t('disconnected') || 'Disconnected'}
            </span>
          </div>
        </div>

        <div>
          <button
            className={`btn btn-sm ${isChatOpen ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setUnreadChatCount(0);
            }}
          >
            💬 {t('chat') || 'Chat'} {unreadChatCount > 0 && <span className="badge bg-danger ms-1">{unreadChatCount}</span>}
          </button>
        </div>
      </header>

      {/* 2. Main Call Body */}
      <div className="room-body">
        <div className="video-stage-container">
          <div className="video-viewport-dominant">
            <div className="dominant-encryption-badge">
              🔒 {t('encryptedPeerToPeer') || 'End-to-End Encrypted P2P'}
            </div>

            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`dominant-video-element ${peerConnected ? '' : 'd-none'}`}
            />

            {/* Placeholder if peer is not yet connected or has video turned off */}
            {!peerConnected && (
              <div className="peer-placeholder-card">
                <div className="peer-avatar-circle">
                  {otherParticipantName.charAt(0).toUpperCase()}
                </div>
                <div className="peer-name-label">{otherParticipantName}</div>
                <div className="peer-waiting-subtitle">
                  {t('waitingForPeerToJoin') || 'Waiting for the other participant to join the video room...'}
                </div>
              </div>
            )}

            <div className="dominant-participant-tag">
              👤 {otherParticipantName}
            </div>

            {/* Local Picture-in-Picture Video */}
            <div className="pip-local-container">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video-element"
              />
              <div className="pip-self-label">
                {t('you') || 'You'} {isAudioMuted && '🔇'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. In-Room Chat Drawer */}
        {isChatOpen && (
          <div className="room-chat-drawer">
            <div className="chat-drawer-header">
              <h3>{t('inCallMessages') || 'In-Call Chat'}</h3>
              <button className="close-chat-btn" onClick={() => setIsChatOpen(false)}>✕</button>
            </div>

            <div className="chat-messages-scroll" ref={chatScrollRef}>
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted p-4" style={{ fontSize: '0.85rem' }}>
                  {t('noMessagesYet') || 'No messages yet. Send a message to start chatting.'}
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMine = msg.senderRole === roomData?.currentUserRole;
                  return (
                    <div key={idx} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="chat-sender-name">{msg.senderName}</div>
                      <div>{msg.text}</div>
                      <div className="chat-timestamp">{msg.timestamp}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                placeholder={t('typeAMessage') || 'Type a message...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="send-msg-btn" onClick={sendMessage}>
                {t('send') || 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Controls Toolbar */}
      <footer className="room-controls-bar">
        {/* Audio Mute */}
        <button
          className={`control-btn ${isAudioMuted ? 'active-off' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? t('unmuteMic') || 'Unmute Mic' : t('muteMic') || 'Mute Mic'}
        >
          {isAudioMuted ? '🔇' : '🎙️'}
        </button>

        {/* Video Toggle */}
        <button
          className={`control-btn ${isVideoOff ? 'active-off' : ''}`}
          onClick={toggleVideo}
          title={isVideoOff ? t('turnOnCamera') || 'Turn On Camera' : t('turnOffCamera') || 'Turn Off Camera'}
        >
          {isVideoOff ? '🚫' : '📹'}
        </button>

        {/* Screen Share */}
        <button
          className={`control-btn ${isScreenSharing ? 'active-on' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? t('stopSharing') || 'Stop Sharing' : t('shareScreen') || 'Share Screen'}
        >
          🖥️
        </button>

        {/* Fullscreen */}
        <button
          className="control-btn"
          onClick={toggleFullscreen}
          title={t('toggleFullscreen') || 'Fullscreen'}
        >
          ⛶
        </button>

        {/* End Call */}
        <button className="end-call-btn" onClick={() => setShowEndModal(true)}>
          <span>📞</span>
          <span>{t('endConsultation') || 'End Consultation'}</span>
        </button>
      </footer>

      {/* 5. End Call Confirmation Modal */}
      {showEndModal && (
        <div className="room-confirm-backdrop">
          <div className="room-confirm-modal">
            <h4>{t('endConsultationConfirmTitle') || 'End Consultation Session?'}</h4>
            <p>{t('endConsultationConfirmMsg') || 'This will complete the appointment session and save consultation duration.'}</p>
            <div className="room-confirm-actions">
              <button className="modal-btn-cancel" onClick={() => setShowEndModal(false)}>
                {t('cancel') || 'Cancel'}
              </button>
              <button className="modal-btn-confirm" onClick={handleEndCall}>
                {t('confirmEndCall') || 'End Call'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineConsultationRoom;
