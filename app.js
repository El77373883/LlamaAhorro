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
    createParticles();
    createCoinsRain();
    updateStreak();
}

// Crear partículas de fondo
function createParticles() {
    const container = document.getElementById('particles');
    const particleEmojis = ['💰', '💵', '💎', '✨', '🪙', '💲'];
    
    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 8000);
    }, 2000);
}

// Crear lluvia de monedas en el balance
function createCoinsRain() {
    const container = document.getElementById('coinsRain');
    
    setInterval(() => {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = '🪙';
        coin.style.left = Math.random() * 100 + '%';
        coin.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(coin);
        
        setTimeout(() => coin.remove(), 6000);
    }, 3000);
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
    const element = document.getElementById('totalSavings');
    element.textContent = `$${total.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// Cambiar tabs
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-premium').forEach(t => t.classList.remove('active'));
    const tabs = document.querySelectorAll('.tab-premium');
    if (tab === 'goals') tabs[0].classList.add('active');
    else if (tab === 'history') tabs[1].classList.add('active');
    else tabs[2].classList.add('active');
    
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
            <div class="empty-state">
                <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHh4eHh4eHh4eA/3o6Zt481isNVuQI1l6/giphy.gif" 
                     class="empty-state-gif" 
                     alt="Alcancía"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><rect fill=%22%23FFD700%22 width=%22120%22 height=%22120%22 rx=%2220%22/><text x=%2260%22 y=%2280%22 font-size=%2260%22 text-anchor=%22middle%22>🐷</text></svg>'">
                <h3 class="empty-state-title">¡Sin metas aún!</h3>
                <p class="empty-state-text">Crea tu primera meta y comienza a ahorrar como un PRO</p>
                <button class="btn-calculate-premium" onclick="openNewGoal()">🚀 Crear Meta</button>
            </div>
        `;
        return;
    }

    container.innerHTML = goals.map(goal => {
        const progress = (goal.saved / goal.amount) * 100;
        const circumference = 2 * Math.PI * 55;
        const offset = circumference - (progress / 100) * circumference;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const weeklyNeeded = calculateWeekly(goal);
        
        return `
            <div class="goal-ultra">
                <div class="goal-ultra-header">
                    <div class="goal-emoji-container">${goal.emoji}</div>
                    <div>
                        <div class="goal-name-pro">${goal.name}</div>
                        <div class="goal-meta-pro">Meta: $${goal.amount.toLocaleString()}</div>
                    </div>
                    <div style="margin-left:auto;">
                        <span style="background: ${progress >= 100 ? 'rgba(0,255,136,0.2)' : 'rgba(255,215,0,0.2)'}; 
                                     padding:6px 14px; 
                                     border-radius:20px; 
                                     font-size:14px; 
                                     font-weight:800;
                                     color: ${progress >= 100 ? '#00FF88' : '#FFD700'};">
                            ${progress >= 100 ? '🎉' : ''} ${progress.toFixed(1)}%
                        </span>
                    </div>
                </div>
                
                <div class="progress-ring-container">
                    <svg class="progress-ring" viewBox="0 0 120 120">
                        <circle class="progress-ring-bg" cx="60" cy="60" r="55"/>
                        <circle class="progress-ring-fill" cx="60" cy="60" r="55"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"/>
                    </svg>
                    <div class="progress-center-text">${Math.round(progress)}%</div>
                </div>
                
                <div class="stats-grid-pro">
                    <div class="stat-pro">
                        <div class="stat-pro-label">💰 Ahorrado</div>
                        <div class="stat-pro-value">$${goal.saved.toLocaleString()}</div>
                    </div>
                    <div class="stat-pro">
                        <div class="stat-pro-label">🎯 Restante</div>
                        <div class="stat-pro-value">$${(goal.amount - goal.saved).toLocaleString()}</div>
                    </div>
                    <div class="stat-pro">
                        <div class="stat-pro-label">📅 Por Semana</div>
                        <div class="stat-pro-value">$${weeklyNeeded.toLocaleString()}</div>
                    </div>
                    <div class="stat-pro">
                        <div class="stat-pro-label">⏰ Días</div>
                        <div class="stat-pro-value">${daysLeft > 0 ? daysLeft : '✅'}</div>
                    </div>
                </div>
                
                <div class="goal-actions-pro">
                    <button class="btn-premium btn-save" onclick="addToGoal(${goal.id})">💰 Depositar</button>
                    <button class="btn-premium btn-withdraw-premium" onclick="withdrawFromGoal(${goal.id})">💸 Retirar</button>
                    <button class="btn-premium btn-edit-premium" onclick="editGoal(${goal.id})">✏️</button>
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
            <div class="empty-state">
                <div class="empty-state-gif" style="font-size:100px;">📊</div>
                <h3 class="empty-state-title">Sin movimientos</h3>
                <p class="empty-state-text">Tus transacciones aparecerán aquí</p>
            </div>
        `;
        return;
    }

    const sortedTx = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedTx.map(tx => {
        const goal = goals.find(g => g.id === tx.goalId);
        const isDeposit = tx.type === 'add';
        
        return `
            <div class="history-item-premium">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="history-icon-circle ${isDeposit ? 'deposit' : 'withdraw'}">
                        ${isDeposit ? '💰' : '💸'}
                    </div>
                    <div>
                        <div style="font-weight:700; font-size:16px;">${isDeposit ? 'Depósito' : 'Retiro'}</div>
                        <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                            ${new Date(tx.date).toLocaleDateString('es-MX', {year:'numeric', month:'long', day:'numeric'})}
                        </div>
                        <div style="font-size:12px; color:var(--text-secondary);">
                            ${goal ? goal.emoji + ' ' + goal.name : 'Sin meta'}
                        </div>
                    </div>
                </div>
                <div style="font-size:24px; font-weight:800; color: ${isDeposit ? '#00FF88' : '#FF4500'};">
                    ${isDeposit ? '+' : '-'}$${tx.amount.toLocaleString()}
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
        { 
            icon: '🌟', 
            name: 'Primer Depósito', 
            desc: 'Haz tu primer ahorro',
            unlocked: allTransactions.length > 0,
            gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHh4eHh4eHh4eA/3o6Zt481isNVuQI1l6/giphy.gif'
        },
        { 
            icon: '💎', 
            name: 'Milly', 
            desc: 'Ahorra $1,000',
            unlocked: totalSaved >= 1000,
            gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHh4eHh4eHh4eA/3o6Zt481isNVuQI1l6/giphy.gif'
        },
        { 
            icon: '🏆', 
            name: 'Meta Cumplida', 
            desc: 'Completa una meta',
            unlocked: completedGoals > 0,
            gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHh4eHh4eHh4eA/3o6Zt481isNVuQI1l6/giphy.gif'
        },
        { 
            icon: '🔥', 
            name: 'En Racha', 
            desc: '7 días ahorrando',
            unlocked: true,
            gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHh4eHh4eHh4eA/xT9DPldJHzZKtORo3C/giphy.gif'
        },
        { 
            icon: '👑', 
            name: 'Ahorrador Pro', 
            desc: 'Ahorra $10,000',
            unlocked: totalSaved >= 10000,
            gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHh4eHh4eHh4eA/3o6Zt481isNVuQI1l6/giphy.gif'
        },
        { 
            icon: '🎯', 
            name: 'Multimetas', 
            desc: '3 metas activas',
            unlocked: goals.length >= 3,
            gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHh4eHh4eHh4eA/3o6Zt481isNVuQI1l6/giphy.gif'
        }
    ];
    
    document.getElementById('achievementsContainer').innerHTML = achievements.map(a => `
        <div class="achievement-premium ${a.unlocked ? 'unlocked' : ''}" style="opacity: ${a.unlocked ? 1 : 0.4};">
            <img src="${a.unlocked ? a.gif : ''}" 
                 class="achievement-gif" 
                 alt="${a.name}"
                 onerror="this.outerHTML='<div style=%22font-size:60px;%22>${a.unlocked ? a.icon : '🔒'}</div>'">
            <div style="font-size: ${a.unlocked ? '24px' : '60px'}; min-height:60px;">
                ${!a.unlocked ? '🔒' : ''}
            </div>
            <div style="font-weight:700; font-size:14px;">${a.name}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${a.desc}</div>
            <div style="font-size:11px; margin-top:4px; color: ${a.unlocked ? '#FFD700' : '#666'};">
                ${a.unlocked ? '✅ Desbloqueado' : '🔒 Bloqueado'}
            </div>
        </div>
    `).join('');
}

// Configurar emoji picker
function setupEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;
    
    picker.innerHTML = emojis.map(e => `
        <div onclick="selectEmoji('${e}')" 
             style="width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; 
                    font-size:28px; cursor:pointer; transition:all 0.3s;
                    background: ${e === selectedEmoji ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)'}; 
                    border: 2px solid ${e === selectedEmoji ? '#FFD700' : 'var(--border-color)'};">
            ${e}
        </div>
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
    resultDiv.style.background = 'rgba(255,215,0,0.05)';
    resultDiv.style.border = '1px solid rgba(255,215,0,0.2)';
    resultDiv.style.borderRadius = '16px';
    resultDiv.style.padding = '16px';
    resultDiv.style.marginTop = '16px';
    resultDiv.innerHTML = `
        <div style="font-weight:800; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span>📊</span> Plan de Ahorro
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:var(--text-secondary);">🎯 Meta</span>
            <span style="font-weight:700;">$${amount.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:var(--text-secondary);">📅 Días</span>
            <span style="font-weight:700;">${daysLeft} días</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:var(--text-secondary);">☀️ Diario</span>
            <span style="font-weight:700; color:#FFD700;">$${daily.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:var(--text-secondary);">📆 Semanal</span>
            <span style="font-weight:700; color:#FFD700;">$${weekly.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0;">
            <span style="color:var(--text-secondary);">📅 Mensual</span>
            <span style="font-weight:700; color:#FFD700;">$${monthly.toLocaleString()}</span>
        </div>
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

    const updatedGoal = await db.getGoal(goalId);
    if (updatedGoal.saved >= updatedGoal.amount) {
        setTimeout(() => alert(`🎉 ¡Felicidades! ¡Completaste: ${updatedGoal.name}!`), 500);
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

// Modales
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
    const streak = localStorage.getItem('streak') || 15;
    document.getElementById('streakNumber').textContent = streak;
}

// Iniciar
document.addEventListener('DOMContentLoaded', init);