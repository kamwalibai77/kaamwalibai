# Translation Implementation Guide

## Overview

The app now supports 3 languages:

- **English** (en) - Default
- **Hindi** (hi) - हिंदी
- **Marathi** (mr) - मराठी

## Files Structure

```
mobile/
├── app/
│   ├── i18n/
│   │   ├── i18n.config.ts      # i18n configuration
│   │   └── translations.ts      # Translation dictionaries
│   ├── contexts/
│   │   └── LanguageContext.tsx  # Language context provider
│   └── hooks/
│       └── useAppTranslation.ts # Custom hook for translations
└── App.tsx                       # Wrapped with LanguageProvider
```

## How to Use Translations in Any Screen

### Method 1: Using useTranslation hook (Recommended)

```tsx
import { useTranslation } from "react-i18next";

export default function YourScreen() {
  const { t, i18n } = useTranslation();

  return (
    <View>
      <Text>{t("home")}</Text>
      <Text>{t("myServices")}</Text>
      <Text>{t("settings")}</Text>
    </View>
  );
}
```

### Method 2: Using custom useAppTranslation hook

```tsx
import { useAppTranslation } from "../hooks/useAppTranslation";

export default function YourScreen() {
  const { t } = useAppTranslation();

  return (
    <View>
      <Text>{t("save")}</Text>
      <Text>{t("cancel")}</Text>
    </View>
  );
}
```

## Available Translation Keys

### Common

- save, cancel, submit, edit, delete, confirm
- success, error, loading
- search, filter, yes, no, ok
- back, next, skip, done, close, select

### Auth/Login

- login, signup, phoneNumber, password
- enterPhoneNumber, enterPassword
- sendOTP, verifyOTP, enterOTP, resendOTP

### Navigation/Screens

- home, chat, myProfile, myServices
- settings, subscription, plans

### Profile

- personalDetails, address, notProvided
- gender, years, age, name, email
- editProfile, updatePersonalDetails
- completeKYC, verifyAccount
- logout, signOutAccount

### Services

- addService, editService, createService
- serviceName, serviceType, description
- price, duration, availability
- hourly, daily, monthly, rateAmount
- selectServiceType, selectRateType
- monday, tuesday, wednesday, thursday
- friday, saturday, sunday

### Messages

- messages, typeMessage, noMessages
- startConversation

### Settings

- language, notifications
- privacyPolicy, termsAndConditions
- aboutUs, helpAndSupport, version

### Reviews

- reviews, rating, writeReview
- submitReview, yourReview

## Adding New Translations

1. Open `mobile/app/i18n/translations.ts`
2. Add your new key to all three language objects:

```typescript
export const translations = {
  en: {
    // ... existing keys
    newKey: "New Text in English",
  },
  hi: {
    // ... existing keys
    newKey: "नया टेक्स्ट हिंदी में",
  },
  mr: {
    // ... existing keys
    newKey: "नवीन मजकूर मराठीत",
  },
};
```

3. Use it in your component:

```tsx
<Text>{t("newKey")}</Text>
```

## Language Selection

- Users can change language from ProfileScreen
- Language icon (🌐) in header opens language modal
- Selection is automatically saved to AsyncStorage
- Language persists across app restarts

## Screens Currently Using Translations

✅ ProfileScreen - Fully translated
✅ BottomTabs - All tab labels translated

## Next Steps to Fully Translate App

To translate remaining screens, add `useTranslation()` hook:

1. **HomeScreen**: Import hook and replace hardcoded strings
2. **LoginScreen**: Use t('login'), t('signup'), t('phoneNumber')
3. **ChatScreen**: Use t('messages'), t('typeMessage')
4. **SettingsScreen**: Use t('settings'), t('language'), t('notifications')
5. **AddServiceScreen**: Use service-related translation keys
6. **MyServicesScreen**: Use t('myServices'), t('addService')

Example for any screen:

```tsx
// Add import
import { useTranslation } from 'react-i18next';

// In component
const { t } = useTranslation();

// Replace text
<Text>Settings</Text>  →  <Text>{t('settings')}</Text>
<Text>Save</Text>      →  <Text>{t('save')}</Text>
```

## Testing

1. Open ProfileScreen
2. Click language icon (🌐)
3. Select Hindi or Marathi
4. Verify all translated screens update immediately
