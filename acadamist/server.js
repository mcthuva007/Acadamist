const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Initialize data structure
let data = {
    crushVotes: {},
    calendarEvents: {}
};

// Load data from file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            data = JSON.parse(fileData);
            console.log('Data loaded from file');
        } else {
            console.log('No existing data file, starting fresh');
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Save data to file
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('Data saved to file');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Initialize data on startup
loadData();

// API Endpoints

// Get all votes
app.get('/api/votes', (req, res) => {
    res.json(data.crushVotes);
});

// Submit a vote
app.post('/api/vote', (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
    }

    // Normalize name (Title Case)
    const normalizedName = name.trim().replace(/\w\S*/g, (w) =>
        w.replace(/^\w/, (c) => c.toUpperCase())
    );

    if (data.crushVotes[normalizedName]) {
        data.crushVotes[normalizedName]++;
    } else {
        data.crushVotes[normalizedName] = 1;
    }

    saveData();

    // Broadcast to all connected clients
    io.emit('vote-update', data.crushVotes);

    res.json({ success: true, votes: data.crushVotes });
});

// Clear all votes (admin only)
app.post('/api/clear-votes', (req, res) => {
    data.crushVotes = {};
    saveData();

    // Broadcast to all connected clients
    io.emit('vote-update', data.crushVotes);

    res.json({ success: true, message: 'Votes cleared' });
});

// Get all calendar events
app.get('/api/events', (req, res) => {
    res.json(data.calendarEvents);
});

// Add a calendar event
app.post('/api/events', (req, res) => {
    const { key, event } = req.body;

    if (!key || !event) {
        return res.status(400).json({ error: 'Key and event are required' });
    }

    if (!data.calendarEvents[key]) {
        data.calendarEvents[key] = [];
    }

    data.calendarEvents[key].push(event);
    saveData();

    // Broadcast to all connected clients
    io.emit('calendar-update', data.calendarEvents);

    res.json({ success: true, events: data.calendarEvents });
});

// Delete a calendar event
app.delete('/api/events/:key/:index', (req, res) => {
    const { key, index } = req.params;

    if (!data.calendarEvents[key]) {
        return res.status(404).json({ error: 'Event key not found' });
    }

    const eventIndex = parseInt(index);
    if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= data.calendarEvents[key].length) {
        return res.status(400).json({ error: 'Invalid event index' });
    }

    data.calendarEvents[key].splice(eventIndex, 1);

    // Remove key if no events left
    if (data.calendarEvents[key].length === 0) {
        delete data.calendarEvents[key];
    }

    saveData();

    // Broadcast to all connected clients
    io.emit('calendar-update', data.calendarEvents);

    res.json({ success: true, events: data.calendarEvents });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Send current data to newly connected client
    socket.emit('vote-update', data.crushVotes);
    socket.emit('calendar-update', data.calendarEvents);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});
