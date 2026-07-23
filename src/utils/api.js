import { decodeJWT } from './jwt';

// Robust environment variable reading for Vite/CRA compatibility
const API_BASE_URL = 
  (import.meta.env && import.meta.env.VITE_API_URL) || 
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 
  'http://localhost:5000/api';

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
 * Handle API responses and throw informative errors.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // JSON parsing failed, use fallback message
    }
    throw new Error(errorMessage);
  }
  return response.json();
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
    // Accept medhub ID. If it is formatted like 'MED-XXXX', retrieve or make up details.
    if (!medHubId || medHubId.trim().length < 4) {
      throw new Error('Invalid Med.hub ID. Must be at least 4 characters.');
    }
    
    // We parse or locate a simulation user, or use a general read-only identity.
    const token = createSimulatedToken({
      sub: medHubId,
      name: `Viewer (${medHubId})`,
      email: `${medHubId.toLowerCase()}@medhub.id`,
      role: 'readonly', // Med.hub ID logins are Read-Only
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
      // Fallback if not found in db
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
 * Exported API clients. Automatically checks connection and falls back to simulation mode.
 */
export const api = {
  login: async (email, password) => {
    if (isDemoModeEnabled()) {
      return simulator.login(email, password);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      return await handleResponse(response);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        console.warn('Backend server unreachable. Falling back to Simulated Demo mode.');
        setDemoMode(true);
        return simulator.login(email, password);
      }
      throw err;
    }
  },

  loginMedHubId: async (medHubId) => {
    if (isDemoModeEnabled()) {
      return simulator.loginMedHubId(medHubId);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/medhub-login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ medHubId })
      });
      return await handleResponse(response);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        console.warn('Backend server unreachable. Falling back to Simulated Demo mode.');
        setDemoMode(true);
        return simulator.loginMedHubId(medHubId);
      }
      throw err;
    }
  },

  signup: async (userData) => {
    if (isDemoModeEnabled()) {
      return simulator.signup(userData);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      return await handleResponse(response);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        console.warn('Backend server unreachable. Falling back to Simulated Demo mode.');
        setDemoMode(true);
        return simulator.signup(userData);
      }
      throw err;
    }
  },

  getScans: async (query = '', filterType = '') => {
    if (isDemoModeEnabled()) {
      return simulator.getScans(query, filterType);
    }
    try {
      const url = new URL(`${API_BASE_URL}/scans`);
      if (query) url.searchParams.append('query', query);
      if (filterType && filterType !== 'All') url.searchParams.append('type', filterType);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(response);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        setDemoMode(true);
        return simulator.getScans(query, filterType);
      }
      throw err;
    }
  },

  uploadScan: async (scanData, creatorName) => {
    if (isDemoModeEnabled()) {
      return simulator.uploadScan(scanData, creatorName);
    }
    try {
      // Check if it is a JSON or file payload.
      // For real app support, we can handle a multipart/form-data upload.
      const isMultipart = scanData instanceof FormData;
      const response = await fetch(`${API_BASE_URL}/scans`, {
        method: 'POST',
        headers: getHeaders(isMultipart),
        body: isMultipart ? scanData : JSON.stringify(scanData)
      });
      return await handleResponse(response);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        setDemoMode(true);
        return simulator.uploadScan(scanData, creatorName);
      }
      throw err;
    }
  },

  getProfile: async () => {
    const token = localStorage.getItem('medhub_token');
    if (isDemoModeEnabled()) {
      return simulator.getProfile(token);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(response);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        setDemoMode(true);
        return simulator.getProfile(token);
      }
      throw err;
    }
  }
};
