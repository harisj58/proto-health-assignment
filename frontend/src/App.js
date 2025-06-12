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

  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://${process.env.REACT_APP_BACKEND_BASE_URL}/ws/v1/speech-to-text`;
    try {
      console.log('[WS] Connecting...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setError('');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'transcript' && data.text?.trim() && data.is_final) {
            setTranscript(prev => prev + ' ' + data.text);
          }
          else if (data.event === 'error') {
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
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
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
    if (!isConnected) {
      setError('WebSocket not connected');
      return;
    }

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      // Create audio processing pipeline
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Set up audio level monitoring
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!isRecording) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        requestAnimationFrame(updateLevel);
      };

      // Send start signal to backend
      wsRef.current.send(JSON.stringify({ event: "start" }));

      // Process audio data
      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const float32 = e.inputBuffer.getChannelData(0);
          const int16 = convertFloat32ToInt16(float32);
          wsRef.current.send(int16.buffer);
        }
      };

      // Connect audio pipeline
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setError('');

      // Start audio level monitoring
      updateLevel();

    } catch (err) {
      console.error('[Start] Error:', err);
      setError('Microphone access error: ' + err.message);
    }
  };

  const stopRecording = () => {
    try {
      // Send stop signal to backend
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'stop' }));
      }

      // Clean up audio context and stream
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      setAudioLevel(0);
    } catch (err) {
      console.error('[Stop] Error:', err);
      setError('Error stopping recording');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>🎙️ Live Speech-to-Text</h2>

      <div style={{
        padding: '8px 12px',
        borderRadius: 6,
        marginBottom: 16,
        background: isConnected ? '#dcfce7' : '#fef2f2',
        color: isConnected ? '#166534' : '#dc2626',
        fontSize: 14
      }}>
        {isConnected ? '✅ WebSocket connected' : '❌ Not connected to server'}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected}
          style={{
            background: isRecording ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            opacity: isConnected ? 1 : 0.5
          }}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>


        <button
          onClick={clearTranscript}
          disabled={!transcript.trim()}
          style={{
            background: '#6b7280',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: transcript.trim() ? 'pointer' : 'not-allowed',
            fontSize: 14,
            opacity: transcript.trim() ? 1 : 0.5
          }}
        >
          Clear
        </button>
      </div>

      {isRecording && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8
          }}>
            <span style={{ fontSize: 14, color: '#666' }}>Audio Level:</span>
            <div style={{
              flex: 1,
              height: 8,
              background: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(audioLevel * 100, 100)}%`,
                background: audioLevel > 0.1 ? '#22c55e' : '#facc15',
                transition: 'width 0.1s ease',
                borderRadius: 4
              }} />
            </div>
          </div>
        </div>
      )}

      <div
        ref={transcriptRef}
        style={{
          height: 250,
          padding: 16,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: 14,
          lineHeight: 1.5
        }}
      >
        {transcript || (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            {isRecording ? '🎤 Listening... Start speaking!' : 'Click "Start Recording" to begin'}
          </p>
        )}
      </div>

      {error && (
        <div style={{
          color: '#dc2626',
          marginTop: 12,
          padding: '8px 12px',
          background: '#fef2f2',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          color: '#166534',
          marginTop: 12,
          padding: '8px 12px',
          background: '#dcfce7',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14
        }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <div style={{
        fontSize: 12,
        marginTop: 24,
        padding: 12,
        background: '#f3f4f6',
        borderRadius: 6,
        color: '#6b7280'
      }}>
        <p style={{ margin: 0, marginBottom: 4 }}>
          <strong>Note:</strong> This app requires HTTPS or localhost to access the microphone.
        </p>
        <p style={{ margin: 0 }}>
          Make sure your backend is running on <code>localhost:8000</code> with the WebSocket endpoint.
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SpeechToTextApp;