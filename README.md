# 💳 Credit Card Statement Parser - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Installation Guide](#installation-guide)
5. [API Documentation](#api-documentation)
6. [Frontend Documentation](#frontend-documentation)
7. [Backend Documentation](#backend-documentation)
8. [Database Schema](#database-schema)
9. [Parser Implementation](#parser-implementation)
10. [Configuration](#configuration)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)

---

## Project Overview

### Description
A sophisticated full-stack web application designed to extract standardized financial data from diverse, non-standardized PDF credit card statements. The system supports five major credit card issuers and provides transaction-level details, currency standardization, and persistent storage.

### Supported Issuers
- **Chase** (JPMorgan Chase Bank)
- **American Express** (Amex)
- **Citibank** (Citi Card)
- **Capital One**
- **Discover** (Discover Bank)

### Technology Stack

**Backend:**
- Python 3.9+
- FastAPI (REST API framework)
- PyMuPDF (PDF parsing)
- Firebase Admin SDK (Firestore)
- Pydantic (Data validation)
- Uvicorn (ASGI server)

**Frontend:**
- Next.js 14 (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- React Hooks (State management)

**Database:**
- Google Firestore (NoSQL cloud database)

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                       │
│                    (Next.js + TypeScript)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Upload Page  │  │ History Page │  │   Components │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON (REST API)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                          │
│                    (FastAPI + Python)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  API Endpoints                        │   │
│  │  POST /api/parse  GET /api/history  DELETE /api/...  │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Parser Dispatcher                        │   │
│  │           (Issuer Detection & Routing)                │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  Chase   │   Amex   │   Citi   │ CapOne   │ Discover │   │
│  │  Parser  │  Parser  │  Parser  │  Parser  │  Parser  │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Currency Standardization Utils                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Firebase Admin SDK
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE FIRESTORE                          │
│                   (Cloud NoSQL Database)                     │
│                                                              │
│  users/                                                      │
│    └── {userId}/                                             │
│          └── statements/                                     │
│                └── {statementId}/                            │
│                      ├── issuer_name                         │
│                      ├── card_variant_last4                  │
│                      ├── billing_cycle_dates                 │
│                      ├── payment_due_date                    │
│                      ├── total_new_balance                   │
│                      ├── transactions[]                      │
│                      └── uploaded_at                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User uploads PDF** → Frontend (FileUpload component)
2. **File sent to API** → Backend POST /api/parse endpoint
3. **Issuer detection** → Dispatcher analyzes first page
4. **Statement parsing** → Specialized parser extracts data
5. **Currency standardization** → Utils normalize amounts
6. **Data validation** → Pydantic validates schema
7. **Firestore save** → Optional persistence (if user_id provided)
8. **JSON response** → Returns standardized data
9. **UI display** → Frontend renders results + transactions

---

## Features

### Core Features ✅

#### 1. Multi-Issuer Support
- Automatic issuer detection from PDF content
- 5 specialized parsers for different statement formats
- Graceful handling of unsupported issuers

#### 2. Data Extraction
Extracts 5 required fields:
- **Issuer Name**: Full bank name
- **Card Last 4**: Last 4 digits of card number
- **Billing Cycle**: Start and end dates (YYYY-MM-DD format)
- **Payment Due Date**: Due date (YYYY-MM-DD format)
- **Total Balance**: Current balance as float

#### 3. Robust PDF Parsing
- PyMuPDF for high-performance extraction
- Regex pattern matching
- Coordinate-based positional analysis
- Multi-page statement support

#### 4. Modern UI/UX
- Responsive design (mobile, tablet, desktop)
- Drag-and-drop file upload
- Loading states and animations
- Error handling with helpful messages
- Professional gradient backgrounds

### Bonus Features 🌟

#### Bonus Feature 1: Transaction Line-Item Extraction
- Extracts individual transactions from statements
- Captures: date, merchant name, amount
- Handles multi-page transaction tables
- Sortable by date, merchant, or amount
- Searchable by any field
- Color-coded (green for credits, black for charges)

#### Bonus Feature 2: Data Persistence (Firestore)
- Automatic saving of parsed statements
- User-specific collections
- History view with all past statements
- Delete functionality
- Timestamp tracking
- Filename preservation

#### Bonus Feature 3: Currency/Localization Standardization
- Detects US format: `$1,234.56`
- Detects EU format: `1.234,56 €`
- Handles negative amounts: `($123.45)`, `-$123.45`
- Supports multiple symbols: `$`, `€`, `£`, `¥`, `₹`
- Converts to standardized float
- Preserves precision (2 decimal places)

---

## Installation Guide

### Prerequisites

**Required Software:**
- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

**Required Accounts:**
- Google account (for Firebase)

### Backend Setup

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd credit-card-parser
```

#### Step 2: Create Virtual Environment
```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

**requirements.txt:**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
PyMuPDF==1.23.8
firebase-admin==6.3.0
pydantic==2.5.0
python-dotenv==1.0.0
```

#### Step 4: Set Up Firebase
1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Firestore Database
4. Generate service account key
5. Download as `serviceAccountKey.json`
6. Place in `backend/` directory

#### Step 5: Configure Environment
Create `backend/.env`:
```env
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
FIREBASE_CREDENTIALS=./serviceAccountKey.json
```

#### Step 6: Start Backend Server
```bash
uvicorn main:app --reload --port 8000
```

Server will be available at: `http://localhost:8000`

### Frontend Setup

#### Step 1: Navigate to Frontend
```bash
cd frontend
```

#### Step 2: Install Dependencies
```bash
npm install
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0"
  }
}
```

#### Step 3: Configure Environment
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Step 4: Start Development Server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Verification

#### Test Backend
```bash
# In new terminal
curl http://localhost:8000
# Should return: {"message":"Credit Card Statement Parser API","version":"1.0.0"}
```

#### Test Frontend
1. Open browser: `http://localhost:3000`
2. Should see upload page
3. Try uploading a test PDF

---

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### 1. Parse Statement

**Endpoint:** `POST /api/parse`

**Description:** Parse a credit card statement PDF and return standardized data.

**Request:**
```http
POST /api/parse HTTP/1.1
Content-Type: multipart/form-data

file: [PDF file binary]
user_id: "demo_user_123" (optional)
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/parse" \
  -F "file=@/path/to/statement.pdf" \
  -F "user_id=user123"
```

**Success Response (200 OK):**
```json
{
  "issuer_name": "Chase",
  "card_variant_last4": "1234",
  "billing_cycle_dates": "2024-02-15 to 2024-03-14",
  "payment_due_date": "2024-04-10",
  "total_new_balance": 1543.87,
  "transactions": [
    {
      "date": "2024-03-01",
      "merchant": "Amazon.com",
      "amount": 125.43
    },
    {
      "date": "2024-03-02",
      "merchant": "Starbucks",
      "amount": 8.50
    }
  ],
  "id": "auto-generated-id",
  "uploaded_at": "2024-03-20T10:30:00Z",
  "filename": "chase_statement.pdf"
}
```

**Error Responses:**

*400 Bad Request - Invalid File Type:*
```json
{
  "detail": "Only PDF files are accepted"
}
```

*400 Bad Request - Unsupported Issuer:*
```json
{
  "detail": "Unable to identify credit card issuer. Supported issuers: Chase, Amex, Citi, Capital One, Discover"
}
```

*500 Internal Server Error - Parsing Failed:*
```json
{
  "detail": "Parsing error: [error details]"
}
```

---

#### 2. Get Statement History

**Endpoint:** `GET /api/history/{user_id}`

**Description:** Retrieve all parsed statements for a specific user.

**Request:**
```http
GET /api/history/demo_user_123 HTTP/1.1
```

**cURL Example:**
```bash
curl http://localhost:8000/api/history/demo_user_123
```

**Success Response (200 OK):**
```json
{
  "statements": [
    {
      "id": "statement_id_1",
      "issuer_name": "Chase",
      "card_variant_last4": "1234",
      "billing_cycle_dates": "2024-02-15 to 2024-03-14",
      "payment_due_date": "2024-04-10",
      "total_new_balance": 1543.87,
      "uploaded_at": "2024-03-20T10:30:00Z",
      "filename": "chase_statement.pdf",
      "transactions": [...]
    },
    {
      "id": "statement_id_2",
      "issuer_name": "American Express",
      "card_variant_last4": "5678",
      "billing_cycle_dates": "2024-02-01 to 2024-02-28",
      "payment_due_date": "2024-03-25",
      "total_new_balance": 2100.50,
      "uploaded_at": "2024-03-15T14:20:00Z",
      "filename": "amex_statement.pdf",
      "transactions": [...]
    }
  ]
}
```

**Error Responses:**

*503 Service Unavailable - Database Not Available:*
```json
{
  "detail": "Database not available"
}
```

*500 Internal Server Error:*
```json
{
  "detail": "Database error: [error details]"
}
```

---

#### 3. Delete Statement

**Endpoint:** `DELETE /api/history/{user_id}/{statement_id}`

**Description:** Delete a specific statement from user's history.

**Request:**
```http
DELETE /api/history/demo_user_123/statement_id_1 HTTP/1.1
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:8000/api/history/demo_user_123/statement_id_1
```

**Success Response (200 OK):**
```json
{
  "message": "Statement deleted successfully"
}
```

**Error Responses:**

*503 Service Unavailable:*
```json
{
  "detail": "Database not available"
}
```

*500 Internal Server Error:*
```json
{
  "detail": "Database error: [error details]"
}
```

---

### Rate Limiting
Currently no rate limiting implemented. Recommended for production:
- 100 requests per hour per IP
- 50 uploads per hour per user

### CORS Configuration
Current allowed origins:
```python
allow_origins=["http://localhost:3000", "https://yourdomain.com"]
```

---

## Frontend Documentation

### Page Structure

#### 1. Upload Page (`app/page.tsx`)

**Route:** `/`

**Purpose:** Main landing page for uploading credit card statements

**Components Used:**
- `FileUpload` - File upload interface
- `StatementResults` - Display parsed data
- `TransactionTable` - Show extracted transactions

**State Management:**
```typescript
const [parsedData, setParsedData] = useState<StatementData | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Key Functions:**
```typescript
// Handle file upload
const handleFileUpload = async (file: File) => {
  // Creates FormData
  // Sends POST request to /api/parse
  // Sets parsedData on success
  // Sets error on failure
};
```

**User Flow:**
1. User lands on page
2. Sees upload component
3. Drags/drops or selects PDF file
4. Clicks "Upload & Parse"
5. Sees loading spinner
6. Views results (summary + transactions)

---

#### 2. History Page (`app/history/page.tsx`)

**Route:** `/history`

**Purpose:** View and manage previously parsed statements

**State Management:**
```typescript
const [statements, setStatements] = useState<StatementData[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [selectedStatement, setSelectedStatement] = useState<StatementData | null>(null);
```

**Key Functions:**
```typescript
// Fetch user's statement history
const fetchHistory = async () => {
  // GET request to /api/history/{userId}
  // Sets statements array
};

// Delete a statement
const handleDelete = async (statementId: string) => {
  // Confirms with user
  // DELETE request to /api/history/{userId}/{statementId}
  // Updates statements array
};
```

**User Flow:**
1. User navigates to history page
2. Sees grid of statement cards
3. Clicks card to view details (modal opens)
4. Can delete statements
5. Can navigate back to upload page

---

### Component Documentation

#### FileUpload Component

**Location:** `components/FileUpload.tsx`

**Props:**
```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
}
```

**Features:**
- Drag-and-drop zone
- Click to browse
- File validation (PDF only)
- Visual feedback
- Loading state

**Usage:**
```typescript
<FileUpload 
  onFileSelect={handleFileUpload} 
  loading={loading} 
/>
```

---

#### StatementResults Component

**Location:** `components/StatementResults.tsx`

**Props:**
```typescript
interface StatementResultsProps {
  data: StatementData;
}
```

**Display Sections:**
1. Header (Issuer name, gradient background)
2. Card grid (4 cards):
   - Issuer with icon
   - Card last 4 with icon
   - Billing cycle with icon
   - Due date with icon
3. Featured balance section
4. Transaction count (if available)

**Usage:**
```typescript
<StatementResults data={parsedData} />
```

---

#### TransactionTable Component

**Location:** `components/TransactionTable.tsx`

**Props:**
```typescript
interface TransactionTableProps {
  transactions: Transaction[];
}
```

**Features:**
- Search bar (filters by merchant, date, amount)
- Sortable columns (date, merchant, amount)
- Sort direction indicators
- Total calculation
- Empty state
- Responsive design

**State:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [sortField, setSortField] = useState<SortField>('date');
const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
```

**Usage:**
```typescript
<TransactionTable transactions={parsedData.transactions} />
```

---

### Styling System

#### Tailwind Configuration

**File:** `tailwind.config.ts`

```typescript
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors, fonts, etc.
    },
  },
  plugins: [],
}
```

#### Color Scheme
- **Primary:** Blue (`blue-600`, `blue-700`)
- **Text:** Slate (`slate-900`, `slate-600`, `slate-500`)
- **Success:** Green (`green-600`)
- **Error:** Red (`red-500`, `red-600`)
- **Background:** Slate gradients

#### Responsive Breakpoints
- **Mobile:** Default (< 768px)
- **Tablet:** `md:` (≥ 768px)
- **Desktop:** `lg:` (≥ 1024px)

---

## Backend Documentation

### Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── models/
│   ├── __init__.py
│   └── schemas.py          # Pydantic models
├── parsers/
│   ├── __init__.py
│   ├── dispatcher.py       # Issuer detection & routing
│   ├── chase_parser.py     # Chase parser
│   ├── amex_parser.py      # Amex parser
│   └── citi_parser.py      # Citi/CapOne/Discover parsers
├── utils/
│   ├── __init__.py
│   └── currency_utils.py   # Currency standardization
├── requirements.txt        # Python dependencies
├── serviceAccountKey.json  # Firebase credentials (gitignored)
└── .env                    # Environment variables
```

### Core Modules

#### main.py

**Purpose:** FastAPI application initialization and endpoint definitions

**Key Components:**
```python
# FastAPI app
app = FastAPI(title="Credit Card Statement Parser API")

# CORS middleware
app.add_middleware(CORSMiddleware, ...)

# Firebase initialization
firebase_admin.initialize_app(cred)
db = firestore.client()

# Endpoints
@app.post("/api/parse")
@app.get("/api/history/{user_id}")
@app.delete("/api/history/{user_id}/{statement_id}")
```

---

#### models/schemas.py

**Purpose:** Data validation and serialization using Pydantic

**Models:**

1. **Transaction Model**
```python
class Transaction(BaseModel):
    date: str  # YYYY-MM-DD format
    merchant: str
    amount: float
```

2. **StatementData Model**
```python
class StatementData(BaseModel):
    issuer_name: str
    card_variant_last4: str
    billing_cycle_dates: str
    payment_due_date: str
    total_new_balance: float
    transactions: Optional[List[Transaction]]
    id: Optional[str]
    uploaded_at: Optional[str]
    filename: Optional[str]
```

---

#### parsers/dispatcher.py

**Purpose:** Issuer detection and parser routing

**Key Functions:**

1. **identify_issuer(pdf_bytes)**
   - Opens PDF
   - Extracts first page text
   - Searches for issuer keywords
   - Returns issuer identifier

2. **parse_statement(pdf_bytes)**
   - Calls identify_issuer()
   - Routes to appropriate parser
   - Validates returned data
   - Returns standardized dictionary

**Detection Logic:**
```python
if "JPMORGAN CHASE" in text:
    return "chase"
elif "AMERICAN EXPRESS" in text:
    return "amex"
elif "CITIBANK" in text:
    return "citi"
elif "CAPITAL ONE" in text:
    return "capital_one"
elif "DISCOVER" in text:
    return "discover"
```

---

#### parsers/chase_parser.py

**Purpose:** Parse Chase credit card statements

**Key Function:**
```python
def parse_chase(pdf_bytes: bytes) -> Dict:
    # Extract text from first page
    # Find card last 4
    # Extract billing cycle dates
    # Extract due date
    # Extract balance
    # Extract transactions from all pages
    # Return standardized dict
```

**Extraction Patterns:**
```python
# Card number
card_match = re.search(r'Account\s+Number[:\s]+.*?(\d{4})', text)

# Balance
balance_match = re.search(r'New Balance[:\s]+\$?([\d,]+\.?\d{0,2})', text)

# Transaction
match = re.search(r'(\d{1,2}/\d{1,2})\s+(.+?)\s+(\$?[\d,]+\.\d{2})', line)
```

---

#### parsers/amex_parser.py

**Purpose:** Parse American Express statements

**Key Differences:**
- Shows 5 digits (takes last 4)
- Date format: "Jan 15" or "Feb 3"
- Different section markers

**Date Parsing:**
```python
# Handles month name format
for fmt in ['%b %d', '%B %d']:
    dt = datetime.strptime(date_str, fmt)
    dt = dt.replace(year=current_year)
```

---

#### parsers/citi_parser.py

**Purpose:** Parse Citi, Capital One, and Discover statements

**Functions:**
- `parse_citi(pdf_bytes)`
- `parse_capital_one(pdf_bytes)`
- `parse_discover(pdf_bytes)`
- `extract_generic_transactions(doc, markers)` - Shared transaction extractor

---

#### utils/currency_utils.py

**Purpose:** Currency format detection and standardization

**Key Functions:**

1. **detect_currency_format(amount_str)**
   - Analyzes string pattern
   - Returns 'US' or 'EU'

2. **standardize_amount(amount_str)**
   - Removes currency symbols
   - Detects format
   - Handles negatives
   - Converts to float

3. **extract_amount_from_text(text, pattern)**
   - Finds currency amounts in text
   - Uses regex patterns
   - Returns standardized float

**Supported Formats:**
```python
"$1,234.56"    → 1234.56   # US format
"1.234,56 €"   → 1234.56   # EU format
"($123.45)"    → -123.45   # Parentheses negative
"-$123.45"     → -123.45   # Minus sign
"+$50.00"      → 50.0      # Plus sign
```

---

## Database Schema

### Firestore Structure

```
firestore/
  └── users/                          # Root collection
        └── {userId}/                 # Document (user ID)
              └── statements/         # Subcollection
                    └── {statementId}/  # Document (auto-generated)
                          ├── issuer_name: string
                          ├── card_variant_last4: string
                          ├── billing_cycle_dates: string
                          ├── payment_due_date: string
                          ├── total_new_balance: number
                          ├── uploaded_at: timestamp
                          ├── filename: string
                          └── transactions: array
                                ├── [0]
                                │   ├── date: string
                                │   ├── merchant: string
                                │   └── amount: number
                                ├── [1]
                                │   ├── date: string
                                │   ├── merchant: string
                                │   └── amount: number
                                └── ...
```

### Example Document

```json
{
  "id": "abc123xyz",
  "issuer_name": "Chase",
  "card_variant_last4": "1234",
  "billing_cycle_dates": "2024-02-15 to 2024-03-14",
  "payment_due_date": "2024-04-10",
  "total_new_balance": 1543.87,
  "uploaded_at": "2024-03-20T10:30:00.000Z",
  "filename": "chase_feb_2024.pdf",
  "transactions": [
    {
      "date": "2024-03-01",
      "merchant": "Amazon.com",
      "amount": 125.43
    },
    {
      "date": "2024-03-02",
      "merchant": "Starbucks",
      "amount": 8.50
    },
    {
      "date": "2024-03-05",
      "merchant": "Payment - Thank You",
      "amount": -500.00
    }
  ]
}
```

### Security Rules

**Development (Test Mode):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Production (Secure):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/statements/{statement} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Indexes

**Composite Index (for sorting):**
- Collection: `statements`
- Fields: 
  - `uploaded_at` (Descending)
  - `__name__` (Descending)

**Create via Console or:**
```bash
firebase firestore:indexes
```

---

## Parser Implementation

### Chase Parser Details

**File:** `parsers/chase_parser.py`

**Identifier Keywords:**
- "JPMORGAN CHASE"
- "CHASE CARD SERVICES"
- "CHASE BANK"

**Data Extraction Strategy:**

1. **Card Last 4:**
```python
# Pattern 1: "Account Number: ...1234"
r'Account\s+Number[:\s]+.*?(\d{4})'

# Pattern 2: "ending in 1234"
r'ending\s+in\s+(\d{4})'
```

2. **Billing Cycle:**
```python
r'(?:Opening|Closing).*?(\d{1,2}/\d{1,2}/\d{2,4}).*?(?:to|through|-|–).*?(\d{1,2}/\d{1,2}/\d{2,4})'
```

3. **Payment Due Date:**
```python
r'Payment\s+Due\s+Date[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})'
```

4. **Balance:**
```python
r'(?:New Balance|Total Balance|Amount Due)[:\s]+\$?([\d,]+\.?\d{0,2})'
```

5. **Transactions:**
```python
# Line pattern: MM/DD  Merchant Name  $XX.XX
r'(\d{1,2}/\d{1,2}(?:/\d{2,4})?)\s+(.+?)\s+(\$?[\-\+]?\d{1,3}(?:,\d{3})*\.?\d{0,2})$'
```

**Section Detection:**
```python
transaction_markers = [
    "PURCHASE", "PAYMENT", "TRANSACTION", "ACTIVITY",
    "Purchases and Adjustments", "Payments and Other Credits"
]
```

**Date Normalization:**
- Input: `3/15/24`, `03/15/2024`, `3/15`
- Output: `2024-03-15`

---

### American Express Parser Details

**File:** `parsers/amex_parser.py`

**Identifier Keywords:**
- "AMERICAN EXPRESS"
- "AMEX"

**Unique Characteristics:**
- Shows 5-digit card ending (we take last 4)
- Uses month names: "Jan 15", "Feb 3"
- Different section headers

**Data Extraction Strategy:**

1. **Card Last 5 (take last 4):**
```python
r'Account\s+Ending[:\s]+(\d{5})'
card_last4 = card_match.group(1)[-4:]
```

2. **Billing Period:**
```python
r'(?:Statement|Billing)\s+Period[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})\s*[-–]\s*(\d{1,2}/\
