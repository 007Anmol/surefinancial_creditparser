import fitz  # PyMuPDF
import re
from datetime import datetime
from typing import Dict, List
from utils.currency_utils import standardize_amount

def parse_citi(pdf_bytes: bytes) -> Dict:
    """Parse Citibank credit card statement."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    try:
        first_page = doc[0]
        text = first_page.get_text()
        
        # Citi card last 4
        card_match = re.search(r'Account.*?(\d{4})', text, re.IGNORECASE)
        card_last4 = card_match.group(1) if card_match else "0000"
        
        # Billing dates
        cycle_match = re.search(
            r'(?:Statement|Billing)\s+(?:Period|Cycle)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})\s*[-–to]+\s*(\d{1,2}/\d{1,2}/\d{2,4})',
            text, re.IGNORECASE
        )
        if cycle_match:
            start_date = parse_date(cycle_match.group(1))
            end_date = parse_date(cycle_match.group(2))
            billing_cycle = f"{start_date} to {end_date}"
        else:
            billing_cycle = "Unknown"
        
        # Payment due date
        due_match = re.search(r'Payment\s+Due\s+Date[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})', text, re.IGNORECASE)
        payment_due = parse_date(due_match.group(1)) if due_match else "Unknown"
        
        # New balance
        balance_match = re.search(r'(?:New Balance|Total Due)[:\s]+\$?([\d,]+\.?\d{0,2})', text, re.IGNORECASE)
        total_balance = standardize_amount(balance_match.group(1)) if balance_match else 0.0
        
        transactions = extract_generic_transactions(doc, ["TRANSACTIONS", "PURCHASES"])
        doc.close()
        
        return {
            "issuer_name": "Citibank",
            "card_variant_last4": card_last4,
            "billing_cycle_dates": billing_cycle,
            "payment_due_date": payment_due,
            "total_new_balance": total_balance,
            "transactions": transactions
        }
    except Exception as e:
        doc.close()
        raise ValueError(f"Citi parser error: {str(e)}")

def parse_capital_one(pdf_bytes: bytes) -> Dict:
    """Parse Capital One credit card statement."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    try:
        first_page = doc[0]
        text = first_page.get_text()
        
        # Capital One card last 4
        card_match = re.search(r'Account\s+Number.*?(\d{4})', text, re.IGNORECASE)
        if not card_match:
            card_match = re.search(r'ending\s+in\s+(\d{4})', text, re.IGNORECASE)
        card_last4 = card_match.group(1) if card_match else "0000"
        
        # Billing dates
        cycle_match = re.search(
            r'(?:Statement|Billing)\s+(?:Period|Date)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})\s*[-–to]+\s*(\d{1,2}/\d{1,2}/\d{2,4})',
            text, re.IGNORECASE
        )
        if cycle_match:
            start_date = parse_date(cycle_match.group(1))
            end_date = parse_date(cycle_match.group(2))
            billing_cycle = f"{start_date} to {end_date}"
        else:
            billing_cycle = "Unknown"
        
        # Payment due date
        due_match = re.search(r'Payment\s+Due\s+Date[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})', text, re.IGNORECASE)
        payment_due = parse_date(due_match.group(1)) if due_match else "Unknown"
        
        # New balance
        balance_match = re.search(r'(?:New Balance|Balance)[:\s]+\$?([\d,]+\.?\d{0,2})', text, re.IGNORECASE)
        total_balance = standardize_amount(balance_match.group(1)) if balance_match else 0.0
        
        transactions = extract_generic_transactions(doc, ["TRANSACTIONS", "ACTIVITY"])
        doc.close()
        
        return {
            "issuer_name": "Capital One",
            "card_variant_last4": card_last4,
            "billing_cycle_dates": billing_cycle,
            "payment_due_date": payment_due,
            "total_new_balance": total_balance,
            "transactions": transactions
        }
    except Exception as e:
        doc.close()
        raise ValueError(f"Capital One parser error: {str(e)}")

def parse_discover(pdf_bytes: bytes) -> Dict:
    """Parse Discover credit card statement."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    try:
        first_page = doc[0]
        text = first_page.get_text()
        
        # Discover card last 4
        card_match = re.search(r'Account\s+Number.*?(\d{4})', text, re.IGNORECASE)
        if not card_match:
            card_match = re.search(r'ending\s+in\s+(\d{4})', text, re.IGNORECASE)
        card_last4 = card_match.group(1) if card_match else "0000"
        
        # Billing dates
        cycle_match = re.search(
            r'(?:Statement|Billing)\s+(?:Period|Closing Date)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})\s*[-–to]+\s*(\d{1,2}/\d{1,2}/\d{2,4})',
            text, re.IGNORECASE
        )
        if cycle_match:
            start_date = parse_date(cycle_match.group(1))
            end_date = parse_date(cycle_match.group(2))
            billing_cycle = f"{start_date} to {end_date}"
        else:
            billing_cycle = "Unknown"
        
        # Payment due date
        due_match = re.search(r'Payment\s+Due\s+Date[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})', text, re.IGNORECASE)
        payment_due = parse_date(due_match.group(1)) if due_match else "Unknown"
        
        # New balance
        balance_match = re.search(r'(?:New Balance|Total Balance)[:\s]+\$?([\d,]+\.?\d{0,2})', text, re.IGNORECASE)
        total_balance = standardize_amount(balance_match.group(1)) if balance_match else 0.0
        
        transactions = extract_generic_transactions(doc, ["TRANSACTIONS", "PURCHASES", "PAYMENTS"])
        doc.close()
        
        return {
            "issuer_name": "Discover",
            "card_variant_last4": card_last4,
            "billing_cycle_dates": billing_cycle,
            "payment_due_date": payment_due,
            "total_new_balance": total_balance,
            "transactions": transactions
        }
    except Exception as e:
        doc.close()
        raise ValueError(f"Discover parser error: {str(e)}")

def extract_generic_transactions(doc, section_markers: List[str]) -> List[Dict]:
    """Generic transaction extractor for multiple issuers."""
    transactions = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        lines = text.split('\n')
        
        in_transaction_section = False
        
        for line in lines:
            if any(marker.upper() in line.upper() for marker in section_markers):
                in_transaction_section = True
                continue
            
            if in_transaction_section and re.search(r'(Total|Summary|Fees|Interest)', line, re.IGNORECASE):
                in_transaction_section = False
            
            if in_transaction_section:
                match = re.search(
                    r'(\d{1,2}/\d{1,2}(?:/\d{2,4})?)\s+(.+?)\s+(\$?[\-\+]?\d{1,3}(?:,\d{3})*\.?\d{0,2})',
                    line.strip()
                )
                
                if match:
                    try:
                        trans_date = parse_date(match.group(1))
                        merchant = match.group(2).strip()
                        amount = standardize_amount(match.group(3))
                        
                        merchant = re.sub(r'\s{2,}', ' ', merchant)[:100]
                        
                        transactions.append({
                            "date": trans_date,
                            "merchant": merchant,
                            "amount": amount
                        })
                    except:
                        continue
    
    return transactions

def parse_date(date_str: str) -> str:
    """Convert various date formats to YYYY-MM-DD."""
    date_str = date_str.strip()
    current_year = datetime.now().year
    
    for fmt in ['%m/%d/%Y', '%m/%d/%y', '%m/%d']:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.year == 1900:
                dt = dt.replace(year=current_year)
            return dt.strftime('%Y-%m-%d')
        except:
            pass
    
    return date_str