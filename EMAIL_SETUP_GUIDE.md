# Email Setup Guide - Gmail App Password

## 🔴 **Current Error:**
```
Email error: Invalid login: 535-5.7.8 Username and Password not accepted
```

## ✅ **Solution: Use Gmail App Password**

---

## 📝 **Step-by-Step Setup:**

### **1. Enable 2-Step Verification**
1. Go to: https://myaccount.google.com/security
2. Click **2-Step Verification**
3. Follow steps to enable it

### **2. Generate App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. Or search "App Passwords" in Google Account settings
3. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: FitTrack or any name
4. Click **Generate**
5. **Copy the 16-digit password** (e.g., `abcd efgh ijkl mnop`)

### **3. Update .env File**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=FitTrackX
FRONTEND_URL=http://localhost:5173
```

**Important**: 
- Remove spaces from app password
- Use your actual Gmail address
- Don't use your regular Gmail password

### **4. Restart Server**
```bash
# Stop server (Ctrl+C)
# Start again
node src/server.js
```

---

## 🧪 **Test Email:**

After setup, test with:
```bash
curl -X POST http://localhost:5000/api/email/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## ⚠️ **Common Issues:**

### **Issue 1: "Less secure app access"**
**Solution**: Use App Password (not regular password)

### **Issue 2: "Username and Password not accepted"**
**Solution**: 
- Enable 2-Step Verification first
- Generate new App Password
- Remove spaces from password

### **Issue 3: Still not working**
**Solution**:
- Check email is correct
- Verify 2-Step Verification is ON
- Generate fresh App Password
- Restart server

---

## 🔐 **Security Notes:**

1. **Never commit .env file** to Git
2. **App Password** is safer than regular password
3. **Each app** should have separate App Password
4. **Revoke** App Password if compromised

---

## 📧 **Alternative: Use Other Email Services**

### **SendGrid (Recommended for Production)**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

### **AWS SES**
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-access-key
EMAIL_PASSWORD=your-aws-secret-key
```

---

## ✨ **After Setup:**

Email features will work:
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ Workout reminders
- ✅ Goal achievement notifications
- ✅ Subscription confirmations

---

## 🎯 **Quick Fix Summary:**

1. Enable 2-Step Verification on Gmail
2. Generate App Password
3. Update .env with App Password
4. Restart server
5. Test email functionality

**Done!** 🚀
