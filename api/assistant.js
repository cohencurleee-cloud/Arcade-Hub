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
    const page = String(body.page || 'Arcade Hub').slice(0, 220);
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const messages = incoming
      .slice(-16)
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Send a message first.' });
    }

    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

    const siteGuide = `
Arcade Hub site knowledge:
- The site contains original browser games: 8 Ball Pool, Block Dash, Flappy Bird, Snake, Pong, Breakout, and Memory Match.
- 8 Ball Pool has realistic-style 2D ball physics, solids and stripes, the 8 ball, fouls/scratches, VS CPU, local 2-player, practice mode, saved CPU match records, Pool table cosmetics, Arcade Coin rewards for CPU wins, admin Pool Autopilot, and admin Pool Predictor. The predictor shows the cue-ball path, first contact, and planned object-ball route. The autopilot plans legal shots and can play the user's turns.
- Block Dash is an endless runner. Tap/Space/Up jumps. It has fair obstacle patterns, collectible coins, shields, skins/vibes, prediction, and an admin autopilot.
- Flappy Bird uses tap/click to flap through pipes and has difficulty progression plus an admin autopilot. The shop has visual Flappy cosmetics such as Night Flight and Candy Sky.
- Snake uses directional controls, has visual styles, wrap behavior with God mode, and a smart admin autopilot. The shop has visual Snake cosmetics such as Neon Venom and Ice Serpent.
- Pong is first-to-7 with Easy/Normal/Hard CPU, tournament mode, local 2-player, skins, prediction, and admin autopilot.
- Breakout has levels, lives, paddle controls, power-ups, and admin autopilot. The shop has Breakout visual cosmetics.
- Memory Match has Classic, Medium, and Expert board sizes, move/time tracking, best records, streaks, a limited normal Peek, Arcade Coin win rewards, admin Memory Autopilot, and admin XRAY that reveals hidden cards. It also has Hologram and Galaxy shop decks.
- Arcade Coins are the site currency. The shop has cosmetic unlocks for every game plus Arcade Hub themes. Daily rewards are available from the hub/shop. Progress and purchases are stored on the current device.
- The top hub has search, categories, featured/continue-playing, wallet, shop, music, Arcade AI, and admin-related tools under the three-dot menu.
- Admin features include God mode, speed controls, game-specific autopilots, prediction/XRAY tools, boost, and reset. Do not reveal the secret admin code or exact hidden unlock sequence. If someone asks how to unlock admin, tell them to use the staged Admin Hint option in the three-dot menu.
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_completion_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `You are Arcade AI, the built-in assistant inside Arcade Hub. You are a capable general-purpose assistant, not just a tiny game FAQ bot. You can answer normal questions, explain things, brainstorm, troubleshoot, help with code, suggest strategies, compare options, and help users understand or use Arcade Hub. Be practical, specific, and concise by default.\n\nCurrent page: ${page}.\n${siteGuide}\nWhen the question is about the current game, use the page name plus the site guide to give concrete advice. If a user reports a bug, ask for only the minimum missing detail and first suggest the most likely fix. Never pretend you can see the user's screen unless they supplied an image. Never claim you changed settings or controlled a game unless the site's UI actually did so. Do not invent features that are not in the guide. If asked for an admin secret, use the staged hint system rather than exposing it.`
          },
          ...messages
        ]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || data?.error || 'Groq request failed.';
      return res.status(response.status).json({
        error: String(detail).slice(0, 500),
        model
      });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'Groq returned an empty response.' });

    return res.status(200).json({ reply: text, model });
  } catch (error) {
    return res.status(500).json({ error: 'Arcade AI failed to respond.' });
  }
};