document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    // Login & Registration
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const adminCheckbox = document.getElementById('admin-checkbox');
    const adminCodeGroup = document.getElementById('admin-code-group');
    
    // Main Auction View
    const auctionView = document.getElementById('auction-view');
    const adminView = document.getElementById('admin-view');
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
    
    // Admin Controls
    const startAuctionBtn = document.getElementById('start-auction-btn');
    const pauseAuctionBtn = document.getElementById('pause-auction-btn');
    const nextPlayerBtn = document.getElementById('next-player-btn');
    const soldPlayerBtn = document.getElementById('sold-player-btn');
    const unsoldPlayerBtn = document.getElementById('unsold-player-btn');
    const playerIndexInput = document.getElementById('player-index');
    
    // Bid Controls
    const bidButtons = document.querySelectorAll('.bid-btn');
    
    // Socket connection
    const socket = io();
    
    // Application state
    let currentUser = {
        username: '',
        isAdmin: false,
        purse: 0,
        players: []
    };
    
    // Show/hide views
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
    
    // Toggle admin code input
    adminCheckbox.addEventListener('change', () => {
        adminCodeGroup.style.display = adminCheckbox.checked ? 'block' : 'none';
    });
    
    // Registration
    registerBtn.addEventListener('click', () => {
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const startingPurse = document.getElementById('starting-purse').value;
        const isAdmin = adminCheckbox.checked;
        const adminCode = document.getElementById('admin-code').value;
        
        // Validate inputs
        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // Register user
        socket.emit('register', {
            username,
            password,
            startingPurse,
            isAdmin,
            adminCode
        }, (response) => {
            if (response.success) {
                alert('Registration successful! Please login.');
                // Switch to login view
                registerView.style.display = 'none';
                loginView.style.display = 'block';
                
                // Clear registration form
                document.getElementById('new-username').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                document.getElementById('admin-code').value = '';
                adminCheckbox.checked = false;
                adminCodeGroup.style.display = 'none';
            } else {
                alert(response.message || 'Registration failed');
            }
        });
    });
    
    // Login
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }
        
        socket.emit('login', { username, password }, (response) => {
            if (response.success) {
                // Update client state
                currentUser = {
                    username,
                    isAdmin: response.isAdmin,
                    purse: response.purse,
                    players: response.players
                };
                
                // Update UI
                userTeamEl.textContent = username;
                updatePurseDisplay(currentUser.purse);
                updateTeamPlayers();
                
                // Show appropriate views
                loginView.style.display = 'none';
                auctionView.style.display = 'block';
                
                if (currentUser.isAdmin) {
                    adminView.style.display = 'block';
                }
                
                // Handle auction state if already running
                if (response.auctionState) {
                    handleAuctionStateUpdate(response.auctionState);
                }
            } else {
                alert(response.message || 'Login failed');
            }
        });
    });
    
    // Admin - Start Auction
    startAuctionBtn.addEventListener('click', () => {
        socket.emit('startAuction', {}, (response) => {
            if (!response.success) {
                alert(response.message || 'Failed to start auction');
            }
        });
    });
    
    // Admin - Pause Auction
    pauseAuctionBtn.addEventListener('click', () => {
        socket.emit('pauseAuction', {}, (response) => {
            if (!response.success) {
                alert(response.message || 'Failed to pause auction');
            }
        });
    });
    
    // Admin - Next Player
    nextPlayerBtn.addEventListener('click', () => {
        const playerIndex = playerIndexInput.value ? parseInt(playerIndexInput.value) : undefined;
        
        socket.emit('nextPlayer', { playerIndex }, (response) => {
            if (!response.success) {
                alert(response.message || 'Failed to move to next player');
            }
            // Clear the index input
            playerIndexInput.value = '';
        });
    });
    
    // Admin - Mark Player as Sold
    soldPlayerBtn.addEventListener('click', () => {
        socket.emit('markAsSold', {}, (response) => {
            if (!response.success) {
                alert(response.message || 'Failed to mark player as sold');
            }
        });
    });
    
    // Admin - Mark Player as Unsold
    unsoldPlayerBtn.addEventListener('click', () => {
        socket.emit('markAsUnsold', {}, (response) => {
            if (!response.success) {
                alert(response.message || 'Failed to mark player as unsold');
            }
        });
    });
    
    // Bidding
    bidButtons.forEach(button => {
        button.addEventListener('click', () => {
            const increment = parseInt(button.getAttribute('data-increment'));
            
            socket.emit('placeBid', { increment }, (response) => {
                if (!response.success) {
                    alert(response.message || 'Failed to place bid');
                }
            });
        });
    });
    
    // Chat
    sendMessageBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    function sendChatMessage() {
        const message = chatInput.value.trim();
        
        if (message) {
            socket.emit('chatMessage', { message });
            chatInput.value = '';
        }
    }
    
    // Socket event handlers
    socket.on('auctionUpdate', (data) => {
        auctionStateEl.textContent = capitalizeFirstLetter(data.status);
        
        if (data.message) {
            addChatMessage('Admin', data.message);
        }
    });
    
    socket.on('playerUpdate', (data) => {
        // Update current player display
        if (data.currentPlayer) {
            updateCurrentPlayerDisplay(data.currentPlayer);
        }
        
        // Update next players list
        if (data.nextPlayers) {
            updateNextPlayersDisplay(data.nextPlayers);
        }
        
        // Reset bid display
        highestBidderEl.textContent = 'Waiting for bids';
        highestBidEl.textContent = formatCurrency(0);
        
        // Clear bid history
        bidHistoryContainer.innerHTML = '<div class="empty-message">No bids yet</div>';
    });
    
    socket.on('bidUpdate', (data) => {
        // Update highest bid and bidder
        highestBidderEl.textContent = data.bidder;
        highestBidEl.textContent = formatCurrency(data.amount);
        
        // Add to bid history
        if (bidHistoryContainer.querySelector('.empty-message')) {
            bidHistoryContainer.innerHTML = '';
        }
        
        const bidHistoryItem = document.createElement('div');
        bidHistoryItem.classList.add('bid-history-item');
        bidHistoryItem.innerHTML = `
            <span class="bid-team">${data.bidder}</span>
            <span class="bid-amount">${formatCurrency(data.amount)}</span>
        `;
        
        bidHistoryContainer.prepend(bidHistoryItem);
        
        // Add chat notification
        addChatMessage('System', `${data.bidder} placed a bid of ${formatCurrency(data.amount)}`);
    });
    
    socket.on('timerUpdate', (data) => {
        const minutes = Math.floor(data.timer / 60);
        const seconds = data.timer % 60;
        
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Make timer red when less than 10 seconds
        if (data.timer <= 10) {
            timerEl.style.color = 'red';
        } else {
            timerEl.style.color = '';
        }
    });
    
    socket.on('teamUpdate', (data) => {
        // Update user's purse and players
        if (data.purse !== undefined) {
            currentUser.purse = data.purse;
            updatePurseDisplay(data.purse);
        }
        
        if (data.players) {
            currentUser.players = data.players;
            updateTeamPlayers();
        }
    });
    
    socket.on('teamListUpdate', (data) => {
        // Update team list
        if (data.teams && data.teams.length > 0) {
            teamList.innerHTML = '';
            
            data.teams.forEach(team => {
                const teamItem = document.createElement('div');
                teamItem.classList.add('team-item');
                
                const isCurrentUser = team.name === currentUser.username;
                if (isCurrentUser) {
                    teamItem.classList.add('current-user');
                }
                
                teamItem.innerHTML = `
                    <div class="team-name">${team.name} ${team.isAdmin ? '(Admin)' : ''}</div>
                    <div class="team-info">
                        <div>Purse: ${formatCurrency(team.purse)}</div>
                        <div>Players: ${team.playerCount}</div>
                    </div>
                `;
                
                teamList.appendChild(teamItem);
            });
        } else {
            teamList.innerHTML = '<div class="empty-message">No teams have joined yet</div>';
        }
    });
    
    socket.on('playerSold', (data) => {
        // Display sold notification
        addChatMessage('System', `${data.player.name} sold to ${data.team} for ${formatCurrency(data.amount)}`);
    });
    
    socket.on('playerUnsold', (data) => {
        // Display unsold notification
        addChatMessage('System', `${data.player.name} remains unsold`);
    });
    
    socket.on('newChatMessage', (data) => {
        addChatMessage(data.team, data.message);
    });
    
    // Helper functions
    function updateCurrentPlayerDisplay(player) {
        currentPlayerDisplay.innerHTML = `
            <div class="player-card">
                <div class="player-image">
                    <img src="${player.image || 'https://via.placeholder.com/100'}" alt="${player.name}">
                </div>
                <div class="player-info">
                    <h3>${player.name}</h3>
                    <div class="player-type">${player.type}</div>
                    <div class="base-price">Base Price: ${formatCurrency(player.basePrice)}</div>
                </div>
            </div>
        `;
    }
    
    function updateNextPlayersDisplay(players) {
        if (players && players.length > 0) {
            nextPlayersList.innerHTML = '';
            
            players.forEach(player => {
                const playerItem = document.createElement('div');
                playerItem.classList.add('next-player-item');
                
                playerItem.innerHTML = `
                    <div class="player-name">${player.name}</div>
                    <div class="player-type">${player.type}</div>
                    <div class="base-price">${formatCurrency(player.basePrice)}</div>
                `;
                
                nextPlayersList.appendChild(playerItem);
            });
        } else {
            nextPlayersList.innerHTML = '<div class="empty-message">No more players in queue</div>';
        }
    }
    
    function updateTeamPlayers() {
        if (currentUser.players && currentUser.players.length > 0) {
            teamPlayersList.innerHTML = '';
            
            currentUser.players.forEach(player => {
                const playerItem = document.createElement('div');
                playerItem.classList.add('team-player-item');
                
                playerItem.innerHTML = `
                    <div class="player-name">${player.name}</div>
                    <div class="player-type">${player.type}</div>
                    <div class="purchase-price">Purchased for: ${formatCurrency(player.soldFor)}</div>
                `;
                
                teamPlayersList.appendChild(playerItem);
            });
        } else {
            teamPlayersList.innerHTML = '<div class="empty-message">You haven\'t purchased any players yet</div>';
        }
    }
    
    function updatePurseDisplay(amount) {
        userPurseEl.textContent = formatCurrency(amount);
    }
    
    function handleAuctionStateUpdate(state) {
        // Update auction status
        auctionStateEl.textContent = capitalizeFirstLetter(state.status);
        
        // Update current player if available
        if (state.currentPlayer) {
            updateCurrentPlayerDisplay(state.currentPlayer);
        }
        
        // Update next players if available
        if (state.nextPlayers) {
            updateNextPlayersDisplay(state.nextPlayers);
        }
        
        // Update bid info if available
        if (state.highestBid) {
            highestBidEl.textContent = formatCurrency(state.highestBid);
            highestBidderEl.textContent = state.highestBidder || 'Waiting for bids';
        }
        
        // Update timer if available
        if (state.timer !== undefined) {
            const minutes = Math.floor(state.timer / 60);
            const seconds = state.timer % 60;
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    function addChatMessage(sender, message) {
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message');
        
        // Highlight messages from the current user
        if (sender === currentUser.username) {
            chatMessage.classList.add('own-message');
        }
        
        // Add system-message class for system messages
        if (sender === 'System' || sender === 'Admin') {
            chatMessage.classList.add('system-message');
        }
        
        chatMessage.innerHTML = `<span>${sender}:</span> ${message}`;
        chatBox.appendChild(chatMessage);
        
        // Scroll to bottom of chat
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    function formatCurrency(amount) {
        // Format as Indian currency (Rupees)
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});