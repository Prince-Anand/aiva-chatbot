// const express = require('express');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const dotenv = require('dotenv');
// const cors = require('cors');

// // Load environment variables
// dotenv.config();

// const app = express();

// // Initialize Google Generative AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


// // Initialize the model with a system instruction
// const model = genAI.getGenerativeModel({
//   model: 'gemini-1.5-flash',
//   systemInstruction: 'You are AIVA, an AI Visual Art Investment Guide. Provide expert insights on AI-generated art investments, including marketplaces, artists, valuation, and strategies. Do not respond to queries outside this field. Respond concisely and professionally in markdown format, using proper syntax for bold text (**text**) and lists (- or 1.). Avoid malformed markdown like *** or extra asterisks.'
// });

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public')); // Serve frontend files

// // Chat endpoint
// app.post('/api/chat', async (req, res) => {
// 	const userMessage = req.body.message;

// 	// Validate input
// 	if (!userMessage) {
// 		return res.status(400).json({ error: 'Message is required' });
// 	}
// 	if (userMessage.length > 1000) {
// 		return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
// 	}

// 	try {
// 		// Prepare the prompt with system instructions
// 		const prompt = `You are AIVA, an AI Visual Art Investment Guide. Provide expert insights on AI-generated art investments, including marketplaces, artists, valuation, and strategies. Do not respond to queries outside this field. Respond concisely and professionally to the following user query: ${userMessage}`;

// 		// Send request to Gemini API
// 		const result = await model.generateContent({
// 			contents: [{ parts: [{ text: prompt }] }],
// 			generationConfig: {
// 				maxOutputTokens: 500, // Limit response length
// 			},
// 		});

// 		// Extract and validate response
// 		let botResponse = result.response.text() || 'Sorry, I couldn’t generate a response. Please try again.';
// 		// Clean up malformed markdown
// 		botResponse = botResponse.replace(/\*{3,}/g, '**'); // Replace *** or more with **
// 		botResponse = botResponse.replace(/\n\s*\n/g, '\n');

// 		if (botResponse.length > 2000) {
// 			return res.status(500).json({ error: 'Response too long, please try a different query' });
// 		}

// 		res.json({ reply: botResponse });
// 	} catch (error) {
// 		console.error('Error with Gemini API:', error.message, error.stack);
// 		if (error.message.includes('API key not valid')) {
// 			return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
// 		} else if (error.message.includes('429') || error.message.includes('Quota')) {
// 			return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
// 		} else if (error.message.includes('model')) {
// 			return res.status(500).json({ error: 'Requested model unavailable. Please contact support.' });
// 		}
// 		res.status(500).json({ error: 'Failed to get response from Gemini API' });
// 	}

// 	console.log('Received message:', userMessage);
// 	console.log('Gemini Response:', JSON.stringify(result.response, null, 2));
// });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
// 	console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model with a system instruction
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: 'You are AIVA, an AI Visual Art Investment Guide. Provide expert insights on AI-generated art investments, including marketplaces, artists, valuation, and strategies. Do not respond to queries outside this field. Respond concisely and professionally in markdown format, using proper syntax for bold text (**text**) and lists (- or 1.). Avoid malformed markdown like *** or extra asterisks.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { history } = req.body;

  // Validate input
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'History is required and must be an array' });
  }
  if (history.length === 0) {
    return res.status(400).json({ error: 'History cannot be empty' });
  }
  // Validate history format
  for (const message of history) {
    if (!message.role || !['user', 'model'].includes(message.role) || !message.parts || !Array.isArray(message.parts) || message.parts.length === 0) {
      return res.status(400).json({ error: 'Invalid history format: each message must have role (user or model) and parts array' });
    }
    for (const part of message.parts) {
      if (!part.text || typeof part.text !== 'string') {
        return res.status(400).json({ error: 'Invalid history format: each part must have a text string' });
      }
      if (part.text.length > 1000) {
        return res.status(400).json({ error: 'Message in history is too long (max 1000 characters)' });
      }
    }
  }

  try {
    // Send conversation history to Gemini API
    const result = await model.generateContent({
      contents: history,
      generationConfig: {
        maxOutputTokens: 500, // Consistent with previous limit
      },
    });

    // Extract and clean response
    let botResponse = result.response.text() || 'Sorry, I couldn’t generate a response. Please try again.';
    // Clean up malformed markdown
    botResponse = botResponse.replace(/\*{3,}/g, '**'); // Replace *** or more with **
    botResponse = botResponse.replace(/\n\s*\n/g, '\n'); // Remove extra blank lines

    if (botResponse.length > 4000) {
      return res.status(500).json({ error: 'Response too long, please try a different query' });
    }

    res.json({ reply: botResponse });

    // Log for debugging
    console.log('Received history:', JSON.stringify(history, null, 2));
    console.log('Gemini Response:', botResponse);
  } catch (error) {
    console.error('Error with Gemini API:', error.message, error.stack);
    if (error.message.includes('API key not valid')) {
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    } else if (error.message.includes('429') || error.message.includes('Quota')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.message.includes('model')) {
      return res.status(500).json({ error: 'Requested model unavailable. Please contact support.' });
    }
    res.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});