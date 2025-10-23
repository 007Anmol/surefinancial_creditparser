import fitz  # PyMuPDF
from typing import Dict
from parsers.chase_parser import parse_chase
from parsers.amex_parser import parse_amex
from parsers.citi_parser import parse_citi, parse_capital_one, parse_discover


def identify_issuer(pdf_bytes: bytes) -> str:
    """
    Identify the credit card issuer from the first page of the PDF.
    
    This function opens the PDF, extracts text from the first page, and searches
    for issuer-specific keywords to determine which bank issued the statement.
    
    Args:
        pdf_bytes (bytes): Raw PDF file bytes
        
    Returns:
        str: Issuer identifier ('chase', 'amex', 'citi', 'capital_one', 'discover')
        
    Raises:
        ValueError: If PDF is empty or issuer cannot be identified
        
    Example:
        >>> with open('statement.pdf', 'rb') as f:
        ...     pdf_bytes = f.read()
        >>> issuer = identify_issuer(pdf_bytes)
        >>> print(issuer)
        'chase'
    """
    # Open PDF document from bytes
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    # Validate PDF has at least one page
    if len(doc) == 0:
        doc.close()
        raise ValueError("PDF is empty or corrupted")
    
    try:
        # Extract text from first page and convert to uppercase for matching
        first_page = doc[0]
        text = first_page.get_text().upper()
        
        # Issuer detection patterns - order matters (most specific first)
        # Chase detection
        if "JPMORGAN CHASE" in text or "CHASE CARD SERVICES" in text or "CHASE BANK" in text:
            doc.close()
            return "chase"
        
        # American Express detection
        elif "AMERICAN EXPRESS" in text or "AMEX" in text:
            doc.close()
            return "amex"
        
        # Citibank detection
        elif "CITIBANK" in text or "CITI CARD" in text or "CITI CARDS" in text:
            doc.close()
            return "citi"
        
        # Capital One detection
        elif "CAPITAL ONE" in text:
            doc.close()
            return "capital_one"
        
        # Discover detection
        elif "DISCOVER" in text or "DISCOVER BANK" in text:
            doc.close()
            return "discover"
        
        else:
            doc.close()
            # Provide helpful error message listing supported issuers
            raise ValueError(
                "Unable to identify credit card issuer. "
                "Please ensure this is a statement from one of the supported issuers: "
                "Chase, American Express, Citibank, Capital One, or Discover. "
                f"First page text preview: {text[:200]}"
            )
    
    except Exception as e:
        doc.close()
        # Re-raise with context if it's not already a ValueError
        if not isinstance(e, ValueError):
            raise ValueError(f"Error identifying issuer: {str(e)}")
        raise


def parse_statement(pdf_bytes: bytes) -> Dict:
    """
    Main dispatcher function that routes PDF to appropriate parser.
    
    This is the primary entry point for parsing credit card statements. It:
    1. Identifies the issuer from the PDF
    2. Routes to the appropriate specialized parser
    3. Returns standardized data in a unified format
    
    Args:
        pdf_bytes (bytes): Raw PDF file bytes
        
    Returns:
        Dict: Standardized statement data with keys:
            - issuer_name (str): Full name of the issuer
            - card_variant_last4 (str): Last 4 digits of card
            - billing_cycle_dates (str): Billing period in 'YYYY-MM-DD to YYYY-MM-DD' format
            - payment_due_date (str): Due date in 'YYYY-MM-DD' format
            - total_new_balance (float): Current balance as standardized float
            - transactions (List[Dict]): Optional list of transaction details
            
    Raises:
        ValueError: If issuer cannot be identified or parsing fails
        
    Example:
        >>> with open('chase_statement.pdf', 'rb') as f:
        ...     pdf_bytes = f.read()
        >>> data = parse_statement(pdf_bytes)
        >>> print(data['issuer_name'])
        'Chase'
        >>> print(data['total_new_balance'])
        1543.87
    """
    # Step 1: Identify the issuer
    try:
        issuer = identify_issuer(pdf_bytes)
    except ValueError as e:
        # Re-raise issuer identification errors with clear message
        raise ValueError(f"Issuer identification failed: {str(e)}")
    
    # Step 2: Map issuer to parser function
    parsers = {
        "chase": parse_chase,
        "amex": parse_amex,
        "citi": parse_citi,
        "capital_one": parse_capital_one,
        "discover": parse_discover
    }
    
    # Get the appropriate parser function
    parser_func = parsers.get(issuer)
    
    # This should never happen given identify_issuer() logic, but check anyway
    if not parser_func:
        raise ValueError(
            f"No parser available for issuer: {issuer}. "
            f"Supported issuers: {', '.join(parsers.keys())}"
        )
    
    # Step 3: Parse the statement and return standardized data
    try:
        parsed_data = parser_func(pdf_bytes)
        
        # Validate that parser returned required fields
        required_fields = [
            'issuer_name',
            'card_variant_last4',
            'billing_cycle_dates',
            'payment_due_date',
            'total_new_balance'
        ]
        
        missing_fields = [field for field in required_fields if field not in parsed_data]
        if missing_fields:
            raise ValueError(
                f"Parser for {issuer} did not return required fields: {', '.join(missing_fields)}"
            )
        
        return parsed_data
        
    except Exception as e:
        # Wrap parsing errors with context about which parser failed
        if isinstance(e, ValueError):
            raise
        raise ValueError(
            f"Error parsing {issuer} statement: {str(e)}. "
            f"The statement format may have changed or be unsupported."
        )


def get_supported_issuers() -> list:
    """
    Get list of supported credit card issuers.
    
    Returns:
        list: List of supported issuer names
        
    Example:
        >>> issuers = get_supported_issuers()
        >>> print(issuers)
        ['Chase', 'American Express', 'Citibank', 'Capital One', 'Discover']
    """
    return [
        "Chase",
        "American Express",
        "Citibank",
        "Capital One",
        "Discover"
    ]


def validate_pdf(pdf_bytes: bytes) -> bool:
    """
    Validate that the provided bytes represent a valid PDF file.
    
    Args:
        pdf_bytes (bytes): Raw file bytes to validate
        
    Returns:
        bool: True if valid PDF, False otherwise
        
    Example:
        >>> with open('statement.pdf', 'rb') as f:
        ...     pdf_bytes = f.read()
        >>> is_valid = validate_pdf(pdf_bytes)
        >>> print(is_valid)
        True
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        is_valid = len(doc) > 0
        doc.close()
        return is_valid
    except Exception:
        return False


# For testing the dispatcher
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python dispatcher.py <path_to_pdf>")
        print(f"Supported issuers: {', '.join(get_supported_issuers())}")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        # Read PDF file
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        
        # Validate PDF
        if not validate_pdf(pdf_bytes):
            print("Error: Invalid PDF file")
            sys.exit(1)
        
        # Identify issuer
        print("Identifying issuer...")
        issuer = identify_issuer(pdf_bytes)
        print(f"✓ Detected issuer: {issuer}")
        
        # Parse statement
        print("Parsing statement...")
        data = parse_statement(pdf_bytes)
        
        # Display results
        print("\n" + "="*50)
        print("PARSED STATEMENT DATA")
        print("="*50)
        print(f"Issuer: {data['issuer_name']}")
        print(f"Card: •••• {data['card_variant_last4']}")
        print(f"Billing Cycle: {data['billing_cycle_dates']}")
        print(f"Due Date: {data['payment_due_date']}")
        print(f"Balance: ${data['total_new_balance']:,.2f}")
        
        if data.get('transactions'):
            print(f"\nTransactions: {len(data['transactions'])} found")
            print("\nFirst 5 transactions:")
            for i, txn in enumerate(data['transactions'][:5], 1):
                print(f"  {i}. {txn['date']} - {txn['merchant']}: ${txn['amount']:.2f}")
        
        print("\n✓ Parsing successful!")
        
    except FileNotFoundError:
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        sys.exit(1)