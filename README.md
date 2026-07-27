# Campus Connect — Event Management System

A campus event management web application built with HTML, CSS, and JavaScript.

## 📁 Project Structure

```
exp/
├── static/
│   ├── css/
│   │   └── style.css       ← All styles
│   └── js/
│       └── script.js       ← All JavaScript logic
├── templates/
│   └── index.html          ← Main HTML page
├── server.py               ← Python local server
├── requirements.txt        ← Python dependencies
└── README.md               ← This file
```

## 🚀 How to Run

### Option 1 — Python Server (Recommended)
```bash
python server.py
```
Opens automatically at → **http://localhost:8000**

### Option 2 — Direct (limited)
Open `templates/index.html` directly in browser.
> ⚠️ Some features may not work due to CORS without a server.

## 🔑 Login Credentials

| Role    | Register Number | Note            |
|---------|----------------|-----------------|
| Admin   | `ADMIN001`     | Select "Admin" tab |
| Student | Register first | Use Register form |

## ✨ Features

- 🎓 Student registration & login
- 🗓️ Browse & filter events by category
- ✅ Event registration with ticket view
- 📊 Student dashboard
- ⚡ Admin dashboard — add/delete events
- 💾 Data persisted via localStorage
- 📱 Fully responsive design
