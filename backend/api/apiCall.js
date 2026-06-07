const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function handleAPIRequest(reviewArr) {
  if (!reviewArr || reviewArr.length === 0) {
    throw new Error("No reviews found to summarize.");
  }

  const prompt = `Summarize these reviews in 100 words or less, use bullets and Be concise, accurate, and include both pros and cons: make sure the summary is in bullets and human readable format \n${reviewArr.join('\n')}`;

  try {
    const modelName = process.env.MODEL_NAME || "tiiuae/falcon3-7b-instruct";
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false
    });

    const answer = completion.choices[0]?.message?.content || '';

    if (!answer) {
      throw new Error("API returned an empty response.");
    }

    return answer.trim();

  } catch (err) {
    console.error('[Backend API Helper] Error:', err.message);
    throw err;
  }
}

module.exports = handleAPIRequest;