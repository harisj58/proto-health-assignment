# Live Speech-to-Text App

A real-time speech-to-text application built with React that captures audio from your microphone and converts it to text using WebSocket communication with a backend service.

## 👨🏻‍💻Author

- [Haris Javed](github.com/harisj58)

## Features

- **Real-time Speech Recognition**: Live audio capture and transcription
- **WebSocket Integration**: Real-time communication with backend service
- **Audio Level Visualization**: Visual feedback showing microphone input levels
- **Connection Status**: Clear indication of WebSocket connection state
- **Responsive Design**: Clean, modern UI that works across devices
- **Error Handling**: Comprehensive error reporting and user feedback

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- A compatible backend service running on `localhost:8000`
- HTTPS connection or localhost environment (required for microphone access)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/harisj58/proto-health-assignment
cd frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   Create a `.env` file in the root directory:

```env
REACT_APP_BACKEND_BASE_URL=localhost:8000
```

4. Start the development server:

```bash
npm start
# or
yarn start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

1. **Connect to Backend**: Ensure your backend service is running on the configured URL
2. **Start Recording**: Click the "Start Recording" button to begin speech capture
3. **Speak**: The app will display real-time transcription of your speech
4. **Monitor Audio**: Watch the audio level indicator to ensure proper microphone input
5. **Stop Recording**: Click "Stop Recording" to end the session
6. **Clear Transcript**: Use the "Clear" button to reset the transcript

## Technical Details

### Audio Processing

- **Sample Rate**: 16kHz (optimized for speech recognition)
- **Channels**: Mono (single channel)
- **Format**: PCM 16-bit signed integers
- **Buffer Size**: 4096 samples per processing block
- **Audio Enhancements**: Echo cancellation and noise suppression enabled

### WebSocket Communication

The app communicates with the backend using WebSocket messages:

#### Outbound Messages

```javascript
// Start recording session
{ "event": "start" }

// Stop recording session
{ "event": "stop" }

// Audio data (binary)
Int16Array buffer
```

#### Inbound Messages

```javascript
// Transcript update
{
  "event": "transcript",
  "text": "transcribed text",
  "is_final": true
}

// Error message
{
  "event": "error",
  "message": "error description"
}

// Session stopped
{
  "event": "stopped",
  "message": "session ended"
}
```

### Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires HTTPS)
- **Edge**: Full support

## Dependencies

### Core Dependencies

- **React**: ^18.x - UI framework
- **lucide-react**: ^0.263.1 - Icon library

### Browser APIs Used

- **WebSocket API**: Real-time communication
- **MediaDevices API**: Microphone access
- **Web Audio API**: Audio processing and analysis

## Project Structure

```
src/
├── App.js                 # Main application component
├── App.css               # Application styles
├── index.js              # Application entry point
├── index.css             # Global styles
└── components/
    └── SpeechToTextApp.jsx # Main speech-to-text component
```

## Configuration

### Environment Variables

- `REACT_APP_BACKEND_BASE_URL`: Backend server URL (without protocol)

### Audio Settings

The microphone is configured with optimal settings for speech recognition:

```javascript
{
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true
}
```

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App (irreversible)

### Code Structure

The main component (`SpeechToTextApp`) manages:

- WebSocket connection lifecycle
- Audio stream capture and processing
- Real-time audio level calculation
- State management for recording status and transcripts
