```text
███╗░░░███╗░█████╗░██████╗░███████╗░█████╗░██████╗░
████╗░████║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗
██╔████╔██║███████║██████╔╝███████╗██║░░██║██████╔╝
██║╚██╔╝██║██╔══██║██╔══██╗╚════██║██║░░██║██╔══██╗
██║░╚═╝░██║██║░░██║██║░░██║███████║╚█████╔╝██║░░██║
╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝░╚════╝░╚═╝░░╚═╝
```

# Marsor - Autonomous AI Agent

> An autonomous, intelligent WhatsApp agent powered by Google Generative AI, Playwright, and Node.js. Marsor is designed to autonomously handle complex tasks, web browsing, service inquiries, and M-Pesa payments through a conversational WhatsApp interface.

---

## Overview

**Marsor** is an advanced autonomous AI assistant that connects to the [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) via webhooks. Unlike traditional scripted bots, Marsor leverages large language models and web automation to provide dynamic, intelligent support. 

Key capabilities include:
- **Autonomous Reasoning:** Powered by `@google/generative-ai` to understand complex user requests, maintain context, and execute multi-step tasks.
- **Web Browsing:** Integrates with **Playwright** to navigate the web, research information, and automate browser tasks on behalf of the user.
- **Seamless Payments:** Handles M-Pesa STK Push payments via the [Safaricom Daraja API](https://developer.safaricom.co.ke/) with real-time callback notifications pushed to clients over Socket.IO.
- **Conversational Interface:** Interacts naturally with users on WhatsApp, handling inquiries, user registration, and providing support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Language | TypeScript 5.8 |
| AI Engine | `@google/generative-ai` |
| Web Automation | Playwright 1.61 |
| Framework | Express 5.2 |
| Database | MongoDB via Mongoose 8.24 |
| Real-time | Socket.IO 4.8 |
| Dev Server | `tsx watch` |

---

## Project Structure

```
src/
├── index.ts              # Server entry - Express, Socket.IO, MongoDB, routes
├── bot/                  # WhatsApp message routing & state management
├── services/             # Core services (M-Pesa, SMS, AI integration)
├── whatsapp/             # Meta Cloud API integration
├── routes/               # Express endpoints (webhooks, payments)
└── models/               # Mongoose schemas
scripts/
├── agent-cli.ts          # CLI interface for Marsor agent testing
├── agent-daemon.ts       # Background daemon for autonomous tasks
└── subscribe-waba.ts     # Script to subscribe to WhatsApp Business App webhooks
```

---

## Prerequisites

- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Meta Developer Account](https://developers.facebook.com/) with a WhatsApp Business App
- A [Safaricom Daraja Account](https://developer.safaricom.co.ke/) (sandbox is fine)
- [ngrok](https://ngrok.com/) (for local webhook exposure)
- A Google Gemini API Key

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/BKerio/bot.git
cd bot
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# AI Integration
GEMINI_API_KEY=your_gemini_api_key

# WhatsApp
WHATSAPP_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Server
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/marsor-bot

# M-Pesa (Daraja API)
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
TILL_NO=your_till_number
MPESA_TRANSACTIONTYPE=CustomerBuyGoodsOnline
MPESA_CALLBACK_URL=https://your-ngrok-url/api/stkpush/callback
```

### 3. Run the application

Start the web server and WhatsApp webhook listener:
```bash
npm run dev
```

Run the Marsor CLI for local testing:
```bash
npm run agent
```

Start the autonomous daemon:
```bash
npm run agent:daemon
```

---

## WhatsApp Webhook Setup

1. **Expose your local server** using ngrok:
   ```bash
   ngrok http 3000
   ```
2. In the [Meta Developer Portal](https://developers.facebook.com/), go to **WhatsApp - Configuration - Webhook** and set:
   - **Callback URL**: `https://<ngrok-url>/api/whatsapp/webhook`
   - **Verify Token**: your `WHATSAPP_VERIFY_TOKEN`
3. Click **Verify and Save**, then subscribe to the `messages` webhook field.
4. Send a message to your bot's WhatsApp number to interact with Marsor.

---

## M-Pesa Integration & Real-time Updates

Marsor supports complete end-to-end payment processing. After initiating an STK Push, clients can listen for real-time updates using Socket.IO:

```js
const socket = io('http://localhost:3000');

socket.emit('join_checkout', { checkoutRequestId: 'ws_xxxxxxxxx' });

socket.on('transaction_update', (data) => {
  console.log('Transaction Status:', data.status);
});
```

---

## License

ISC
