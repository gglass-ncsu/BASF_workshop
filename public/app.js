class ConsoleApp {
    constructor() {
        this.templates = [];
        this.isLoading = false;
        this.initializeApp();
    }

    async initializeApp() {
        await this.loadTemplates();
        this.setupEventListeners();
        this.updateSendButton();
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            this.templates = await response.json();
            this.populateTemplateSelector();
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.showError('Failed to load workshop templates');
        }
    }

    populateTemplateSelector() {
        const selector = document.getElementById('template-selector');
        selector.innerHTML = '<option value="">Select a template...</option>';
        
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            selector.appendChild(option);
        });
    }

    setupEventListeners() {
        // Template selector
        const templateSelector = document.getElementById('template-selector');
        const loadTemplateBtn = document.getElementById('load-template-btn');
        
        templateSelector.addEventListener('change', () => {
            loadTemplateBtn.disabled = !templateSelector.value;
        });
        
        loadTemplateBtn.addEventListener('click', () => this.loadSelectedTemplate());
        
        // Prompt inputs
        const systemPrompt = document.getElementById('system-prompt');
        const userPrompt = document.getElementById('user-prompt');
        
        systemPrompt.addEventListener('input', () => this.updateSendButton());
        userPrompt.addEventListener('input', () => this.updateSendButton());
        
        // Buttons
        document.getElementById('send-button').addEventListener('click', () => this.sendMessage());
        document.getElementById('clear-prompts-btn').addEventListener('click', () => this.clearPrompts());
        document.getElementById('reset-chat-btn').addEventListener('click', () => this.resetChat());
        
        // Keyboard shortcuts
        systemPrompt.addEventListener('keydown', (e) => this.handleKeyDown(e));
        userPrompt.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        // Ctrl/Cmd + Enter to send
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!this.isLoading && this.canSend()) {
                this.sendMessage();
            }
        }
    }

    loadSelectedTemplate() {
        const selector = document.getElementById('template-selector');
        const templateId = selector.value;
        
        if (!templateId) return;
        
        // Find the template data from server
        fetch(`/api/template/${templateId}`)
            .then(response => response.json())
            .then(template => {
                document.getElementById('system-prompt').value = template.system;
                document.getElementById('user-prompt').value = template.template;
                this.updateSendButton();
                
                // Focus on user prompt for editing
                document.getElementById('user-prompt').focus();
            })
            .catch(error => {
                console.error('Failed to load template:', error);
                this.showError('Failed to load template');
            });
    }

    clearPrompts() {
        document.getElementById('system-prompt').value = '';
        document.getElementById('user-prompt').value = '';
        document.getElementById('context-input').value = '';
        document.getElementById('template-selector').value = '';
        document.getElementById('load-template-btn').disabled = true;
        this.updateSendButton();
    }

    resetChat() {
        document.getElementById('chat-messages').innerHTML = `
            <div class="chat-message bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        AI
                    </div>
                    <div class="flex-1">
                        <p class="text-gray-800">Welcome to the BASF AI Workshop! Configure your system and user prompts above, or select a template to get started. You can edit any template before sending it to the AI.</p>
                    </div>
                </div>
            </div>
        `;
    }

    canSend() {
        const userPrompt = document.getElementById('user-prompt').value.trim();
        return userPrompt.length > 0 && !this.isLoading;
    }

    updateSendButton() {
        const sendButton = document.getElementById('send-button');
        const canSend = this.canSend();
        
        sendButton.disabled = !canSend;
        sendButton.innerHTML = this.isLoading ? 
            '<span class="loading-spinner"></span> Sending...' : 
            'Send Message';
    }

    async sendMessage() {
        if (!this.canSend()) return;

        const systemPrompt = document.getElementById('system-prompt').value.trim();
        const userPrompt = document.getElementById('user-prompt').value.trim();
        const context = document.getElementById('context-input').value.trim();

        this.isLoading = true;
        this.updateSendButton();

        // Add user message to chat
        this.addMessage(userPrompt, 'user');
        
        // Show system prompt if provided
        if (systemPrompt) {
            this.addMessage(`System: ${systemPrompt}`, 'system');
        }
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemPrompt: systemPrompt,
                    userPrompt: userPrompt,
                    context: context || undefined
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
        } finally {
            this.isLoading = false;
            this.updateSendButton();
        }
    }

    addMessage(content, sender, isError = false) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        let bgColor, avatar, avatarBg, borderColor;
        
        if (isError) {
            bgColor = 'bg-red-50';
            avatarBg = 'bg-red-500';
            borderColor = 'border-red-500';
            avatar = 'ERR';
        } else if (sender === 'user') {
            bgColor = 'bg-gray-50';
            avatarBg = 'bg-gray-600';
            borderColor = 'border-gray-500';
            avatar = 'YOU';
        } else if (sender === 'system') {
            bgColor = 'bg-green-50';
            avatarBg = 'bg-green-600';
            borderColor = 'border-green-500';
            avatar = 'SYS';
        } else {
            bgColor = 'bg-blue-50';
            avatarBg = 'bg-blue-500';
            borderColor = 'border-blue-500';
            avatar = 'AI';
        }
        
        messageElement.innerHTML = `
            <div class="${bgColor} p-4 rounded-lg border-l-4 ${borderColor}">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-white text-xs font-medium">
                        ${avatar}
                    </div>
                    <div class="flex-1">
                        <p class="text-gray-800 whitespace-pre-wrap break-words">${this.escapeHtml(content)}</p>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    new ConsoleApp();
});