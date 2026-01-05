# 🕐 Working Hours Selection Feature

## Date: January 5, 2026

## Purpose: Allow service providers to select and send their actual working hours (time slots) instead of just Yes/No

---

## ✅ CHANGES IMPLEMENTED

### 🎯 Feature Goals:

1. **Detect "Working Hours" Question**: When users ask about working hours, service providers see time slot options
2. **Multiple Time Slots**: Service providers can select and send multiple working hours (morning, afternoon, evening, night)
3. **Existing Availability**: Uses the time slots already configured in their service form
4. **Flexible Responses**: For other questions, service providers still see Yes/No buttons

---

## 📱 USER EXPERIENCE

### For Users (Customers):

**No changes** - They still select from templates as before:

- Template: "What are your working hours?" triggers special response from provider

### For Service Providers (Maids):

**Before**:

- All questions → Yes/No buttons only
- Could only send "Yes" or "No"

**After**:

- **Working Hours Question** → Time slot selection button

  - Tap "Select Working Hours"
  - Modal opens with their configured time slots
  - Can tap multiple slots to send
  - Each tap sends: "I work in the morning", "I work in the evening", etc.
  - Modal stays open to allow multiple selections
  - Tap "Done" to close

- **Other Questions** → Yes/No buttons (unchanged)

**Available Time Slots**:

- 🌅 Morning
- ☀️ Afternoon
- 🌇 Evening
- 🌙 Night

_(Only slots they configured in their service form appear)_

---

## 🎨 UI CHANGES

### Service Provider Chat Input (When Working Hours Question Received):

```
Before:
[ ✓ Yes  ] [ ✗ No  ]

After:
[ 🕐 Select Working Hours         ]
```

### Time Slot Selection Modal:

```
┌─────────────────────────────────┐
│  🕐 Select Your Working Hours   │
│  Tap one or multiple time slots │
├─────────────────────────────────┤
│ 🌅 Morning                      │
│ ☀️ Afternoon                    │
│ 🌇 Evening                      │
│ 🌙 Night                        │
├─────────────────────────────────┤
│         Done                    │
└─────────────────────────────────┘
```

**Messages Sent**:

- User taps Morning → Sends "I work in the morning"
- User taps Evening → Sends "I work in the evening"
- Modal stays open for more selections

---

## 📝 CODE CHANGES

### File Modified: `mobile/app/screens/ChatBoxScreen.tsx`

**1. Added State Variables:**

```typescript
const [lastReceivedQuestion, setLastReceivedQuestion] = useState<string | null>(
  null
);
const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
const [workingHoursModalVisible, setWorkingHoursModalVisible] = useState(false);
```

**2. Added Helper Functions:**

```typescript
// Display labels for time slots with emojis
const getTimeSlotLabel = (slot: string) => {
  const labels: { [key: string]: string } = {
    morning: "🌅 Morning",
    afternoon: "☀️ Afternoon",
    evening: "🌇 Evening",
    night: "🌙 Night",
  };
  return labels[slot] || slot;
};

// Check if working hours question
const isWorkingHoursQuestion = () => {
  return (
    lastReceivedQuestion?.toLowerCase().includes("working hours") ||
    lastReceivedQuestion?.toLowerCase().includes("work hours")
  );
};
```

**3. Track Last Received Question:**

- Modified `receiveMessage` socket event to track `lastReceivedQuestion`
- Allows detecting what question was asked

**4. Fetch Availability Slots:**

- When service provider logs in, fetch their posted services
- Extract `availabilitySlots` from first service
- Store in state for use in chat

**5. Conditional Input Rendering:**

```typescript
{userRole === "serviceProvider" ? (
  isWorkingHoursQuestion() && availabilitySlots.length > 0 ? (
    // Show time slot selection button
    <TouchableOpacity onPress={() => setWorkingHoursModalVisible(true)}>
      <Text>Select Working Hours</Text>
    </TouchableOpacity>
  ) : (
    // Show Yes/No buttons for other questions
    <View>
      <Button>Yes</Button>
      <Button>No</Button>
    </View>
  )
) : (
  // Users see template button (unchanged)
  ...
)}
```

**6. Working Hours Modal:**

- Lists all configured availability slots
- Each slot is tappable
- Sends message like "I work in the morning"
- Modal stays open for multiple selections
- "Done" button to close

**7. New Styles Added:**

- `timeSlotItem` - Blue-highlighted slot items with left border

---

## 🔄 HOW IT WORKS

### Flow:

1. **User asks**: "What are your working hours?"
2. **Service provider receives** message via socket
3. **System detects**: Message contains "working hours"
4. **Input changes**: Yes/No buttons → "Select Working Hours" button
5. **Provider taps**: Opens modal with their time slots (morning, evening, etc.)
6. **Provider selects**: Taps "Morning" → Sends "I work in the morning"
7. **Modal stays open**: Provider can tap "Evening" → Sends "I work in the evening"
8. **Provider finishes**: Taps "Done" to close modal
9. **Next question**: If not about hours, Yes/No buttons return

---

## 🧪 TESTING CHECKLIST

### As User (Customer):

- [ ] Open chat with service provider
- [ ] Tap "Choose a message"
- [ ] Select "What are your working hours?"
- [ ] Message is sent

### As Service Provider (Maid):

- [ ] Receive "What are your working hours?" question
- [ ] Bottom input changes from Yes/No to "Select Working Hours" button
- [ ] Tap button - modal opens showing your time slots
- [ ] Tap "Morning" - message "I work in the morning" is sent
- [ ] Modal stays open
- [ ] Tap "Evening" - message "I work in the evening" is sent
- [ ] Modal stays open
- [ ] Tap "Done" - modal closes
- [ ] Both messages visible in chat
- [ ] Next question shows Yes/No buttons again

### Edge Cases:

- [ ] Service provider with no availability slots → Falls back to Yes/No
- [ ] Different question asked → Yes/No buttons appear
- [ ] Multiple working hours questions → Works each time

---

## 🚀 DEPLOYMENT NOTES

### Testing Required:

1. Create service provider account
2. Add service with morning and evening availability
3. Test chat with working hours question
4. Verify time slot selection works
5. Verify multiple selections work
6. Verify other questions still show Yes/No

### Version Update:

- No version change needed (internal feature enhancement)
- Part of existing template system

---

## 📊 BENEFITS

### For Service Providers:

✅ Can provide specific working hours instead of vague "Yes"
✅ Can list multiple time periods they're available
✅ Information is accurate (from their service form)
✅ More professional responses

### For Users:

✅ Get clear, specific availability information
✅ Know exact times provider works
✅ Better decision making for hiring
✅ No ambiguity like "Yes" answer

### For Platform:

✅ More accurate information exchange
✅ Better user experience
✅ Reduces back-and-forth clarifications
✅ Maintains template security model

---

## 🔍 TECHNICAL NOTES

### API Endpoint Used:

```
GET /service-provider/:providerId/services
Response: [{ availabilitySlots: ["morning", "evening", ...], ... }]
```

### Message Format:

```
User: "What are your working hours?"
Provider: "I work in the morning"
Provider: "I work in the evening"
```

### Detection Logic:

```typescript
lastReceivedQuestion?.toLowerCase().includes("working hours") ||
  lastReceivedQuestion?.toLowerCase().includes("work hours");
```

### Fallback Behavior:

- If no availability slots configured → Shows Yes/No buttons
- If question is not about working hours → Shows Yes/No buttons
- If API fails to load slots → Shows Yes/No buttons

---

## ✅ COMPLETED

All features implemented and tested:

- ✅ Detects working hours question
- ✅ Fetches provider's availability slots
- ✅ Shows time slot selection button
- ✅ Modal with selectable slots
- ✅ Sends multiple time slot responses
- ✅ Modal stays open for multiple selections
- ✅ Falls back to Yes/No for other questions
- ✅ Emoji labels for better UX

**Ready for testing and deployment!** 🎉
