module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Arcade AI is not connected yet. Add GROQ_API_KEY in Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const page = String(body.page || 'Arcade Hub').slice(0, 160);
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const messages = incoming
      .slice(-12)
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Send a message first.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.65,
        max_completion_tokens: 650,
        messages: [
          {
            role: 'system',
            content: `You are Arcade AI, the built-in assistant for a mobile browser game site called Arcade Hub. Be concise, friendly, and practical. Help with game controls, strategies, feature ideas, debugging, and questions about the Arcade Hub games. Current page: ${page}. Do not pretend you can see the user's screen or directly press game controls through chat. If they ask about an autopilot, explain or help improve the site's local game controller rather than claiming the language model is controlling every frame.`
          },
          ...messages
        ]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || data?.error || 'Groq request failed.';
      return res.status(response.status).json({ error: String(detail).slice(0, 500) });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'Groq returned an empty response.' });
    return res.status(200).json({ reply: text });
  } catch (error) {
    return res.status(500).json({ error: 'Arcade AI failed to respond.' });
  }
};
