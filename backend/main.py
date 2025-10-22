from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional
import os
from datetime import datetime
from parsers.dispatcher import parse_statement
from models.schemas import StatementData

app = FastAPI(title="Credit Card Statement Parser API")

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization error: {e}")
    db = None

@app.get("/")
async def root():
    return {"message": "Credit Card Statement Parser API", "version": "1.0.0"}

@app.post("/api/parse", response_model=StatementData)
async def parse_pdf(
    file: UploadFile = File(...),
    user_id: Optional[str] = None
):
    """
    Parse a credit card statement PDF and return standardized data.
    Optionally saves to Firestore if user_id is provided.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        # Read PDF file
        pdf_bytes = await file.read()
        
        # Parse the statement using dispatcher
        parsed_data = parse_statement(pdf_bytes)
        
        # Save to Firestore if user_id provided and db available
        if user_id and db:
            try:
                doc_ref = db.collection('users').document(user_id).collection('statements').document()
                parsed_data['id'] = doc_ref.id
                parsed_data['uploaded_at'] = datetime.utcnow().isoformat()
                parsed_data['filename'] = file.filename
                doc_ref.set(parsed_data)
            except Exception as e:
                print(f"Firestore save error: {e}")
        
        return JSONResponse(content=parsed_data)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

@app.get("/api/history/{user_id}")
async def get_history(user_id: str):
    """
    Retrieve all parsed statements for a user from Firestore.
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        statements_ref = db.collection('users').document(user_id).collection('statements')
        docs = statements_ref.order_by('uploaded_at', direction=firestore.Query.DESCENDING).stream()
        
        statements = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            statements.append(data)
        
        return JSONResponse(content={"statements": statements})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/history/{user_id}/{statement_id}")
async def delete_statement(user_id: str, statement_id: str):
    """
    Delete a specific statement from user's history.
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        doc_ref = db.collection('users').document(user_id).collection('statements').document(statement_id)
        doc_ref.delete()
        return JSONResponse(content={"message": "Statement deleted successfully"})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)