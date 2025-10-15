# chat_logic.py

from deep_translator import GoogleTranslator

# Store documents in memory (like your PyQt app)
documents = {}  # {filename: content}
current_doc = None

def set_current_doc(doc_name: str, content: str):
    """Add or switch current document context"""
    global current_doc
    documents[doc_name] = content
    current_doc = doc_name

def reset_context():
    global current_doc
    current_doc = None

def get_response(user_message: str, target_lang: str = "english"):
    """
    Simulate chat response based on current document context
    """
    global current_doc

    context_text = ""
    if current_doc and current_doc in documents:
        context_text = f"Use the following document to answer questions:\n{documents[current_doc]}\n\n"

    system_prompt = context_text + f"You are an AI assistant. Answer the user's question clearly in {target_lang}."

    # For simplicity, we'll just return a formatted string.
    # You can replace this with your real AI/chat logic.
    response_text = f"{system_prompt}\nUser asked: {user_message}"

    # Translate using GoogleTranslator
    try:
        translated = GoogleTranslator(source="auto", target=target_lang).translate(response_text)
        return translated
    except Exception as e:
        return f"⚠️ Translation Error: {e}"
