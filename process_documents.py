import getpass
import os
import bs4
import mammoth
import pdfplumber

from langchain_core.documents import Document
from langchain_mistralai import MistralAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

if not os.environ.get("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = ""

from langchain.chat_models import init_chat_model

llm = init_chat_model("mistral-large-latest", model_provider="mistralai")

os.environ["HF_TOKEN"] = ""

if not os.environ.get("MISTRALAI_API_KEY"):
    os.environ["MISTRALAI_API_KEY"] = ""

embeddings = MistralAIEmbeddings(model="mistral-embed")


vector_store = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
vector_store.reset_collection()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # chunk size (characters)
    chunk_overlap=200,  # chunk overlap (characters)
    add_start_index=True,  # track index in original document
)
folder_path = "./data"
types = ["word","pdf"]
file_paths = {}
for type in types:
    subfolder_path = os.path.join(folder_path, type)  # Đường dẫn thư mục con
    if os.path.exists(subfolder_path):  # Kiểm tra xem thư mục con có tồn tại không
        file_paths[type] = [
            os.path.join(subfolder_path, file)
            for file in os.listdir(subfolder_path)
            if os.path.isfile(os.path.join(subfolder_path, file))
        ]

def getDocument(file_path,type):
    if (type=="word"):
        with open(file_path, "rb") as docx_file:
            text = mammoth.extract_raw_text(docx_file).value or ""

      # Tạo document cho vector store
        documents = [Document(page_content=text, metadata={"source": file_path})]
    if (type=="pdf"):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or "" 
                text += page_text + "\n"
        documents = [Document(page_content=text, metadata={"source": file_path})]
    return documents

for file_type, file_list in file_paths.items():
    for file_path in file_list:
        documents = getDocument(file_path, file_type)  
        if not documents: 
            print(f"Bỏ qua file rỗng: {file_path}")
            continue  
        splits = text_splitter.split_documents(documents)  
        if splits:  
            vector_store.add_documents(documents=splits)
            print("đã thêm",file_path)
        else:
            print(f"Không thể split file: {file_path}")


