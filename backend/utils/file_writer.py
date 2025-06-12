import wave
from pathlib import Path

# Create recordings directory if it doesn't exist
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(exist_ok=True)


async def save_audio_file(session_id: str, audio_buffer: bytearray):
    """Save accumulated audio data to a WAV file"""
    try:
        audio_file_path = RECORDINGS_DIR / f"{session_id}.wav"

        # Audio parameters (should match your Deepgram options)
        sample_rate = 16000
        channels = 1
        sample_width = 2  # 16-bit = 2 bytes per sample

        with wave.open(str(audio_file_path), "wb") as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sample_width)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_buffer)

        print(f"Audio saved to: {audio_file_path}")

    except Exception as e:
        print(f"Error saving audio file for session {session_id}: {e}")
