# MedCase CW2 – 5-Minute Video Script
**Student:** MD Rezaul Hoque | 10406063  
**Module:** COM682 – Cloud Native Development  
**Target time:** Exactly 5:00 minutes

---

> 🎙️ Speak clearly. Keep camera on. Share your screen the whole time.
> Practice this once before recording so you hit the timing.

---

## [0:00–0:30] Introduction + Azure Resource Group

**Say:**
> "Hi, I'm Rezaul Hoque, student number 10406063. This is my CW2 submission for COM682 – Cloud Native Development. The project is MedCase, a cloud-native medical case sharing platform built on Microsoft Azure.

> I'll start by showing you the Azure Portal. Here is my resource group – medcase-rg – which contains all the Azure resources used in this project."

**Do:**
- Open Azure Portal → Resource Groups → medcase-rg
- Scroll to show all resources: App Service, Cosmos DB, Storage, Logic App, App Insights, Static Web Apps

---

## [0:30–1:00] Live Frontend

**Say:**
> "Here's the live frontend, hosted on Azure Static Web Apps. It's a globally distributed static site with automatic CDN delivery and free SSL – deployed automatically via GitHub Actions on every push."

**Do:**
- Open your Static Web App URL (e.g. https://gentle-plant-xxx.azurestaticapps.net)
- Show the home page with case listings
- Click Upload Case to show the upload form
- Click Search to show the search page

---

## [1:00–2:30] CRUD Operations via Postman

**Say:**
> "Now I'll demonstrate all four CRUD operations through the REST API, which is hosted on Azure App Service at this URL."

**Do – show each in Postman:**

**CREATE (POST):**
> "First, creating a new case with POST to /api/cases."
- Send the POST request with JSON body
- Show 201 response with the new caseId
- Copy the caseId

**READ (GET list):**
> "Getting all cases – this queries Cosmos DB."
- GET /api/cases → show 200 response with cases array

**READ (GET single):**
> "Getting a single case by ID."
- GET /api/cases/{caseId} → show the specific case

**UPDATE (PUT):**
> "Updating the diagnosis field with a PUT request."
- PUT /api/cases/{caseId} with updated JSON → show 200 response

**MEDIA UPLOAD (POST multipart):**
> "Uploading a media file – this goes directly to Azure Blob Storage."
- POST /api/media/upload with file + caseId → show 201 response with blobUrl

**DELETE (DELETE):**
> "Finally, deleting a case – this removes it from Cosmos DB."
- DELETE /api/cases/{caseId} → show 200 response

---

## [2:30–3:00] Azure Blob Storage

**Say:**
> "Here in the Azure Portal, I can see the Blob Storage account – medcasestorage. Inside the medical-media container, you can see the file I just uploaded through the API. Files are stored with a folder structure by case ID."

**Do:**
- Azure Portal → Storage Account → Containers → medical-media
- Click into the folder → show the uploaded file
- Click the file → show the URL (matches the blobUrl in the API response)

---

## [3:00–3:30] Cosmos DB – Live Data

**Say:**
> "This is Azure Cosmos DB in NoSQL mode. Inside the MedCaseDB database, the cases container holds the JSON documents we just created and updated. You can see the partition key is specialty, which distributes read load across specialties."

**Do:**
- Azure Portal → Cosmos DB → Data Explorer → MedCaseDB → cases → Items
- Click on a document → show the full JSON
- Point out: id, title, specialty (partition key), mediaUrls array

---

## [3:30–4:00] Logic Apps – Blob Trigger

**Say:**
> "This is the Logic App – medcase-blob-trigger. It's configured to watch the medical-media container. When a new blob is created, it triggers an HTTP call to the App Service's internal endpoint, which would initiate thumbnail generation. This is the automation workflow from my CW1 design."

**Do:**
- Azure Portal → Logic Apps → medcase-blob-trigger
- Click Overview → show trigger history (if any runs exist)
- Click Logic app designer → show the trigger and HTTP action
- Click Run History to show any successful runs

---

## [4:00–4:30] Application Insights – Monitoring

**Say:**
> "Application Insights is integrated into the App Service for full telemetry. You can see live request data here, including the CRUD operations I just performed. This captures request latency, failed dependencies, and exceptions – and can send alerts if error rates exceed a threshold."

**Do:**
- Azure Portal → Application Insights → medcase-insights
- Click Overview → show Live Metrics or the requests graph
- Click Transaction Search → show the recent API requests (POST /api/cases, GET /api/cases etc.)
- Point out response times

---

## [4:30–5:00] CI/CD – GitHub Actions

**Say:**
> "Finally, CI/CD is implemented via GitHub Actions. Every push to the main branch automatically deploys the backend to App Service and the frontend to Static Web Apps. Here you can see the latest successful deployment run. This fully implements the CI/CD requirement from the CW1 design."

**Do:**
- Open GitHub → your repo → Actions tab
- Click the latest successful workflow run
- Show the steps: checkout → install → deploy
- Show the green tick ✅

**Close with:**
> "That completes my CW2 demo for MedCase. I've demonstrated full CRUD operations, Azure Blob Storage for media, Cosmos DB for metadata, a Logic Apps automation workflow, Application Insights monitoring, and CI/CD via GitHub Actions. Thank you."

---

## Timing Summary

| Section | Duration | Cumulative |
|---------|----------|------------|
| Intro + Resource Group | 30s | 0:30 |
| Frontend | 30s | 1:00 |
| CRUD (Postman) | 90s | 2:30 |
| Blob Storage | 30s | 3:00 |
| Cosmos DB | 30s | 3:30 |
| Logic Apps | 30s | 4:00 |
| App Insights | 30s | 4:30 |
| CI/CD + Close | 30s | 5:00 |

> ⚠️ Panopto Capture: Access via Blackboard → left menu → Panopto link.  
> Record screen + webcam simultaneously if possible.
