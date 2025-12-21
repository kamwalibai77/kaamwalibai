# 🚀 Production Deployment Checklist

## ✅ Security & Google Play Compliance

### OTP Security (CRITICAL)
- [ ] `DEBUG_OTP` is **NOT** set in production environment variables
- [ ] OTP is **NEVER** displayed on mobile app screen
- [ ] OTP is **NOT** returned in API responses (backend)
- [ ] SMS gateway is properly configured for production
- [ ] OTP expiry time is set (default: 5 minutes)
- [ ] Rate limiting is enabled and tested
- [ ] Daily OTP limits are configured

### Backend Environment Variables (Production)
```env
# Database
DATABASE_URL=your_production_db_url

# JWT Secret (use a strong random string)
JWT_SECRET=your_secure_random_secret

# OTP Settings
OTP_COOLDOWN_SECS=60
OTP_DAILY_LIMIT=10

# SMS Gateway - Configure ONE of these:

# Option 1: Twilio
SMS_GATEWAY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890

# Option 2: 2Factor.in
SMS_GATEWAY_PROVIDER=2factor
SMS_GATEWAY_KEY=your_api_key

# IMPORTANT: Do NOT set DEBUG_OTP in production
# DEBUG_OTP=false  # or simply don't set it
```

### Mobile App
- [ ] API base URL points to production backend
- [ ] All console.logs reviewed (remove sensitive data)
- [ ] Error handling is user-friendly (no stack traces shown)
- [ ] App version is updated in app.json
- [ ] Permissions are properly declared in app.json

### Testing Before Deployment
- [ ] Test OTP flow with real phone numbers
- [ ] Test rate limiting works correctly
- [ ] Test OTP expiry works correctly  
- [ ] Test SMS delivery (if using SMS gateway)
- [ ] Test with slow/no internet connection
- [ ] Test on both Android and iOS

### Google Play Store Requirements
- [ ] App uses HTTPS for all API calls
- [ ] Privacy Policy is accessible in-app
- [ ] Data retention policy is documented
- [ ] Permissions are justified in store listing
- [ ] OTP is sent via SMS (not displayed on screen)
- [ ] Authentication is secure (no hardcoded credentials)

### Apple App Store Requirements
- [ ] All network calls use HTTPS
- [ ] Privacy manifest is included (if required)
- [ ] SMS permission usage is explained
- [ ] User data handling is transparent

---

## 🔍 Final Verification Commands

### Check Backend Logs Don't Expose Sensitive Data
```bash
# Make sure no OTP appears in production logs where users can see
# Only server-side console logs are acceptable
grep -r "otp" backend/
```

### Verify Mobile App Doesn't Display OTP
```bash
# Search for any OTP display in mobile code
grep -r "OTP is" mobile/app/
grep -r "json.otp" mobile/app/
```

### Test Production API
```bash
# Test OTP sending (should NOT return OTP in response)
curl -X POST https://your-api.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Response should be:
# {"ok":true,"expiresInMinutes":5,"cooldownSecs":60}
# WITHOUT the "otp" field
```

---

## 📱 Store Submission

### Android (Google Play)
1. Build release APK/AAB
2. Update version code and name
3. Test with internal testing track first
4. Submit for review
5. Respond to any policy questions about OTP/SMS usage

### iOS (App Store)  
1. Build release IPA
2. Update version and build number
3. Submit via App Store Connect
4. Provide test account if needed
5. Explain SMS permission usage in review notes

---

## 🆘 Emergency Rollback Plan

If issues are discovered in production:

1. **Immediately disable new user signups** if OTP is broken
2. **Rollback to previous version** via store emergency update
3. **Check backend logs** for errors
4. **Verify SMS gateway** is working
5. **Test in staging** before redeploying

---

## 📞 Support Contacts

- Backend Issues: [Your backend team contact]
- Mobile Issues: [Your mobile team contact]
- SMS Gateway Support: [Twilio/2Factor support]
- Database Issues: [Your DB admin contact]

---

Last Updated: December 21, 2025
