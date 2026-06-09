import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentText } = await request.json();

    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: 'No notice payload text provided.' }, { status: 400 });
    }

    const cleanText = documentText.trim();
    const lowercaseText = cleanText.toLowerCase();
    
    // --- 1. DETERMINISTIC TYPE DETECTION ---
    let transactionType = 'Capital Call';
    if (lowercaseText.includes('management fee') || lowercaseText.includes('performance fee')) {
      transactionType = 'Management Fee Notice';
    } else if (lowercaseText.includes('distribution') || lowercaseText.includes('return of capital')) {
      transactionType = 'Fund Distribution';
    } else if (lowercaseText.includes('loan') || lowercaseText.includes('drawdown') || lowercaseText.includes('facility')) {
      transactionType = 'Bank Loan Drawdown';
    }

    // --- 2. ENTITY EXTRACTION PARSING ---
    let fundName = 'AGIP Alternative Investments IV';
    const fundRegex = /(?:fund|entity|partnership):\s*([^\n\r]+)/i;
    const fundMatch = cleanText.match(fundRegex);
    if (fundMatch && fundMatch[1]) {
      fundName = fundMatch[1].trim();
    }

    // --- 3. AMOUNT EXTRACTION PARSING (STRICT CENTS MATCHING) ---
    let totalAmountInCents = 150000000; // Safe default $1.5M demo fall-back
    
    // Looks for numbers preceded by currency symbols (e.g., $1,500,000.00 or Php 50,000)
    const amountRegex = /(?:\$|php|eur|gbp)\s*([0-9,]+(?:\.[0-9]{2})?)/i;
    const amountMatch = cleanText.match(amountRegex);
    
    if (amountMatch && amountMatch[1]) {
      const normalizedAmount = amountMatch[1].replace(/,/g, '');
      totalAmountInCents = Math.round(parseFloat(normalizedAmount) * 100);
    }

    // --- 4. DOUBLE-ENTRY MAPPING GENERATOR ---
    let suggestedLedgerLines: any[] = [];

    switch (transactionType) {
      case 'Capital Call':
        suggestedLedgerLines = [
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: totalAmountInCents, creditInCents: 0 },
          { accountCode: '3100', accountName: 'Partners Capital - LP Contributions', debitInCents: 0, creditInCents: totalAmountInCents }
        ];
        break;
        
      case 'Management Fee Notice':
        suggestedLedgerLines = [
          { accountCode: '5100', accountName: 'Management & Performance Fees', debitInCents: totalAmountInCents, creditInCents: 0 },
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: 0, creditInCents: totalAmountInCents }
        ];
        break;

      case 'Bank Loan Drawdown':
        suggestedLedgerLines = [
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: totalAmountInCents, creditInCents: 0 },
          { accountCode: '1300', accountName: 'Bank Loans Receivable', debitInCents: 0, creditInCents: totalAmountInCents }
        ];
        break;

      default:
        suggestedLedgerLines = [
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: totalAmountInCents, creditInCents: 0 },
          { accountCode: '3100', accountName: 'Partners Capital - LP Contributions', debitInCents: 0, creditInCents: totalAmountInCents }
        ];
    }

    // --- 5. RETURN CLEANED DATA STRUCTURE ---
    return NextResponse.json({
      fundName,
      transactionType,
      totalAmountInCents,
      currency: 'USD',
      noticeDate: new Date().toISOString().split('T')[0],
      suggestedLedgerLines
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal processing error' }, { status: 500 });
  }
}