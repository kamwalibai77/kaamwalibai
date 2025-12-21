# 📋 Google Play Data Safety Form - My Kaam Wali Bai

## Required Declarations for Your App

### 1. **Does your app collect or share user data?**
✅ **YES** - You collect phone numbers, names, addresses, KYC documents, etc.

---

## 📱 Data Collection Details

### Personal Information
| Data Type | Collected | Shared | Purpose | Optional/Required |
|-----------|-----------|--------|---------|-------------------|
| **Name** | ✅ Yes | ❌ No | Account Management, App Functionality | Required |
| **Phone Number** | ✅ Yes | ❌ No | Authentication (OTP), Communication | Required |
| **Address** | ✅ Yes | ❌ No | Service Matching, Location-based Services | Required |
| **Email** (if any) | ⚠️ Check | ❌ No | Account Management | Optional |
| **Photos** | ✅ Yes | ❌ No | Profile Pictures, KYC Verification | Required for Service Providers |

### Location
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **Approximate Location** | ✅ Yes | ❌ No | Service Matching |
| **Precise Location** | ⚠️ Yes (if using GPS) | ❌ No | Service Provider Matching |

### Financial Information
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **Payment Info** | ❌ No (via Razorpay) | ❌ No | Handled by Razorpay |
| **Purchase History** | ✅ Yes | ❌ No | Subscription Management |

### Files and Documents
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **Photos** | ✅ Yes | ❌ No | Profile Pictures, KYC Documents |
| **Documents** | ✅ Yes | ❌ No | Aadhaar, PAN for KYC |

### Messages
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **In-app Messages** | ✅ Yes (if chat feature) | ❌ No | User-Service Provider Communication |

### App Activity
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **App Interactions** | ✅ Yes | ❌ No | Analytics, Service Matching |
| **Search History** | ✅ Yes | ❌ No | Service Recommendations |

---

## 🔒 Security Practices

### Data Encryption
✅ **Data is encrypted in transit** (HTTPS)
✅ **Data is encrypted at rest** (Database encryption)

### Data Deletion
✅ **Users can request data deletion** 
- Implement account deletion feature
- Show how users can request deletion

### Data Retention Policy
- **Active Accounts**: Data retained while account is active
- **Deleted Accounts**: Data deleted within 30 days
- **KYC Documents**: Retained for legal compliance (may vary by jurisdiction)

---

## 📝 Data Safety Form Answers

### Question 1: Does your app collect or share any of the required user data types?
**Answer**: ✅ YES

### Question 2: Is all of the user data collected by your app encrypted in transit?
**Answer**: ✅ YES (using HTTPS/SSL)

### Question 3: Do you provide a way for users to request that their data is deleted?
**Answer**: ✅ YES
- Settings > Delete Account
- Or email support request

### Question 4: Data Collection Purpose
Select ALL that apply:
- ✅ App functionality
- ✅ Account management
- ✅ Fraud prevention, security, and compliance
- ❌ Advertising or marketing
- ❌ Analytics
- ❌ Developer communications

### Question 5: Is data collection optional or required?
- **Phone Number**: Required (for OTP authentication)
- **Name**: Required (for profile)
- **Address**: Required (for service matching)
- **Photos**: Optional (profile picture), Required (KYC for service providers)
- **Location**: Required (for service matching)

---

## ⚠️ IMPORTANT NOTES

1. **Be 100% Accurate**: Any mismatch between declarations and actual app behavior = rejection
2. **KYC Documents**: Declare Aadhaar/PAN collection under "Government IDs"
3. **Razorpay**: Since payment is handled by third-party, you don't collect payment info directly
4. **User-Generated Content**: If users can message each other, declare it
5. **Location**: If you collect lat/long coordinates, it's "Precise Location"

---

## 🔄 After Submission

If rejected, common reasons:
1. **Missing declarations** - Add all data types you collect
2. **Incorrect encryption claims** - Ensure HTTPS everywhere
3. **Missing deletion option** - Implement in Settings
4. **Privacy Policy missing/incomplete** - Must cover all declared data
