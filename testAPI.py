from fastapi import FastAPI
from pydantic import BaseModel
from langchain_mistralai import MistralAIEmbeddings
from langchain_chroma import Chroma
from langchain import hub
from langchain_core.documents import Document
from typing_extensions import List, TypedDict

app = FastAPI()
print("Server is running")

import getpass
import os
os.environ["HF_TOKEN"] = ""
if not os.environ.get("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = ""

from langchain.chat_models import init_chat_model

llm = init_chat_model("mistral-large-latest", model_provider="mistralai")
print("Khởi tạo model thành công")

embeddings = MistralAIEmbeddings(model="mistral-embed")
print("Khởi tạo embeddings thành công")

vector_store = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
print("Khởi tạo vector store thành công")


class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    sources: List[str]
prompt = hub.pull("rlm/rag-prompt")

def retrieve(state: State):
    retrieved_results = vector_store.similarity_search_with_score(state["question"], k=1)

    retrieved_docs = []
    sources = []  # Lưu danh sách tên file nguồn

    for doc, score in retrieved_results:
        print("điểm số của RAG:", score)
        retrieved_docs.append(doc)

        # Lấy tên file từ metadata
        if "source" in doc.metadata:
            sources.append(doc.metadata["source"])

    return {"context": retrieved_docs, "sources": sources}


def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}



class QueryRequest(BaseModel):
    question: str

def rag_agent(question: str) -> str:
    # Gọi RAG Agent của bạn
    retrieve_state = {"question": question}
    response = retrieve(retrieve_state)

    context = response["context"]
    sources = response.get("sources", [])  # Lấy danh sách file nguồn (nếu có)

    # Tạo chuỗi chứa context
    context_text = "\n".join([doc.page_content for doc in context])

    # Tạo chuỗi chứa danh sách file nguồn
    sources_text = "\nNguồn: " + ", ".join(sources) if sources else ""

    return f"Câu hỏi: {question}\n\nContext:\n{context_text}{sources_text}"

@app.post("/query")
def query_rag(request: QueryRequest):
    print("Câu hỏi: ", request.question)
    response = rag_agent(request.question)
    print(response)
    return {"answer": response}

# Chạy server bằng: uvicorn main:app --host 127.0.0.1 --port 8000
