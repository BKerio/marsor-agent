```text
███╗░░░███╗░█████╗░██████╗░███████╗░█████╗░██████╗░
████╗░████║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗
██╔████╔██║███████║██████╔╝███████╗██║░░██║██████╔╝
██║╚██╔╝██║██╔══██║██╔══██╗╚════██║██║░░██║██╔══██╗
██║░╚═╝░██║██║░░██║██║░░██║███████║╚█████╔╝██║░░██║
╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝░╚════╝░╚═╝░░╚═╝
```

# Marsor - Your AI Assistant on WhatsApp

> **In one sentence:** Marsor is a smart assistant that lives inside WhatsApp. People chat with it like they would with a real person, and it can answer questions, look things up online, and take M-Pesa payments for you.

---

## What is Marsor?

Think of Marsor as a **virtual receptionist that never sleeps**.

Most WhatsApp "bots" only follow a fixed menu ("Press 1 for prices, press 2 for hours..."). Marsor is different. It uses artificial intelligence (Google's Gemini) to actually *understand* what someone is asking, even if they type it casually, misspell words, or ask several things at once. It then works out what to do and replies in plain, natural language.

### What can it do?

| Marsor can... | What that means in everyday terms |
|---|---|
| **Hold a real conversation** | Customers can type normally - no menus or codes. Marsor remembers what was said earlier in the chat. |
| **Answer questions about your services** | It can explain what you offer, your prices, and how things work. |
| **Look things up on the internet** | If it needs information it doesn't already know, it can open a web browser by itself, search, and read pages - just like a person would. |
| **Take M-Pesa payments** | It can send a payment prompt straight to a customer's phone. The customer just enters their M-Pesa PIN to pay. |
| **Confirm payments instantly** | As soon as Safaricom confirms a payment, Marsor knows about it and can let your website or app know immediately. |
| **Register users** | It can collect and save a customer's details during the chat. |

---

## How does it work? (The simple version)

```text
  Customer's phone                 Your computer / server                  Outside services
 ┌──────────────┐   message    ┌──────────────────────────┐   asks     ┌──────────────────┐
 │   WhatsApp   │ ───────────► │                          │ ─────────► │  Google Gemini   │
 │              │              │          Marsor          │ ◄───────── │  (the "brain")   │
 │              │ ◄─────────── │                          │            └──────────────────┘
 └──────────────┘    reply     │  • reads the message     │   browses  ┌──────────────────┐
        ▲                      │  • decides what to do    │ ─────────► │  The internet    │
        │  "Enter M-Pesa PIN"  │  • saves info to its     │            └──────────────────┘
        └──────────────────────│    database (MongoDB)    │  payment   ┌──────────────────┐
                               │                          │ ─────────► │ Safaricom M-Pesa │
                               └──────────────────────────┘ ◄───────── └──────────────────┘
                                                            "paid ✓"
```

1. A customer sends a WhatsApp message to your business number.
2. WhatsApp (run by Meta) forwards that message to Marsor.
3. Marsor asks Google's AI to help understand the message and decide on a response.
4. If needed, Marsor browses the web or starts an M-Pesa payment.
5. Marsor sends the reply back to the customer on WhatsApp.
6. Anything worth remembering (customers, payments) is stored in a database.

---

## What you'll need before starting

Don't worry if some of these are unfamiliar - each one is explained below. Most have free or test ("sandbox") versions.

| You need | What it is, in plain English |
|---|---|
| **[Node.js](https://nodejs.org/) (version 18 or newer)** | The engine that runs Marsor's code on your computer. Download and install it like any other program. |
| **A MongoDB database** | Marsor's "filing cabinet" where it saves customers and payments. You can install it locally or get a free one online at [MongoDB Atlas](https://www.mongodb.com/atlas). |
| **A [Meta Developer account](https://developers.facebook.com/) with a WhatsApp Business app** | This is what lets Marsor send and receive WhatsApp messages on behalf of your business number. |
| **A [Safaricom Daraja account](https://developer.safaricom.co.ke/)** | Safaricom's service that lets software request M-Pesa payments. The free test ("sandbox") version is fine for trying things out. |
| **A Google Gemini API key** | A password-like code that lets Marsor use Google's AI. Get one from [Google AI Studio](https://aistudio.google.com/). |
| **[ngrok](https://ngrok.com/)** | A free tool that gives your computer a temporary public web address, so WhatsApp and M-Pesa can reach Marsor while you're testing at home. |

---

## Setting it up - step by step

> 💡 The commands below are typed into a **terminal** (also called Command Prompt, PowerShell, or Terminal on Mac). Copy each line, paste it in, and press Enter.

### Step 1: Download the project and install its parts

```bash
git clone https://github.com/BKerio/bot.git
cd bot
npm install
```

*What this does:* downloads Marsor's code to your computer, moves into its folder, and installs all the building blocks it depends on.

### Step 2: Add your secret keys

Marsor needs your account details (keys and passwords) to connect to WhatsApp, M-Pesa, Google, and your database. These go in a file called `.env`.

First, make a copy of the example file:

```bash
cp .env.example .env
```

Then open `.env` in any text editor and replace each `your_...` placeholder with your real details:

```env
# --- Google AI (Marsor's "brain") ---
GEMINI_API_KEY=your_gemini_api_key

# --- WhatsApp (from the Meta Developer Portal) ---
WHATSAPP_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token   # any secret word you make up

# --- Server settings (you can usually leave these as they are) ---
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# --- Database (where Marsor saves its information) ---
MONGO_URI=mongodb://localhost:27017/marsor-bot

# --- M-Pesa (from your Safaricom Daraja account) ---
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
TILL_NO=your_till_number
MPESA_TRANSACTIONTYPE=CustomerBuyGoodsOnline
MPESA_CALLBACK_URL=https://your-ngrok-url/api/stkpush/callback
```

> ⚠️ **Keep the `.env` file private.** It contains passwords to your accounts. Never share it or upload it anywhere public.

### Step 3: Start Marsor

There are three ways to run Marsor, depending on what you want to do:

| Command | When to use it |
|---|---|
| `npm run dev` | **The main one.** Starts Marsor so it can receive and reply to WhatsApp messages. |
| `npm run agent` | Chat with Marsor directly in your terminal - handy for testing without using WhatsApp. |
| `npm run agent:daemon` | Runs Marsor quietly in the background so it can carry out tasks on its own. |

### Step 4: Connect Marsor to WhatsApp

WhatsApp needs to know *where* to send your customers' messages. Because Marsor is running on your own computer, we use ngrok to give it a public address.

1. **Open a second terminal window** and run:
   ```bash
   ngrok http 3000
   ```
   ngrok will show a web address that looks like `https://abc123.ngrok-free.app`. Copy it.

2. Go to the [Meta Developer Portal](https://developers.facebook.com/), open your app, and go to **WhatsApp → Configuration → Webhook**. Fill in:
   - **Callback URL:** your ngrok address followed by `/api/whatsapp/webhook`
     (for example: `https://abc123.ngrok-free.app/api/whatsapp/webhook`)
   - **Verify Token:** the same secret word you put in `WHATSAPP_VERIFY_TOKEN`

3. Click **Verify and Save**, then turn on (subscribe to) the **messages** option.

4. **Try it out!** Send a WhatsApp message to your business number - Marsor should reply. 🎉

> 📝 Also update `MPESA_CALLBACK_URL` in your `.env` file to use your ngrok address, so Safaricom can tell Marsor when a payment goes through. Note that the free ngrok address changes every time you restart it, so you'll need to update both places when that happens.

---

## How M-Pesa payments work

1. During a chat, Marsor sends a payment request to the customer's phone.
2. A pop-up appears on the customer's phone asking for their **M-Pesa PIN**. (This is called an "STK Push".)
3. The customer enters their PIN to approve the payment.
4. Safaricom tells Marsor whether the payment succeeded or failed.
5. Marsor instantly passes that update on to your website or app.

### For developers: listening for payment updates

If you have a website or app that needs to know the moment a payment completes, it can listen for live updates using Socket.IO:

```js
const socket = io('http://localhost:3000');

// Tell Marsor which payment you're waiting on
socket.emit('join_checkout', { checkoutRequestId: 'ws_xxxxxxxxx' });

// Get notified as soon as the payment status changes
socket.on('transaction_update', (data) => {
  console.log('Transaction Status:', data.status);
});
```

---

## Glossary - common terms explained

| Term | Meaning |
|---|---|
| **AI / Gemini** | Google's artificial intelligence. It's what lets Marsor understand messages and write sensible replies. |
| **API** | A way for two pieces of software to talk to each other. For example, Marsor uses Safaricom's API to request payments. |
| **API key / token** | A secret code that proves to a service (like Google or WhatsApp) that Marsor is allowed to use it. Treat it like a password. |
| **Webhook** | A "doorbell" for software. When something happens (like a new WhatsApp message), the service rings Marsor's webhook to let it know. |
| **STK Push** | The M-Pesa pop-up that appears on a customer's phone asking them to enter their PIN to pay. |
| **Sandbox** | A practice/test version of a service. No real money moves, so you can experiment safely. |
| **Database (MongoDB)** | Where Marsor stores information so it isn't forgotten, like customer details and payment records. |
| **Terminal** | The text-based window where you type commands to your computer. |
| **ngrok** | A tool that makes a program on your computer reachable from the internet, temporarily. |

---

## For developers: technical details

<details>
<summary>Click to expand</summary>

### Tech stack

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

### Project structure

```
src/
├── index.ts              # Server entry - Express, Socket.IO, MongoDB, routes
├── agent/                # Marsor agent logic (runner, terminal UI, banner)
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

### Building for production

```bash
npm run build   # compile TypeScript into the dist/ folder
npm start       # run the compiled app
```

</details>

---

## License

ISC
