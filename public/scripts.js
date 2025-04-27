// Display welcome message on page load
window.onload = function () {
	addMessage(
		"Hello! I'm AIVA, your AI Visual Art Investment guide. How can I help you navigate the world of AI art investments today?"
	);
};

// Function to add a message to the chat
function addMessage(content, isUser = false) {
	const chatContainer = document.getElementById('chat-container');

	const messageDiv = document.createElement('div');
	messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

	const avatarDiv = document.createElement('div');
	avatarDiv.className = `message-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`;

	const icon = document.createElement('i');
	icon.className = isUser ? 'fa-solid fa-user' : 'fa-brands fa-bots';
	avatarDiv.appendChild(icon);

	const contentDiv = document.createElement('div');
	contentDiv.className = 'message-content';

	// Parse markdown for bot messages, use raw content for user messages
	if (!isUser) {
		try {
			// Check if marked and DOMPurify are available
			if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
				console.error('Marked or DOMPurify not loaded');
				contentDiv.innerHTML = content; // Fallback to raw content
			} else {
				// Convert markdown to HTML and sanitize
				const htmlContent = marked.parse(content, { breaks: true });
				const sanitizedContent = DOMPurify.sanitize(htmlContent, {
					ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
					ALLOWED_ATTR: []
				});
				contentDiv.innerHTML = sanitizedContent;
			}
		} catch (error) {
			console.error('Error parsing markdown:', error.message);
			contentDiv.innerHTML = content; // Fallback to raw content
		}
	} else {
		contentDiv.innerHTML = content;
	}

	messageDiv.appendChild(avatarDiv);
	messageDiv.appendChild(contentDiv);

	chatContainer.appendChild(messageDiv);
	chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to show the typing indicator
function showTyping() {
	const chatContainer = document.getElementById('chat-container');

	const typingDiv = document.createElement('div');
	typingDiv.className = 'message bot-message';
	typingDiv.id = 'typing-indicator';

	const avatarDiv = document.createElement('div');
	avatarDiv.className = 'message-avatar bot-avatar';

	const icon = document.createElement('i');
	icon.className = 'fa-brands fa-bots';
	avatarDiv.appendChild(icon);

	const contentDiv = document.createElement('div');
	contentDiv.className = 'message-content typing-indicator';

	for (let i = 0; i < 3; i++) {
		const dot = document.createElement('div');
		dot.className = 'typing-dot';
		contentDiv.appendChild(dot);
	}

	typingDiv.appendChild(avatarDiv);
	typingDiv.appendChild(contentDiv);

	chatContainer.appendChild(typingDiv);
	chatContainer.scrollTop = chatContainer.scrollHeight;

	return typingDiv;
}

// Function to hide the typing indicator
function hideTyping(typingIndicator) {
	if (typingIndicator) {
		typingIndicator.remove();
	}
}

// Send message to backend
async function sendMessage() {
	const userInput = document.getElementById('user-input');
	const message = userInput.value.trim();

	// Client-side validation
	if (message === '') {
		addMessage('Please enter a message.');
		return;
	}
	if (message.length > 1000) {
		addMessage('Message is too long (max 1000 characters).');
		return;
	}

	// Add user message
	addMessage(message, true);
	userInput.value = '';

	// Show typing indicator
	const typingIndicator = showTyping();

	try {
		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message }),
		});

		const data = await response.json();

		if (!response.ok) {
			if (response.status === 400) {
				throw new Error(data.error || 'Invalid input. Please try again.');
			} else if (response.status === 429) {
				throw new Error('Rate limit exceeded. Please try again later.');
			} else if (response.status === 500 && data.error.includes('Server configuration')) {
				throw new Error('Server error. Please contact support.');
			}
			throw new Error(data.error || 'Failed to get response from server');
		}

		// Hide typing indicator
		hideTyping(typingIndicator);

		// Add bot response
		addMessage(data.reply);
	} catch (error) {
		console.error('Frontend Error:', error.message);
		hideTyping(typingIndicator);
		addMessage(error.message);
	}
}

// Allow sending message with Enter key
document.getElementById('user-input').addEventListener('keypress', function (e) {
	if (e.key === 'Enter') {
		sendMessage();
	}
});

// Clear conversation button functionality
document.querySelector('.chat-controls button:first-child').addEventListener('click', function () {
	const chatContainer = document.getElementById('chat-container');
	chatContainer.innerHTML = '';

	// Add welcome message back
	addMessage(
		"Hello! I'm AIVA, your AI Visual Art Investment guide. How can I help you navigate the world of AI art investments today?"
	);
});