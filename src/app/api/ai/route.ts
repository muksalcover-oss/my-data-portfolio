import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    const key = process.env.GOOGLE_API_KEY

    if (!key) {
      return NextResponse.json({ error: 'No API key configured on server' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(key)
    // Using gemini-1.5-flash as it is fast and cost-effective, perfect for interactive dashboards
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text) {
       return NextResponse.json({ error: 'No text in AI response' }, { status: 502 })
    }

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('AI Route Error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
