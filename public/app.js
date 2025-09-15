class WorkshopApp {
    constructor() {
        this.selectedTemplate = null;
        this.templates = [];
        this.initializeApp();
    }

    async initializeApp() {
        await this.loadTemplates();
        this.setupEventListeners();
        this.setupEnterKeySubmission();
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            this.templates = await response.json();
            this.renderTemplates();
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.showError('Failed to load workshop templates');
        }
    }

    renderTemplates() {
        const container = document.getElementById('templates-container');
        container.innerHTML = '';

        this.templates.forEach(template => {
            const templateElement = document.createElement('div');
            templateElement.className = 'prompt-template bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100';
            templateElement.innerHTML = `
                <h4 class="font-medium text-gray-800 mb-1">${template.name}</h4>
                <p class="text-xs text-gray-600">${template.description}</p>
            `;
            templateElement.addEventListener('click', () => this.selectTemplate(template));
            container.appendChild(templateElement);
        });

        // Add custom template option
        const customTemplate = document.createElement('div');
        customTemplate.className = 'prompt-template bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100';
        customTemplate.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-1">Custom Mode</h4>
            <p class="text-xs text-blue-600">Use your own prompts without templates</p>
        `;
        customTemplate.addEventListener('click', () => this.selectTemplate(null));
        container.appendChild(customTemplate);
    }

    selectTemplate(template) {
        this.selectedTemplate = template;
        
        // Update visual selection
        document.querySelectorAll('.prompt-template').forEach(el => {
            el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-100');
        });
        
        event.target.closest('.prompt-template').classList.add('ring-2', 'ring-blue-500', 'bg-blue-100');
        
        // Update header
        const templateName = template ? template.name : 'Custom Mode';
        document.getElementById('selected-template').textContent = templateName;
        
        // Focus on message input
        document.getElementById('message-input').focus();
    }

    setupEventListeners() {
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        
        sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enable send button only when there's text
        messageInput.addEventListener('input', () => {
            sendButton.disabled = messageInput.value.trim() === '';
        });
    }

    setupEnterKeySubmission() {
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const contextInput = document.getElementById('context-input');
        const message = messageInput.value.trim();
        
        if (!message) return;

        // Clear input and disable send button
        messageInput.value = '';
        document.getElementById('send-button').disabled = true;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    promptType: this.selectedTemplate?.id,
                    context: contextInput.value.trim() || undefined
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide typing indicator and add AI response
            this.hideTypingIndicator();
            this.addMessage(data.response, 'ai');
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'ai', true);
        }
    }

    addMessage(content, sender, isError = false) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const isUser = sender === 'user';
        const bgColor = isError ? 'bg-red-50' : (isUser ? 'bg-gray-50' : 'bg-blue-50');
        const avatar = isUser ? 'You' : 'AI';
        const avatarBg = isError ? 'bg-red-500' : (isUser ? 'bg-gray-500' : 'bg-blue-500');
        
        messageElement.innerHTML = `
            <div class="${bgColor} p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-white text-sm font-medium">
                        ${avatar.charAt(0)}
                    </div>
                    <div class="flex-1">
                        <p class="text-gray-800 whitespace-pre-wrap">${content}</p>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        document.getElementById('typing-indicator').classList.add('active');
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typing-indicator').classList.remove('active');
    }

    showError(message) {
        this.addMessage(message, 'ai', true);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WorkshopApp();
});