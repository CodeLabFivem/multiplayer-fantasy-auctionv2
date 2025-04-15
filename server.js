const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt');

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic in-memory storage (in a real app, use a database)
const users = {};
const admins = [];
let auctionState = {
  status: 'waiting', // waiting, active, paused, finished
  currentPlayer: null,
  nextPlayers: [],
  highestBid: 0,
  highestBidder: null,
  timer: 30,
  timerInterval: null,
  soldPlayers: [],
  unsoldPlayers: []
};

// Sample player list - in a real app, this would come from a database
let players = [
    { name: "Rinku Singh", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Yashasvi Jaiswal", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Deepak Chahar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shahrukh Khan", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sandeep Sharma", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Arshdeep Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kamindu Mendis", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vijaykumar Vyshak", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Anrich Nortje", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Harpreet Brar", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mohammad Shami", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Akash Madhwal", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kuldeep Yadav", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rahul Chahar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shreyas Iyer", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nitish Kumar Reddy", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ravichandran Ashwin", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Tushar Deshpande", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Yuzvendra Chahal", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Hardik Pandya", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Heinrich Klaasen", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Riyan Parag", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Suryakumar Yadav", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jitesh Sharma", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Pat Cummins", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sanju Samson", category: "batter/wicketkeeper", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Liam Livingstone", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rohit Sharma", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mayank Yadav", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jasprit Bumrah", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Travis Head", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Virat Kohli", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jos Buttler", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shubman Gill", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nicholas Pooran", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rashid Khan", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Andre Russell", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sunil Narine", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Axar Patel", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rishabh Pant", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ishan Kishan", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "KL Rahul", category: "batter/wicketkeeper", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "MS Dhoni", category: "batter/wicketkeeper", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Phil Salt", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Quinton de Kock", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Dhruv Jurel", category: "batter/wicketkeeper", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Abishek Porel", category: "batter/wicketkeeper", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rahmanullah Gurbaz", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ruturaj Gaikwad", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ravindra Jadeja", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shivam Dube", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Devon Conway", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rachin Ravindra", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Matheesha Pathirana", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Noor Ahmad", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sam Curran", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Syed Khaleel Ahmed", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vijay Shankar", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rahul Tripathi", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shaik Rasheed", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Anshul Kamboj", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mukesh Choudhary", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Deepak Hooda", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Gurjapneet Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nathan Ellis", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ramakrishna Ghosh", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kamlesh Nagarkoti", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jamie Overton", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shreyas Gopal", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vansh Bedi", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "C Andre Siddarth", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Tristan Stubbs", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mitchell Starc", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jake Fraser-Mcgurk", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "T Natarajan", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Karun Nair", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sameer Rizvi", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ashutosh Sharma", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mohit Sharma", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Faf du Plessis", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mukesh Kumar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Darshan Nalkande", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vipraj Nigam", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Dushmantha Chameera", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Donovan Ferreira", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ajay Mandal", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Manvanth Kumar", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Madhav Tiwari", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Tripurana Vijay", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sai Sudharsan", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rahul Tewatia", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kagiso Rabada", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mohammad Siraj", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Prasidh Krishna", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nishant Sindhu", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mahipal Lomror", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kumar Kushagra", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Anuj Rawat", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Manav Suthar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Washington Sundar", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Gerald Coetzee", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Arshad Khan", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Gurnoor Brar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sherfane Rutherford", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "R Sai Kishore", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ishant Sharma", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jayant Yadav", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Glenn Phillips", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Karim Janat", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kulwant Khejroliya", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Varun Chakaravarthy", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Harshit Rana", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ramandeep Singh", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Venkatesh Iyer", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Angkrish Raghuvanshi", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vaibhav Arora", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mayank Markande", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rovman Powell", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Manish Pandey", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Spencer Johnson", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Luvnith Sisodia", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ajinkya Rahane", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Anukul Roy", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Moeen Ali", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Chetan Sakariya", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ravi Bishnoi", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ayush Badoni", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shardul Thakur", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "David Miller", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mitchell Marsh", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Aiden Markram", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Avesh Khan", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Abdul Samad", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Aryan Juyal", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Akash Deep", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Himmat Singh", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "M Siddharth", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Digvesh Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shahbaz Ahmed", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Akash Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shamar Joseph", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Prince Yadav", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Yuvraj Chaudhary", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rajvardhan Hangargekar", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Arshin Kulkarni", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Matthew Breetzke", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Tilak Varma", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Trent Boult", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Naman Dhir", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Robin Minz", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Karn Sharma", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ryan Rickelton", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mujeeb-ur-Rahman", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Will Jacks", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ashwani Kumar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mitchell Santner", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Reece Topley", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shrijith Krishnan", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Raj Bawa", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Satyanarayana Raju", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Bevon Jacobs", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Arjun Tendulkar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vignesh Puthur", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shashank Singh", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Prabhsimran Singh", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Marcus Stoinis", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Glenn Maxwell", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nehal Wadhera", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vishnu Vinod", category: "wicketkeeper/batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Yash Thakur", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Marco Jansen", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Josh Inglis", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Lockie Ferguson", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Azmatullah Omarzai", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Harnoor Pannu", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kuldeep Sen", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Priyansh Arya", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Aaron Hardie", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Suryash Shedge", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Musheer Khan", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Xavier Bartlett", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Pyla Avinash", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Praveen Dubey", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shimron Hetmyer", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jofra Archer", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mahesh Theekshana", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Wanindu Hasaranga", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kumar Kartikeya Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nitish Rana", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Shubham Dubey", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Yudhvir Charak", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Fazalhaq Farooqi", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Vaibhav Suryavanshi", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kwena Maphaka", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Ashok Sharma", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Kunal Singh Rathore", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rajat Patidar", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Yash Dayal", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Josh Hazlewood", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Rasikh Dar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Suyash Sharma", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Krunal Pandya", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Bhuvneshwar Kumar", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Swapnil Singh", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Tim David", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Romario Shepherd", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Nuwan Thushara", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Manoj Bhandage", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jacob Bethell", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Devdutt Padikkal", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Swastik Chikara", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Mohit Rathee", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Abhinandan Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Lungi Ngidi", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Abhishek Sharma", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Harshal Patel", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Adam Zampa", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Atharva Taide", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Abhinav Manohar", category: "allrounder", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Simarjeet Singh", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Zeeshan Ansari", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Jaydev Unadkat", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Aniket Verma", category: "batter", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Eshan Malinga", category: "bowler", basePrice: 30000000, status: "waiting" , image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
    { name: "Sachin Baby", category: "batter", basePrice: 30000000, status: "waiting", image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg"}
];

// Admin access code (in a real app, store this securely)
const ADMIN_CODE = 'admin123';

// Initialize auction with first few players
auctionState.nextPlayers = [...playersList];

// Socket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Register new user
  socket.on('register', async (data, callback) => {
    try {
      // Check if username already exists
      if (users[data.username]) {
        return callback({ success: false, message: 'Team name already in use' });
      }
      
      // If registering as admin, verify admin code
      if (data.isAdmin) {
        if (data.adminCode !== ADMIN_CODE) {
          return callback({ success: false, message: 'Invalid admin code' });
        }
        admins.push(data.username);
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      users[data.username] = {
        password: hashedPassword,
        purse: parseInt(data.startingPurse) || 1000000000, // Default 100 Cr
        isAdmin: data.isAdmin,
        players: [],
        socketId: socket.id
      };
      
      callback({ success: true, message: 'Registration successful' });
    } catch (error) {
      console.error('Registration error:', error);
      callback({ success: false, message: 'Registration failed' });
    }
  });
  
  // Login
  socket.on('login', async (data, callback) => {
    try {
      // Check if user exists
      const user = users[data.username];
      if (!user) {
        return callback({ success: false, message: 'Invalid team name or password' });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) {
        return callback({ success: false, message: 'Invalid team name or password' });
      }
      
      // Update socket ID for the user
      user.socketId = socket.id;
      
      // Send user data and auction state
      callback({
        success: true,
        isAdmin: user.isAdmin,
        purse: user.purse,
        players: user.players,
        auctionState: {
          status: auctionState.status,
          currentPlayer: auctionState.currentPlayer,
          nextPlayers: auctionState.nextPlayers.slice(0, 3), // Only send next 3 players
          highestBid: auctionState.highestBid,
          highestBidder: auctionState.highestBidder,
          timer: auctionState.timer
        }
      });
      
      // Notify all clients about teams
      updateTeamList();
    } catch (error) {
      console.error('Login error:', error);
      callback({ success: false, message: 'Login failed' });
    }
  });
  
  // Admin - Start auction
  socket.on('startAuction', (data, callback) => {
    const username = getUsernameFromSocket(socket.id);
    
    // Check if user is admin
    if (!username || !users[username].isAdmin) {
      return callback({ success: false, message: 'Unauthorized' });
    }
    
    auctionState.status = 'active';
    
    if (!auctionState.currentPlayer && auctionState.nextPlayers.length > 0) {
      moveToNextPlayer();
    }
    
    io.emit('auctionUpdate', { status: auctionState.status });
    callback({ success: true });
  });
  
  // Admin - Pause auction
  socket.on('pauseAuction', (data, callback) => {
    const username = getUsernameFromSocket(socket.id);
    
    // Check if user is admin
    if (!username || !users[username].isAdmin) {
      return callback({ success: false, message: 'Unauthorized' });
    }
    
    auctionState.status = 'paused';
    clearInterval(auctionState.timerInterval);
    
    io.emit('auctionUpdate', { status: auctionState.status });
    callback({ success: true });
  });
  
  // Admin - Next player
  socket.on('nextPlayer', (data, callback) => {
    const username = getUsernameFromSocket(socket.id);
    
    // Check if user is admin
    if (!username || !users[username].isAdmin) {
      return callback({ success: false, message: 'Unauthorized' });
    }
    
    if (auctionState.status !== 'active') {
      return callback({ success: false, message: 'Auction is not active' });
    }
    
    if (data && data.playerIndex !== undefined && data.playerIndex < auctionState.nextPlayers.length) {
      const selectedPlayer = auctionState.nextPlayers.splice(data.playerIndex, 1)[0];
      if (auctionState.currentPlayer) {
        auctionState.unsoldPlayers.push(auctionState.currentPlayer);
      }
      auctionState.currentPlayer = selectedPlayer;
    } else {
      moveToNextPlayer();
    }
    
    callback({ success: true });
  });
  
  // Admin - Mark player as sold
  socket.on('markAsSold', (data, callback) => {
    const username = getUsernameFromSocket(socket.id);
    
    // Check if user is admin
    if (!username || !users[username].isAdmin) {
      return callback({ success: false, message: 'Unauthorized' });
    }
    
    if (!auctionState.currentPlayer) {
      return callback({ success: false, message: 'No player to mark as sold' });
    }
    
    if (auctionState.highestBidder) {
      const team = auctionState.highestBidder;
      const bid = auctionState.highestBid;
      
      if (users[team]) {
        // Deduct from team's purse
        users[team].purse -= bid;
        
        // Add player to team
        const soldPlayer = { ...auctionState.currentPlayer, soldFor: bid };
        users[team].players.push(soldPlayer);
        auctionState.soldPlayers.push({ 
          player: auctionState.currentPlayer, 
          team: team, 
          amount: bid 
        });
        
        // Send team update to the buyer
        if (users[team].socketId) {
          io.to(users[team].socketId).emit('teamUpdate', {
            purse: users[team].purse,
            players: users[team].players
          });
        }
        
        // Broadcast the sale to all
        io.emit('playerSold', {
          player: auctionState.currentPlayer,
          team: team,
          amount: bid
        });
        
        // Update team list for all
        updateTeamList();
      }
    } else {
      return callback({ success: false, message: 'No bids to mark player as sold' });
    }
    
    // Reset auction state for next player
    resetAuctionState();
    moveToNextPlayer();
    
    callback({ success: true });
  });
  
  // Admin - Mark player as unsold
  socket.on('markAsUnsold', (data, callback) => {
    const username = getUsernameFromSocket(socket.id);
    
    // Check if user is admin
    if (!username || !users[username].isAdmin) {
      return callback({ success: false, message: 'Unauthorized' });
    }
    
    if (!auctionState.currentPlayer) {
      return callback({ success: false, message: 'No player to mark as unsold' });
    }
    
    auctionState.unsoldPlayers.push(auctionState.currentPlayer);
    
    // Broadcast the unsold status
    io.emit('playerUnsold', {
      player: auctionState.currentPlayer
    });
    
    // Reset auction state for next player
    resetAuctionState();
    moveToNextPlayer();
    
    callback({ success: true });
  });
  
  // Place bid
  socket.on('placeBid', (data, callback) => {
    const username = getUsernameFromSocket(socket.id);
    
    if (!username) {
      return callback({ success: false, message: 'Not logged in' });
    }
    
    if (auctionState.status !== 'active') {
      return callback({ success: false, message: 'Auction is not active' });
    }
    
    if (!auctionState.currentPlayer) {
      return callback({ success: false, message: 'No player to bid on' });
    }
    
    const user = users[username];
    let bidAmount = 0;
    
    // If it's the first bid, use base price, otherwise increment
    if (auctionState.highestBid === 0) {
      bidAmount = auctionState.currentPlayer.basePrice;
    } else {
      bidAmount = auctionState.highestBid + data.increment;
    }
    
    // Check if team has enough money
    if (bidAmount > user.purse) {
      return callback({ success: false, message: 'Insufficient funds' });
    }
    
    // Update highest bid
    auctionState.highestBid = bidAmount;
    auctionState.highestBidder = username;
    
    // Reset timer
    auctionState.timer = 30;
    
    // Broadcast bid update
    io.emit('bidUpdate', {
      amount: bidAmount,
      bidder: username
    });
    
    // Send confirmation to bidder
    callback({ success: true, bidAmount });
  });
  
  // Send chat message
  socket.on('chatMessage', (data) => {
    const username = getUsernameFromSocket(socket.id);
    
    if (!username) return;
    
    io.emit('newChatMessage', {
      team: username,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    
    // Could mark user as offline here, but keeping simple for demo
  });
});

// Utility functions
function getUsernameFromSocket(socketId) {
  for (const username in users) {
    if (users[username].socketId === socketId) {
      return username;
    }
  }
  return null;
}

function moveToNextPlayer() {
  // Clear previous timer
  clearInterval(auctionState.timerInterval);
  
  // Reset bid state
  auctionState.highestBid = 0;
  auctionState.highestBidder = null;
  
  // If there are players left, get the next one
  if (auctionState.nextPlayers.length > 0) {
    auctionState.currentPlayer = auctionState.nextPlayers.shift();
    auctionState.timer = 30;
    
    // Broadcast player update
    io.emit('playerUpdate', {
      currentPlayer: auctionState.currentPlayer,
      nextPlayers: auctionState.nextPlayers.slice(0, 3)
    });
    
    // Start timer if auction is active
    if (auctionState.status === 'active') {
      startAuctionTimer();
    }
  } else {
    // End the auction if no more players
    auctionState.status = 'finished';
    auctionState.currentPlayer = null;
    
    io.emit('auctionUpdate', { 
      status: auctionState.status,
      message: 'All players have been auctioned'
    });
  }
}

function resetAuctionState() {
  // Reset auction state for next player
  auctionState.highestBid = 0;
  auctionState.highestBidder = null;
  auctionState.timer = 30;
  
  // Clear timer interval
  clearInterval(auctionState.timerInterval);
}

function startAuctionTimer() {
  // Clear any existing interval
  clearInterval(auctionState.timerInterval);
  
  // Start new timer
  auctionState.timerInterval = setInterval(() => {
    auctionState.timer--;
    
    // Broadcast timer update
    io.emit('timerUpdate', { timer: auctionState.timer });
    
    // If timer reaches 0, handle end of bidding
    if (auctionState.timer <= 0) {
      clearInterval(auctionState.timerInterval);
      
      // If there was a bid, automatically mark as sold
      if (auctionState.highestBidder) {
        const team = auctionState.highestBidder;
        const bid = auctionState.highestBid;
        
        // Deduct from team's purse
        users[team].purse -= bid;
        
        // Add player to team
        const soldPlayer = { ...auctionState.currentPlayer, soldFor: bid };
        users[team].players.push(soldPlayer);
        auctionState.soldPlayers.push({ 
          player: auctionState.currentPlayer, 
          team: team, 
          amount: bid 
        });
        
        // Send team update to the buyer
        if (users[team].socketId) {
          io.to(users[team].socketId).emit('teamUpdate', {
            purse: users[team].purse,
            players: users[team].players
          });
        }
        
        // Broadcast the sale to all
        io.emit('playerSold', {
          player: auctionState.currentPlayer,
          team: team,
          amount: bid
        });
        
        // Update team list for all
        updateTeamList();
      } else {
        // Mark as unsold if no bids
        auctionState.unsoldPlayers.push(auctionState.currentPlayer);
        
        // Broadcast the unsold status
        io.emit('playerUnsold', {
          player: auctionState.currentPlayer
        });
      }
      
      // Move to next player
      setTimeout(() => {
        resetAuctionState();
        moveToNextPlayer();
      }, 3000); // Small delay before next player
    }
  }, 1000);
}

function updateTeamList() {
  const teamList = Object.keys(users).map(username => {
    return {
      name: username,
      purse: users[username].purse,
      playerCount: users[username].players.length,
      isAdmin: users[username].isAdmin
    };
  });
  
  io.emit('teamListUpdate', { teams: teamList });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
