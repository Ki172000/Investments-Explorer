import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentText } = await request.json();

    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: 'No notice payload text provided.' }, { status: 400 });
    }

    const cleanText = documentText.trim();
    
    // Segment text based on batch headers
    const blocks = cleanText.split(/transaction architecture batch file|transaction frame|batch file/i);
    const extractedEntries: any[] = [];

    blocks.forEach((block, index) => {
      if (index === 0 && !block.toLowerCase().includes('target fund entity')) return;
      
      const lowercaseBlock = block.toLowerCase();
      if (!lowercaseBlock.trim()) return;

      // Identify transaction class
      let transactionType = 'Capital Call';
      if (lowercaseBlock.includes('management fee') || lowercaseBlock.includes('advisory fee') || lowercaseBlock.includes('invoice amount')) {
        transactionType = 'Management Fee Notice';
      } else if (lowercaseBlock.includes('distribution') || lowercaseBlock.includes('return of capital') || lowercaseBlock.includes('divestment')) {
        transactionType = 'Fund Distribution';
      }

      // Extract Fund Entity Name
      let fundName = 'Alternative Investments Portfolio IV';
      const fundRegex = /(?:fund entity|target fund entity|partnership|fund)\s*:\s*([^\n\r]+)/i;
      const fundMatch = block.match(fundRegex);
      if (fundMatch && fundMatch[1]) {
        fundName = fundMatch[1].trim();
      }

      // Extract Currency Value
      let amountInCents = 0;
      const amountRegex = /(?:\$|php|eur|gbp)\s*([0-9,]+(?:\.[0-9]{2})?)/i;
      const amountMatch = block.match(amountRegex);
      if (amountMatch && amountMatch[1]) {
        const normalized = amountMatch[1].replace(/,/g, '');
        amountInCents = Math.round(parseFloat(normalized) * 100);
      }

      if (amountInCents === 0) return;

      // Structure double-entry guidelines
      let lines: any[] = [];
      if (transactionType === 'Capital Call') {
        lines = [
          { accountCode: '1100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '3100', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Management Fee Notice') {
        lines = [
          { accountCode: '5100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Fund Distribution') {
        lines = [
          { accountCode: '3100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', debitInCents: 0, creditInCents: amountInCents }
        ];
      }

      // Generate localized ID using the JE-XXXX framework
      const uniqueSerial = Math.floor(1000 + Math.random() * 9000);

      extractedEntries.push({
        id: `JE${uniqueSerial}`,
        fundName,
        transactionType,
        totalAmountInCents: amountInCents,
        currency: 'USD',
        suggestedLedgerLines: lines
      });
    });

    return NextResponse.json({ entries: extractedEntries });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal batch processing error' }, { status: 500 });
  }
}