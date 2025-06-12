# Speech-to-Text Backend API

A FastAPI-based backend service for real-time speech-to-text transcription with conversation saving capabilities. This service provides streaming transcription using Deepgram's Speech-to-Text API and persists conversations to a database with audio file storage.

## 👨🏻‍💻Author

- [Haris Javed](github.com/harisj58)

## Features

- **Real-time Speech-to-Text**: Stream audio chunks for live transcription
- **Conversation Persistence**: Save complete transcripts to database
- **Audio File Storage**: Store raw audio files locally
- **WebSocket Support**: Real-time bidirectional communication
- **Error Handling**: Robust error handling and logging
- **Environment-based Configuration**: Secure API key management

## Tech Stack

- **Framework**: FastAPI
- **Runtime**: Python 3.12+
- **Package Manager**: uv
- **STT Service**: Deepgram SDK
- **Database**: SQLite (lightweight, file-based)
- **Audio Storage**: Local file system

## Prerequisites

- Python 3.12 or higher
- uv package manager
- Deepgram API key (sign up at [Deepgram](https://deepgram.com/))

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/harisj58/proto-health-assignment
   cd backend
   ```

2. **Install uv** (if not already installed)

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. **Create environment, activate it and install dependencies**
   ```bash
   uv venv
   source .venv/bin/activate
   uv sync
   ```

## Environment Setup

1. **Create environment file**

   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Deepgram API Configuration
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

3. **Get your Deepgram API Key**
   - Sign up at [Deepgram](https://deepgram.com/)
   - Navigate to your dashboard
   - Create a new API key
   - Copy the key to your `.env` file

## Running the project

1. **Ensure environment is active**

```bash
source .venv/bin/activate
```

2. **Run the application using `uvicorn`**

```bash
uvicorn server:app --reload
```

## WebSocket API

### `WS /ws/v1/speech-to-text`

Real-time speech-to-text transcription via WebSocket connection.

**Connection:** `ws://localhost:8000/ws/v1/speech-to-text`

**Message Types:**

#### Client → Server Messages

**1. Start Session (JSON)**

json

```json
{
  "event": "start"
}
```

- Initiates a new transcription session
- Creates unique session ID
- Establishes Deepgram connection
- Resets audio buffer

**2. Stop Session (JSON)**

json

```json
{
  "event": "stop"
}
```

- Ends the current transcription session
- Saves full transcription to database
- Saves accumulated audio to WAV file
- Returns session summary

**3. Audio Data (Binary)**

- Raw audio bytes sent directly as WebSocket binary message
- Audio format: Linear PCM, 16kHz, mono, 16-bit
- Each chunk is forwarded to Deepgram and accumulated in session buffer

#### Server → Client Messages

**1. Transcript Results**

json

```json
{
  "event": "transcript",
  "text": "partial or final transcript text",
  "is_final": true/false
}
```

**2. Utterance End**

json

```json
{
  "event": "utterance_end",
  "text": ""
}
```

**3. Session Stopped**

json

```json
{
  "event": "stopped",
  "message": "STT session ended.",
  "session_id": "uuid-string",
  "full_transcription": "complete session transcript"
}
```

**4. Error Messages**

json

```json
{
  "event": "error",
  "message": "error description"
}
```

**Audio Requirements:**

- Encoding: Linear PCM (linear16)
- Sample Rate: 16kHz
- Channels: Mono (1)
- Bit Depth: 16-bit

# Project Structure

```
backend/
├── __pycache__/                    # Python bytecode cache
├── .venv/                          # Virtual environment
├── db/                             # Database storage
│   └── transcriptions.db           # SQLite database file
├── recordings/                     # Audio file storage
│   └── 836f9b19-22b0-4320-95e9-27bce3...  # Saved audio files (UUID named)
├── routers/                        # API route modules
│   ├── __pycache__/               # Router bytecode cache
│   └── websocket_routes.py        # WebSocket endpoints
├── utils/                          # Utility modules
│   ├── __pycache__/               # Utils bytecode cache
│   ├── database.py                # Database operations
│   └── file_writer.py             # Audio file handling
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
├── .python-version                # Python version specification
├── main.py                        # Application entry point
├── pyproject.toml                 # Project configuration & dependencies
├── README.md                      # Project documentation
├── server.py                      # FastAPI server implementation
└── uv.lock                        # Dependency lock file
```

## Directory Descriptions

Directory/File

Purpose

**`__pycache__/`**

Python bytecode cache (auto-generated)

**`.venv/`**

Python virtual environment

**`db/`**

Database storage directory

**`recordings/`**

Audio file storage with UUID-based filenames

**`routers/`**

FastAPI router modules for API endpoints

**`utils/`**

Utility functions for database and file operations

**`main.py`**

Application entry point

**`server.py`**

Main FastAPI application server

**`pyproject.toml`**

uv project configuration and dependencies

**`uv.lock`**

Dependency version lock file

**`.env`**

Environment variables (API keys, config)

**`README.md`**

Project documentation and setup guide

## Key Files

- **`server.py`** - Main FastAPI application with CORS and route registration
- **`websocket_routes.py`** - WebSocket endpoint for real-time speech-to-text
- **`database.py`** - SQLite database operations for transcription storage
- **`file_writer.py`** - Audio file saving utilities
- **`transcriptions.db`** - SQLite database storing conversation records
- **`.env`** - Contains Deepgram API key and other configuration
