import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, summary, history } = body;

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const API_KEY = process.env.GROK_API_KEY;
        if (!API_KEY) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        // Build a concise context string from the summary
        const context = Object.entries(summary || {}).map(([col, stats]: [string, any]) => {
            let s = `${col}: `;
            if (stats.uniqueCount) s += `${stats.uniqueCount} unique values. `;
            if (stats.mean !== undefined) s += `Mean=${stats.mean.toFixed(2)}, Min=${stats.min}, Max=${stats.max}. `;
            if (stats.topValues) s += `Top values: ${stats.topValues.slice(0, 3).map((v: any) => `${v.value}(${v.count})`).join(', ')}.`;
            return s;
        }).join('\n');

        // Build conversation messages
        const messages: any[] = [
            {
                role: 'system',
                content: `You are a helpful data analyst assistant. The user has uploaded a CSV dataset. Answer their questions clearly, concisely, and accurately based on the dataset summary provided. Be conversational but precise. If the question cannot be answered from the data, say so honestly.

Dataset Summary:
${context}`,
            },
            // Include prior turns for context (limit to last 6 messages)
            ...(history || []).slice(-6),
            { role: 'user', content: question },
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                messages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Groq chat error:', response.status, err);
            return NextResponse.json({ error: 'AI request failed' }, { status: response.status });
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        return NextResponse.json({ answer });
    } catch (e: any) {
        console.error('Chat API error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
