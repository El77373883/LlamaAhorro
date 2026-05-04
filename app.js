// Estado global
let currentTab = 'goals';
let selectedEmoji = '🏍️';
let calculatedPlan = null;
let goals = [];
let allTransactions = [];

// Emojis disponibles
const emojis = ['🏍️', '🚗', '🏠', '✈️', '🎓', '💻', '📱', '🎮', '🎸', '💍', '🏖️', '📚', '🐶', '🎨', '🏋️', '💼'];

// Inicializar app
async function init() {
    await db.init();
    await loadData();
    renderAll();
    setupEmojiPicker();
    setupServiceWorker();
    updateStreak();
}

// Cargar datos
async function loadData() {
    goals = await db.getGoals();
    allTransactions = await db.getTransactions();
    updateTotalSavings();
}

// Service Worker
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW registrado'))
            .catch(err => console.log('Error SW:', err));
    }
}

// Actualizar total ahorrado
async function updateTotalSavings() {
    const total = await db.getTotalSavings();
    document.getElementById('totalSavings').textContent = `$${total.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// Cambiar tabs
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab:nth-child(${tab === 'goals' ? 1 : tab === 'history' ? 2 : 3})`).classList.add('active');
    
    document.getElementById('goalsContainer').style.display = tab === 'goals' ? 'block' : 'none';
    document.getElementById('historyContainer').style.display = tab === 'history' ? 'block' : 'none';
    document.getElementById('achievementsContainer').style.display = tab === 'achievements' ? 'block' : 'none';
    
    renderAll();
}

// Renderizar todo
async function renderAll() {
    switch(currentTab) {
        case 'goals':
            renderGoals();
            break;
        case 'history':
            renderHistory();
            break;
        case 'achievements':
            renderAchievements();
            break;
    }
}

// Renderizar metas
function renderGoals() {
    const container = document.getElementById('goalsContainer');
    
    if (goals.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 60px 20px;">
                <div style="font-size: 80px; margin-bottom: 20px;">🎯</div>
                <h3 style="margin-bottom: 12px;">No tienes metas aún</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">Crea tu primera meta de ahorro y comienza a ahorrar</p>
                <button class="calculate-btn" onclick="openNewGoal()">✨ Crear mi primera meta</button>
            </div>
        `;
        return;
    }

    container.innerHTML = goals.map(goal => {
        const progress = (goal.saved / goal.amount) * 100;
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (progress / 100) * circumference;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const weeklyNeeded = calculateWeekly(goal);
        
        return `
            <div class="goal-card-pro">
                <div class="goal-header">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span class="goal-icon-large">${goal.emoji}</span>
                        <div>
                            <div class="goal-title">${goal.name}</div>
                            <div class="goal-target">Meta: $${goal.amount.toLocaleString()}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span style="background: ${progress >= 100 ? '#10B981' : '#4A6CF7'}; padding:4px 12px; border-radius:20px; font-size:14px; font-weight:700;">
                            ${progress.toFixed(1)}%
                        </span>
                    </div>
                </div>
                
                <div class="progress-circle-container">
                    <svg class="circular-progress" viewBox="0 0 120 120">
                        <circle class="circular-bg" cx="60" cy="60" r="54"></circle>
                        <circle class="circular-fill" cx="60" cy="60" r="54"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            stroke="${progress >= 100 ? '#10B981' : '#4A6CF7'}">
                        </circle>
                        <text x="60" y="60" class="progress-text">${Math.round(progress)}%</text>
                    </svg>
                </div>
                
                <div class="goal-stats">
                    <div class="stat-item">
                        <div class="stat-label">AHORRADO</div>
                        <div class="stat-value">$${goal.saved.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">FALTANTE</div>
                        <div class="stat-value">$${(goal.amount - goal.saved).toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">POR SEMANA</div>
                        <div class="stat-value">$${weeklyNeeded.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">DÍAS RESTANTES</div>
                        <div class="stat-value">${daysLeft > 0 ? daysLeft : '¡Completado!'}</div>
                    </div>
                </div>
                
                <div class="goal-actions">
                    <button class="btn btn-add" onclick="addToGoal(${goal.id})">💰 Agregar</button>
                    <button class="btn btn-withdraw" onclick="withdrawFromGoal(${goal.id})">💸 Retirar</button>
                    <button class="btn btn-edit" onclick="editGoal(${goal.id})">✏️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Calcular ahorro semanal necesario
function calculateWeekly(goal) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const weeksLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 7));
    const remaining = goal.amount - goal.saved;
    return weeksLeft > 0 ? Math.ceil(remaining / weeksLeft) : remaining;
}

// Renderizar historial
async function renderHistory() {
    const container = document.getElementById('historyContainer');
    const transactions = await db.getTransactions();
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 60px 20px;">
                <div style="font-size:80px;">📊</div>
                <h3>Sin movimientos</h3>
                <p style="color: var(--text-secondary);">Tus transacciones aparecerán aquí</p>
            </div>
        `;
        return;
    }

    const sortedTx = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedTx.map(tx => {
        const goal = goals.find(g => g.id === tx.goalId);
        return `
            <div class="history-item ${tx.type}">
                <div>
                    <div style="font-weight:600;">${tx.type === 'add' ? 'Depósito' : 'Retiro'}</div>
                    <div class="history-date">${new Date(tx.date).toLocaleDateString('es-MX', {year: 'numeric', month: 'long', day: 'numeric'})}</div>
                    <div style="font-size:12px; color: var(--text-secondary);">${goal ? goal.emoji + ' ' + goal.name : 'Sin meta'}</div>
                </div>
                <div class="history-amount ${tx.type}">
                    ${tx.type === 'add' ? '+' : '-'}$${tx.amount.toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar logros
function renderAchievements() {
    const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
    const completedGoals = goals.filter(g => g.saved >= g.amount).length;
    
    const achievements = [
        { icon: '🌟', name: 'Primer depósito', unlocked: allTransactions.length > 0 },
        { icon: '💎', name: '$1,000 ahorrados', unlocked: totalSaved >= 1000 },
        { icon: '🏆', name: 'Primera meta completada', unlocked: completedGoals > 0 },
        { icon: '🔥', name: 'Racha de 7 días', unlocked: true },
        { icon: '👑', name: 'Ahorrador Pro', unlocked: totalSaved >= 10000 },
        { icon: '🎯', name: '3 metas activas', unlocked: goals.length >= 3 }
    ];
    
    document.getElementById('achievementsContainer').innerHTML = achievements.map(a => `
        <div class="achievement-card" style="opacity: ${a.unlocked ? 1 : 0.5};">
            <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-status ${a.unlocked ? 'unlocked' : 'locked'}">
                ${a.unlocked ? 'Desbloqueado' : 'Bloqueado'}
            </div>
        </div>
    `).join('');
}

// Configurar emoji picker
function setupEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.innerHTML = emojis.map(e => `
        <div class="emoji-option ${e === selectedEmoji ? 'selected' : ''}" onclick="selectEmoji('${e}')">${e}</div>
    `).join('');
}

function selectEmoji(emoji) {
    selectedEmoji = emoji;
    setupEmojiPicker();
}

// Calcular plan de ahorro
function calculateSavings() {
    const name = document.getElementById('goalName').value;
    const amount = parseFloat(document.getElementById('goalAmount').value);
    const deadline = document.getElementById('goalDate').value;

    if (!name || !amount || !deadline) {
        alert('Completa todos los campos');
        return;
    }

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.ceil(daysLeft / 7);
    const monthsLeft = Math.ceil(daysLeft / 30);
    
    const daily = Math.ceil(amount / daysLeft);
    const weekly = Math.ceil(amount / weeksLeft);
    const monthly = Math.ceil(amount / monthsLeft);

    calculatedPlan = { name, amount, deadline, emoji: selectedEmoji, daily, weekly, monthly, daysLeft, weeksLeft, monthsLeft };

    const resultDiv = document.getElementById('calculationResult');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h4 style="margin-bottom:12px;">📊 Plan de ahorro calculado</h4>
        <div class="result-item"><span>🎯 Meta:</span><span>$${amount.toLocaleString()}</span></div>
        <div class="result-item"><span>📅 Fecha límite:</span><span>${new Date(deadline).toLocaleDateString()}</span></div>
        <div class="result-item"><span>⏰ Días restantes:</span><span>${daysLeft} días</span></div>
        <div class="result-item"><span>💵 Por día:</span><span>$${daily.toLocaleString()}</span></div>
        <div class="result-item"><span>📆 Por semana:</span><span>$${weekly.toLocaleString()}</span></div>
        <div class="result-item"><span>📅 Por mes:</span><span>$${monthly.toLocaleString()}</span></div>
    `;

    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('saveGoalBtn').style.display = 'block';
}

// Guardar meta
async function saveGoal() {
    if (!calculatedPlan) return;
    
    await db.addGoal({
        name: calculatedPlan.name,
        emoji: calculatedPlan.emoji,
        amount: calculatedPlan.amount,
        deadline: calculatedPlan.deadline,
        saved: 0,
        weekly: calculatedPlan.weekly
    });

    closeModal('newGoalModal');
    await loadData();
    renderAll();
    launchConfetti();
    resetNewGoalForm();
}

function resetNewGoalForm() {
    document.getElementById('goalName').value = '';
    document.getElementById('goalAmount').value = '';
    document.getElementById('goalDate').value = '';
    document.getElementById('calculationResult').style.display = 'none';
    document.getElementById('calculateBtn').style.display = 'block';
    document.getElementById('saveGoalBtn').style.display = 'none';
    calculatedPlan = null;
}

// Agregar ahorro
async function addToGoal(goalId) {
    document.getElementById('quickAddGoal').value = goalId;
    openModal('quickAddModal');
}

async function quickAdd() {
    const amount = parseFloat(document.getElementById('quickAddAmount').value);
    const goalId = parseInt(document.getElementById('quickAddGoal').value);

    if (!amount || amount <= 0) {
        alert('Ingresa una cantidad válida');
        return;
    }

    const goal = await db.getGoal(goalId);
    await db.updateGoal(goalId, { saved: goal.saved + amount });
    await db.addTransaction({ goalId, amount, type: 'add' });

    closeModal('quickAddModal');
    document.getElementById('quickAddAmount').value = '';
    await loadData();
    renderAll();

    // Verificar si completó la meta
    const updatedGoal = await db.getGoal(goalId);
    if (updatedGoal.saved >= updatedGoal.amount) {
        launchConfetti();
        setTimeout(() => alert(`¡Felicidades! Completaste la meta: ${updatedGoal.name}`), 500);
    }
}

// Retirar dinero
async function withdrawFromGoal(goalId) {
    document.getElementById('quickWithdrawGoal').value = goalId;
    openModal('quickWithdrawModal');
}

async function quickWithdraw() {
    const amount = parseFloat(document.getElementById('quickWithdrawAmount').value);
    const goalId = parseInt(document.getElementById('quickWithdrawGoal').value);

    if (!amount || amount <= 0) {
        alert('Ingresa una cantidad válida');
        return;
    }

    const goal = await db.getGoal(goalId);
    if (amount > goal.saved) {
        alert('No tienes suficiente ahorrado');
        return;
    }

    await db.updateGoal(goalId, { saved: goal.saved - amount });
    await db.addTransaction({ goalId, amount, type: 'withdraw' });

    closeModal('quickWithdrawModal');
    document.getElementById('quickWithdrawAmount').value = '';
    await loadData();
    renderAll();
}

// Funciones de modales
function openNewGoal() {
    openModal('newGoalModal');
    setupEmojiPicker();
}

function openQuickAdd() {
    const select = document.getElementById('quickAddGoal');
    select.innerHTML = goals.map(g => `<option value="${g.id}">${g.emoji} ${g.name}</option>`).join('');
    openModal('quickAddModal');
}

function openQuickWithdraw() {
    const select = document.getElementById('quickWithdrawGoal');
    select.innerHTML = goals.map(g => `<option value="${g.id}">${g.emoji} ${g.name} - $${g.saved.toLocaleString()}</option>`).join('');
    openModal('quickWithdrawModal');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Streak
function updateStreak() {
    const streak = localStorage.getItem('streak') || 1;
    document.getElementById('streakBadge').textContent = `🔥 ${streak} días`;
    // Aquí puedes implementar lógica real de streak
}

// Confetti
function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(piece);
        
        setTimeout(() => piece.remove(), 4000);
    }
}

// Iniciar
document.addEventListener('DOMContentLoaded', init);
