# Acadamist - Real-Time Academic Hub

A collaborative academic platform with real-time synchronization across all devices. Features include a synchronized calendar for events, a fun voting zone, and study tools.

## Features

- **Real-Time Calendar**: Add, view, and delete events with instant synchronization across all devices
- **Fun Zone Voting**: Vote for your favorite names and see results update live on all connected devices  
- **Pomodoro Timer**: Focus timer to help with study sessions
- **Resource Hub**: Access to notes, past papers, and study materials
- **Admin Controls**: Protected admin panel for managing events and clearing votes

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-Time**: Socket.io for WebSocket communication
- **Database**: JSON file storage (easily upgradeable to MongoDB)

## Installation

### Prerequisites

- Node.js (v14 or higher) - [Download here](https://nodejs.org/)

### Setup Instructions

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/mcthuva/Documents/programming/acadamist
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   - Open your browser and go to: `http://localhost:3000`
   - Open the same URL on multiple devices/browsers to test real-time synchronization

## Usage

### For Students

- **View Calendar**: See all scheduled academic events
- **Vote in Fun Zone**: Enter a name and vote (updates live for everyone)
- **Use Timer**: Set a custom focus timer for study sessions
- **Access Materials**: Navigate to Notes and Past Papers sections

### For Admins

1. Click the 🔒 icon in the footer
2. Enter password: `ilovemaths123`
3. Once logged in, you can:
   - Add calendar events by clicking on any date
   - Delete events using the 🗑️ button
   - Clear all votes using the "Reset Leaderboard" button

## Real-Time Features

All changes are instantly visible to everyone:

- **Voting**: When someone votes, the leaderboard and pie chart update on all devices
- **Calendar Events**: New events appear immediately on all connected clients
- **Event Deletion**: Removed events disappear from all clients instantly

## Deployment

### Option 1: Render (Recommended - Free Tier Available)

1. Create account at [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Deploy!

### Option 2: Railway

1. Create account at [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects settings
5. Deploy!

### Option 3: Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Run commands:
   ```bash
   heroku login
   heroku create acadamist-app
   git push heroku main
   heroku open
   ```

### Environment Variables (Optional)

You can set a custom port:
- `PORT`: Server port (default: 3000)

## File Structure

```
acadamist/
├── server.js           # Backend server with API endpoints
├── script.js           # Frontend JavaScript with Socket.io
├── index.html          # Main HTML file
├── style.css          # Styles
├── package.json       # Node.js dependencies
├── data.json          # Database (auto-created)
├── assets/            # Images and static files
└── README.md          # This file
```

## API Endpoints

- `GET /api/votes` - Fetch all votes
- `POST /api/vote` - Submit a vote
- `POST /api/clear-votes` - Clear all votes (admin only)
- `GET /api/events` - Fetch all calendar events
- `POST /api/events` - Add a calendar event
- `DELETE /api/events/:key/:index` - Delete a specific event

## WebSocket Events

- `vote-update` - Broadcast when votes change
- `calendar-update` - Broadcast when calendar events change

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Try: `PORT=3001 npm start`

### Can't connect from other devices
- Make sure devices are on the same network
- Use your computer's IP address instead of localhost
- Find IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
- Access via: `http://YOUR_IP:3000`

### Changes not syncing
- Check browser console for connection errors
- Verify server is running
- Check that Socket.io is connecting (should see "Connected to server" in console)

### Data lost after restart
- Data is saved in `data.json` - make sure this file isn't deleted
- Don't add `data.json` to `.gitignore` if you want to keep data

## Admin Password

Default admin password: `ilovemaths123`

To change it, edit line 390 in `script.js`:
```javascript
if (adminPassword.value === 'YOUR_NEW_PASSWORD') {
```

## Support

Created by Thuva
- Instagram: [@mc_thuva](https://www.instagram.com/mc_thuva/?hl=en)
- YouTube: [@mcvisuals_25](https://www.youtube.com/@mcvisuals_25)
- Email: mcofficial2025@gmail.com

## License

MIT License - Feel free to use and modify for your needs!
