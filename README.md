#MEDHUB

## Project Overview

A web-based medical imaging and health records management system that allows users to upload, analyze, and manage medical images and scans. The application supports dual authentication methods with role-based access control to ensure secure access to medical records.

---

## Features

### 1. Authentication & Access Control

#### Two Login Methods:

**A. Account & Password Login**
- Full access to all application features
- Ability to create, read, update, and manage records

**B. Med.hub ID Login (Read-Only Mode)**
- Can only VIEW existing medical records/files
- Can only SEARCH through database
- CANNOT:
  - Upload new files
  - Create account details
  - Modify any data
  - Export/Download files
- Restricted dashboard (search panel only visible)

---

### 2. Signup Flow (Account & Password)

Creates full account with:
- **Medical Details:** Blood group, Height, Weight
- **Personal Info:** Name, Age, Contact
- **Additional:** Other medical history
- **Web Tour:** Shows what each feature does

---

### 3. Main Application (Post-Login)

#### Dashboard Layout:
```
┌─────────────────────────────────────────────┐
│         MAIN DASHBOARD                      │
├─────────────────────────────────────────────┤
│                                             │
│  Settings Panel  │  Profile Panel           │
│  (Basic Settings)│ (All user details from   │
│                  │  account creation)       │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐    ┌──────────────┐     │
│  │   UPLOAD     │    │    SEARCH    │     │
│  │   SECTION    │    │   SECTION    │     │
│  └──────────────┘    └──────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4. Upload Section (Full Access Only)

#### Option I: Regular Image Upload
```
Step 1: Get Image
   ↓
Step 2: Analyze (AI processing)
   ↓
Step 3: Create TXT File (Instantly)
   ↓
   ├─ Export Current (Download)
   │
   └─ Add to Main Database (Save to DB)
```

#### Option II: Scan Files Upload (Separate)
- Upload only **MRI files**
- Upload only **CT files**
- Upload **Other scan files** (separately near normal upload)
- Each with same analyze → export/save options

---

### 5. Search Section (Both Access Levels)
- Show all files in database
- Filter options
- Export options (Full access only)
- View file details

---

## Complete User Flow

```
User Visits App
      │
      ├─────────────────────────────────┬─────────────────────────────┐
      │                                 │                             │
   Med.hub ID              Account & Password                    New User?
      │                                 │                             │
      ↓                                 ↓                             ↓
   READ-ONLY            FULL ACCESS                            SIGNUP FORM
   ACCESS               LOGIN                                   (Collect all
      │                    │                                     details)
      │                    ↓                                        │
      │              Dashboard                                      ↓
      │                    ├─ Settings                         Verify & Create
      │                    ├─ Profile Panel                    Account
      │                    ├─ Upload (Full features)                │
      │                    │  ├─ Images                             ↓
      │                    │  └─ Scans (MRI/CT)               Dashboard
      │                    └─ Search & Export                        │
      │                                                             │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      └────────→ Search & View Only (Read-Only Access) ←───────────┘
                         │
                         ├─ View all files
                         ├─ Filter results
                         └─ View details
```

---

## Access Level Comparison Table

MEDHUB ID

Login           ████████████████ 100% ✅
View Files      ████████████████ 100% ✅
Search          ████████████████ 100% ✅
Upload Image    ░░░░░░░░░░░░░░░░   0% ❌
Upload Scans    ░░░░░░░░░░░░░░░░   0% ❌
Analyze Files   ░░░░░░░░░░░░░░░░   0% ❌
Export/Download ░░░░░░░░░░░░░░░░   0% ❌
Edit Profile    ░░░░░░░░░░░░░░░░   0% ❌
Create Account  ░░░░░░░░░░░░░░░░   0% ❌

NORMAL LOGIN

Login           ████████████████ 100% ✅
View Files      ████████████████ 100% ✅
Search          ████████████████ 100% ✅
Upload Image    ████████████████ 100% ✅
Upload Scans    ████████████████ 100% ✅
Analyze Files   ████████████████ 100% ✅
Export/Download ████████████████ 100% ✅
Edit Profile    ████████████████ 100% ✅
Create Account  ████████████████ 100% ✅
