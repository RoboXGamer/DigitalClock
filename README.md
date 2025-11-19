# DigitalClock

Live Link: [im-digitalclock.netlify.app](https://im-digitalclock.netlify.app/)

## Features

### 🕐 Clock Mode
- Real-time digital clock display with smooth rolling digit animations
- 12-hour and 24-hour time format toggle
- AM/PM indicator for 12-hour format
- Optional seconds display
- Full date display with weekday, month, and year
- Updates automatically every second

### ⏱️ Timer Mode
- Countdown timer with hours, minutes, and seconds input
- Start/Pause/Reset controls
- Visual alert when timer completes
- Input validation for time values
- Smooth digit animations during countdown

### ⏲️ Stopwatch Mode
- Precision stopwatch with millisecond accuracy
- Lap recording functionality with unlimited laps
- Automatic display switching:
  - Shows milliseconds (MM:SS.ms) for times under 1 hour
  - Shows hours (HH:MM:SS) for times over 1 hour
- Start/Stop/Lap/Reset controls
- Scrollable lap history with individual lap times

### ⚙️ Settings & Customization
- **Dark Mode**: Toggle between light and dark themes
- **24-Hour Format**: Switch between 12-hour and 24-hour time display
- **Show Seconds**: Toggle seconds visibility in clock mode
- **Fullscreen Mode**: Expand to fullscreen view
- **Local Storage**: All settings and current mode are automatically saved

### 🎨 Design
- Clean and minimalist interface
- Responsive design for all screen sizes
- Smooth rolling digit animations for a premium feel
- Consistent design language across all modes

### 📱 PWA Support
- Offline-supported Progressive Web App
- Install on desktop or mobile devices
- Works without internet connection

## Usage

1. **Switch Modes**: Click on Clock, Timer, or Stopwatch tabs at the top
2. **Timer**: Enter time values and click Start to begin countdown
3. **Stopwatch**: Click Start to begin, Lap to record times, Reset to clear
4. **Settings**: Click the gear icon (⚙️) in the bottom-right to access settings
5. **Persistence**: Your settings and active mode are automatically saved

## Technologies

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript
- Service Worker for PWA functionality
