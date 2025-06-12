from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
import os
import asyncio
import json
from datetime import datetime
import uuid

from utils.database import save_transcription_to_db

websocket_router = APIRouter()
DG_API_KEY = os.getenv("DEEPGRAM_API_KEY")
dg_client = DeepgramClient(DG_API_KEY)


@websocket_router.websocket("/ws/v1/speech-to-text")
async def speech_to_text(websocket: WebSocket):
    await websocket.accept()

    dg_connection = None
    loop = asyncio.get_event_loop()

    # Session tracking variables
    session_id = str(uuid.uuid4())
    full_transcription = ""
    session_start_time = None

    try:
        while True:
            msg = await websocket.receive()

            # Handle text messages
            if msg["type"] == "websocket.receive" and "text" in msg:
                data = json.loads(msg["text"])
                event = data.get("event")

                if event == "start":
                    # Record session start time
                    session_start_time = datetime.now()
                    print(f"Starting new transcription session with ID: {session_id}")

                    # Start new deepgram connection
                    dg_connection = dg_client.listen.websocket.v("1")

                    # Improved transcription handler
                    def on_message(self, result, **kwargs):
                        async def handle_message():
                            nonlocal full_transcription
                            try:
                                # Check if result has the expected structure
                                if (
                                    hasattr(result, "channel")
                                    and result.channel.alternatives
                                ):
                                    sentence = result.channel.alternatives[0].transcript
                                    is_final = (
                                        result.is_final
                                        if hasattr(result, "is_final")
                                        else False
                                    )

                                    print(
                                        f"Transcription: '{sentence}' (final: {is_final})"
                                    )

                                    # Accumulate final transcriptions
                                    if is_final and sentence and sentence.strip():
                                        full_transcription += sentence.strip() + " "

                                    # Only send non-empty transcriptions
                                    if sentence and sentence.strip():
                                        await websocket.send_json(
                                            {
                                                "event": "transcript",
                                                "text": sentence.strip(),
                                                "is_final": is_final,
                                            }
                                        )
                                    elif sentence == "" and is_final:
                                        # Send empty final result to indicate end of utterance
                                        await websocket.send_json(
                                            {"event": "utterance_end", "text": ""}
                                        )
                                else:
                                    print(
                                        f"Unexpected result structure: {type(result)}"
                                    )

                            except Exception as e:
                                print(f"Error in transcription handler: {e}")
                                await websocket.send_json(
                                    {
                                        "event": "error",
                                        "message": f"Error in Deepgram handler: {str(e)}",
                                    }
                                )

                        asyncio.run_coroutine_threadsafe(handle_message(), loop)

                    def on_error(self, error, **kwargs):
                        async def handle_error():
                            print(f"Deepgram error: {error}")
                            await websocket.send_json(
                                {
                                    "event": "error",
                                    "message": f"Deepgram error: {error}",
                                }
                            )

                        asyncio.run_coroutine_threadsafe(handle_error(), loop)

                    # Register event handlers
                    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
                    dg_connection.on(LiveTranscriptionEvents.Error, on_error)

                    # Updated Deepgram options
                    options = LiveOptions(
                        model="nova-2",
                        language="en-US",
                        smart_format=True,
                        encoding="linear16",  # Make sure this matches your audio
                        channels=1,
                        sample_rate=16000,  # Make sure this matches your audio
                        interim_results=True,
                        utterance_end_ms="1000",
                        vad_events=True,
                        # Add these for better transcription
                        punctuate=True,
                        profanity_filter=False,
                        redact=False,
                    )

                    addons = {"no_delay": "true"}

                    if not dg_connection.start(options, addons=addons):
                        await websocket.send_json(
                            {
                                "event": "error",
                                "message": "Failed to connect to Deepgram",
                            }
                        )
                        return

                    print("Deepgram connection started successfully")

                elif event == "stop":
                    if dg_connection:
                        await dg_connection.finish()

                    # Calculate session duration and save transcription before stopping
                    session_duration = None
                    if session_start_time:
                        session_duration = (
                            datetime.now() - session_start_time
                        ).total_seconds()

                    # Save the full transcription to database
                    if full_transcription.strip():
                        save_transcription_to_db(
                            session_id, full_transcription.strip(), session_duration
                        )

                    await websocket.send_json(
                        {
                            "event": "stopped",
                            "message": "STT session ended.",
                            "session_id": session_id,
                            "full_transcription": full_transcription.strip(),
                        }
                    )
                    break

            # Handle binary audio messages
            elif msg["type"] == "websocket.receive" and "bytes" in msg:
                if dg_connection:
                    audio_data = msg["bytes"]
                    print(f"Sending audio chunk of {len(audio_data)} bytes to Deepgram")
                    dg_connection.send(audio_data)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
        pass
    except Exception as e:
        print(f"Exception in websocket handler: {e}")
    finally:
        try:
            # Calculate session duration
            session_duration = None
            if session_start_time:
                session_duration = (datetime.now() - session_start_time).total_seconds()

            # Save transcription to database before closing connection
            if full_transcription.strip():
                save_transcription_to_db(
                    session_id, full_transcription.strip(), session_duration
                )

            if dg_connection:
                await dg_connection.finish()
                print("Deepgram connection closed")
        except Exception as e:
            print(f"Error closing Deepgram connection: {e}")
            pass
