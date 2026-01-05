# 📞 Contact Request Feature - Implementation Summary

## Date: January 5, 2026

## Purpose: Secure contact number sharing with approval workflow

---

## ✅ FEATURE OVERVIEW

### 🎯 Problem Solved:

- Users want to contact service providers
- Contact numbers shouldn't be visible immediately (privacy/security)
- Service providers should control who can call them
- Prevents spam and harassment

### 🔄 Workflow:

```
USER (Customer)                     SERVICE PROVIDER (Maid)
     │                                      │
     ├─ Clicks call icon                   │
     │  or selects template                │
     │  "Can you share your               │
     │   contact number?"                  │
     │                                     │
     ├─ Confirms request ─────────────────>│
     │                                     │
     │                              ┌──────┴──────┐
     │                              │ Modal appears│
     │                              │ Approve/     │
     │                              │ Decline      │
     │                              └──────┬──────┘
     │                                     │
     │<───── Approval/Rejection ───────────┤
     │                                     │
   ┌─┴─────────────┐                     │
   │ If APPROVED:  │                     │
   │ Call icon     │                     │
   │ becomes active│                     │
   │ Can call      │                     │
   └───────────────┘                     │
                                         │
   ┌─────────────┐                      │
   │ If REJECTED:│                      │
   │ Can request │                      │
   │ again       │                      │
   └─────────────┘                      │
```

---

## 📱 USER EXPERIENCE

### For Users (Customers):

#### 1. **Before Request:**

- Call icon shows as **outline** (⭕ call-outline)
- Tapping shows confirmation dialog

#### 2. **Request Sent:**

- Call icon changes to **clock** (⏱️ time)
- Tapping shows "Request Pending" message
- Cannot send duplicate requests

#### 3. **Request Approved:**

- Call icon changes to **filled** (📞 call)
- Tapping directly dials service provider
- Contact number is now accessible

#### 4. **Request Rejected:**

- Icon resets to outline
- Can send new request

#### 5. **Template Message:**

- New template added: "Can you share your contact number?"
- Sends message AND contact request simultaneously

---

### For Service Providers (Maids):

#### 1. **Receive Request:**

- Modal automatically pops up
- Shows: "Contact Request"
- Shows requester's name
- Two buttons: **Decline** | **Approve**

#### 2. **Decline:**

- Modal closes
- User is notified
- No contact shared

#### 3. **Approve:**

- Modal closes
- User can now call
- Success message shown

---

## 🔧 TECHNICAL IMPLEMENTATION

### Frontend Changes (`mobile/app/screens/ChatBoxScreen.tsx`)

#### 1. **New State Variables:**

```typescript
const [contactRequestSent, setContactRequestSent] = useState(false);
const [contactRequestApproved, setContactRequestApproved] = useState(false);
const [pendingContactRequest, setPendingContactRequest] = useState<any>(null);
const [contactApprovalModalVisible, setContactApprovalModalVisible] =
  useState(false);
```

#### 2. **Updated Message Templates:**

```typescript
const messageTemplates = [
  // ... existing templates
  "Can you share your contact number?", // NEW
];
```

#### 3. **Modified Call Button Logic:**

- **Before:** Direct call API fetch
- **After:**
  - If approved → Call directly
  - If pending → Show "Request Pending"
  - If not requested → Show confirmation & send request

#### 4. **Socket Listeners Added:**

- `contactRequest` - Service provider receives request
- `contactRequestApproved` - User notified of approval
- `contactRequestRejected` - User notified of rejection

#### 5. **New Modal Component:**

- Contact Approval Modal (for service providers)
- Shows when request received
- Approve/Decline buttons
- Auto-closes on action

---

### Backend Changes (`backend/sockets/socket.js`)

#### 1. **New Socket Events:**

**`contactRequest`** - Receives contact request from user

```javascript
socket.on("contactRequest", async (data) => {
  // Fetch requester name from database
  // Emit to provider with request details
});
```

**`contactRequestResponse`** - Receives approval/rejection from provider

```javascript
socket.on("contactRequestResponse", async (data) => {
  if (approved) {
    // Emit approval to requester
  } else {
    // Emit rejection to requester
  }
});
```

#### 2. **Data Flow:**

```
User → contactRequest → Backend → Provider
Provider → contactRequestResponse → Backend → User
```

---

## 🎨 UI COMPONENTS

### Call Button States:

| State         | Icon          | Color | Behavior                      |
| ------------- | ------------- | ----- | ----------------------------- |
| Not Requested | call-outline  | White | Shows confirmation dialog     |
| Pending       | time          | White | Shows "Request Pending" alert |
| Approved      | call (filled) | White | Makes phone call directly     |

### Contact Approval Modal:

```
┌─────────────────────────────────┐
│          📞                     │
│     Contact Request             │
│                                 │
│  [Name] wants to request your   │
│  contact number                 │
│                                 │
│  [Decline]      [Approve]       │
└─────────────────────────────────┘
```

**Styling:**

- Decline: Red button (#ef4444)
- Approve: Green button (#10b981)
- Center-aligned with icon
- Modal overlay with blur

---

## 🔒 SECURITY FEATURES

### 1. **Privacy Protection:**

- Contact number hidden by default
- Requires explicit approval
- Service provider has full control

### 2. **Spam Prevention:**

- User can't send multiple simultaneous requests
- Service provider can decline
- No automatic approval

### 3. **Harassment Prevention:**

- Service provider screens all requests
- Can decline suspicious users
- No forced sharing

### 4. **Data Security:**

- Request data sent via secure WebSocket
- No database storage needed (real-time only)
- Requester name fetched from verified DB

---

## 🧪 TESTING CHECKLIST

### As User (Customer):

**Scenario 1: Request via Call Icon**

- [ ] Open chat with service provider
- [ ] Click call icon (outline)
- [ ] Confirmation dialog appears
- [ ] Click "Request"
- [ ] Icon changes to clock
- [ ] Alert shows "Request Sent"
- [ ] Wait for provider approval

**Scenario 2: Request via Template**

- [ ] Open chat
- [ ] Click "Choose a message"
- [ ] Select "Can you share your contact number?"
- [ ] Message sends
- [ ] Call icon changes to clock
- [ ] Request sent

**Scenario 3: After Approval**

- [ ] Receive approval notification
- [ ] Call icon becomes filled
- [ ] Click call icon
- [ ] Phone dialer opens with number

**Scenario 4: After Rejection**

- [ ] Receive rejection notification
- [ ] Call icon resets to outline
- [ ] Can request again

---

### As Service Provider (Maid):

**Scenario 1: Receive Request**

- [ ] User sends contact request
- [ ] Modal automatically appears
- [ ] Shows requester name
- [ ] Two buttons visible

**Scenario 2: Approve Request**

- [ ] Click "Approve"
- [ ] Success alert appears
- [ ] Modal closes
- [ ] User can now call

**Scenario 3: Decline Request**

- [ ] Click "Decline"
- [ ] Modal closes
- [ ] User notified
- [ ] Contact not shared

**Scenario 4: Multiple Requests**

- [ ] Receive request from User A
- [ ] Approve/Decline
- [ ] Receive request from User B
- [ ] Each handled independently

---

### Edge Cases:

- [ ] **User offline when approved:** Notification shown when reconnects
- [ ] **Provider offline when requested:** Request queued, shown on connect
- [ ] **Multiple simultaneous requests:** Only latest shown
- [ ] **Request during blocked state:** Should not be allowed (add check)
- [ ] **Network interruption:** Request resent on reconnect

---

## 📊 DATABASE CONSIDERATIONS

### Current: Real-time Only (No Persistence)

**Pros:**

- Simple implementation
- No database changes needed
- Real-time notifications

**Cons:**

- Requests lost if offline
- No history tracking
- Can't review past requests

### Future Enhancement: Add Database Table

**Recommended Schema:**

```sql
CREATE TABLE contact_requests (
  id SERIAL PRIMARY KEY,
  requester_id INT REFERENCES users(id),
  provider_id INT REFERENCES users(id),
  status ENUM('pending', 'approved', 'rejected'),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);
```

**Benefits:**

- Persistent request history
- Offline request queuing
- Analytics/reporting
- Prevent duplicate requests

---

## 🚀 DEPLOYMENT NOTES

### Version Update:

Update `mobile/app.json`:

```json
{
  "version": "1.0.3",
  "android": {
    "versionCode": 11
  }
}
```

### Release Notes:

```
v1.0.3:
- Added secure contact request feature
- Users can request service provider contact numbers
- Service providers approve/decline requests
- Enhanced privacy and security
```

### Backend Deployment:

- No database changes required
- Socket changes are live immediately
- Restart backend server to apply changes

---

## 💡 FUTURE ENHANCEMENTS

### Phase 2:

1. **Request Expiry:** Auto-reject after 24 hours
2. **Request Limit:** Max 3 pending requests per user
3. **Block Integration:** Blocked users can't request
4. **Push Notifications:** Alert provider even if app closed
5. **Request History:** Show past requests in settings

### Phase 3:

1. **Auto-Approve:** Service providers can set auto-approve for verified users
2. **Conditional Sharing:** Share contact only during work hours
3. **Temporary Access:** Contact visible for 24 hours only
4. **Premium Feature:** Make contact requests paid feature
5. **Analytics:** Track approval/rejection rates

---

## 📝 GOOGLE PLAY NOTES

### Privacy Policy Update Required:

```
CONTACT INFORMATION SHARING:

Users can request contact information from service providers.
Service providers have full control over who can access their
contact information. All requests require explicit approval.

Contact information is only shared after provider consent and
is used solely for work-related communication.
```

### Store Listing Update:

```
PRIVACY FEATURES:
✓ Secure contact request system
✓ Service provider approval required
✓ No automatic contact sharing
✓ Full privacy control for all users
```

---

## ⚠️ IMPORTANT NOTES

### Current Limitations:

1. ⚠️ **No persistence:** Requests lost if app closed
2. ⚠️ **No history:** Can't view past requests
3. ⚠️ **No rate limiting:** Users can spam requests (after rejection)
4. ⚠️ **No block check:** Blocked users can still request

### Recommended Improvements:

1. Add database table for persistence
2. Implement rate limiting (max 3 requests/day per pair)
3. Check block status before allowing request
4. Add request expiry (auto-reject after 24h)

---

## 🔄 ROLLBACK PROCEDURE

If issues occur:

1. **Frontend rollback:**

   ```bash
   git checkout <previous-commit>
   cd mobile && npx eas build --platform android
   ```

2. **Backend rollback:**

   ```bash
   git checkout <previous-commit>
   # Restart server
   ```

3. **Quick fix:** Comment out socket listeners in ChatBoxScreen.tsx

---

**Status**: ✅ Implementation complete
**Testing**: Required before production
**Priority**: Medium - Nice-to-have feature
**Risk**: Low - No breaking changes to existing functionality
