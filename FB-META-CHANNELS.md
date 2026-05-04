# Facebook / Messenger / Facebook Page Integration - Technical Guide

This document outlines the technical implementation of Facebook integration in PaintAI, following the "omnichannel" approach for Messenger and Page Feed (Comments).

## 1. Features Supported
- **Messenger Messaging**: Receive and reply to messages in the Page inbox.
- **Page Feed Comments**: Receive and reply to comments on Page posts.
- **Post Publishing**: Create posts with text, images, and videos on the Page timeline.
- **Analytics & Metrics**: Fetch Page and Post-level insights.

## 2. Configuration (Environment Variables)
Ensure the following variables are set in your `.env` file:

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
MESSENGER_TRIGGER_ENABLED=true
```

## 3. Webhook Setup
Webhooks are essential for real-time messaging and comment handling.

### URL Structure
Each connected Facebook channel has a unique webhook URL:
`{PUBLIC_API_ORIGIN}/v1/triggers/messenger/webhook/{channel_id}`

### Handshake (Verification)
1. In Meta Developer Console -> App -> Webhooks.
2. Select **Page** object.
3. Click **Configure a Webhook**.
4. Callback URL: Copy from the settings page in PaintAI.
5. Verify Token: Copy from the settings page in PaintAI (generated uniquely for each channel).

### Subscription Fields
Subscribe to the following fields for full functionality:
- `messages` (for Messenger)
- `messaging_postbacks` (for Messenger buttons)
- `feed` (for Page comments)

## 4. Technical Architecture

### Backend Components
- **`FacebookMessengerController`**: Handles the public endpoints for Meta webhooks (GET for handshake, POST for events).
- **`MessengerService`**: Parses incoming events (Messenger messaging or Feed changes) and executes business logic (e.g., AI response generation).
- **`FacebookAdapter`**: Handles Graph API interactions like token exchange, posting, and fetching metrics.

### OAuth Flow
1. User clicks "Connect Facebook" in Settings.
2. Backend generates OAuth URL with scopes: `pages_show_list`, `pages_manage_posts`, `pages_manage_engagement`, `pages_read_engagement`, `read_insights`, `pages_messaging`, `pages_manage_metadata`.
3. After callback, backend exchanges code for a **Long-lived Page Access Token**.
4. A unique `verifyToken` is generated and stored in the channel metadata.

## 5. Security
- **X-Hub-Signature-256**: (Planned) Validate that incoming requests are signed by Meta using the `FACEBOOK_APP_SECRET`.
- **Verify Token**: Ensures that only your Meta App can link to the specific channel.

## 6. Known Limitations
- **Page Permissions**: The user must be an Admin of the Facebook Page to grant all necessary permissions.
- **App Review**: To use `pages_messaging` and `pages_manage_posts` in production, the Meta App must pass App Review.
