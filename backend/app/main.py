from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import requests
import base64
from dotenv import load_dotenv

from .models import ChatRequest, ChatResponse

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="ChatGPT Conversational API",
    description="A FastAPI application that interfaces with OpenAI's ChatGPT API for conversational purposes.",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",  # React default port
    "http://127.0.0.1:3000",
    # Add more origins if deploying to production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY")
ENDPOINT = os.getenv("ENDPOINT")

if not API_KEY or not ENDPOINT:
    raise ValueError("API_KEY and ENDPOINT must be set in the environment variables.")

headers = {
    "Content-Type": "application/json",
    "api-key": API_KEY,
}

# In-memory storage for conversations (for simplicity)
# In production, consider using a persistent store like Redis or a database
conversations = {}

@app.post("/chat", response_model=ChatResponse)
def chat(chat_request: ChatRequest):
    """
    Endpoint to handle chat messages.

    Args:
        chat_request (ChatRequest): The chat request containing user message and conversation ID.

    Returns:
        ChatResponse: The assistant's reply.
    """
    user_message = chat_request.message
    conversation_id = chat_request.conversation_id or "default"

    # Initialize conversation history if not present
    if conversation_id not in conversations:
        conversations[conversation_id] = [
            {
                "role": "system",
                "content": "You are an AI assistant that helps people find information."
            }
        ]

    # Append the user's message to the conversation
    conversations[conversation_id].append({
        "role": "user",
        "content": user_message
    })

    # Prepare the payload for OpenAI API
    payload = {
        "messages": conversations[conversation_id],
        "temperature": 0.7,
        "top_p": 0.95,
        "max_tokens": 800
    }

    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API request failed: {e}")

    data = response.json()

    # Extract assistant's reply
    assistant_message = data.get("choices", [{}])[0].get("message", {}).get("content", "")

    # Append the assistant's reply to the conversation
    conversations[conversation_id].append({
        "role": "assistant",
        "content": assistant_message
    })

    return ChatResponse(
        conversation_id=conversation_id,
        reply=assistant_message
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the ChatGPT Conversational API"}