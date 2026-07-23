import { decodeJWT } from './jwt';

let API_BASE_URL = 
  (import.meta.env && import.meta.env.VITE_API_URL) || 
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 
  'http://localhost:5000/api';

async function fetchWithPortFallback(url, options = {}) {
  if (API_BASE_URL.includes('5001') && url.includes('5000')) {
    url = url.replace('5000', '5001');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const fetchOptions = { ...options, signal: controller.signal };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    if (url.includes('localhost:5000')) {
      const fallbackUrl = url.replace('localhost:5000', 'localhost:5001');
      console.warn(`[PORT FALLBACK] Port 5000 timed out or offline. Switching to port 5001: ${fallbackUrl}`);
      API_BASE_URL = API_BASE_URL.replace('5000', '5001');
      return await fetch(fallbackUrl, options);
    }
    throw err;
  }
}

// Check if we should use local simulation (if API is down or if user toggles Demo Mode)
const isDemoModeEnabled = () => {
  return localStorage.getItem('medhub_demo_mode') === 'true';
};

export const setDemoMode = (enabled) => {
  localStorage.setItem('medhub_demo_mode', enabled ? 'true' : 'false');
};

/**
 * Helper to construct headers with the authorization token.
 */
function getHeaders(isMultipart = false) {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = localStorage.getItem('medhub_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle API responses and throw informative errors. Unwraps data payload if wrapped in standardized envelope.
 */
async function handleResponse(response) {
  let body;
  try {
    body = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    return {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('medhub_token');
    }
    let errorMessage = body.message || body.error || `HTTP Error ${response.status}: ${response.statusText}`;
    if (body.errors && Array.isArray(body.errors)) {
      const details = body.errors.map(err => `${err.field}: ${err.message}`).join(', ');
      errorMessage = `${errorMessage} (${details})`;
    }
    throw new Error(errorMessage);
  }

  // Handle standard response envelope { success: true, message: '...', data: { ... } }
  if (body && typeof body === 'object' && 'data' in body && body.data !== null) {
    return body.data;
  }
  return body;
}

/**
 * Local Simulator DB initialization
 */
function initSimulatedDb() {
  if (!localStorage.getItem('sim_users')) {
    // Seed default users
    const defaultUsers = [
      {
        id: 'user_1',
        name: 'Dr. Sarah Jenkins',
        age: 34,
        email: 'sarah.jenkins@medhub.com',
        password: 'password123',
        blood_group: 'A+',
        height: '168',
        weight: '62',
        contact: '+1 (555) 234-5678',
        medical_history: 'No significant past medical history. Standard vaccinations up to date.',
        role: 'full'
      },
      {
        id: 'user_2',
        name: 'Patient John Doe',
        age: 45,
        email: 'john.doe@gmail.com',
        password: 'password123',
        blood_group: 'O-',
        height: '180',
        weight: '82',
        contact: '+1 (555) 987-6543',
        medical_history: 'Mild asthma managed with inhaler. Hypertension diagnosed 2024.',
        role: 'full'
      }
    ];
    localStorage.setItem('sim_users', JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem('sim_scans')) {
    // Seed default scans
    const defaultScans = [
      {
        id: 'scan_1',
        title: 'Brain MRI T2 Weighted',
        type: 'MRI',
        fileName: 'mri_brain_t2.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=60',
        uploadedBy: 'Dr. Sarah Jenkins',
        uploadedAt: '2026-07-20T10:15:30Z',
        patientName: 'John Doe',
        description: 'Axial T2-weighted MRI of the brain showing normal ventricular size. No acute intracranial hemorrhage or mass effect.'
      },
      {
        id: 'scan_2',
        title: 'Chest CT Scan',
        type: 'CT',
        fileName: 'ct_chest_coronal.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800&auto=format&fit=crop&q=60',
        uploadedBy: 'Dr. Sarah Jenkins',
        uploadedAt: '2026-07-22T14:45:00Z',
        patientName: 'Jane Smith',
        description: 'Coronal reformatted chest CT demonstrates clear lung fields. No pleural effusions or cardiomegaly.'
      },
      {
        id: 'scan_3',
        title: 'Left Knee X-Ray',
        type: 'Image',
        fileName: 'xray_knee_left.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60',
        uploadedBy: 'Dr. Sarah Jenkins',
        uploadedAt: '2026-07-23T09:30:00Z',
        patientName: 'Bob Johnson',
        description: 'AP and Lateral projections of the left knee show preservation of joint spaces. No fracture or dislocation.'
      }
    ];
    localStorage.setItem('sim_scans', JSON.stringify(defaultScans));
  }
}

initSimulatedDb();

/**
 * Generate simulated JWT token.
 */
function createSimulatedToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours expiry
  const body = btoa(JSON.stringify({ ...payload, exp }));
  return `${header}.${body}.simulatedsignature`;
}

/**
 * Simulation helper logic for authentication and uploads
 */
const simulator = {
  login: async (email, password) => {
    await new Promise(r => setTimeout(r, 600)); // Sim response lag
    const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password credentials');
    }
    
    const token = createSimulatedToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: 'full' // Accounts logging in via Email/Password have full access
    });
    
    return { token, user };
  },

  loginMedHubId: async (medHubId) => {
    await new Promise(r => setTimeout(r, 600));
    if (!medHubId || medHubId.trim().length < 4) {
      throw new Error('Invalid Med.hub ID. Must be at least 4 characters.');
    }
    
    const token = createSimulatedToken({
      sub: medHubId,
      name: `Viewer (${medHubId})`,
      email: `${medHubId.toLowerCase()}@medhub.id`,
      role: 'readonly',
      medHubId: medHubId
    });

    return { token, user: { id: medHubId, name: `Viewer (${medHubId})`, email: `${medHubId.toLowerCase()}@medhub.id`, role: 'readonly', medHubId } };
  },

  signup: async (userData) => {
    await new Promise(r => setTimeout(r, 800));
    const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('An account with this email address already exists');
    }
    
    const newUser = {
      id: `user_${Date.now()}`,
      ...userData,
      role: 'full'
    };
    
    users.push(newUser);
    localStorage.setItem('sim_users', JSON.stringify(users));
    
    const token = createSimulatedToken({
      sub: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'full'
    });
    
    return { token, user: newUser };
  },

  getScans: async (query = '', filterType = '') => {
    await new Promise(r => setTimeout(r, 500));
    let scans = JSON.parse(localStorage.getItem('sim_scans') || '[]');
    
    if (query) {
      const q = query.toLowerCase();
      scans = scans.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.patientName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    
    if (filterType && filterType !== 'All') {
      scans = scans.filter(s => s.type === filterType);
    }
    
    return scans;
  },

  uploadScan: async (scanData, creatorName) => {
    await new Promise(r => setTimeout(r, 1000));
    const scans = JSON.parse(localStorage.getItem('sim_scans') || '[]');
    
    const newScan = {
      id: `scan_${Date.now()}`,
      title: scanData.title || 'Untitled Scan',
      type: scanData.type || 'Other',
      fileName: scanData.fileName || 'scan.jpg',
      fileUrl: scanData.fileUrl || 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800&auto=format&fit=crop&q=60',
      uploadedBy: creatorName || 'Unknown Doctor',
      uploadedAt: new Date().toISOString(),
      patientName: scanData.patientName || 'Unknown Patient',
      description: scanData.description || 'No description provided.'
    };
    
    scans.unshift(newScan);
    localStorage.setItem('sim_scans', JSON.stringify(scans));
    return newScan;
  },

  getProfile: async (token) => {
    await new Promise(r => setTimeout(r, 300));
    const decoded = decodeJWT(token);
    if (!decoded) throw new Error('Invalid token session');
    
    if (decoded.role === 'readonly') {
      return {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: 'readonly',
        medHubId: decoded.medHubId || decoded.sub,
        age: 'N/A',
        blood_group: 'N/A',
        height: 'N/A',
        weight: 'N/A',
        contact: 'N/A',
        medical_history: 'Read-only Med.hub ID viewer access. Limited clinical data available.'
      };
    }

    const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
    const user = users.find(u => u.id === decoded.sub || u.email === decoded.email);
    if (!user) {
      return {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: 'full',
        age: 30,
        blood_group: 'O+',
        height: '175',
        weight: '70',
        contact: 'N/A',
        medical_history: 'Default Profile. Detailed metadata not loaded.'
      };
    }
    return user;
  }
};

/**
 * Exported API clients. Real backend integration with simulator fallback when explicitly enabled.
 */
export const api = {
  login: async (email, password) => {
    if (isDemoModeEnabled()) {
      return simulator.login(email, password);
    }
    const response = await fetchWithPortFallback(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(response);
  },

  loginMedHubId: async (medHubId) => {
    if (isDemoModeEnabled()) {
      return simulator.loginMedHubId(medHubId);
    }
    const response = await fetchWithPortFallback(`${API_BASE_URL}/auth/login-medhub`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ medhubId: medHubId, medHubId: medHubId })
    });
    return await handleResponse(response);
  },

  signup: async (userData) => {
    if (isDemoModeEnabled()) {
      return simulator.signup(userData);
    }
    const response = await fetchWithPortFallback(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return await handleResponse(response);
  },

  loginGoogle: async (googleData) => {
    if (isDemoModeEnabled()) {
      return simulator.login(googleData.email || 'google.user@medhub.com', 'password123');
    }
    const response = await fetchWithPortFallback(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(googleData)
    });
    return await handleResponse(response);
  },

  getScans: async (query = '', filterType = '') => {
    if (isDemoModeEnabled()) {
      return simulator.getScans(query, filterType);
    }
    const url = new URL(`${API_BASE_URL}/files`);
    if (filterType && filterType !== 'All') url.searchParams.append('fileType', filterType);
    
    const response = await fetchWithPortFallback(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    });
    const result = await handleResponse(response);
    const rawFiles = result.files || (Array.isArray(result) ? result : []);

    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    
    const scans = rawFiles.map(f => {
      const analysis = f.analysisResult || {};
      const fileUrl = f.filePath 
        ? (f.filePath.startsWith('http') ? f.filePath : `${baseUrl}/${f.filePath}`) 
        : 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=60';

      return {
        id: f.id,
        title: f.originalName ? f.originalName.replace(/\.[^/.]+$/, "") : 'Medical Scan',
        type: f.fileType || 'Image',
        fileName: f.filename || f.originalName || 'scan.jpg',
        fileUrl: fileUrl,
        uploadedBy: analysis.uploadedBy || 'Admitting Clinician',
        uploadedAt: f.createdAt || new Date().toISOString(),
        patientName: analysis.patientName || 'Patient Record',
        description: analysis.summary || analysis.aiFindings || 'Clinical scan uploaded and indexed in backend database.'
      };
    });

    if (query) {
      const q = query.toLowerCase();
      return scans.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.patientName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return scans;
  },

  uploadScan: async (scanData, creatorName) => {
    if (isDemoModeEnabled()) {
      return simulator.uploadScan(scanData, creatorName);
    }

    let formData;
    if (scanData instanceof FormData) {
      formData = scanData;
    } else {
      formData = new FormData();
      if (scanData.fileUrl && scanData.fileUrl.startsWith('data:')) {
        const arr = scanData.fileUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], scanData.fileName || 'medical_scan.jpg', { type: mime });
        formData.append('image', file);
      } else if (scanData.file) {
        formData.append('image', scanData.file);
      } else {
        const dummyBlob = new Blob(["dummy medical scan content"], { type: 'image/jpeg' });
        formData.append('image', dummyBlob, scanData.fileName || 'scan.jpg');
      }
    }

    const response = await fetchWithPortFallback(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });

    const result = await handleResponse(response);
    const uploadedFile = result.file || {};
    const analysis = result.analysisResult || {};
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

    const fileUrl = uploadedFile.filePath 
      ? `${baseUrl}/${uploadedFile.filePath}`
      : (scanData.fileUrl || 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=60');

    return {
      id: uploadedFile.id || `scan_${Date.now()}`,
      title: scanData.title || uploadedFile.originalName || 'Medical Scan',
      type: scanData.type || uploadedFile.fileType || 'MRI',
      fileName: uploadedFile.filename || scanData.fileName || 'scan.jpg',
      fileUrl: fileUrl,
      uploadedBy: creatorName || 'Admitting Clinician',
      uploadedAt: uploadedFile.createdAt || new Date().toISOString(),
      patientName: scanData.patientName || 'Patient Record',
      description: scanData.description || analysis.summary || 'Scan uploaded and analyzed successfully.'
    };
  },

  getProfile: async () => {
    const token = localStorage.getItem('medhub_token');
    if (isDemoModeEnabled()) {
      return simulator.getProfile(token);
    }
    const response = await fetchWithPortFallback(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  updateProfile: async (profileData) => {
    const token = localStorage.getItem('medhub_token');
    if (isDemoModeEnabled()) {
      const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
      if (users[0]) {
        Object.assign(users[0], profileData);
        localStorage.setItem('sim_users', JSON.stringify(users));
        return { user: users[0] };
      }
      return { user: profileData };
    }
    const response = await fetchWithPortFallback(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    return await handleResponse(response);
  }
};
