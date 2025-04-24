const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Utilise la clé API depuis le fichier .env
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

app.post('/generate', async (req, res) => {
  const { keywords } = req.body;

  if (!keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Les mots-clés doivent être un tableau.' });
  }

  const prompt = `Génère une description originale et bien rédigée en français à partir des mots-clés suivants : ${keywords.join(', ')}`;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    const text = response.data.choices[0].message.content;
    res.json({ description: text });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la génération.' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`));
