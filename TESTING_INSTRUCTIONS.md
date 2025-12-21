# 🔐 OTP Testing Instructions

## ⚠️ IMPORTANT: OTP Security

For **Google Play Store compliance**, OTP codes are **NEVER displayed on screen** in the app.

---

## 📱 How to Get Your OTP for Testing

### Method 1: Check Backend Console (Recommended for Development)

When you request an OTP, it will be logged in the **backend server console**.

1. Start the backend server
2. Request OTP in the mobile app
3. Look for this log in your backend console:
   ```
   [otp] sent OTP for +919876543210: 123456 (stored in DB otp_plain)
   ```
4. Use the 6-digit code shown in the console

### Method 2: Check Database Directly

1. Open your database management tool
2. Query the `Otps` table:
   ```sql
   SELECT otp_plain, phone, expires_at, createdAt 
   FROM Otps 
   WHERE phone = '+919876543210' 
   ORDER BY createdAt DESC 
   LIMIT 1;
   ```
3. Use the `otp_plain` value

### Method 3: SMS Gateway (Production)

If you have configured an SMS gateway (Twilio, 2Factor, etc.), the OTP will be sent via SMS to the phone number.

**Environment Variables for SMS:**
- `SMS_GATEWAY_PROVIDER=twilio` (or `2factor`)
- `TWILIO_ACCOUNT_SID=your_sid`
- `TWILIO_AUTH_TOKEN=your_token`
- `TWILIO_FROM=+1234567890`

---

## 🚫 What NOT to Do

❌ **DO NOT** set `DEBUG_OTP=true` in production  
❌ **DO NOT** display OTP on screen in the app  
❌ **DO NOT** return OTP in API responses (except in DEBUG mode locally)

These practices will cause **Google Play Store rejection** for insecure authentication.

---

## ✅ Production Checklist

Before deploying to production:

- [ ] `DEBUG_OTP` is NOT set or is set to `false`
- [ ] SMS gateway is properly configured
- [ ] OTP is never displayed in the mobile app UI
- [ ] OTP is not returned in API responses
- [ ] OTP expiry time is reasonable (5 minutes)
- [ ] Rate limiting is enabled

---

## 📋 OTP Configuration

Default OTP settings (configurable via environment variables):

- **OTP Length**: 6 digits
- **Expiry Time**: 5 minutes
- **Cooldown**: 60 seconds between requests
- **Daily Limit**: 10 OTPs per phone number
- **Max Verification Attempts**: 5

---

## 🔧 Environment Variables

```env
# OTP Settings
OTP_COOLDOWN_SECS=60
OTP_DAILY_LIMIT=10

# SMS Gateway (choose one)
SMS_GATEWAY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890

# OR use 2Factor.in
SMS_GATEWAY_PROVIDER=2factor
SMS_GATEWAY_KEY=your_api_key

# Debug (LOCAL TESTING ONLY - NEVER IN PRODUCTION)
DEBUG_OTP=false
```

---

## 📞 Support

If you encounter issues with OTP:
1. Check backend server logs
2. Verify database connectivity
3. Confirm SMS gateway credentials (if using SMS)
4. Check rate limiting hasn't been exceeded
