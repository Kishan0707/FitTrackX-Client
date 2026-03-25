# Email Setup - Step by Step Guide

## 🔴 Current Status:
```
⚠️  Email service not configured - Email features disabled
```

## ✅ Enable Email in 3 Steps:

---

## Step 1: Generate Gmail App Password

### Option A: Direct Link
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Gmail account
3. You'll see "App passwords" page

### Option B: Manual Navigation
1. Go to: https://myaccount.google.com/
2. Click "Security" (left sidebar)
3. Scroll down to "How you sign in to Google"
4. Click "2-Step Verification" (enable it if not enabled)
5. Go back to Security
6. Click "App passwords"

### Generate Password:
1. Select app: **Mail**
2. Select device: **Other (Custom name)**
3. Type name: **FitTrack**
4. Click **Generate**
5. Copy the **16-digit password** (example: `abcd efgh ijkl mnop`)
6. Remove spaces: `abcdefghijklmnop`

---

## Step 2: Update .env File

Open: `D:\fit-Track-X-Backend\server\.env`

Replace these lines:
```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
```

With your actual credentials:
```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Example:**
```env
EMAIL_USER=kishan@gmail.com
EMAIL_PASSWORD=xyzw1234abcd5678
```

---

## Step 3: Restart Server

```bash
# Stop server (Ctrl+C in terminal)
# Start again
node src/server.js
```

---

## ✅ Success Message:

After restart, you should see:
```
✅ Email service configured
Server is running on port 5000
```

---

## 🧪 Test Email:

### Test 1: Forgot Password
1. Go to: http://localhost:5173/forgot-password
2. Enter your email
3. Click "Send Reset Link"
4. Check your email inbox

### Test 2: API Test
```bash
curl -X POST http://localhost:5000/api/email/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"youremail@gmail.com"}'
```

---

## ⚠️ Common Issues:

### Issue 1: "Username and Password not accepted"
**Cause**: Using regular Gmail password instead of App Password
**Fix**: Generate App Password and use that

### Issue 2: "2-Step Verification required"
**Cause**: 2-Step Verification not enabled
**Fix**: Enable it first, then generate App Password

### Issue 3: Still not working
**Checklist**:
- [ ] 2-Step Verification is ON
- [ ] App Password generated (not regular password)
- [ ] No spaces in password
- [ ] Correct email address
- [ ] Server restarted after .env update

---

## 📧 Email Features (After Setup):

1. ✅ Password Reset Emails
2. ✅ Welcome Emails (new users)
3. ✅ Workout Reminders
4. ✅ Goal Achievement Notifications
5. ✅ Subscription Confirmations

---

## 🔐 Security Tips:

1. **Never share** App Password
2. **Don't commit** .env file to Git
3. **Revoke** App Password if compromised
4. **Use different** App Password for each app

---

## 📝 Summary:

```
1. Generate Gmail App Password
2. Update .env file with real credentials
3. Restart server
4. Test email functionality
```

**That's it!** 🚀
