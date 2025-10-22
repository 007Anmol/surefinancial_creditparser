import fitz  # PyMuPDF
import re
from datetime import datetime
from typing import Dict, List
from utils.currency_utils import standardize_amount

def parse_amex(pdf_bytes: bytes) -> Dict:
    """
    Parse American Express credit card statement.
    Amex statements have unique layout with account ending in last 5 digits.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    try:
        first_page = doc[0]
        text = first_page.get_text()
        
        # Extract card last 4 digits (Amex shows 5 digits, we take last 4)
        card_match = re.search(r'Account\s+Ending[:\s]+(\d{5})', text, re.IGNORECASE)
        if not card_match:
            card_match = re.search(r'Card\s+Ending[:\s]+(\d{5})', text, re.IGNORECASE)
        if not card_match:
            card_match = re.search(r'(\d{5})\s*$', text[:500], re.MULTILINE)
        
        card_last4 = card_match.group(1)[-4:] if card_match else "0000"
        
        # Extract billing period (Amex uses "Statement Period" or "Billing Period")
        period_match = re.search(
            r'(?:Statement|Billing)\s+Period[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})\s*[-–]\s*(\d{1,2}/\d{1,2}/\d{2,4})',
            text,
            re.IGNORECASE
        )
        if period_match:
            start_date = parse_date(period_match.group(1))
            end_date = parse_date(period_match.group(2))
            billing_cycle = f"{start_date} to {end_date}"
        else:
            billing_cycle = "Unknown"
        
        # Extract payment due date
        due_match = re.search(
            r'(?:Payment|Total)\s+Due\s+(?:Date|By)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})',
            text,
            re.IGNORECASE
        )
        payment_due = parse_date(due_match.group(1)) if due_match else "Unknown"
        
        # Extract new balance (Amex labels: "Total Due", "New Balance", "Amount Due")
        balance_match = re.search(
            r'(?:Total Due|New Balance|Amount Due)[:\s]+\$?([\d,]+\.?\d{0,2})',
            text,
            re.IGNORECASE
        )
        if balance_match:
            total_balance = standardize_amount(balance_match.group(1))
        else:
            total_balance = 0.0
        
        # Extract transactions
        transactions = extract_amex_transactions(doc)
        
        doc.close()
        
        return {
            "issuer_name": "American Express",
            "card_variant_last4": card_last4,
            "billing_cycle_dates": billing_cycle,
            "payment_due_date": payment_due,
            "total_new_balance": total_balance,
            "transactions": transactions
        }
    
    except Exception as e:
        doc.close()
        raise ValueError(f"Amex parser error: {str(e)}")

def extract_amex_transactions(doc) -> List[Dict]:
    """
    Extract transaction line items from Amex statement.
    Amex format typically: Date  Description  Amount
    """
    transactions = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        lines = text.split('\n')
        
        in_transaction_section = False
        
        for line in lines:
            # Amex section markers
            if re.search(r'(Charges|Transactions|Activity|Card Member)', line, re.IGNORECASE):
                in_transaction_section = True
                continue
            
            if in_transaction_section and re.search(r'(Total|Subtotal|Fees|Interest Rate)', line, re.IGNORECASE):
                in_transaction_section = False
            
            if in_transaction_section:
                # Amex pattern: Month DD  Merchant Name  Amount
                match = re.search(
                    r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|' +
                    r'\d{1,2}/\d{1,2}(?:/\d{2,4})?)\s+(.+?)\s+(\$?[\-\+]?\d{1,3}(?:,\d{3})*\.?\d{0,2})$',
                    line.strip()
                )
                
                if match:
                    try:
                        trans_date = parse_date(match.group(1))
                        merchant = match.group(2).strip()
                        amount = standardize_amount(match.group(3))
                        
                        # Clean merchant name
                        merchant = re.sub(r'\s{2,}', ' ', merchant)
                        merchant = merchant[:100]  # Limit length
                        
                        transactions.append({
                            "date": trans_date,
                            "merchant": merchant,
                            "amount": amount
                        })
                    except:
                        continue
    
    return transactions

def parse_date(date_str: str) -> str:
    """
    Convert various date formats to YYYY-MM-DD.
    Handles Amex formats: "Jan 15", "MM/DD/YY", etc.
    """
    date_str = date_str.strip()
    current_year = datetime.now().year
    
    # Try month name format (Jan 15, Feb 3, etc.)
    month_formats = ['%b %d', '%B %d']
    for fmt in month_formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            dt = dt.replace(year=current_year)
            return dt.strftime('%Y-%m-%d')
        except:
            pass
    
    # Try numeric formats
    for fmt in ['%m/%d/%Y', '%m/%d/%y', '%m/%d']:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.year == 1900:
                dt = dt.replace(year=current_year)
            return dt.strftime('%Y-%m-%d')
        except:
            pass
    
    return date_str