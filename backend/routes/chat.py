from fastapi import APIRouter
from pydantic import BaseModel
import asyncio
import random

router = APIRouter(
    prefix="/api/chat",
    tags=["Chatbot"]
)

class ChatRequest(BaseModel):
    message: str

@router.post("")
async def chat_with_data(request: ChatRequest):
    # Simulate processing time for the "AI"
    await asyncio.sleep(1.5)
    
    msg = request.message.lower()
    
    # Simple rule-based mock for demonstration purposes
    if "revenue" in msg:
        response = "Based on our latest data, total revenue is approximately R$ 15.7M, showing a 15% increase compared to the previous period. The strongest category is 'Health Beauty'."
    elif "order" in msg or "cancellation" in msg:
        response = "The current cancellation rate is hovering around 1%. We've noticed a slight spike in cancellations in São Paulo over the last 48 hours."
    elif "customer" in msg or "retention" in msg:
        response = "We have over 96,000 unique customers. The repeat customer rate is currently at 3.1%, indicating an opportunity for targeted retention campaigns."
    elif "delivery" in msg:
        response = "On-time delivery rate is 92%. The average delivery time across all regions is 12 days."
    elif "hello" in msg or "hi" in msg:
        response = "Hello! I am your BI Assistant. I can help you analyze revenue, orders, customers, and delivery metrics. What would you like to know?"
    else:
        responses = [
            "That's an interesting question. Looking at the data, the trends indicate positive growth, though certain regions underperform.",
            "I've analyzed the dashboard data. While I don't have a specific metric for that exact phrasing, overall business health remains strong at 85/100.",
            "Could you clarify your question? I can provide specific insights on revenue, orders, customers, or geographic distribution."
        ]
        response = random.choice(responses)
        
    return {"role": "ai", "text": response}
