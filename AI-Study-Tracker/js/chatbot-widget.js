/**
 * AI Study Tracker - Floating Chatbot Widget
 */

(function() {
    // Create widget HTML structure
    const widgetHtml = `
    <div id="chatbot-widget-container">
        <button id="chatbot-trigger" title="AI Assistant">🤖</button>
        <div id="chatbot-window">
            <div id="chatbot-header">
                <h3><span>🤖</span> AI Study Assistant</h3>
                <span id="chatbot-close">&times;</span>
            </div>
            <div id="chatbot-messages">
                <div class="widget-msg bot">
                    Hi! I'm your AI Study Assistant. Ask me anything about your progress or for study tips!
                </div>
            </div>
            <div id="widget-typing" class="widget-typing" style="padding: 0 20px; color: #3b82f6;">AI is thinking...</div>
            <form id="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Type a message..." autocomplete="off">
                <button type="submit" id="chatbot-send">Send</button>
            </form>
        </div>
    </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', widgetHtml);

    // Elements
    const container = document.getElementById('chatbot-widget-container');
    const trigger = document.getElementById('chatbot-trigger');
    const windowEl = document.getElementById('chatbot-window');
    const header = document.getElementById('chatbot-header');
    const closeBtn = document.getElementById('chatbot-close');
    const form = document.getElementById('chatbot-input-area');
    const input = document.getElementById('chatbot-input');
    const messagesSection = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('widget-typing');

    // Dragging Logic
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target === closeBtn) return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, container);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    // Toggle window
    trigger.addEventListener('click', () => {
        const isVisible = windowEl.style.display === 'flex';
        windowEl.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) input.focus();
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('closing');
        setTimeout(() => {
            windowEl.style.display = 'none';
            windowEl.classList.remove('closing');
        }, 300);
    });

    // Handle messaging
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        addMessage(query, 'user');
        input.value = '';
        
        typingIndicator.style.display = 'block';
        messagesSection.scrollTop = messagesSection.scrollHeight;

        try {
            // Using absolute URL for backend to work from any page
            const response = await fetch('http://localhost:5000/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            typingIndicator.style.display = 'none';

            if (data.answer) {
                addMessage(data.answer, 'bot');
            } else {
                addMessage("I'm sorry, I couldn't process that. Please try again.", 'bot');
            }
        } catch (err) {
            console.error(err);
            typingIndicator.style.display = 'none';
            addMessage("⚠️ Backend connection error. Is the server running?", 'bot');
        }
    });

    function addMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `widget-msg ${type}`;
        msgDiv.textContent = text;
        messagesSection.appendChild(msgDiv);
        messagesSection.scrollTop = messagesSection.scrollHeight;
    }
})();
