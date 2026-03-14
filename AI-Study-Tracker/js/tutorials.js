let currentSubject = 'html';
let currentLessonIndex = 0;
let tutorialsIndex = null;
let subjectCache = {};

document.addEventListener('DOMContentLoaded', () => {
    initTutorials();
});

async function initTutorials() {
    if (window.location.protocol === 'file:') {
        console.error('Fetch API is blocked on file:// protocol. Use a local server.');
        const serverUrl = 'http://localhost:5000/ai/tutorials.html';
        document.getElementById('topicContent').innerHTML = `
            <div class="setup-notice">
                <div class="setup-icon">🌐</div>
                <h3>Server Setup Required</h3>
                <p>To enable scalable tutorials and W3Schools integration, this module requires the backend server.</p>
                <div class="setup-steps">
                    <div class="step">
                        <span class="step-num">1</span>
                        <p>Ensure your backend is running (<code>python backend/app.py</code>)</p>
                    </div>
                    <div class="step">
                        <span class="step-num">2</span>
                        <p>Click the button below to launch via the server</p>
                    </div>
                </div>
                <button onclick="window.location.href='${serverUrl}'" class="btn btn-primary btn-lg launch-btn">
                    Launch Tutorials via Server ❯
                </button>
                <div class="url-hint">Manual link: <code>${serverUrl}</code></div>
            </div>`;
        return;
    }

    try {
        // Load index
        const response = await fetch('../data/tutorials/index.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        tutorialsIndex = await response.json();
        
        // Generate subject navigation
        generateSubjectBar();

        // Content navigation
        document.getElementById('prevBtn').addEventListener('click', () => navigateLesson(-1));
        document.getElementById('nextBtn').addEventListener('click', () => navigateLesson(1));

        // Load initial subject
        loadSubject('html');
    } catch (error) {
        console.error('Failed to initialize tutorials:', error);
        document.getElementById('topicContent').innerHTML = `
            <div class="alert alert-danger">
                <h4>❌ Error Loading Tutorials</h4>
                <p>We encountered an error while fetching the tutorial data. Please ensure the server is running and refresh the page.</p>
                <p><small>${error.message}</small></p>
            </div>`;
    }
}

function generateSubjectBar() {
    const subjectBar = document.querySelector('.subject-bar');
    if (!subjectBar || !tutorialsIndex) return;

    subjectBar.innerHTML = '';
    tutorialsIndex.subjects.forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'subj-btn' + (subject.id === currentSubject ? ' active' : '');
        btn.dataset.subject = subject.id;
        btn.textContent = subject.title;
        btn.onclick = () => {
            document.querySelectorAll('.subj-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadSubject(subject.id);
        };
        subjectBar.appendChild(btn);
    });
}

async function loadSubject(subjectId) {
    currentSubject = subjectId;
    currentLessonIndex = 0;
    
    let data = subjectCache[subjectId];
    
    if (!data) {
        const subjectMeta = tutorialsIndex.subjects.find(s => s.id === subjectId);
        if (subjectMeta) {
            try {
                const response = await fetch(`../data/tutorials/${subjectMeta.file}`);
                data = await response.json();
                subjectCache[subjectId] = data;
            } catch (error) {
                console.error(`Failed to load subject ${subjectId}:`, error);
                data = { title: "Error Loading Tutorial", lessons: [] };
            }
        } else {
            data = { title: "Tutorial Not Found", lessons: [] };
        }
    }
    
    document.getElementById('subjectHeader').textContent = data.title;
    
    // Build topics list
    const topicsList = document.getElementById('topicsList');
    topicsList.innerHTML = '';
    
    data.lessons.forEach((lesson, index) => {
        const item = document.createElement('div');
        item.className = 'topic-item' + (index === 0 ? ' active' : '');
        item.textContent = lesson.title;
        item.onclick = () => loadLesson(index);
        topicsList.appendChild(item);
    });

    if (data.lessons.length > 0) {
        loadLesson(0);
    } else {
        document.getElementById('topicTitle').textContent = "Coming Soon";
        document.getElementById('topicContent').innerHTML = "<p>Tutorial content for this subject is being prepared.</p>";
    }
}

function loadLesson(index) {
    currentLessonIndex = index;
    const data = subjectCache[currentSubject];
    if (!data) return;

    const lessons = data.lessons;
    const lesson = lessons[index];

    // Update topics sidebar active state
    const items = document.querySelectorAll('.topic-item');
    items.forEach((item, idx) => {
        if (idx === index) item.classList.add('active');
        else item.classList.remove('active');
    });

    // Update main content
    document.getElementById('topicTitle').textContent = lesson.title;
    document.getElementById('topicContent').innerHTML = lesson.content;

    // Update nav buttons visibility/text
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (index === 0) {
        prevBtn.textContent = "❮ Home";
    } else {
        prevBtn.textContent = "❮ Previous";
    }

    if (index === lessons.length - 1) {
        nextBtn.textContent = "Take Assessment ❯";
        nextBtn.className = "btn btn-success btn-sm";
        nextBtn.onclick = () => loadAssessment();
    } else {
        nextBtn.textContent = "Next ❯";
        nextBtn.className = "btn btn-primary btn-sm";
        nextBtn.onclick = () => navigateLesson(1);
    }
}

// ── Assessment Engine ────────────────────────────────────────────────────────
let quizState = {
    currentIndex: 0,
    score: 0,
    times: [],
    startTime: 0
};

function loadAssessment() {
    const data = subjectCache[currentSubject];
    if (!data || !data.quiz) {
        alert("Assessment for this subject is coming soon!");
        return;
    }

    // Reset state
    quizState = { currentIndex: 0, score: 0, times: [], startTime: Date.now() };

    // Hide sidebar and update UI for quiz mode
    document.getElementById('topicTitle').textContent = `${data.title} - Final Assessment`;
    renderQuestion();
}

function renderQuestion() {
    const data = subjectCache[currentSubject];
    const question = data.quiz[quizState.currentIndex];
    
    quizState.startTime = Date.now(); // Start timer for this question

    let html = `
        <div class="assessment-card">
            <div class="quiz-progress">Question ${quizState.currentIndex + 1} of ${data.quiz.length}</div>
            <div class="quiz-question">${question.question}</div>
            <div class="quiz-options">
    `;

    question.options.forEach((opt, idx) => {
        html += `
            <button class="quiz-opt-btn" onclick="handleAnswer(${idx})">
                ${opt}
            </button>
        `;
    });

    html += `</div></div>`;
    document.getElementById('topicContent').innerHTML = html;
    
    // Hide navigation buttons during quiz
    document.querySelector('.content-nav').style.display = 'none';
}

function handleAnswer(choiceIdx) {
    const data = subjectCache[currentSubject];
    const question = data.quiz[quizState.currentIndex];
    const timeTaken = (Date.now() - quizState.startTime) / 1000;
    
    quizState.times.push(timeTaken);
    if (choiceIdx === question.answer) {
        quizState.score++;
    }

    quizState.currentIndex++;
    if (quizState.currentIndex < data.quiz.length) {
        renderQuestion();
    } else {
        submitResults();
    }
}

async function submitResults() {
    document.getElementById('topicContent').innerHTML = `
        <div class="loading-results">
            <div class="spinner"></div>
            <p>Analyzing your performance and predicting readiness...</p>
        </div>`;

    try {
        const response = await fetch('/submit_assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: currentSubject,
                score: quizState.score,
                total: subjectCache[currentSubject].quiz.length,
                time_per_question: quizState.times
            })
        });

        const result = await response.json();
        displayResult(result);
    } catch (error) {
        console.error('Submission failed:', error);
        alert('Failed to submit results. Please try again.');
    }
}

function displayResult(result) {
    const isReady = result.status.includes('Ready');
    document.getElementById('topicContent').innerHTML = `
        <div class="result-card ${isReady ? 'ready' : 'needs-improvement'}">
            <div class="result-header">
                <span class="result-icon">${isReady ? '🎉' : '📚'}</span>
                <h3>${result.status}</h3>
            </div>
            <div class="result-stats">
                <div class="stat">
                    <span class="label">Score</span>
                    <span class="val">${result.percentage}%</span>
                </div>
                <div class="stat">
                    <span class="label">Avg Speed</span>
                    <span class="val">${result.avg_time}s</span>
                </div>
            </div>
            <p class="result-advice">${result.advice}</p>
            <button onclick="location.reload()" class="btn btn-primary mt-3">Back to Tutorials</button>
        </div>`;
    
    // Keep nav hidden or show Home
    document.querySelector('.content-nav').style.display = 'none';
    document.getElementById('topicTitle').textContent = "Assessment Results";
}

function navigateLesson(direction) {
    const data = subjectCache[currentSubject];
    if (!data) return;

    const lessons = data.lessons;
    let nextIndex = currentLessonIndex + direction;
    
    if (nextIndex >= 0 && nextIndex < lessons.length) {
        loadLesson(nextIndex);
    }
}
