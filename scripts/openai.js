export async function chatComplete({ apiKey, messages }) {

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages
    })
  });

  const data = await res.json();

  console.log("FULL OPENAI RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  if (!data.choices) {
    throw new Error("No choices returned from OpenAI");
  }

  return data.choices[0].message.content;
}