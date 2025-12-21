# 🚨 CRITICAL: app.json Issues to Fix Immediately

## ❌ Problems Found in Your Current app.json

### 1. **DANGEROUS: SMS Permissions (WILL CAUSE REJECTION)**

```json
"RECEIVE_SMS",
"READ_SMS"
```

**Problem**: Google Play is VERY strict about SMS/Call permissions

- Apps need special declaration for SMS permissions
- Must have primary functionality requiring SMS
- OTP apps should use SMS Retriever API (not direct SMS reading)

**Impact**: 🚫 **INSTANT REJECTION** without proper justification

**Solution**: ❌ **REMOVE** these permissions (you're using via backend, not reading SMS directly)

---

### 2. **CALL_PHONE Permission - Needs Justification**

```json
"CALL_PHONE"
```

**Problem**: Requires explanation for why app needs to make calls
**Better Alternative**: Use `tel:` intent (opens dialer, user makes call)

---

### 3. **Duplicate Permissions**

Your permissions list has duplicates - clean it up.

---

### 4. **Missing Privacy Policy Link**

app.json doesn't include privacy policy link

---

### 5. **Missing Target SDK**

Must specify Android Target SDK 34 (Android 14)

---

## ✅ CORRECTED app.json

Replace your current app.json with this:

\`\`\`json
{
"expo": {
"name": "My Kaam Wali Bai",
"slug": "maid-service-app",
"version": "1.0.0",
"orientation": "portrait",
"icon": "./assets/images/logo.png",
"scheme": "maidserviceapp",
"userInterfaceStyle": "automatic",
"newArchEnabled": true,
"splash": {
"image": "./assets/images/splash-icon.png",
"resizeMode": "contain",
"backgroundColor": "#ffffff"
},
"description": "Connect with verified household service providers. Find trusted maids, cooks, and cleaners near you.",
"privacy": "public",
"ios": {
"supportsTablet": true,
"bundleIdentifier": "com.vrdata.kaamwalibai.app",
"buildNumber": "1.0.0",
"infoPlist": {
"NSAppTransportSecurity": {
"NSAllowsArbitraryLoads": false
},
"NSCameraUsageDescription": "We need camera access to upload profile photos and KYC documents (Aadhaar, PAN cards) for service provider verification.",
"NSPhotoLibraryUsageDescription": "We need photo library access to select and upload profile pictures and identity documents.",
"NSLocationWhenInUseUsageDescription": "We need your location to find and match you with service providers near your area.",
"NSLocationAlwaysUsageDescription": "We need location access to continuously provide relevant service providers in your area."
}
},
"android": {
"package": "com.vrdata.kaamwalibai.app",
"versionCode": 8,
"compileSdkVersion": 34,
"targetSdkVersion": 34,
"adaptiveIcon": {
"foregroundImage": "./assets/images/logo.png",
"backgroundColor": "#ffffff"
},
"permissions": [
"ACCESS_FINE_LOCATION",
"ACCESS_COARSE_LOCATION",
"CAMERA",
"READ_MEDIA_IMAGES",
"READ_EXTERNAL_STORAGE",
"WRITE_EXTERNAL_STORAGE"
],
"permissionsDescription": {
"ACCESS_FINE_LOCATION": "Required to find service providers near you and provide location-based matching",
"ACCESS_COARSE_LOCATION": "Required to find service providers in your area",
"CAMERA": "Required to capture and upload profile photos and KYC verification documents (Aadhaar, PAN)",
"READ_MEDIA_IMAGES": "Required to select photos from your gallery for profile pictures and document uploads",
"READ_EXTERNAL_STORAGE": "Required to access photos from device storage for profile and document uploads",
"WRITE_EXTERNAL_STORAGE": "Required to save downloaded images and documents"
},
"blockedPermissions": [
"CALL_PHONE",
"READ_SMS",
"RECEIVE_SMS",
"SEND_SMS",
"READ_PHONE_STATE",
"WRITE_CALL_LOG",
"READ_CALL_LOG"
],
"edgeToEdgeEnabled": true,
"googleServicesFile": "./google-services.json"
},
"web": {
"bundler": "metro",
"output": "static",
"favicon": "./assets/images/icon.jpeg"
},
"plugins": [
"expo-router",
[
"expo-splash-screen",
{
"image": "./assets/images/splash-icon.png",
"imageWidth": 200,
"resizeMode": "contain",
"backgroundColor": "#ffffff"
}
],
[
"expo-location",
{
"locationAlwaysAndWhenInUsePermission": "We need your location to find service providers near you."
}
],
[
"expo-camera",
{
"cameraPermission": "We need camera access to upload profile photos and KYC documents."
}
],
[
"expo-image-picker",
{
"photosPermission": "We need photo library access to select profile pictures and documents."
}
],
"expo-localization",
"expo-web-browser"
],
"experiments": {
"typedRoutes": true
},
"extra": {
"router": {},
"apiUrl": "https://kaamwalibai.onrender.com",
"eas": {
"projectId": "dfe61dd9-ea80-41be-8dff-720ad4f197cd"
}
},
"owner": "mohit_pote01",
"runtimeVersion": {
"policy": "appVersion"
},
"updates": {
"url": "https://u.expo.dev/dfe61dd9-ea80-41be-8dff-720ad4f197cd"
},
"primaryColor": "#6366f1"
}
}
\`\`\`

---

## 🔑 Key Changes Made

### ✅ 1. Removed Dangerous Permissions

- ❌ Removed `RECEIVE_SMS`
- ❌ Removed `READ_SMS`
- ❌ Removed `CALL_PHONE`
- ✅ Added `blockedPermissions` to explicitly block them

### ✅ 2. Added Permission Descriptions

- Clear explanation for each permission
- Required for Google Play review

### ✅ 3. Updated Android Target

- `compileSdkVersion`: 34
- `targetSdkVersion`: 34
- Required for new apps (Aug 2024+)

### ✅ 4. Added Modern Permission

- `READ_MEDIA_IMAGES` for Android 13+
- Replaces READ_EXTERNAL_STORAGE on newer devices

### ✅ 5. Removed Duplicates

- Cleaned up permission list

### ✅ 6. Added Plugin Configurations

- Proper permission descriptions in plugins
- Better documentation

### ✅ 7. Security Improvement

- iOS: Changed `NSAllowsArbitraryLoads` to `false`
- Use HTTPS only (more secure)

---

## 🚨 Why SMS/Call Permissions Cause Rejection

Google Play has **strict policies** for SMS and Call permissions:

### SMS Permissions (READ_SMS, RECEIVE_SMS)

**Allowed only if**:

- App's core functionality requires SMS (like SMS app, backup app)
- Must be default SMS handler OR
- Must have user-visible SMS feature

**Your app**: ❌ Doesn't qualify

- OTP is sent from backend server
- App doesn't display SMS messages
- SMS reading is not a core feature

### CALL_PHONE Permission

**Allowed only if**:

- App makes calls as core functionality
- Better alternative: Use `tel:` intent

**Your app**: Can use dial intent instead

```typescript
Linking.openURL(\`tel:${phoneNumber}\`)
```

---

## 📱 Alternative for Phone Calls

Instead of CALL_PHONE permission, use intent:

\`\`\`typescript
import { Linking } from 'react-native';

// Open dialer with number (no permission needed)
const makeCall = (phoneNumber: string) => {
Linking.openURL(\`tel:${phoneNumber}\`);
};
\`\`\`

This:

- ✅ Opens device dialer
- ✅ User explicitly presses call button
- ✅ No permission needed
- ✅ Google Play approved

---

## 🔧 How to Update

1. **Backup current app.json**
   \`\`\`bash
   cp mobile/app.json mobile/app.json.backup
   \`\`\`

2. **Replace with corrected version**

   - Use the app.json above

3. **Clean and rebuild**
   \`\`\`bash
   cd mobile
   rm -rf node_modules
   npm install
   npx expo prebuild --clean
   \`\`\`

4. **Test locally**
   \`\`\`bash
   npx expo start
   \`\`\`

5. **Build for production**
   \`\`\`bash
   eas build --platform android --profile production
   \`\`\`

---

## ✅ After Update Checklist

- [ ] App runs without crashes
- [ ] Camera works (profile photo)
- [ ] Photo picker works (KYC upload)
- [ ] Location works (service matching)
- [ ] Phone number tap opens dialer (if implemented)
- [ ] No permission errors in logs
- [ ] OTP works (backend SMS sending)

---

## 📋 Google Play Console - Permission Declaration

When submitting, you'll need to explain permissions:

### Location (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)

**Explanation**:

> "This permission is required to find and match users with service providers
> in their nearby area. Location data is used only for service matching and
> is not shared with third parties. Users can disable location access, but
> this will limit app functionality."

### Camera (CAMERA)

**Explanation**:

> "Camera permission is required to capture profile photos and KYC verification
> documents (Aadhaar card, PAN card) for service provider verification. Photos
> are uploaded securely and used only for identity verification."

### Storage (READ_EXTERNAL_STORAGE, READ_MEDIA_IMAGES)

**Explanation**:

> "Storage permission is required to select photos from device gallery for
> profile pictures and KYC document uploads. Only user-selected photos are
> accessed."

---

## 🚫 What NOT to Do

1. ❌ **Don't** request SMS permissions unless absolutely necessary
2. ❌ **Don't** use CALL_PHONE for basic dialing
3. ❌ **Don't** request unnecessary permissions "just in case"
4. ❌ **Don't** have duplicate permissions
5. ❌ **Don't** forget permission descriptions

---

## 📞 If You Really Need SMS Permissions

If you absolutely need SMS permissions:

1. **Submit Declaration Form**:

   - Explain why SMS is core functionality
   - Provide video demonstration
   - Show prominent feature

2. **Requirements**:

   - Must be default SMS app OR
   - Must have user-facing SMS feature
   - Must justify in app description

3. **Your case**:
   - ❌ OTP via backend doesn't qualify
   - ✅ Current implementation is correct (no SMS permission)

---

## 🎯 Summary

**CRITICAL ACTIONS**:

1. ✅ Update app.json with corrected version above
2. ✅ Remove SMS and CALL permissions
3. ✅ Add permission descriptions
4. ✅ Update target SDK to 34
5. ✅ Test thoroughly before submitting

**Result**: Much higher approval chance! 🚀

---

Last Updated: December 21, 2025
