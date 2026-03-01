import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { summary } = body;

        if (!summary) {
            return NextResponse.json({ error: 'Summary data is required' }, { status: 400 });
        }

        const API_KEY = process.env.GROK_API_KEY;

        if (!API_KEY) {
            return NextResponse.json(
                { error: 'GROK_API_KEY is not configured on the server.' },
                { status: 500 }
            );
        }

        // Prepare a concise version of the summary to send to avoid token limits
        const conciseSummary = Object.entries(summary).map(([key, stats]: [string, any]) => {
            let statString = `${key}: `;
            if (stats.uniqueCount) statString += `${stats.uniqueCount} unique values. `;
            if (stats.mean !== undefined) statString += `Mean: ${stats.mean.toFixed(2)}, Min: ${stats.min}, Max: ${stats.max}. `;
            if (stats.topValues) {
                statString += `Top values: ${stats.topValues.map((v: any) => `${v.value}(${v.count})`).join(', ')}.`;
            }
            return statString;
        }).join('\n');

        const prompt = `Analyze the following dataset summary and provide 3 key, actionable insights. 
Keep it very concise, professional, and easy to understand. Format as a bulleted list or short paragraphs.
Dataset Summary:
${conciseSummary}`;

        // Using Groq API (api.groq.com) — the key prefix gsk_ is a Groq key, not xAI/Grok
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert data analyst assistant. Provide clear, concise, and valuable insights based on dataset summaries."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama-3.3-70b-versatile", // Fast, powerful Groq-hosted model
                temperature: 0.3,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', response.status, errorText);
            return NextResponse.json({ error: `AI API Error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        const insights = data.choices[0].message.content;

        return NextResponse.json({ insights });

    } catch (error: any) {
        console.error('Error generating insights:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
