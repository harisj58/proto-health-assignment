import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle } from 'lucide-react';

const SpeechToTextApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  const connectWebSocket = useCallback((onOpenCallback) => {
    const wsUrl = `ws://${process.env.REACT_APP_BACKEND_BASE_URL}/ws/v1/speech-to-text`;

    try {
      console.log('[WS] Connecting...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setError('');
        if (onOpenCallback) onOpenCallback();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'transcript' && data.text?.trim() && data.is_final) {
            setTranscript(prev => prev + ' ' + data.text);
          } else if (data.event === 'error') {
            console.error('[WS] Error:', data.message);
            setError('Server Error: ' + data.message);
          } else if (data.event === 'stopped') {
            console.log('[WS] Session stopped:', data.message);
          }
        } catch (err) {
          console.error('[WS] Invalid JSON:', err);
        }
      };

      ws.onclose = () => {
        console.warn('[WS] Closed');
        setIsConnected(false);
        setIsRecording(false);
      };

      ws.onerror = (e) => {
        console.error('[WS] Connection error');
        setError('WebSocket connection error');
        setIsConnected(false);
      };
    } catch (err) {
      console.error('[WS] Failed to connect:', err);
      setError('WebSocket connection failed');
    }
  }, []);


  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [connectWebSocket]);

  const convertFloat32ToInt16 = (buffer) => {
    const l = buffer.length;
    const result = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return result;
  };

  const startRecording = async () => {
    // Reset state for a new session
    setTranscript('');
    setError('');
    setSuccess('');
    setAudioLevel(0);

    // Close previous WebSocket if still open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    // Reconnect and wait for WebSocket before starting mic
    connectWebSocket(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        streamRef.current = stream;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000,
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const float32 = e.inputBuffer.getChannelData(0);
          const int16 = convertFloat32ToInt16(float32);
          updateLevel(float32); // new RMS-based audio level
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(int16.buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        // Start the backend session
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ event: "start" }));
        }

        setIsRecording(true);

      } catch (err) {
        console.error('[Start] Error:', err);
        setError('Microphone access error: ' + err.message);
      }
    });
  };

  const updateLevel = (buffer) => {
    const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length);
    setAudioLevel(rms);
  };



  const stopRecording = () => {
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'stop' }));
    }
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setAudioLevel(0);
  };

  const clearTranscript = () => {
    setTranscript('');
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>🎙️ Live Speech-to-Text</h2>
      <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 16, background: isConnected ? '#dcfce7' : '#fef2f2', color: isConnected ? '#166534' : '#dc2626', fontSize: 14 }}>
        {isConnected ? '✅ WebSocket connected' : '❌ Not connected to server'}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={isRecording ? stopRecording : startRecording} disabled={!isConnected} style={{ background: isRecording ? '#ef4444' : '#10b981', color: '#fff', padding: '10px 16px', borderRadius: 6, border: 'none', cursor: isConnected ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: isConnected ? 1 : 0.5 }}>
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button onClick={clearTranscript} disabled={!transcript.trim()} style={{ background: '#6b7280', color: '#fff', padding: '10px 16px', borderRadius: 6, border: 'none', cursor: transcript.trim() ? 'pointer' : 'not-allowed', fontSize: 14, opacity: transcript.trim() ? 1 : 0.5 }}>
          Clear
        </button>
      </div>
      {isRecording && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>Audio Level:</span>
            <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(audioLevel * 100, 100)}%`, background: audioLevel > 0.1 ? '#22c55e' : '#facc15', transition: 'width 0.1s ease', borderRadius: 4 }} />
            </div>
          </div>
        </div>
      )}
      <div ref={transcriptRef} style={{ height: 250, padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.5 }}>
        {transcript || (<p style={{ color: '#9ca3af', fontStyle: 'italic' }}>{isRecording ? '🎤 Listening... Start speaking!' : 'Click "Start Recording" to begin'}</p>)}
      </div>
      {error && (<div style={{ color: '#dc2626', marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><AlertCircle size={16} />{error}</div>)}
      {success && (<div style={{ color: '#166534', marginTop: 12, padding: '8px 12px', background: '#dcfce7', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><CheckCircle size={16} />{success}</div>)}
      <div style={{ fontSize: 12, marginTop: 24, padding: 12, background: '#f3f4f6', borderRadius: 6, color: '#6b7280' }}>
        <p style={{ margin: 0, marginBottom: 4 }}><strong>Note:</strong> This app requires HTTPS or localhost to access the microphone.</p>
        <p style={{ margin: 0 }}>Make sure your backend is running on <code>localhost:8000</code> with the WebSocket endpoint.</p>
      </div>
      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SpeechToTextApp;
