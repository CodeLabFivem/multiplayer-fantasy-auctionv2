const socket = io();

const AntiSpam = {
    actions: {},
    canPerform(action, cooldown = 1000) {
        const now = Date.now();
        const lastAction = this.actions[action] || 0;
        if (now - lastAction < cooldown) return false;
        this.actions[action] = now;
        return true;
    }
};

const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('toast-active'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-active');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

const CacheManager = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {}
    },
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },
    clear() {
        localStorage.clear();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const auctionView = document.getElementById('auction-view');
    const adminView = document.getElementById('admin-view');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    
    const adminCheckbox = document.getElementById('admin-checkbox');
    const adminCodeGroup = document.getElementById('admin-code-group');
    const auctionStateEl = document.getElementById('auction-state');
    const userTeamEl = document.getElementById('user-team');
    const userPurseEl = document.getElementById('user-purse');
    const currentPlayerDisplay = document.getElementById('current-player-display');
    const timerEl = document.getElementById('timer');
    const highestBidderEl = document.getElementById('highest-bidder');
    const highestBidEl = document.getElementById('highest-bid');
    const bidHistoryContainer = document.getElementById('bid-history-container');
    const nextPlayersList = document.getElementById('next-players-list');
    const teamList = document.getElementById('team-list');
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const teamPlayersList = document.getElementById('team-players-list');
    
    const startAuctionBtn = document.getElementById('start-auction-btn');
    const pauseAuctionBtn = document.getElementById('pause-auction-btn');
    const nextPlayerBtn = document.getElementById('next-player-btn');
    const soldPlayerBtn = document.getElementById('sold-player-btn');
    const unsoldPlayerBtn = document.getElementById('unsold-player-btn');
    const playerIndexInput = document.getElementById('player-index');
    
    const bidButtons = document.querySelectorAll('.bid-btn');
    
    let currentUser = CacheManager.load('currentUser');
    
    if (currentUser) {
        document.getElementById('username').value = currentUser.username;
    }
    
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });
    
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
    });
    
    adminCheckbox.addEventListener('change', () => {
        adminCodeGroup.style.display = adminCheckbox.checked ? 'block' : 'none';
    });
    
    registerBtn.addEventListener('click', () => {
        if (!AntiSpam.canPerform('register', 2000)) {
            Toast.show('Please wait before registering', 'error');
            return;
        }
        
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const startingPurse = parseInt(document.getElementById('starting-purse').value) || 1000000000;
        const isAdmin = adminCheckbox.checked;
        const adminCode = document.getElementById('admin-code').value;
        
        if (!username || !password) {
            Toast.show('Please enter username and password', 'error');
            return;
        }
        
        if (password.length < 4) {
            Toast.show('Password must be at least 4 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            Toast.show('Passwords do not match', 'error');
            return;
        }
        
        socket.emit('register', { username, password, startingPurse, isAdmin, adminCode }, (response) => {
            if (response.success) {
                Toast.show('Registration successful!', 'success');
                document.getElementById('new-username').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                document.getElementById('admin-code').value = '';
                adminCheckbox.checked = false;
                adminCodeGroup.style.display = 'none';
                registerView.style.display = 'none';
                loginView.style.display = 'block';
            } else {
                Toast.show(response.message || 'Registration failed', 'error');
            }
        });
    });
    
    loginBtn.addEventListener('click', () => {
        if (!AntiSpam.canPerform('login', 1000)) {
            Toast.show('Please wait before logging in', 'error');
            return;
        }
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            Toast.show('Please enter username and password', 'error');
            return;
        }
        
        socket.emit('login', { username, password }, (response) => {
            if (response.success) {
                currentUser = {
                    username,
                    isAdmin: response.isAdmin,
                    purse: response.purse,
                    players: response.players
                };
                
                CacheManager.save('currentUser', { username });
                
                userTeamEl.textContent = username;
                userPurseEl.textContent = formatCurrency(response.purse);
                updateTeamPlayers(response.players);
                
                loginView.style.display = 'none';
                auctionView.style.display = 'block';
                
                if (response.isAdmin) {
                    adminView.style.display = 'block';
                }
                
                if (response.auctionState) {
                    handleAuctionState(response.auctionState);
                }
                
                Toast.show(`Welcome, ${username}!`, 'success');
            } else {
                Toast.show(response.message || 'Login failed', 'error');
            }
        });
    });
    
    logoutBtn.addEventListener('click', () => {
        CacheManager.clear();
        location.reload();
    });
    
    clearCacheBtn.addEventListener('click', () => {
        if (confirm('Clear all cache data?')) {
            CacheManager.clear();
            location.reload();
        }
    });
    
    startAuctionBtn?.addEventListener('click', () => {
        socket.emit('startAuction', {}, (response) => {
            if (!response.success) {
                Toast.show(response.message || 'Failed to start auction', 'error');
            }
        });
    });
    
    pauseAuctionBtn?.addEventListener('click', () => {
        socket.emit('pauseAuction', {}, (response) => {
            if (!response.success) {
                Toast.show(response.message || 'Failed to pause auction', 'error');
            }
        });
    });
    
    nextPlayerBtn?.addEventListener('click', () => {
        const playerIndex = playerIndexInput.value ? parseInt(playerIndexInput.value) : undefined;
        socket.emit('nextPlayer', { playerIndex }, (response) => {
            if (!response.success) {
                Toast.show(response.message || 'Failed to move to next player', 'error');
            }
            playerIndexInput.value = '';
        });
    });
    
    soldPlayerBtn?.addEventListener('click', () => {
        socket.emit('markAsSold', {}, (response) => {
            if (!response.success) {
                Toast.show(response.message || 'Failed to mark as sold', 'error');
            }
        });
    });
    
    unsoldPlayerBtn?.addEventListener('click', () => {
        socket.emit('markAsUnsold', {}, (response) => {
            if (!response.success) {
                Toast.show(response.message || 'Failed to mark as unsold', 'error');
            }
        });
    });
    
    bidButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!AntiSpam.canPerform('bid', 500)) {
                Toast.show('Wait before bidding again', 'error');
                return;
            }
            
            const increment = parseInt(button.getAttribute('data-increment'));
            
            socket.emit('placeBid', { increment }, (response) => {
                if (!response.success) {
                    Toast.show(response.message || 'Failed to place bid', 'error');
                } else {
                    Toast.show('Bid placed!', 'success');
                }
            });
        });
    });
    
    sendMessageBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    function sendChatMessage() {
        if (!AntiSpam.canPerform('chat', 1000)) {
            Toast.show('Wait before sending another message', 'error');
            return;
        }
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        socket.emit('chatMessage', { message });
        chatInput.value = '';
    }
    
    socket.on('auctionUpdate', (data) => {
        auctionStateEl.textContent = data.status.toUpperCase();
        if (data.message) {
            addChatMessage('System', data.message);
        }
    });
    
    socket.on('playerUpdate', (data) => {
        if (data.currentPlayer) {
            updateCurrentPlayer(data.currentPlayer);
        }
        if (data.nextPlayers) {
            updateNextPlayers(data.nextPlayers);
        }
        highestBidderEl.textContent = 'Waiting for bids';
        highestBidEl.textContent = formatCurrency(0);
        bidHistoryContainer.innerHTML = '<div class="empty-message">No bids yet</div>';
    });
    
    socket.on('bidUpdate', (data) => {
        highestBidderEl.textContent = data.bidder;
        highestBidEl.textContent = formatCurrency(data.amount);
        
        if (bidHistoryContainer.querySelector('.empty-message')) {
            bidHistoryContainer.innerHTML = '';
        }
        
        const item = document.createElement('div');
        item.className = 'bid-history-item';
        item.innerHTML = `
            <span class="bid-team">${data.bidder}</span>
            <span class="bid-amount">${formatCurrency(data.amount)}</span>
        `;
        bidHistoryContainer.prepend(item);
    });
    
    socket.on('timerUpdate', (data) => {
        const minutes = Math.floor(data.timer / 60);
        const seconds = data.timer % 60;
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerEl.style.color = data.timer <= 10 ? 'red' : '';
    });
    
    socket.on('teamUpdate', (data) => {
        if (data.purse !== undefined) {
            currentUser.purse = data.purse;
            userPurseEl.textContent = formatCurrency(data.purse);
        }
        if (data.players) {
            currentUser.players = data.players;
            updateTeamPlayers(data.players);
        }
    });
    
    socket.on('teamListUpdate', (data) => {
        if (data.teams && data.teams.length > 0) {
            teamList.innerHTML = '';
            data.teams.forEach(team => {
                const item = document.createElement('div');
                item.className = 'team-item';
                if (team.name === currentUser?.username) {
                    item.classList.add('current-user');
                }
                item.innerHTML = `
                    <div class="team-name">${team.name} ${team.isAdmin ? '(Admin)' : ''}</div>
                    <div class="team-info">
                        <div>Purse: ${formatCurrency(team.purse)}</div>
                        <div>Players: ${team.playerCount}</div>
                    </div>
                `;
                teamList.appendChild(item);
            });
        }
    });
    
    socket.on('playerSold', (data) => {
        addChatMessage('System', `${data.player.name} sold to ${data.team} for ${formatCurrency(data.amount)}`);
    });
    
    socket.on('playerUnsold', (data) => {
        addChatMessage('System', `${data.player.name} remains unsold`);
    });
    
    socket.on('newChatMessage', (data) => {
        addChatMessage(data.team, data.message);
    });
    
    function handleAuctionState(state) {
        auctionStateEl.textContent = state.status.toUpperCase();
        if (state.currentPlayer) updateCurrentPlayer(state.currentPlayer);
        if (state.nextPlayers) updateNextPlayers(state.nextPlayers);
        if (state.highestBid) {
            highestBidEl.textContent = formatCurrency(state.highestBid);
            highestBidderEl.textContent = state.highestBidder || 'Waiting for bids';
        }
        if (state.timer !== undefined) {
            const minutes = Math.floor(state.timer / 60);
            const seconds = state.timer % 60;
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    function updateCurrentPlayer(player) {
        currentPlayerDisplay.innerHTML = `
            <div class="player-card">
                <div class="player-info">
                    <h3>${player.name}</h3>
                    <div class="player-type">${player.category}</div>
                    <div class="base-price">Base: ${formatCurrency(player.basePrice)}</div>
                </div>
            </div>
        `;
    }
    
    function updateNextPlayers(players) {
        if (players.length === 0) {
            nextPlayersList.innerHTML = '<div class="empty-message">No players in queue</div>';
            return;
        }
        nextPlayersList.innerHTML = '';
        players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'next-player-item';
            item.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="player-type">${player.category}</div>
                <div class="base-price">${formatCurrency(player.basePrice)}</div>
            `;
            nextPlayersList.appendChild(item);
        });
    }
    
    function updateTeamPlayers(players) {
        if (!players || players.length === 0) {
            teamPlayersList.innerHTML = '<div class="empty-message">No players purchased yet</div>';
            return;
        }
        teamPlayersList.innerHTML = '';
        players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'team-player-item';
            item.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="player-type">${player.category}</div>
                <div class="purchase-price">Purchased: ${formatCurrency(player.soldFor)}</div>
            `;
            teamPlayersList.appendChild(item);
        });
    }
    
    function addChatMessage(sender, message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message';
        if (sender === currentUser?.username) messageEl.classList.add('own-message');
        if (sender === 'System' || sender === 'Admin') messageEl.classList.add('system-message');
        messageEl.innerHTML = `<span>${sender}:</span> ${message}`;
        chatBox.appendChild(messageEl);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
});
