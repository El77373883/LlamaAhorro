class AhorroDB {
    constructor() {
        this.dbName = 'AhorroProDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Tabla de metas
                if (!db.objectStoreNames.contains('goals')) {
                    const goalsStore = db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
                    goalsStore.createIndex('name', 'name', { unique: false });
                }

                // Tabla de transacciones
                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    txStore.createIndex('goalId', 'goalId', { unique: false });
                    txStore.createIndex('type', 'type', { unique: false });
                    txStore.createIndex('date', 'date', { unique: false });
                }

                // Tabla de configuración
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async addGoal(goal) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('goals', 'readwrite');
            const store = tx.objectStore('goals');
            const request = store.add({
                ...goal,
                saved: 0,
                createdAt: new Date().toISOString(),
                completed: false
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getGoals() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('goals', 'readonly');
            const store = tx.objectStore('goals');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getGoal(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('goals', 'readonly');
            const store = tx.objectStore('goals');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateGoal(id, updates) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('goals', 'readwrite');
            const store = tx.objectStore('goals');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const goal = getRequest.result;
                Object.assign(goal, updates);
                const putRequest = store.put(goal);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async addTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('transactions', 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.add({
                ...transaction,
                date: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTransactions(goalId = null) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('transactions', 'readonly');
            const store = tx.objectStore('transactions');
            let request;

            if (goalId) {
                const index = store.index('goalId');
                request = index.getAll(goalId);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTotalSavings() {
        const goals = await this.getGoals();
        return goals.reduce((total, goal) => total + (goal.saved || 0), 0);
    }
}

// Inicializar DB global
const db = new AhorroDB();
