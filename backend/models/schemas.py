from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class Transaction(BaseModel):
    """Individual transaction line item"""
    date: str = Field(..., description="Transaction date in YYYY-MM-DD format")
    merchant: str = Field(..., description="Merchant or transaction description")
    amount: float = Field(..., description="Transaction amount (positive for purchases, negative for credits)")
    
    class Config:
        schema_extra = {
            "example": {
                "date": "2024-03-15",
                "merchant": "Amazon.com",
                "amount": 45.99
            }
        }

class StatementData(BaseModel):
    """Standardized credit card statement data"""
    issuer_name: str = Field(..., description="Credit card issuer (Chase, Amex, Citi, Capital One, Discover)")
    card_variant_last4: str = Field(..., description="Last 4 digits of card number")
    billing_cycle_dates: str = Field(..., description="Billing cycle in format 'YYYY-MM-DD to YYYY-MM-DD'")
    payment_due_date: str = Field(..., description="Payment due date in YYYY-MM-DD format")
    total_new_balance: float = Field(..., description="Total balance as standardized float")
    transactions: Optional[List[Transaction]] = Field(default=None, description="List of transaction line items")
    
    # Metadata fields
    id: Optional[str] = None
    uploaded_at: Optional[str] = None
    filename: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "issuer_name": "Chase",
                "card_variant_last4": "1234",
                "billing_cycle_dates": "2024-02-15 to 2024-03-14",
                "payment_due_date": "2024-04-10",
                "total_new_balance": 1543.87,
                "transactions": [
                    {
                        "date": "2024-03-01",
                        "merchant": "Grocery Store",
                        "amount": 125.43
                    }
                ]
            }
        }
