# 🚀 Google Play Store Submission Checklist - My Kaam Wali Bai

## ✅ Pre-Submission Checklist

### 📱 App Basics

#### 1. App Information
- [ ] **App Name**: My Kaam Wali Bai
- [ ] **Short Description** (80 chars max):
  ```
  Find trusted maids & household help. Connect with verified service providers.
  ```
- [ ] **Full Description** (4000 chars max):
  ```
  My Kaam Wali Bai connects users with verified household service providers.
  
  FOR USERS:
  • Find trusted maids, cooks, cleaners near you
  • View verified profiles with KYC
  • 3 FREE trial contacts
  • Affordable subscription plans
  • Direct communication with service providers
  • Ratings and reviews
  
  FOR SERVICE PROVIDERS:
  • Create professional profile
  • Complete KYC verification
  • List your services (cooking, cleaning, etc.)
  • Get matched with nearby customers
  • Manage bookings and availability
  
  FEATURES:
  ✓ OTP-based secure login
  ✓ Location-based service matching
  ✓ KYC verified service providers
  ✓ In-app communication
  ✓ Flexible subscription plans
  ✓ Secure payments via Razorpay
  
  Join thousands of users finding reliable household help!
  ```

#### 2. App Category
- [ ] **Primary Category**: Lifestyle
- [ ] **Secondary Category**: Business (optional)

#### 3. Target Audience
- [ ] **Age Rating**: PEGI 12+ or Teen
  - Contains user-generated content
  - Communication features
  - Real-world meeting facilitation
- [ ] **Target Audience Declaration**:
  - ✅ 18+: Users can interact and meet in person
  - ✅ Contains user profiles and contact info

---

## 🖼️ Graphics Assets (REQUIRED)

### Screenshots (CRITICAL - App will be rejected without these)
- [ ] **Minimum 2 screenshots required** (Recommended: 4-8)
- [ ] **Resolution**: 
  - Phone: 1080x1920 to 1080x2400 (16:9 to 9:16)
  - Tablet (if applicable): 1200x1920 to 1600x2560
  
**Recommended Screenshots**:
1. Home screen with service provider listings
2. Service provider profile with KYC badge
3. User profile screen
4. Search/filter interface
5. Subscription plans screen
6. Chat/contact screen (if applicable)

### Feature Graphic (REQUIRED)
- [ ] **Size**: 1024 x 500 pixels
- [ ] **Format**: PNG or JPEG
- [ ] **Design**: Showcase app name and key feature
- [ ] **No borders**: Full bleed design

### App Icon (REQUIRED)
- [ ] **Size**: 512 x 512 pixels
- [ ] **Format**: PNG (32-bit with transparency)
- [ ] **No rounded corners**: Google Play adds them automatically

### Optional Graphics
- [ ] Promo Video (YouTube link)
- [ ] Tablet screenshots (if supporting tablets)

---

## 📄 Required Policies & Links

### 1. Privacy Policy (MANDATORY)
- [ ] Upload PRIVACY_POLICY.md to your website
- [ ] Or host on GitHub Pages: `https://yourusername.github.io/privacy-policy`
- [ ] Or use free hosting: Firebase Hosting, Netlify, Vercel
- [ ] **Add Privacy Policy URL** in Play Console
- [ ] **Add Privacy Policy link IN APP**: Settings screen

### 2. Terms of Service (Optional but Recommended)
- [ ] Create terms_of_service.md
- [ ] Host publicly accessible URL
- [ ] Link in app Settings

### 3. Support Email (REQUIRED)
- [ ] Create: support@yourdomain.com or use Gmail
- [ ] Add in Play Console
- [ ] Monitor regularly for user issues

### 4. Website (Optional but Recommended)
- [ ] Create simple landing page
- [ ] Include: App description, features, download link
- [ ] Can use GitHub Pages (free)

---

## 🔐 Content Rating Questionnaire

### Content Declaration
Answer honestly in Play Console:

1. **Violence**: No
2. **Sexuality**: No
3. **Profanity**: No (unless user-generated)
4. **Controlled Substances**: No
5. **Discrimination**: No
6. **Gambling**: No
7. **User Interaction**: ✅ **YES**
   - Users can communicate
   - Users can share information
   - Users can create profiles
8. **Location Sharing**: ✅ **YES**
   - App uses location for matching
9. **Personal Information**: ✅ **YES**
   - Collects name, phone, address

**Expected Rating**: PEGI 12+ or Teen

---

## 🔒 App Access & Testing

### Test Account Information (REQUIRED for Review)
Provide in "App access" section:

```
TEST USER ACCOUNT:
Username/Phone: +919876543210
OTP: Check server console logs or database

TEST SERVICE PROVIDER ACCOUNT:
Username/Phone: +919876543211
OTP: Check server console logs or database

ADMIN PANEL ACCESS:
URL: https://your-admin-panel-url.com
Email: admin@test.com
Password: TestAdmin123

PAYMENT TESTING:
Use Razorpay test mode cards:
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
OTP: Any 6 digits (in test mode)

INSTRUCTIONS:
1. Start backend server
2. Request OTP - check backend console for OTP code
3. OTP expires in 5 minutes
4. KYC documents: Use sample images (provided in app)
5. Free trial: First 3 contacts are free
6. Subscription: Use test card for payment
```

### Special Access Instructions
- [ ] Mention backend server needs to be running
- [ ] Explain OTP retrieval process (console logs)
- [ ] Provide sample KYC documents if needed
- [ ] Explain free trial and subscription flow

---

## ⚙️ Technical Requirements

### 1. Target API Level
- [ ] **Target API 34** (Android 14) - Required as of August 2024
- [ ] Update in app.json or app config

### 2. App Bundle
- [ ] Use **.aab format** (not APK)
- [ ] Enable App Signing by Google Play

### 3. Permissions
Review and justify ALL permissions in app.json:

```json
{
  "permissions": [
    "INTERNET",              // API calls
    "CAMERA",                // Profile photos, KYC docs
    "READ_EXTERNAL_STORAGE", // Photo selection
    "WRITE_EXTERNAL_STORAGE",// Photo saving
    "ACCESS_FINE_LOCATION",  // Service matching
    "ACCESS_COARSE_LOCATION" // Service matching
  ]
}
```

**Permission Declarations**:
- [ ] Explain CAMERA: "Upload profile photos and KYC documents"
- [ ] Explain LOCATION: "Find service providers near you"
- [ ] Explain STORAGE: "Save and upload photos"

### 4. Sensitive Permissions (Extra Scrutiny)
- [ ] **Location**: Declare in Data Safety + explain in description
- [ ] **SMS/Phone**: OTP already handled (no direct SMS sending from app)
- [ ] **Camera/Storage**: For photos only (explain in-app)

---

## 🔔 Notifications & Ads

### Push Notifications
- [ ] If implemented: Declare in Data Safety
- [ ] Provide opt-out option in Settings
- [ ] Don't send promotional notifications without consent

### Advertisements
- [ ] If using ads: Declare all ad networks
- [ ] Ensure ads comply with Google policies
- [ ] No misleading ads

---

## 💳 In-App Purchases / Subscriptions

### Subscription Declaration
- [ ] **Product Name**: Premium Subscription
- [ ] **Price**: ₹299/month (or your pricing)
- [ ] **Features**:
  ```
  • Unlimited service provider contacts
  • Priority support
  • Ad-free experience (if applicable)
  • Advanced filters
  ```

### Razorpay Integration
- [ ] Ensure Razorpay is in test mode during review
- [ ] Provide test payment instructions
- [ ] Add "Powered by Razorpay" if required by their terms

---

## 🚫 Common Rejection Reasons (MUST FIX)

### 1. ❌ Missing Privacy Policy
**Fix**: 
- [ ] Upload PRIVACY_POLICY.md to public URL
- [ ] Add link in Play Console
- [ ] Add link in app Settings

### 2. ❌ Incomplete Data Safety Form
**Fix**: 
- [ ] Fill GOOGLE_PLAY_DATA_SAFETY.md completely
- [ ] Declare ALL data collection
- [ ] Be accurate (they test the app!)

### 3. ❌ OTP Security Issue
**Fix**: 
- [ ] ✅ Already fixed! OTP not shown on screen
- [ ] Verify DEBUG_OTP=false in production
- [ ] Test OTP flow works with backend logs

### 4. ❌ Insufficient Screenshots
**Fix**: 
- [ ] Upload at least 4 high-quality screenshots
- [ ] Show key features
- [ ] Include KYC verification screen

### 5. ❌ Target Audience Wrong
**Fix**: 
- [ ] Set to 18+ (users can meet in person)
- [ ] Declare user interaction features

### 6. ❌ KYC Document Handling
**Fix**: 
- [ ] Explain Aadhaar/PAN usage in Privacy Policy
- [ ] Get explicit consent before collecting
- [ ] Mention admin approval process

### 7. ❌ Payment Issues
**Fix**: 
- [ ] Use Google Play Billing OR clearly state using Razorpay
- [ ] Provide test payment flow
- [ ] Show pricing clearly

### 8. ❌ User-Generated Content
**Fix**: 
- [ ] Add reporting mechanism for inappropriate content
- [ ] Add user blocking feature
- [ ] Implement content moderation (admin panel)

---

## 📝 Store Listing Copy

### App Title (30 chars max)
```
My Kaam Wali Bai - Find Maids
```

### Short Description (80 chars)
```
Find trusted household help. Verified maids, cooks & cleaners near you.
```

### App Tags (Keywords)
```
maid service, household help, cleaning service, cook, domestic help, 
service provider, home services, verified maids, trusted help
```

---

## 🧪 Pre-Launch Testing

### Device Testing (Play Console)
- [ ] Enable Pre-launch Report
- [ ] Review crash reports
- [ ] Fix any critical issues

### Internal Testing Track
- [ ] Upload to Internal Testing FIRST
- [ ] Test with 5-10 real users
- [ ] Fix any bugs found
- [ ] Move to Closed Testing

### Closed Testing Requirements
- [ ] Add test users via email
- [ ] Minimum 14 days testing period recommended
- [ ] Gather feedback
- [ ] Fix critical bugs

---

## 🌐 Localization (Optional but Good)

- [ ] Add Hindi translations (बड़ी user base)
- [ ] Add app description in Hindi
- [ ] Add screenshots with Hindi UI

---

## 📧 Communication with Review Team

### If Rejected, Response Template:

```
Subject: Appeal for App Rejection - My Kaam Wali Bai

Dear Google Play Review Team,

Thank you for reviewing our app. We have addressed the issues mentioned:

[List each issue and how you fixed it]

1. Privacy Policy: Now hosted at [URL] and linked in app Settings
2. Data Safety: Updated to declare all data collection accurately
3. OTP Security: OTP is no longer displayed on screen, sent via SMS only
4. Screenshots: Added 6 high-quality screenshots showing key features
5. KYC Documents: Added explicit consent flow and usage explanation

We have thoroughly tested these changes and believe the app now complies 
with all Google Play policies.

Please re-review the app. We are available for any clarification.

Thank you,
[Your Name]
[Support Email]
```

---

## ✅ Final Verification Before Submission

- [ ] App doesn't crash on launch
- [ ] All features work as described
- [ ] Privacy Policy is accessible
- [ ] OTP flow works (check backend logs)
- [ ] Payment flow works (test mode)
- [ ] KYC upload works
- [ ] Free trial works (3 contacts)
- [ ] Subscription activation works
- [ ] User-Service Provider matching works
- [ ] No placeholder text or "Lorem Ipsum"
- [ ] No test data visible to users
- [ ] All images load properly
- [ ] App size is reasonable (<100MB preferred)

---

## 🆘 Emergency Contacts

- **Google Play Support**: https://support.google.com/googleplay/android-developer
- **Razorpay Support**: [Razorpay support email/phone]
- **Expo Forums**: https://forums.expo.dev
- **Stack Overflow**: Tag with `google-play` and `expo`

---

## 📅 Timeline Expectations

1. **Internal Testing Upload**: Immediate
2. **Internal Testing Review**: 1-2 hours
3. **Closed Testing Upload**: Immediate after internal approval
4. **Closed Testing Review**: 24-48 hours
5. **Production Review** (when ready): 3-7 days
6. **Re-review** (after rejection fixes): 24-48 hours

---

## 💡 Pro Tips

1. **Start with Internal Testing** - Find bugs early
2. **Be Patient** - Reviews take time, especially first submission
3. **Be Thorough** - Fix ALL issues in Data Safety form
4. **Be Honest** - Don't hide data collection
5. **Respond Quickly** - Fix and resubmit within 7 days of rejection
6. **Keep Testing** - User feedback is valuable

---

Last Updated: December 21, 2025

**Good Luck with Your Submission! 🚀**
