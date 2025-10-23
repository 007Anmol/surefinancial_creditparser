import re
from typing import Tuple

def detect_currency_format(amount_str: str) -> str:
    """
    Detect the currency format used in the string.
    Returns: 'US' for US format (1,234.56) or 'EU' for European format (1.234,56)
    """
    # Remove currency symbols and whitespace
    cleaned = re.sub(r'[^\d,.\-\+]', '', amount_str.strip())
    
    # Check for European format (comma as decimal separator)
    if re.search(r'\d+\.\d{3}', cleaned) and ',' in cleaned:
        # Pattern like 1.234,56 (EU format)
        return 'EU'
    elif re.search(r'\d+,\d{2}$', cleaned) and cleaned.count(',') == 1:
        # Single comma followed by exactly 2 digits at end
        return 'EU'
    else:
        # Default to US format
        return 'US'

def standardize_amount(amount_str: str) -> float:
    """
    Convert various currency format strings to standardized float.
    Handles:
    - US format: $1,234.56 or 1,234.56
    - EU format: 1.234,56 € or 1.234,56
    - Negative amounts: -$123.45 or ($123.45)
    - Plus signs: +$50.00
    
    Returns: float value (positive for charges, negative for credits)
    """
    if not amount_str:
        raise ValueError("Empty amount string")
    
    # Store if amount is negative
    is_negative = False
    
    # Handle parentheses notation for negative (common in accounting)
    if '(' in amount_str and ')' in amount_str:
        is_negative = True
        amount_str = amount_str.replace('(', '').replace(')', '')
    
    # Check for explicit negative sign
    if amount_str.strip().startswith('-'):
        is_negative = True
    
    # Remove currency symbols, spaces, and + signs
    cleaned = re.sub(r'[$€£¥₹\s\+]', '', amount_str)
    
    # Detect format
    currency_format = detect_currency_format(cleaned)
    
    try:
        if currency_format == 'EU':
            # European format: replace . with nothing, then , with .
            cleaned = cleaned.replace('.', '').replace(',', '.')
        else:
            # US format: just remove commas
            cleaned = cleaned.replace(',', '')
        
        # Convert to float
        value = float(cleaned)
        
        # Apply negative if needed
        if is_negative:
            value = -abs(value)
        
        return value
    
    except ValueError as e:
        raise ValueError(f"Could not parse amount '{amount_str}': {str(e)}")

def extract_amount_from_text(text: str, pattern: str = None) -> float:
    """
    Extract and standardize the first currency amount found in text.
    Optionally use a specific regex pattern.
    """
    if pattern:
        match = re.search(pattern, text)
        if match:
            amount_str = match.group(1) if match.groups() else match.group(0)
            return standardize_amount(amount_str)
    
    # Default pattern: find currency amounts
    default_pattern = r'[$€£¥₹]?\s*[\-\+]?\s*\(?\d{1,3}(?:[,.\s]\d{3})*[,.]?\d{0,2}\)?'
    match = re.search(default_pattern, text)
    
    if match:
        return standardize_amount(match.group(0))
    
    raise ValueError(f"No currency amount found in text: {text}")

# Test cases
if __name__ == "__main__":
    test_cases = [
        ("$1,234.56", 1234.56),
        ("1.234,56 €", 1234.56),
        ("-$500.00", -500.0),
        ("($123.45)", -123.45),
        ("+$50.00", 50.0),
        ("£1,000.99", 1000.99),
        ("1.500,00", 1500.0),
        ("2,500.75", 2500.75)
    ]
    
    print("Testing currency standardization:")
    for test_input, expected in test_cases:
        result = standardize_amount(test_input)
        status = "✓" if abs(result - expected) < 0.01 else "✗"
        print(f"{status} '{test_input}' -> {result} (expected {expected})")