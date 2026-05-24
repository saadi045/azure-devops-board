# Day 1 — Hands-on Setup Guide

This guide takes you from "I have the starter files" to "my API is running on my laptop." Plan for 60 to 90 minutes total.

## Step 1: Get the starter files onto your computer

You have already downloaded the zip with all the starter files. Extract it to a location you'll remember, like `D:\project\task-api`.

The folder structure looks like this:

```
task-api/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── src/
│   ├── server.js
│   └── routes/
│       ├── health.js
│       └── tasks.js
├── tests/
│   └── api.http
└── docs/
    ├── ROADMAP.md
    └── SETUP.md
```

## Step 2: Open the project in VS Code

There are three ways. Pick whichever works for you.

**Option A — File Explorer:** Navigate to the `task-api` folder, right-click empty space inside the folder, and choose **Open with Code**.

**Option B — Command line:** Open a terminal in the folder and type `code .` (the period means "this folder"). You will need to close and reopen any old terminals first.

**Option C — VS Code menu:** Open VS Code, click **File → Open Folder**, and select the `task-api` folder.

Once it's open, you should see the folder structure in the left sidebar.

## Step 3: Create your .env file

Your application reads configuration from a file called `.env`. We give you a `.env.example` as a template — never commit the real `.env` to git (it's already in `.gitignore`).

In VS Code, look at the file list on the left. Right-click on `.env.example` and choose **Copy**. Right-click in empty space below and choose **Paste**. Rename the copy from `.env.example copy` to just `.env`.

Open the new `.env` file. For Day 1 you don't need to change anything — the defaults work. Save the file and close it.

## Step 4: Install the project dependencies

The `package.json` lists which libraries your project needs (Express for the web server, dotenv for config). The command `npm install` reads that list and downloads them.

Open a terminal **inside VS Code** by clicking **Terminal → New Terminal** in the menu bar. You should see your project path in the terminal prompt. Run:

```
npm install
```

This takes 20 to 60 seconds. When it's done, you'll see a new `node_modules` folder appear (don't worry, it's in `.gitignore`). You may see a few warnings about "deprecated" packages — those are normal and safe to ignore.

If you see any **errors** (red text saying "ERR!"), stop and tell me what they say.

## Step 5: Run the API

Still in the VS Code terminal, run:

```
npm run dev
```

You should see output like this:

```
🚀 Task API running on http://localhost:3000
   Environment: development
   Try: curl http://localhost:3000/health
```

If you see that, **your API is running**. Leave this terminal open.

## Step 6: Verify it works

Open your web browser and go to: **http://localhost:3000/health**

You should see something like:

```json
{"status":"ok","uptime":12.345,"timestamp":"2026-05-12T12:34:56.789Z"}
```

Try a few more URLs in the browser:

- **http://localhost:3000/** — shows API info
- **http://localhost:3000/api/v1/tasks** — shows the demo task

If all three work, **Session 1 is complete**. You have a working REST API.

## Step 7: Test more endpoints with REST Client

The browser only does GET requests. To test POST, PATCH, and DELETE, use the REST Client extension you installed earlier.

Open the file `tests/api.http` in VS Code. You'll see "Send Request" links appear above each block. Click one to send the request. The response opens in a panel on the right.

Try these in order:

1. Click **Send Request** above "Create a new task". You should see a 201 status with the new task object.
2. Click **Send Request** above "List all tasks". You should now see 2 tasks instead of 1.
3. Click **Send Request** above "Update a task". The task should show `"completed": true`.
4. Click **Send Request** above "Delete a task". You should get an empty 204 response.
5. Click **Send Request** above "List all tasks" again to confirm it's gone.

## Step 8: Initialize git and prepare for GitHub

This sets up version control for the project. You'll push to GitHub once everything works.

Stop the server in your terminal by pressing **Ctrl+C**. Then run these commands one at a time:

```
git init
git add .
git commit -m "Day 1: Initial project skeleton with Express API"
```

You should see "1 file changed, X insertions" or similar — that means git tracked your files. **Don't push to GitHub yet** — we'll do that in Day 2 once the database is wired up. Publishing too early means clients see an incomplete project.

## Done with Day 1 — what you accomplished

By the end of Day 1, you have:

1. A working Express REST API
2. Five working endpoints (health, root, list tasks, create task, update task, delete task)
3. Structured logging on every request
4. Error handling for 404 and 500 errors
5. Validation on POST requests
6. A reusable test file in REST Client format
7. Version-controlled project ready for GitHub

## What's next — Day 2

Tomorrow you'll add a real PostgreSQL database running in Docker. The in-memory storage gets replaced with persistent storage. This is where Docker Compose first comes in.

Come back here and say **"Day 1 complete"** and I'll deliver the Day 2 package — docker-compose.yml, database connection code, updated routes, and migration scripts.

## Common problems

**"npm: command not found"**
Close all terminals and open a fresh one. If still broken, see [Node.js installation guide](https://nodejs.org).

**"EADDRINUSE: address already in use :::3000"**
Another program is using port 3000. Either find and stop it, or change the PORT in your `.env` file to something else like 3001.

**"Cannot find module 'express'"**
`npm install` didn't run successfully. Delete the `node_modules` folder, delete `package-lock.json` if it exists, and run `npm install` again.

**The health URL just hangs in the browser**
The server isn't running. Look at your terminal — if you don't see the "🚀 Task API running" message, the server crashed. Read the error message, then restart with `npm run dev`.

**REST Client requests fail with "Connection refused"**
The server isn't running. Go back to Step 5.
