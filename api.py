from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from chat_logic import get_response, set_current_doc, reset_context

app = FastAPI()

origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    target_lang: str = "english"

class DocRequest(BaseModel):
    filename: str
    content: str

@app.post("/api/chat")
def chat(request: ChatRequest):
    reply = get_response(request.message, request.target_lang)
    return {"message": {"content": reply}}

@app.post("/api/upload_doc")
def upload_doc(request: DocRequest):
    set_current_doc(request.filename, request.content)
    return {"status": "success", "current_doc": request.filename}

@app.post("/api/reset_context")
def reset_chat_context():
    reset_context()
    return {"status": "context cleared"}
