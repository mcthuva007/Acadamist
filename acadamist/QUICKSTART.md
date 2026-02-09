# Acadamist - Installation & Quick Start Guide

## ⚠️ Prerequisites Installation

Your system needs Node.js to run the backend server. Here's how to install it:

### Option 1: Using Homebrew (Recommended for Mac)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```

3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

### Option 2: Direct Download

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer
4. Restart your terminal

---

## 🚀 Quick Start (After Node.js is installed)

1. **Open Terminal and navigate to project**:
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

4. **Access the app**:
   - Open browser: `http://localhost:3000`
   - Open in multiple tabs/browsers to see real-time sync!

---

## 📱 Testing Real-Time Sync

### Test 1: Multiple Browser Tabs
1. Open `http://localhost:3000` in 2-3 browser tabs
2. Submit a vote in one tab → See it update in all tabs instantly!
3. Add a calendar event in one tab → See it appear in all tabs!

### Test 2: Multiple Devices (Same Network)
1. Find your computer's IP address:
   ```bash
   ipconfig getifaddr en0
   ```
2. On other devices (phone/tablet), open: `http://YOUR_IP:3000`
3. Vote or add events → See changes sync across all devices!

### Test 3: Admin Features
1. Click the 🔒 icon in footer
2. Password: `ilovemaths123`
3. Click any calendar date to add events
4. Try "Reset Leaderboard" to test vote clearing

---

## ✅ What to Verify

- ✓ Votes update in real-time across all browsers/devices
- ✓ Calendar events sync instantly when added/deleted
- ✓ Pie chart updates automatically when votes change
- ✓ Admin can add/delete events visible to everyone
- ✓ Console shows "Connected to server" message

---

## 🐛 Troubleshooting

**Port already in use?**
```bash
PORT=3001 npm start
```
Then access via `http://localhost:3001`

**Can't access from phone?**
- Make sure phone is on same WiFi network
- Disable Mac firewall temporarily for testing
- Use your computer's IP address, not "localhost"

**Server crashes?**
- Check terminal for error messages
- Make sure all code files are saved
- Try restarting: `npm start`

---

For full documentation, see [README.md](README.md)
