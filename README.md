
# Real-Time Speech-to-Text Application

A full-stack real-time speech-to-text application that captures audio from your microphone, transcribes it using Deepgram's API, and saves conversations to a database. Built with React frontend and FastAPI backend.

## 👨🏻‍💻 Author

- [Haris Javed](https://github.com/harisj58)

## 🎯 Features

### Frontend
- **Real-time Speech Recognition**: Live audio capture and transcription
- **Audio Level Visualization**: Visual feedback showing microphone input levels
- **Connection Status**: Clear indication of WebSocket connection state
- **Responsive Design**: Clean, modern UI that works across devices
- **Error Handling**: Comprehensive error reporting and user feedback

### Backend
- **Real-time Speech-to-Text**: Stream audio chunks for live transcription using Deepgram
- **Conversation Persistence**: Save complete transcripts to SQLite database
- **Audio File Storage**: Store raw audio files locally with UUID naming
- **WebSocket Support**: Real-time bidirectional communication
- **Robust Error Handling**: Comprehensive logging and error management

## 🛠️ Tech Stack

### Frontend
- **React** 18.x - UI framework
- **WebSocket API** - Real-time communication
- **Web Audio API** - Audio processing and analysis
- **lucide-react** - Icon library

### Backend
- **FastAPI** - Python web framework
- **Python** 3.12+
- **uv** - Package manager
- **Deepgram SDK** - Speech-to-text service
- **SQLite** - Lightweight database
- **WebSockets** - Real-time communication

## 📋 Prerequisites

- **Node.js** (version 14 or higher)
- **Python** 3.12 or higher
- **uv** package manager
- **Deepgram API key** (sign up at [Deepgram](https://deepgram.com/))
- **HTTPS connection** or localhost environment (required for microphone access)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/harisj58/proto-health-assignment
cd proto-health-assignment
```

### 2. Backend Setup

```bash
cd backend

# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv sync

# Configure environment variables
cp .env.example .env
# Edit .env and add your Deepgram API key:
# DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Start the backend server
uvicorn server:app --reload
```

The backend will be running at `http://localhost:8000`

### 3. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install
# or yarn install

# Configure environment variables
# Create .env file:
echo "REACT_APP_BACKEND_BASE_URL=localhost:8000" > .env

# Start the frontend server
npm start
# or yarn start
```

The frontend will be running at `http://localhost:3000`

## 🎮 Usage

1. **Start Both Servers**: Ensure both frontend and backend are running
2. **Open Application**: Navigate to `http://localhost:3000` in your browser
3. **Grant Permissions**: Allow microphone access when prompted
4. **Start Recording**: Click "Start Recording" to begin speech capture
5. **Speak**: Watch real-time transcription appear on screen
6. **Monitor Audio**: Use the audio level indicator to ensure proper input
7. **Stop Recording**: Click "Stop Recording" to end the session
8. **Clear Transcript**: Use "Clear" button to reset the display

## 🏗️ Project Structure

```
proto-health-assignment/
├── frontend/                       # React frontend application
│   ├── src/
│   │   ├── App.js                 # Main application component
│   │   ├── App.css                # Application styles
│   │   ├── index.js               # Application entry point
│   │   ├── index.css              # Global styles
│   │   └── components/
│   │       └── SpeechToTextApp.jsx # Main speech-to-text component
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies
│   └── .env                       # Frontend environment variables
├── backend/                        # FastAPI backend service
│   ├── routers/
│   │   └── websocket_routes.py    # WebSocket endpoints
│   ├── utils/
│   │   ├── database.py            # Database operations
│   │   └── file_writer.py         # Audio file handling
│   ├── db/
│   │   └── transcriptions.db      # SQLite database
│   ├── recordings/                # Stored audio files
│   ├── server.py                  # FastAPI application
│   ├── main.py                    # Application entry point
│   ├── pyproject.toml             # Backend dependencies
│   └── .env                       # Backend environment variables
└── README.md                      # This file
```

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env`)
```env
REACT_APP_BACKEND_BASE_URL=localhost:8000
```

#### Backend (`.env`)
```env
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

### Audio Settings

The application uses optimized settings for speech recognition:

```javascript
// Frontend audio configuration
{
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true
}
```

## 📡 WebSocket API

### Connection
`ws://localhost:8000/ws/v1/speech-to-text`

### Message Types

#### Client → Server

**Start Session**
```json
{ "event": "start" }
```

**Stop Session**
```json
{ "event": "stop" }
```

**Audio Data**
- Binary WebSocket messages containing raw audio bytes
- Format: Linear PCM, 16kHz, mono, 16-bit

#### Server → Client

**Transcript Results**
```json
{
  "event": "transcript",
  "text": "transcribed text",
  "is_final": true
}
```

**Session Stopped**
```json
{
  "event": "stopped",
  "message": "STT session ended.",
  "session_id": "uuid-string",
  "full_transcription": "complete transcript"
}
```

**Error Messages**
```json
{
  "event": "error",
  "message": "error description"
}
```

## 🌐 Browser Compatibility

- **Chrome**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support (requires HTTPS) ✅
- **Edge**: Full support ✅

## 📚 Development

### Available Scripts

#### Frontend
```bash
npm start          # Development server
npm test           # Run tests
npm run build      # Production build
npm run eject      # Eject from Create React App
```

#### Backend
```bash
uvicorn server:app --reload    # Development server with auto-reload
uvicorn server:app --host 0.0.0.0 --port 8000  # Production server
```

### Getting Deepgram API Key

1. Sign up at [Deepgram](https://deepgram.com/)
2. Navigate to your dashboard
3. Create a new API key
4. Copy the key to your backend `.env` file

## 🔒 Security Notes

- Keep your Deepgram API key secure and never commit it to version control
- The application requires HTTPS in production for microphone access
- Audio files are stored locally with UUID-based filenames for privacy
