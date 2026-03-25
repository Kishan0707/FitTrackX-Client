# Socket.io-client Usage Guide - FitTrack X

## 📊 **Current Status:**

### ❌ **Abhi Kahan Use Nahi Kiya:**
```
Frontend mein socket.io-client installed hai but use nahi kiya gaya
```

### ✅ **Backend Mein Ready Hai:**
```javascript
// server/src/config/socket.js
- Socket.io server configured
- Real-time notification system ready
- Event handlers ready
```

---

## 🎯 **Kahan Use Kar Sakte Hain:**

### **1. Real-time Notifications** 🔔
- New workout assigned by coach
- Diet plan updated
- Goal achieved
- Subscription expiring
- New message from coach

### **2. Live Updates** 🔄
- Dashboard stats auto-update
- Workout progress live tracking
- Diet tracking real-time
- Coach-client communication

### **3. Collaborative Features** 👥
- Coach watching client workout live
- Group workout sessions
- Live leaderboard updates
- Real-time chat

---

## 🚀 **Implementation Examples:**

### **Example 1: Notification System**

#### **Step 1: Create Socket Context**
```javascript
// client/src/context/socketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Show toast notification
      alert(notification.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};
```

#### **Step 2: Add to main.jsx**
```javascript
import { SocketProvider } from './context/socketContext';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
);
```

#### **Step 3: Use in Components**
```javascript
// In any component
import { useSocket } from '../context/socketContext';

const Dashboard = () => {
  const { socket, notifications } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('workoutAssigned', (data) => {
        alert(`New workout assigned: ${data.workoutName}`);
      });
    }
  }, [socket]);

  return (
    <div>
      <h1>Notifications: {notifications.length}</h1>
      {notifications.map(n => (
        <div key={n.id}>{n.message}</div>
      ))}
    </div>
  );
};
```

---

### **Example 2: Live Workout Tracking**

```javascript
// client/src/pages/workouts/LiveWorkout.jsx
import { useSocket } from '../../context/socketContext';

const LiveWorkout = () => {
  const { socket } = useSocket();
  const [currentSet, setCurrentSet] = useState(0);

  const updateProgress = (setNumber) => {
    setCurrentSet(setNumber);
    
    // Send to coach in real-time
    socket?.emit('workoutProgress', {
      workoutId: '123',
      currentSet: setNumber,
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <h1>Live Workout</h1>
      <button onClick={() => updateProgress(currentSet + 1)}>
        Complete Set {currentSet + 1}
      </button>
    </div>
  );
};
```

---

### **Example 3: Coach-Client Real-time Communication**

```javascript
// Coach Dashboard - Watch client workout live
const CoachDashboard = () => {
  const { socket } = useSocket();
  const [clientProgress, setClientProgress] = useState({});

  useEffect(() => {
    socket?.on('workoutProgress', (data) => {
      setClientProgress(prev => ({
        ...prev,
        [data.clientId]: data
      }));
    });
  }, [socket]);

  return (
    <div>
      <h1>Live Client Progress</h1>
      {Object.entries(clientProgress).map(([clientId, progress]) => (
        <div key={clientId}>
          Client {clientId}: Set {progress.currentSet}
        </div>
      ))}
    </div>
  );
};
```

---

### **Example 4: Real-time Dashboard Stats**

```javascript
// Dashboard with live updates
const Dashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Listen for stat updates
    socket?.on('statsUpdate', (newStats) => {
      setStats(newStats);
    });

    // Request initial stats
    socket?.emit('getStats');
  }, [socket]);

  return (
    <div>
      <StatCard title="Total Workouts" value={stats.totalWorkouts} />
      <StatCard title="Calories Burned" value={stats.caloriesBurned} />
    </div>
  );
};
```

---

### **Example 5: Notification Bell Component**

```javascript
// client/src/components/NotificationBell.jsx
import { useSocket } from '../context/socketContext';
import { useState } from 'react';
import { FaBell } from 'react-icons/fa';

const NotificationBell = () => {
  const { notifications } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-lg">
          <div className="p-4">
            <h3 className="font-bold mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-slate-400">No notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-2 border-b border-slate-700">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-slate-400">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

---

## 🎯 **Kahan Kahan Use Kar Sakte Hain:**

### **1. Navbar** 🔔
```javascript
// Add notification bell
<NotificationBell />
```

### **2. Dashboard** 📊
```javascript
// Live stats updates
socket.on('statsUpdate', updateStats);
```

### **3. Workout Pages** 💪
```javascript
// Live workout tracking
socket.emit('workoutStarted', workoutId);
socket.emit('setCompleted', { workoutId, setNumber });
```

### **4. Coach Dashboard** 👨‍🏫
```javascript
// Watch clients live
socket.on('clientWorkoutProgress', showProgress);
```

### **5. Diet Tracking** 🍎
```javascript
// Real-time meal logging
socket.emit('mealLogged', mealData);
```

### **6. Progress Page** 📈
```javascript
// Live weight updates
socket.emit('weightUpdated', newWeight);
```

### **7. Chat/Messages** 💬
```javascript
// Coach-client messaging
socket.emit('sendMessage', message);
socket.on('newMessage', displayMessage);
```

---

## 📝 **Backend Events Already Ready:**

```javascript
// server/src/config/socket.js

socket.on('join', (userId) => {
  // User joins their room
});

// Emit notifications
emitNotification(userId, notification);

// Emit workout updates
emitWorkoutUpdate(userId, workout);

// Emit diet updates
emitDietUpdate(userId, diet);
```

---

## 🔧 **Quick Implementation Steps:**

### **Step 1: Create Socket Context**
```bash
Create: client/src/context/socketContext.jsx
```

### **Step 2: Add to main.jsx**
```javascript
Wrap App with SocketProvider
```

### **Step 3: Create Notification Bell**
```bash
Create: client/src/components/NotificationBell.jsx
```

### **Step 4: Add to Navbar**
```javascript
Import and use NotificationBell in Navbar
```

### **Step 5: Use in Components**
```javascript
const { socket } = useSocket();
socket.emit('event', data);
socket.on('event', handler);
```

---

## ✨ **Benefits:**

1. ✅ Real-time notifications
2. ✅ Live progress tracking
3. ✅ Instant updates
4. ✅ Better user experience
5. ✅ Coach-client communication
6. ✅ Live leaderboards
7. ✅ Collaborative features

---

## 🎯 **Priority Implementation:**

### **High Priority:**
1. Notification Bell in Navbar
2. Real-time workout updates
3. Coach notifications

### **Medium Priority:**
4. Live dashboard stats
5. Diet tracking updates
6. Progress updates

### **Low Priority:**
7. Chat system
8. Group features
9. Live leaderboards

---

## 📊 **Summary:**

| Feature | Status | Priority |
|---------|--------|----------|
| Socket.io Server | ✅ Ready | - |
| Socket.io Client | ⚠️ Not Used | - |
| Notification System | ❌ Not Implemented | High |
| Live Updates | ❌ Not Implemented | High |
| Chat System | ❌ Not Implemented | Low |

---

**Next Step**: Implement Notification Bell in Navbar! 🚀
