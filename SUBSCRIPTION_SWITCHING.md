# Automatic Company Switching for Expired Subscriptions

## Overview
This feature automatically switches to another company when the current company's subscription has expired, ensuring users can continue using the application without interruption.

## How It Works

### 1. Login Flow
- When an owner logs in, the system checks the subscription status of their default/last selected company
- If the subscription is expired (`is_subscription_valid: false` with message containing 'expired'), the system automatically searches for another company with a valid subscription
- If a valid company is found, it becomes the active company
- If no valid companies are found, login fails with an appropriate error message

### 2. Company Switching
- When manually switching companies, the system validates the target company's subscription
- If the target company's subscription is expired, it automatically finds and switches to a valid alternative
- The user is transparently switched to a company with a valid subscription

### 3. Periodic Validation
- For owners, the system periodically checks (every 5 minutes) if the current company's subscription is still valid
- If the subscription expires while the user is logged in, they are automatically switched to another valid company

## Key Components

### API Functions
- `handleOwnerCompanySelection()` - Validates subscription during login and selects appropriate company
- `getSubscriptionStatus()` - Checks subscription status for a specific company

### Utility Functions
- `validateAndSwitchCompany()` - Main function that validates current company and switches if needed
- `isCompanySubscriptionValid()` - Checks if a specific company has valid subscription

### Context Updates
- `CompanyContext` - Enhanced to handle subscription validation during company operations
- `AuthContext` - Updated to use new company selection logic during login

## Subscription Validation Logic

A subscription is considered **invalid** when:
- `is_subscription_valid` is explicitly `false`
- `subscription_message` contains the word 'expired' (case-insensitive)

Example invalid response:
```json
{
  "is_subscription_valid": false,
  "subscription_message": "Your subscription has expired. Please renew to continue."
}
```

## Error Handling
- If subscription check fails due to network/API errors, the system defaults to allowing access (fail-safe)
- If no valid companies are found, appropriate error messages are shown
- All subscription checks are wrapped in try-catch blocks to prevent application crashes

## Testing
Use the `SubscriptionSwitchTest` component to manually test the validation and switching logic:
```jsx
import SubscriptionSwitchTest from '../components/SubscriptionSwitchTest';
```

## Configuration
- Periodic check interval: 5 minutes (configurable in CompanyContext)
- Only applies to users with admin type 'Owner' or 'owner'
- Requires multiple companies for switching to work effectively