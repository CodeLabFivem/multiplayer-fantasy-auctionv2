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
const playersList = [
  // Chennai Super Kings
  { id: 1, name: "Ruturaj Gaikwad", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5443.png" },
  { id: 2, name: "Ravindra Jadeja", type: "All-Rounder", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Ravindra_Jadeja_2017.jpg" },
  { id: 3, name: "Matheesha Pathirana", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5435.png" },
  { id: 4, name: "Shivam Dube", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5431.png" },
  { id: 5, name: "MS Dhoni", type: "Wicket-Keeper", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/MS_Dhoni_in_2019.jpg" },
  { id: 6, name: "Devon Conway", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3781.png" },
  { id: 7, name: "Rahul Tripathi", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3834.png" },
  { id: 8, name: "Rachin Ravindra", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3870.png" },
  { id: 9, name: "Ravichandran Ashwin", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Ravichandran_Ashwin_2016.jpg" },
  { id: 10, name: "Syed Khaleel Ahmed", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2965.png" },
  { id: 11, name: "Noor Ahmad", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5437.png" },
  { id: 12, name: "Vijay Shankar", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1083.png" },
  { id: 13, name: "Sam Curran", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2939.png" },
  { id: 14, name: "Shaik Rasheed", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 15, name: "Anshul Kamboj", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 16, name: "Mukesh Choudhary", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5438.png" },
  { id: 17, name: "Deepak Hooda", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1561.png" },
  { id: 18, name: "Gurjapneet Singh", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 19, name: "Nathan Ellis", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5436.png" },
  { id: 20, name: "Ramakrishna Ghosh", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 21, name: "Kamlesh Nagarkoti", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3766.png" },
  { id: 22, name: "Jamie Overton", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 23, name: "Shreyas Gopal", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1760.png" },
  { id: 24, name: "Vansh Bedi", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 25, name: "C Andre Siddarth", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },

  // Delhi Capitals
  { id: 26, name: "Axar Patel", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/110.png" },
  { id: 27, name: "Kuldeep Yadav", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/261.png" },
  { id: 28, name: "Tristan Stubbs", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5434.png" },
  { id: 29, name: "Abishek Porel", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5433.png" },
  { id: 30, name: "Mitchell Starc", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Mitchell_Starc_2015.jpg" },
  { id: 31, name: "KL Rahul", type: "Wicket-Keeper", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/6/6d/KL_Rahul_2021.jpg" },
  { id: 32, name: "Jake Fraser-Mcgurk", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5432.png" },
  { id: 33, name: "T Natarajan", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3833.png" },
  { id: 34, name: "Karun Nair", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/276.png" },
  { id: 35, name: "Sameer Rizvi", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 36, name: "Ashutosh Sharma", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 37, name: "Mohit Sharma", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/154.png" },
  { id: 38, name: "Faf du Plessis", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Faf_du_Plessis_2018.jpg" },
  { id: 39, name: "Mukesh Kumar", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5430.png" },
  { id: 40, name: "Darshan Nalkande", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5429.png" },
  { id: 41, name: "Vipraj Nigam", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 42, name: "Dushmantha Chameera", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3185.png" },
  { id: 43, name: "Donovan Ferreira", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 44, name: "Ajay Mandal", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 45, name: "Manvanth Kumar", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 46, name: "Madhav Tiwari", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 47, name: "Tripurana Vijay", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },

  // Gujarat Titans
  { id: 48, name: "Rashid Khan", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Rashid_Khan_2017.jpg" },
  { id: 49, name: "Shubman Gill", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Shubman_Gill_2023.jpg" },
  { id: 50, name: "Sai Sudharsan", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5428.png" },
  { id: 51, name: "Rahul Tewatia", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1740.png" },
  { id: 52, name: "Shahrukh Khan", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/19352.png" },
  { id: 53, name: "Kagiso Rabada", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Kagiso_Rabada_2018.jpg" },
  { id: 54, name: "Jos Buttler", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Jos_Buttler_2018.jpg" },
  { id: 55, name: "Mohammad Siraj", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3840.png" },
  { id: 56, name: "Prasidh Krishna", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2909.png" },
  { id: 57, name: "Nishant Sindhu", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 58, name: "Mahipal Lomror", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2970.png" },
  { id: 59, name: "Kumar Kushagra", type: "Wicket-Keeper", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 60, name: "Anuj Rawat", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5427.png" },
  { id: 61, name: "Manav Suthar", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 62, name: "Washington Sundar", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2973.png" },
  { id: 63, name: "Gerald Coetzee", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/6018.png" },
  { id: 64, name: "Arshad Khan", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5426.png" },
  { id: 65, name: "Gurnoor Brar", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 66, name: "Sherfane Rutherford", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3838.png" },
  { id: 67, name: "R Sai Kishore", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5425.png" },
  { id: 68, name: "Ishant Sharma", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/51.png" },
  { id: 69, name: "Jayant Yadav", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1748.png" },
  { id: 70, name: "Glenn Phillips", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3782.png" },
  { id: 71, name: "Karim Janat", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 72, name: "Kulwant Khejroliya", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2969.png" },

  // Kolkata Knight Riders
  { id: 73, name: "Rinku Singh", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3830.png" },
  { id: 74, name: "Varun Chakaravarthy", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5423.png" },
  { id: 75, name: "Sunil Narine", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/156.png" },
  { id: 76, name: "Andre Russell", type: "All-Rounder", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Andre_Russell_2016.jpg" },
  { id: 77, name: "Harshit Rana", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5422.png" },
  { id: 78, name: "Ramandeep Singh", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 79, name: "Venkatesh Iyer", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3831.png" },
  { id: 80, name: "Quinton de Kock", type: "Wicket-Keeper", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Quinton_de_Kock_2016.jpg" },
  { id: 81, name: "Rahmanullah Gurbaz", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5421.png" },
  { id: 82, name: "Anrich Nortje", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3786.png" },
  { id: 83, name: "Angkrish Raghuvanshi", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 84, name: "Vaibhav Arora", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5420.png" },
  { id: 85, name: "Mayank Markande", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3771.png" },
  { id: 86, name: "Rovman Powell", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3068.png" },
  { id: 87, name: "Manish Pandey", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/123.png" },
  { id: 88, name: "Spencer Johnson", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 89, name: "Luvnith Sisodia", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 90, name: "Ajinkya Rahane", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/135.png" },
  { id: 91, name: "Anukul Roy", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3770.png" },
  { id: 92, name: "Moeen Ali", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/173.png" },
  { id: 93, name: "Chetan Sakariya", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5064.png" },

  // Lucknow Super Giants
  { id: 94, name: "Nicholas Pooran", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1703.png" },
  { id: 95, name: "Ravi Bishnoi", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/19351.png" },
  { id: 96, name: "Mayank Yadav", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5418.png" },
  { id: 97, name: "Ayush Badoni", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5417.png" },
  { id: 98, name: "Shardul Thakur", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1745.png" },
  { id: 99, name: "Rishabh Pant", type: "Wicket-Keeper", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Rishabh_Pant_2018.jpg" },
  { id: 100, name: "David Miller", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/187.png" },
  { id: 101, name: "Mitchell Marsh", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/963.png" },
  { id: 102, name: "Aiden Markram", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3785.png" },
  { id: 103, name: "Avesh Khan", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1564.png" },
  { id: 104, name: "Abdul Samad", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3836.png" },
  { id: 105, name: "Aryan Juyal", type: "Wicket-Keeper", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 106, name: "Akash Deep", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5416.png" },
  { id: 107, name: "Himmat Singh", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 108, name: "M Siddharth", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 109, name: "Digvesh Singh", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 110, name: "Shahbaz Ahmed", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3835.png" },
  { id: 111, name: "Akash Singh", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5415.png" },
  { id: 112, name: "Shamar Joseph", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 113, name: "Prince Yadav", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 114, name: "Yuvraj Chaudhary", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 115, name: "Rajvardhan Hangargekar", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5414.png" },
  { id: 116, name: "Arshin Kulkarni", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 117, name: "Matthew Breetzke", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },

  // Mumbai Indians
  { id: 118, name: "Jasprit Bumrah", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Jasprit_Bumrah_2021.jpg" },
  { id: 119, name: "Suryakumar Yadav", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/108.png" },
  { id: 120, name: "Hardik Pandya", type: "All-Rounder", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Hardik_Pandya_2022.jpg" },
  { id: 121, name: "Rohit Sharma", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Rohit_Sharma_2016.jpg" },
  { id: 122, name: "Tilak Varma", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5412.png" },
  { id: 123, name: "Trent Boult", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/967.png" },
  { id: 124, name: "Naman Dhir", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 125, name: "Robin Minz", type: "Wicket-Keeper", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 126, name: "Karn Sharma", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1118.png" },
  { id: 127, name: "Ryan Rickelton", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 128, name: "Deepak Chahar", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/91.png" },
  { id: 129, name: "Mujeeb-ur-Rahman", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3188.png" },
  { id: 130, name: "Will Jacks", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5411.png" },
  { id: 131, name: "Ashwani Kumar", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 132, name: "Mitchell Santner", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1107.png" },
  { id: 133, name: "Reece Topley", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/891.png" },
  { id: 134, name: "Shrijith Krishnan", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 135, name: "Raj Bawa", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 136, name: "Satyanarayana Raju", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 137, name: "Bevon Jacobs", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 138, name: "Arjun Tendulkar", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5410.png" },
  { id: 139, name: "Vignesh Puthur", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },

  // Punjab Kings
  { id: 140, name: "Shashank Singh", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5409.png" },
  { id: 141, name: "Prabhsimran Singh", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3775.png" },
  { id: 142, name: "Arshdeep Singh", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3761.png" },
  { id: 143, name: "Shreyas Iyer", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/351.png" },
  { id: 144, name: "Yuzvendra Chahal", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/111.png" },
  { id: 145, name: "Marcus Stoinis", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/964.png" },
  { id: 146, name: "Glenn Maxwell", type: "All-Rounder", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Glenn_Maxwell_2015.jpg" },
  { id: 147, name: "Nehal Wadhera", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5408.png" },
  { id: 148, name: "Harpreet Brar", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3760.png" },
  { id: 149, name: "Vishnu Vinod", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2972.png" },
  { id: 150, name: "Vijaykumar Vyshak", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5407.png" },
  { id: 151, name: "Yash Thakur", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 152, name: "Marco Jansen", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3819.png" },
  { id: 153, name: "Josh Inglis", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Josh_Inglis_2022.jpg" },
  { id: 154, name: "Lockie Ferguson", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Lockie_Ferguson_2022.jpg" },
  { id: 155, name: "Azmatullah Omarzai", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 156, name: "Harnoor Pannu", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 157, name: "Kuldeep Sen", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2028/5406.png" },
  { id: 158, name: "Priyansh Arya", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 159, name: "Aaron Hardie", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 160, name: "Suryash Shedge", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 161, name: "Musheer Khan", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 162, name: "Xavier Bartlett", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 163, name: "Pyla Avinash", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 164, name: "Praveen Dubey", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2967.png" },

  // Rajasthan Royals
  { id: 165, name: "Sanju Samson", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/258.png" },
  { id: 166, name: "Yashasvi Jaiswal", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5065.png" },
  { id: 167, name: "Riyan Parag", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3764.png" },
  { id: 168, name: "Dhruv Jurel", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5405.png" },
  { id: 169, name: "Shimron Hetmyer", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1705.png" },
  { id: 170, name: "Sandeep Sharma", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/54.png" },
  { id: 171, name: "Jofra Archer", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3742.png" },
  { id: 172, name: "Mahesh Theekshana", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5404.png" },
  { id: 173, name: "Wanindu Hasaranga", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Wanindu_Hasaranga_2022.jpg" },
  { id: 174, name: "Akash Madhwal", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5403.png" },
  { id: 175, name: "Kumar Kartikeya Singh", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5402.png" },
  { id: 176, name: "Nitish Rana", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2738.png" },
  { id: 177, name: "Tushar Deshpande", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5401.png" },
  { id: 178, name: "Shubham Dubey", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 179, name: "Yudhvir Charak", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5413.png" },
  { id: 180, name: "Fazalhaq Farooqi", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5400.png" },
  { id: 181, name: "Vaibhav Suryavanshi", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 182, name: "Kwena Maphaka", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 183, name: "Ashok Sharma", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 184, name: "Kunal Singh Rathore", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5399.png" },

  // Royal Challengers Bangalore
  { id: 185, name: "Virat Kohli", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Virat_Kohli_2018.jpg" },
  { id: 186, name: "Rajat Patidar", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5398.png" },
  { id: 187, name: "Yash Dayal", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5397.png" },
  { id: 188, name: "Liam Livingstone", type: "All-Rounder", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Liam_Livingstone_2021.jpg" },
  { id: 189, name: "Phil Salt", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5396.png" },
  { id: 190, name: "Jitesh Sharma", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3758.png" },
  { id: 191, name: "Josh Hazlewood", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/969.png" },
  { id: 192, name: "Rasikh Dar", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5395.png" },
  { id: 193, name: "Suyash Sharma", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5394.png" },
  { id: 194, name: "Krunal Pandya", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3183.png" },
  { id: 195, name: "Bhuvneshwar Kumar", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/116.png" },
  { id: 196, name: "Swapnil Singh", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2971.png" },
  { id: 197, name: "Tim David", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5419.png" },
  { id: 198, name: "Romario Shepherd", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3820.png" },
  { id: 199, name: "Nuwan Thushara", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 200, name: "Manoj Bhandage", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5393.png" },
  { id: 201, name: "Jacob Bethell", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 202, name: "Devdutt Padikkal", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3776.png" },
  { id: 203, name: "Swastik Chikara", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 204, name: "Mohit Rathee", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 205, name: "Abhinandan Singh", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 206, name: "Lungi Ngidi", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3746.png" },

  // Sunrisers Hyderabad
  { id: 207, name: "Heinrich Klaasen", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Heinrich_Klaasen_2023.jpg" },
  { id: 208, name: "Pat Cummins", type: "Bowler", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Pat_Cummins_2018.jpg" },
  { id: 209, name: "Abhishek Sharma", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3763.png" },
  { id: 210, name: "Travis Head", type: "Batsman", basePrice: 30000000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Travis_Head_2023.jpg" },
  { id: 211, name: "Nitish Kumar Reddy", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5392.png" },
  { id: 212, name: "Mohammad Shami", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/94.png" },
  { id: 213, name: "Harshal Patel", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/157.png" },
  { id: 214, name: "Ishan Kishan", type: "Wicket-Keeper", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/2975.png" },
  { id: 215, name: "Rahul Chahar", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/3762.png" },
  { id: 216, name: "Adam Zampa", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/958.png" },
  { id: 217, name: "Atharva Taide", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5391.png" },
  { id: 218, name: "Abhinav Manohar", type: "All-Rounder", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/19351.png" },
  { id: 219, name: "Simarjeet Singh", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/5390.png" },
  { id: 220, name: "Zeeshan Ansari", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 221, name: "Jaydev Unadkat", type: "Bowler", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/86.png" },
  { id: 222, name: "Kamindu Mendis", type: "All-Rounder", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 223, name: "Aniket Verma", type: "Batsman", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 224, name: "Eshan Malinga", type: "Bowler", basePrice: 30000000, image: "https://via.placeholder.com/100" },
  { id: 225, name: "Sachin Baby", type: "Batsman", basePrice: 30000000, image: "https://resources.iplt20.com/ipl/IPLHeadshot/2023/1130.png" }
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