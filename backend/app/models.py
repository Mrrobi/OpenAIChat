from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    """
    Model representing a chat request from the user.
    """
    conversation_id: Optional[str] = Field(
        None,
        description="An optional identifier for the conversation to maintain context."
    )
    message: str = Field(..., description="The user's message to the assistant.")

class ChatResponse(BaseModel):
    """
    Model representing the assistant's reply.
    """
    conversation_id: str = Field(..., description="Identifier for the conversation.")
    reply: str = Field(..., description="The assistant's response.")