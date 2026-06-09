import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { documentText } = await req.json();

    if (!documentText) {
      return NextResponse.json({ error: 'No document text provided' }, { status: 400 });
    }

    const response = await generateObject({
      model: openai('gpt-4o-mini'),
      system: `You are an expert Alternative Investments Fund Accountant processing structured notices.
      Analyze the text provided from a Fund Notice. Extract metrics and map them to standard numerical account identifiers:
      - Assets: 1100 (Cash), 1200 (PE Investments), 1300 (Bank Loans Receivable)
      - Liabilities: 2100 (Management Fees Payable)
      - Equity: 3100 (LP Contributions), 3300 (Unfunded Capital Commitments)
      - Revenue: 4100 (Interest Income), 4200 (Realized Gains)
      - Expenses: 5100 (Management Fees Expense)

      Always multiply monetary balances by 100 to convert values to exact integer cents. Ensure debits equal credits.`,
      prompt: documentText,
      schema: z.object({
        fundName: z.string(),
        noticeDate: z.string(),
        dueDate: z.string(),
        transactionType: z.enum(['CAPITAL_CALL', 'DISTRIBUTION']),
        currency: z.string().default('USD'),
        totalAmountInCents: z.number(),
        suggestedLedgerLines: z.array(
          z.object({
            accountCode: z.string().describe('The 4-digit reference number (e.g., 1100, 1200, 3100)'),
            accountName: z.string().describe('Standard account title descriptive text matching the code'),
            debitInCents: z.number(),
            creditInCents: z.number(),
          })
        ),
      }),
    });

    return NextResponse.json(response.object);
  } catch (error: any) {
    console.error('Extraction Error:', error);
    return NextResponse.json({ error: 'Failed to process financial notice: ' + error.message }, { status: 500 });
  }
}