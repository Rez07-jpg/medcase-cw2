# MedCase CW2 – Complete Step-by-Step Deployment Guide
**Module:** COM682 – Cloud Native Development  
**Student:** MD Rezaul Hoque | 10406063  
**Project:** MedCase – Cloud-Based Medical Case Sharing Platform

---

## Overview of What You're Building

| Component | Azure Service | What it does |
|-----------|--------------|--------------|
| Frontend | Azure Static Web Apps | HTML/JS UI served globally |
| Backend API | Azure App Service | Node.js REST API (CRUD) |
| Media Storage | Azure Blob Storage | Stores X-rays, MRIs, videos |
| Database | Azure Cosmos DB | Stores case metadata (JSON) |
| Automation | Azure Logic Apps | Thumbnail trigger on blob upload |
| Monitoring | Application Insights | Telemetry, errors, performance |
| Auth | Azure AD (optional) | RBAC for users |
| CI/CD | GitHub Actions | Auto-deploy on git push |

---

## PHASE 1 – Azure Portal Setup (Do this first, ~45 mins)

### Step 1.1 – Create a Resource Group
1. Go to https://portal.azure.com
2. Search → **Resource Groups** → **+ Create**
3. Name: `medcase-rg`
4. Region: `UK South` (or nearest)
5. Click **Review + Create** → **Create**

> ⚠️ Put ALL resources into `medcase-rg`. This makes it easy to show in your video.

---

### Step 1.2 – Create Azure Storage Account (Blob Storage)
1. Search → **Storage Accounts** → **+ Create**
2. Resource Group: `medcase-rg`
3. Storage account name: `medcasestorage` (must be globally unique – add numbers if taken)
4. Performance: Standard | Redundancy: **LRS**
5. Click **Review + Create** → **Create**

**After creation:**
1. Open your storage account
2. Left menu → **Containers** → **+ Container**
3. Name: `medical-media` | Access: **Blob (anonymous read)**
4. Create another container: `thumbnails` | Access: **Blob**
5. Left menu → **Access Keys** → copy **Connection string** → save it as `AZURE_STORAGE_CONNECTION_STRING`

---

### Step 1.3 – Create Azure Cosmos DB
1. Search → **Azure Cosmos DB** → **+ Create**
2. Choose **Azure Cosmos DB for NoSQL**
3. Resource Group: `medcase-rg`
4. Account name: `medcase-cosmos` (globally unique)
5. Location: UK South | Capacity: **Serverless**
6. Click **Review + Create** → **Create** (takes ~5 mins)

**After creation:**
1. Open Cosmos DB account
2. Left menu → **Data Explorer** → **New Container**
3. Database ID: `MedCaseDB` | Container ID: `cases` | Partition key: `/specialty`
4. Left menu → **Keys** → copy **PRIMARY CONNECTION STRING** → save as `COSMOS_CONNECTION_STRING`
5. Also copy **URI** and **PRIMARY KEY** separately

---

### Step 1.4 – Create Application Insights
1. Search → **Application Insights** → **+ Create**
2. Resource Group: `medcase-rg`
3. Name: `medcase-insights`
4. Region: UK South | Resource Mode: **Classic**
5. Create → after deployment, open it → copy **Instrumentation Key** → save as `APPINSIGHTS_INSTRUMENTATIONKEY`

---

### Step 1.5 – Create Azure App Service (Backend API)
1. Search → **App Services** → **+ Create** → **Web App**
2. Resource Group: `medcase-rg`
3. Name: `medcase-api` (globally unique – will become `medcase-api.azurewebsites.net`)
4. Publish: **Code** | Runtime: **Node 20 LTS**
5. OS: Linux | Region: UK South
6. Plan: **Free F1** (for testing) or Basic B1
7. Click **Review + Create** → **Create**

**After creation – set environment variables:**
1. Open App Service → left menu → **Configuration** → **Application Settings**
2. Add these settings (+ New application setting for each):

```
AZURE_STORAGE_CONNECTION_STRING = <your connection string>
COSMOS_CONNECTION_STRING        = <your connection string>
COSMOS_DATABASE                 = MedCaseDB
COSMOS_CONTAINER                = cases
APPINSIGHTS_INSTRUMENTATIONKEY  = <your key>
PORT                            = 8080
NODE_ENV                        = production
```

3. Click **Save**
4. Go to **General settings** → set **Always On: On** (if on B1+)

---

### Step 1.6 – Create Azure Static Web Apps (Frontend)
> Do this AFTER you push your code to GitHub (Phase 2)

1. Search → **Static Web Apps** → **+ Create**
2. Resource Group: `medcase-rg`
3. Name: `medcase-frontend`
4. Plan: **Free**
5. Region: West Europe
6. Source: **GitHub** → Sign in → select your repo → branch: `main`
7. Build presets: **Custom** | App location: `/frontend` | Output: leave blank
8. Click **Review + Create** → **Create**

> This auto-creates a GitHub Actions workflow file. Your frontend will deploy automatically on every push.

---

## PHASE 2 – Code Setup & GitHub (~30 mins)

### Step 2.1 – Initialise Git Repository
```bash
# In your medcase-cw2 folder
git init
git add .
git commit -m "Initial MedCase CW2 commit"
```

Go to https://github.com → New Repository → name: `medcase-cw2` → Public → Create

```bash
git remote add origin https://github.com/YOUR_USERNAME/medcase-cw2.git
git branch -M main
git push -u origin main
```

---

### Step 2.2 – Set GitHub Secrets (for CI/CD)
1. GitHub → your repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from App Service → Overview → Get publish profile |
| `AZURE_STORAGE_CONNECTION_STRING` | From Step 1.2 |
| `COSMOS_CONNECTION_STRING` | From Step 1.3 |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | From Step 1.4 |

**To get publish profile:**  
App Service → Overview → **Download publish profile** → open the file → copy ALL contents → paste as secret value

---

### Step 2.3 – Install Dependencies & Test Locally
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (DO NOT commit this):
```
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
COSMOS_CONNECTION_STRING=your_cosmos_connection_string
COSMOS_DATABASE=MedCaseDB
COSMOS_CONTAINER=cases
APPINSIGHTS_INSTRUMENTATIONKEY=your_key
PORT=3000
NODE_ENV=development
```

Test locally:
```bash
npm start
# Open http://localhost:3000/health → should return {"status":"ok"}
```

---

### Step 2.4 – Update Frontend API URL
Open `frontend/config.js` and update:
```javascript
const API_BASE_URL = 'https://medcase-api.azurewebsites.net';
```
Replace with your actual App Service URL.

---

## PHASE 3 – Deploy Backend to Azure (~10 mins)

### Option A – Via GitHub Actions (recommended)
Just push to main:
```bash
git add .
git commit -m "Deploy backend"
git push
```
Watch: GitHub → Actions tab → see the deployment running ✅

### Option B – Via Azure CLI
```bash
# Install Azure CLI first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
az login
cd backend
zip -r ../backend.zip .
az webapp deployment source config-zip \
  --resource-group medcase-rg \
  --name medcase-api \
  --src ../backend.zip
```

**Verify deployment:**
```
https://medcase-api.azurewebsites.net/health
```
Should return: `{"status":"ok","timestamp":"..."}`

---

## PHASE 4 – Set Up Logic Apps (~20 mins)

### Step 4.1 – Create Logic App
1. Search → **Logic Apps** → **+ Add** → **Consumption**
2. Resource Group: `medcase-rg`
3. Name: `medcase-blob-trigger`
4. Region: UK South
5. Create → open → **Logic app designer**

### Step 4.2 – Build the Blob Trigger Workflow
1. **Trigger:** Search `Azure Blob Storage` → select **"When a blob is added or modified"**
   - Connection: create new → use your storage connection string
   - Container: `medical-media`
   - Interval: 1 minute

2. **Action 1:** Search `HTTP` → **HTTP**
   - Method: `POST`
   - URI: `https://medcase-api.azurewebsites.net/api/internal/thumbnail`
   - Body: `{"blobName": "@{triggerBody()?['Name']}", "blobUrl": "@{triggerBody()?['Path']}"}`
   - Headers: `Content-Type: application/json`

3. Click **Save**

> This mimics the thumbnail generation Logic App from your CW1 design.

---

## PHASE 5 – Test All CRUD Operations (~20 mins)

Use **Postman** or the frontend UI to test:

### 5.1 Create a Case (POST)
```
POST https://medcase-api.azurewebsites.net/api/cases
Content-Type: application/json

{
  "title": "Chest X-Ray – Pneumonia",
  "description": "47yr male, shortness of breath",
  "specialty": "Radiology",
  "diagnosis": "Community-acquired pneumonia",
  "uploaderId": "user-001"
}
```
→ Should return `201` with `caseId`

### 5.2 Get All Cases (GET)
```
GET https://medcase-api.azurewebsites.net/api/cases
GET https://medcase-api.azurewebsites.net/api/cases?specialty=Radiology
```

### 5.3 Get Single Case (GET)
```
GET https://medcase-api.azurewebsites.net/api/cases/{caseId}
```

### 5.4 Update a Case (PUT)
```
PUT https://medcase-api.azurewebsites.net/api/cases/{caseId}
Content-Type: application/json

{"diagnosis": "Updated diagnosis"}
```

### 5.5 Delete a Case (DELETE)
```
DELETE https://medcase-api.azurewebsites.net/api/cases/{caseId}
```

### 5.6 Upload Media (POST multipart)
In Postman:
- Method: POST
- URL: `https://medcase-api.azurewebsites.net/api/media/upload`
- Body: form-data → key: `file` (type: File) + key: `caseId` (Text)

---

## PHASE 6 – Video Recording Guide (5 mins exactly)

See `video-script/VIDEO_SCRIPT.md` for the full script.

**Structure (stay strictly to time):**
| Section | Time |
|---------|------|
| Intro + show Azure resource group | 0:00–0:30 |
| Show frontend running | 0:30–1:00 |
| CRUD demo (Postman) | 1:00–2:30 |
| Azure Portal – Blob Storage | 2:30–3:00 |
| Cosmos DB – data in portal | 3:00–3:30 |
| Logic Apps – show trigger | 3:30–4:00 |
| App Insights – show telemetry | 4:00–4:30 |
| CI/CD – GitHub Actions | 4:30–5:00 |

> Record with Panopto Capture (via Blackboard menu). Turn camera on if possible.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error on frontend | Add your SWA URL to CORS in App Service → API → CORS |
| Cosmos DB 403 | Check your connection string has the full primary key |
| Blob upload fails | Check container access level is set to "Blob" |
| App Service 503 | Check logs: App Service → Log stream |
| GitHub Actions fail | Check secrets are set correctly |

---

## Azure Resources Checklist (for your video)
- [ ] Resource Group: `medcase-rg`
- [ ] Storage Account with `medical-media` and `thumbnails` containers
- [ ] Cosmos DB account → `MedCaseDB` database → `cases` container
- [ ] App Service → `medcase-api` running on Node 20
- [ ] Application Insights → showing live data
- [ ] Logic App → `medcase-blob-trigger` with blob trigger
- [ ] Static Web App → frontend deployed and accessible
- [ ] GitHub Actions → successful deployment runs
