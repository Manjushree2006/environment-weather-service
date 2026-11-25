import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Cloud, CloudRain, CloudSun, Droplets, Gauge, History,
  Leaf, LogOut, RefreshCw, ShieldCheck, Sprout, Thermometer, Wind,
  Menu, X, RadioTower, ClipboardList, Settings, CheckCircle2, AlertCircle,
  User, Users, Building, Building2, Download, FileText, FileDown,
  Search, PlusCircle, Calendar, MapPin, Sliders, BarChart2, Check,
  XCircle, Info, Lock, ChevronRight, Hash, Phone, Mail
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('leafline_token') || '');
  const [role, setRole] = useState(localStorage.getItem('leafline_role') || 'admin');
  const [userProfile, setUserProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('leafline_user') || '{}'); } catch { return {}; }
  });

  // Landing / Auth Form states
  const [authMode, setAuthMode] = useState('admin_login'); // admin_login, user_login, org_login, user_register, org_register, track_status
  const [adminKey, setAdminKey] = useState('Leafline@123');
  const [userLoginData, setUserLoginData] = useState({ email: 'ramesh.kumar@leafline.ag', password: 'password123' });
  const [orgLoginData, setOrgLoginData] = useState({ identifier: 'RQ1', password: 'password123' });
  const [userRegData, setUserRegData] = useState({
    fullName: '', email: '', mobile: '', password: '',
    farmName: '', farmLocation: '', state: 'Karnataka', district: 'Dharwad',
    latitude: 15.4589, longitude: 75.0078
  });
  const [orgRegData, setOrgRegData] = useState({
    organizationName: '', organizationType: 'Research institution', email: '',
    contactNumber: '', contactPerson: '', address: '', state: 'Karnataka', district: 'Bengaluru Urban',
    description: '', password: ''
  });
  const [trackingReqId, setTrackingReqId] = useState('RQ1');
  const [trackResult, setTrackResult] = useState(null);

  // App UI state
  const [tab, setTab] = useState('overview');
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Location & Weather state
  const [lat, setLat] = useState('12.9716');
  const [lon, setLon] = useState('77.5946');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [lastHistoryRefresh, setLastHistoryRefresh] = useState(null);
  const [exportScope, setExportScope] = useState('both');
  const [exportLocation, setExportLocation] = useState('');
  const [days, setDays] = useState('7');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [analysisData, setAnalysisData] = useState({ forecast: [], sensors: [] });

  // Sensors & Readings state
  const [sensors, setSensors] = useState([]);
  const [readings, setReadings] = useState([]);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [newSensor, setNewSensor] = useState({
    deviceId: '', name: '', sensorType: 'DHT22', manufacturer: 'Adafruit',
    model: 'DHT22', measurementType: 'Temperature & Humidity', measurementUnit: '°C / %',
    userId: '', farmLocation: '', fieldId: 'field-demo'
  });
  const [newSensorKey, setNewSensorKey] = useState('');
  const [submitReadingData, setSubmitReadingData] = useState({
    deviceId: '', readingValue: '', measurementType: 'Temperature & Humidity',
    measurementUnit: '°C', temperatureC: '', humidityPct: '', rainfallMm: '',
    windSpeedKmh: '', soilMoisturePct: '', soilPh: ''
  });

  // Historical records & filters
  const [historyItems, setHistoryItems] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [filterUser, setFilterUser] = useState('');
  const [filterSensor, setFilterSensor] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMeasType, setFilterMeasType] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Administration state
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminOrgs, setAdminOrgs] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminAudit, setAdminAudit] = useState([]);

  // Reports state
  const [reportPreview, setReportPreview] = useState(null);
  const [reportDownloading, setReportDownloading] = useState(false);

  // Alternaria disease forecast (retained)
  const [growthStages, setGrowthStages] = useState([]);
  const [diseaseStage, setDiseaseStage] = useState('flowering');
  const [diseasePdi, setDiseasePdi] = useState('15');
  const [diseaseForecast, setDiseaseForecast] = useState(null);

  // Helper headers
  const authHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  async function apiRequest(endpoint, options = {}) {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) }
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      throw new Error(data.detail || `Request failed (${res.status})`);
    }
    return data;
  }

  // ---------------- AUTHENTICATION HANDLERS ----------------
  async function handleAdminLogin(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_key: adminKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Administrator login failed');

      localStorage.setItem('leafline_token', data.access_token);
      localStorage.setItem('leafline_role', 'admin');
      localStorage.setItem('leafline_user', JSON.stringify({ name: data.name, role: 'admin' }));
      setToken(data.access_token);
      setRole('admin');
      setUserProfile({ name: data.name, role: 'admin' });
      setTab('overview');
      setNotice('Logged in as Administrator.');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function handleUserLogin(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/api/auth/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userLoginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'User login failed');

      localStorage.setItem('leafline_token', data.access_token);
      localStorage.setItem('leafline_role', 'user');
      localStorage.setItem('leafline_user', JSON.stringify(data));
      setToken(data.access_token);
      setRole('user');
      setUserProfile(data);
      if (data.latitude && data.longitude) {
        setLat(String(data.latitude));
        setLon(String(data.longitude));
      }
      setTab('overview');
      setNotice(`Welcome back, ${data.name}! (User ID: ${data.userId})`);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function handleOrgLogin(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/api/auth/org/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgLoginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Organization login failed');

      localStorage.setItem('leafline_token', data.access_token);
      localStorage.setItem('leafline_role', 'organization');
      localStorage.setItem('leafline_user', JSON.stringify(data));
      setToken(data.access_token);
      setRole('organization');
      setUserProfile(data);
      setTab('overview');
      setNotice(`Welcome, ${data.name}! (Organization ID: ${data.organizationId})`);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function handleUserRegister(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/api/auth/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userRegData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      setNotice(`Registration successful! Your User ID is ${data.userId}. You can now log in.`);
      setUserLoginData({ email: userRegData.email, password: userRegData.password });
      setAuthMode('user_login');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function handleOrgRegister(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/api/auth/org/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgRegData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Organization registration failed');

      setNotice(`Request submitted! Save your Request ID: ${data.requestId}. Once approved by the administrator, you can log in.`);
      setTrackingReqId(data.requestId);
      setAuthMode('track_status');
      checkStatus(data.requestId);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function checkStatus(reqIdToCheck) {
    const q = reqIdToCheck || trackingReqId;
    if (!q) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/api/auth/org/status/${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Status lookup failed');
      setTrackResult(data);
    } catch (err) {
      setError(err.message);
      setTrackResult(null);
    } finally { setBusy(false); }
  }

  function handleLogout() {
    localStorage.removeItem('leafline_token');
    localStorage.removeItem('leafline_role');
    localStorage.removeItem('leafline_user');
    setToken('');
    setRole('admin');
    setUserProfile({});
    setWeather(null);
    setForecast(null);
    setAnalysisData({ forecast: [], sensors: [] });
    setNotice('Logged out successfully.');
  }

  // Explicit user-initiated browser location lookup; no silent geolocation.
  async function fetchMyCurrentLocation() {
    if (!navigator.geolocation) { setError('Location is unavailable in this browser. You can use your registered farm location instead.'); return; }
    setLocationLoading(true); setError(''); setNotice('');
    navigator.geolocation.getCurrentPosition(async position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setLat(latitude.toFixed(5)); setLon(longitude.toFixed(5));
      let placeName = '';
      try {
        const place = await apiRequest(`/api/weather/reverse-geocode?latitude=${latitude}&longitude=${longitude}`);
        placeName = place.locationName || '';
        setDetectedLocation(placeName);
        setNotice(`Current location detected: ${placeName}`);
        if (role === 'user') setUserProfile(prev => ({ ...prev, currentLocationName: placeName }));
      } catch (err) {
        setError('Reverse geocoding failed. Weather will still be fetched for your coordinates; you can also use your registered farm location.');
      }
      try {
        const wx = await apiRequest(`/api/weather/current?latitude=${latitude}&longitude=${longitude}${placeName ? `&locationName=${encodeURIComponent(placeName)}` : ''}`);
        setWeather(wx);
        const fc = await apiRequest(`/api/weather/forecast?latitude=${latitude}&longitude=${longitude}&days=${days}${placeName ? `&locationName=${encodeURIComponent(placeName)}` : ''}`);
        setForecast(fc);
      } catch (err) { setError(err.message); }
      finally { setLocationLoading(false); }
    }, err => {
      const message = err.code === 1 ? 'Location permission denied. Allow location access in your browser, or use your registered farm location.'
        : err.code === 2 ? 'Your location is unavailable. Check device location services or use your registered farm location.'
        : err.code === 3 ? 'Location request timed out. Try again or use your registered farm location.'
        : 'Unable to fetch your location. Use your registered farm location instead.';
      setError(message); setLocationLoading(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  function useRegisteredFarmLocation() {
    if (userProfile.latitude == null || userProfile.longitude == null) {
      setError('Your account does not have registered farm coordinates. Update your farm details or enter coordinates manually.');
      return;
    }
    setLat(String(userProfile.latitude)); setLon(String(userProfile.longitude));
    setDetectedLocation([userProfile.farmLocation, userProfile.district, userProfile.state].filter(Boolean).join(', '));
    setNotice('Using your registered farm location.');
    setTimeout(() => { loadWeather(); loadForecast(); }, 0);
  }

  // ---------------- DATA LOADERS ----------------
  async function loadWeather() {
    setBusy(true); setError('');
    try {
      const d = await apiRequest(`/api/weather/current?latitude=${lat}&longitude=${lon}${detectedLocation ? `&locationName=${encodeURIComponent(detectedLocation)}` : ''}`);
      setWeather(d);
      setNotice('Weather observation updated.');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function loadForecast() {
    setBusy(true); setError('');
    try {
      const d = await apiRequest(`/api/weather/forecast?latitude=${lat}&longitude=${lon}&days=${days}${detectedLocation ? `&locationName=${encodeURIComponent(detectedLocation)}` : ''}`);
      setForecast(d);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function loadWeatherAnalysis() {
    setBusy(true); setError('');
    try {
      const d = await apiRequest(`/api/weather/analysis?latitude=${lat}&longitude=${lon}&days=${days}`);
      setAnalysisData(d);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function loadSensors() {
    try {
      const d = await apiRequest(`/api/sensors`);
      setSensors(Array.isArray(d) ? d : []);
      if (Array.isArray(d) && d.length > 0 && !submitReadingData.deviceId) {
        setSubmitReadingData(prev => ({ ...prev, deviceId: d[0].deviceId, measurementType: d[0].measurementType || 'Temperature & Humidity' }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadRecentReadings() {
    try {
      const d = await apiRequest(`/api/sensor-data/readings?limit=25`);
      setReadings(Array.isArray(d) ? d : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegisterSensor(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const payload = { ...newSensor };
      if (role === 'user' && userProfile.userId) {
        payload.userId = userProfile.userId;
      }
      const res = await apiRequest('/api/sensors/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setNewSensorKey(res.sensorKey);
      setNotice(`Sensor "${res.name}" registered successfully! Copy its API key below.`);
      loadSensors();
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function handleSubmitReading(e) {
    if (e) e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const selSensor = sensors.find(s => s.deviceId === submitReadingData.deviceId);
      const payload = {
        deviceId: submitReadingData.deviceId,
        readingValue: submitReadingData.readingValue !== '' ? Number(submitReadingData.readingValue) : null,
        measurementType: submitReadingData.measurementType || selSensor?.measurementType,
        measurementUnit: submitReadingData.measurementUnit || selSensor?.measurementUnit,
        temperatureC: submitReadingData.temperatureC !== '' ? Number(submitReadingData.temperatureC) : null,
        humidityPct: submitReadingData.humidityPct !== '' ? Number(submitReadingData.humidityPct) : null,
        rainfallMm: submitReadingData.rainfallMm !== '' ? Number(submitReadingData.rainfallMm) : null,
        windSpeedKmh: submitReadingData.windSpeedKmh !== '' ? Number(submitReadingData.windSpeedKmh) : null,
        soilMoisturePct: submitReadingData.soilMoisturePct !== '' ? Number(submitReadingData.soilMoisturePct) : null,
        soilPh: submitReadingData.soilPh !== '' ? Number(submitReadingData.soilPh) : null,
        fieldId: selSensor?.fieldId || 'field-demo'
      };

      const res = await apiRequest('/api/sensor-data/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setNotice(`Reading #${res.readingId} recorded successfully.`);
      loadRecentReadings();
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function loadHistory() {
    setBusy(true); setError('');
    try {
      let url = `/api/environmental-data/history?limit=100&recordType=${filterType}`;
      if (filterUser) url += `&userId=${encodeURIComponent(filterUser)}`;
      if (filterSensor) url += `&deviceId=${encodeURIComponent(filterSensor)}`;
      if (filterMeasType && filterMeasType !== 'all') url += `&measurementType=${encodeURIComponent(filterMeasType)}`;
      if (filterFrom) url += `&from=${encodeURIComponent(filterFrom)}T00:00:00`;
      if (filterTo) url += `&to=${encodeURIComponent(filterTo)}T23:59:59`;

      const d = await apiRequest(url);
      setHistoryItems(d.items || []);
      setHistoryTotal(d.total || 0);
      setLastHistoryRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function loadAdminData() {
    setBusy(true); setError('');
    try {
      const [u, o, s, a] = await Promise.all([
        apiRequest('/api/admin/users'),
        apiRequest('/api/admin/organizations'),
        apiRequest('/api/admin/stats'),
        apiRequest('/api/admin/audit-logs?limit=50')
      ]);
      setAdminUsers(Array.isArray(u) ? u : []);
      setAdminOrgs(Array.isArray(o) ? o : []);
      setAdminStats(s);
      setAdminAudit(a.items || []);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function reviewOrgRequest(requestId, accept) {
    setBusy(true); setError(''); setNotice('');
    try {
      const endpoint = `/api/admin/organizations/${requestId}/${accept ? 'accept' : 'reject'}`;
      const res = await apiRequest(endpoint, { method: 'POST' });
      setNotice(res.message);
      loadAdminData();
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function loadReportPreview() {
    setBusy(true); setError('');
    try {
      let url = `/api/reports/preview?limit=100&dataScope=${encodeURIComponent(exportScope)}`;
      if (exportLocation && (exportScope === 'forecast' || exportScope === 'both')) url += `&location=${encodeURIComponent(exportLocation)}`;
      if (exportScope !== 'forecast' && filterUser) url += `&userId=${encodeURIComponent(filterUser)}`;
      if (exportScope !== 'forecast' && filterSensor) url += `&deviceId=${encodeURIComponent(filterSensor)}`;
      if (exportScope !== 'forecast' && filterMeasType && filterMeasType !== 'all') url += `&measurementType=${encodeURIComponent(filterMeasType)}`;
      if (filterFrom) url += `&from=${encodeURIComponent(filterFrom)}T00:00:00`;
      if (filterTo) url += `&to=${encodeURIComponent(filterTo)}T23:59:59`;

      const d = await apiRequest(url);
      setReportPreview(d);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function downloadPdfReport() { return downloadScopedExport('pdf'); }

  async function downloadScopedExport(format) {
    setReportDownloading(true); setError('');
    try {
      const params = new URLSearchParams({ format, dataScope: exportScope });
      if (exportScope !== 'forecast' && filterUser) params.set('userId', filterUser);
      if (exportScope !== 'forecast' && filterSensor) params.set('deviceId', filterSensor);
      if (exportScope !== 'forecast' && filterMeasType && filterMeasType !== 'all') params.set('measurementType', filterMeasType);
      if (filterFrom) params.set('from', `${filterFrom}T00:00:00`);
      if (filterTo) params.set('to', `${filterTo}T23:59:59`);
      if (exportLocation) params.set('location', exportLocation);
      const res = await fetch(`${API}/api/reports/export?${params}`, { headers: authHeaders() });
      if (!res.ok) { let msg = await res.text(); try { msg = JSON.parse(msg).detail || msg; } catch {} throw new Error(msg || `Export failed (${res.status})`); }
      const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `Leafline_Weather_${exportScope}_${new Date().toISOString().slice(0,10)}.${format}`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setNotice(`${format.toUpperCase()} export downloaded.`);
    } catch (err) { setError(err.message); } finally { setReportDownloading(false); }
  }

  // ---------------- DYNAMIC TABS BY ROLE ----------------
  const navigationTabs = useMemo(() => {
    if (role === 'admin') {
      return [
        ['overview', 'Overview', CloudSun],
        ['forecast', 'Forecast', Cloud],
        ['sensors', 'Sensor Data', RadioTower],
        ['analysis', 'Weather Analysis', Sprout],
        ['history', 'Historical Data', History],
        ['admin', 'Administration', Settings]
      ];
    } else if (role === 'user') {
      return [
        ['overview', 'Overview', CloudSun],
        ['forecast', 'Forecast', Cloud],
        ['sensors', 'Sensor Data', RadioTower],
        ['analysis', 'Weather Analysis', Sprout],
        ['history', 'Historical Data', History],
        ['account', 'Account Information', User]
      ];
    } else if (role === 'organization') {
      return [
        ['overview', 'Overview', CloudSun],
        ['forecast', 'Forecast', Cloud],
        ['sensors', 'Sensor Data', RadioTower],
        ['analysis', 'Weather Analysis', Sprout],
        ['history', 'Historical Data', History],
        ['reports', 'Data Export / Reports', FileDown]
      ];
    }
    return [['overview', 'Overview', CloudSun]];
  }, [role]);

  // Sync active tab when role changes
  useEffect(() => {
    if (!navigationTabs.some(([id]) => id === tab)) {
      setTab('overview');
    }
  }, [navigationTabs, tab]);

  // Load appropriate data on tab change
  useEffect(() => {
    if (!token) return;
    if (tab === 'overview') { loadWeather(); if (role === 'admin') loadAdminData(); }
    if (tab === 'forecast') { loadForecast(); }
    if (tab === 'sensors') { loadSensors(); loadRecentReadings(); }
    if (tab === 'analysis') { loadWeatherAnalysis(); }
    if (tab === 'history') { loadHistory(); loadSensors(); }
    if (tab === 'admin') { loadAdminData(); }
    if (tab === 'reports') { loadReportPreview(); loadSensors(); }
  }, [tab, token, role]);

  const activeTabMeta = navigationTabs.find(x => x[0] === tab);

  return (
    <div className={`app-shell ${!token ? 'public-shell' : ''}`}>
      {/* ---------------- SIDEBAR NAVIGATION (WHEN LOGGED IN) ---------------- */}
      {token && (
        <aside className={`sidebar ${mobile ? 'open' : ''}`}>
          <div className="brand">
            <div className="brand-mark"><Leaf size={22} /></div>
            <div>
              <b>Leafline</b>
              <span>Weather Service</span>
            </div>
            <button className="mobile-close" onClick={() => setMobile(false)}><X size={20} /></button>
          </div>

          <div className="side-label">
            {role === 'admin' ? 'ADMINISTRATOR WORKSPACE' : role === 'organization' ? 'ORGANIZATION WORKSPACE' : 'FARMER WORKSPACE'}
          </div>

          <nav>
            {navigationTabs.map(([id, label, Icon]) => (
              <button
                key={id}
                className={`nav-item ${tab === id ? 'active' : ''}`}
                onClick={() => { setTab(id); setMobile(false); }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === 'admin' && <span className="nav-dot" />}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="service-status">
              <span className="pulse" />
              <div>
                <b>Weather Service</b>
                <small>Connected · Microservice v2.0</small>
              </div>
            </div>
            <div className="side-foot">
              Leafline Platform · Microservice
            </div>
          </div>
        </aside>
      )}

      {token && mobile && <div className="scrim" onClick={() => setMobile(false)} />}

      {/* ---------------- MAIN WORKSPACE AREA ---------------- */}
      <main className="main-area">
        {/* TOPBAR */}
        <header className="topbar">
          {token && <button className="hamburger" onClick={() => setMobile(true)}><Menu size={22} /></button>}
          <div className="crumb">
            Leafline <span>/</span> <b>Weather Service</b>
            {token && <> <span>/</span> <span className="crumb-active">{activeTabMeta?.[1]}</span></>}
          </div>

          <div className="top-actions">
            <span className="env-pill"><span /> ONLINE</span>
            {token ? (
              <div className="user-profile-widget">
                <button className="user-chip" onClick={handleLogout} title="Click to Sign Out">
                  <span className="avatar">
                    {role === 'admin' ? 'A' : role === 'organization' ? 'O' : 'U'}
                  </span>
                  <div className="user-info-text">
                    <b>{userProfile.name || (role === 'admin' ? 'Administrator' : role)}</b>
                    <small>
                      {role === 'admin' ? 'Administrator' : role === 'organization' ? (userProfile.organizationId || 'Org') : (userProfile.userId || 'User')}
                    </small>
                  </div>
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <span className="signed-out">Not authenticated</span>
            )}
          </div>
        </header>

        <div className={`content ${!token ? 'public-content' : ''}`}>
          {/* PAGE TITLE */}
          {token && (
            <div className="page-heading">
              <div>
                <div className="eyebrow">LEAFLINE WEATHER SERVICE</div>
                <h1>{activeTabMeta?.[1] || 'Overview'}</h1>
                <p>
                  {role === 'admin' && 'System-wide weather observations, sensor management, and administrative control.'}
                  {role === 'user' && `Farm microclimate intelligence for ${userProfile.farmName || 'your farm'} (${userProfile.farmLocation || 'Field'}).`}
                  {role === 'organization' && `Regional agricultural weather records and compliance data export for ${userProfile.name}.`}
                </p>
              </div>
              <div className="heading-icon">
                {activeTabMeta?.[2] ? React.createElement(activeTabMeta[2], { size: 28 }) : <CloudSun size={28} />}
              </div>
            </div>
          )}

          {/* ALERTS */}
          {error && (
            <div className="alert error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={14} /></button>
            </div>
          )}
          {notice && (
            <div className="alert success">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button onClick={() => setNotice('')}><X size={14} /></button>
            </div>
          )}

          {/* ---------------- PUBLIC LANDING / LOGIN / REGISTRATION PAGE ---------------- */}
          {!token ? (
            <section className="access-shell">
              {/* Left Brand Banner */}
              <div className="access-hero">
                <div className="sun-icon"><Leaf size={38} /></div>
                <div className="form-eyebrow">LEAFLINE PLATFORM</div>
                <h2>Weather Service</h2>
                <p>
                  Dedicated agricultural weather intelligence: live Open-Meteo observations, multi-day forecasts,
                  field sensor telemetry, and verifiable environmental reporting.
                </p>

                <div className="access-highlights">
                  <span>Three-tier role authentication: Administrator, User & Organization</span>
                  <span>Live Open-Meteo observations & 16-day forecast integration</span>
                  <span>Registered field sensor management & IoT data intake</span>
                  <span>Strict user-level and organization-level data isolation</span>
                  <span>Verifiable PDF compliance reports with statistical summaries</span>
                </div>
              </div>

              {/* Right Authentication Panel */}
              <div className="access-panel">
                {/* 3 Prominent Login Options */}
                {authMode.includes('login') && (
                  <>
                    <div className="form-eyebrow">CHOOSE ACCOUNT TYPE</div>
                    <h3>Account Login</h3>
                    <div className="auth-tabs-row">
                      <button
                        className={`auth-tab-btn ${authMode === 'admin_login' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('admin_login'); setError(''); }}
                      >
                        <ShieldCheck size={16} />
                        <span>Administrator</span>
                      </button>
                      <button
                        className={`auth-tab-btn ${authMode === 'user_login' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('user_login'); setError(''); }}
                      >
                        <User size={16} />
                        <span>User</span>
                      </button>
                      <button
                        className={`auth-tab-btn ${authMode === 'org_login' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('org_login'); setError(''); }}
                      >
                        <Building2 size={16} />
                        <span>Organization</span>
                      </button>
                    </div>
                  </>
                )}

                {/* 1. Administrator Login Form */}
                {authMode === 'admin_login' && (
                  <form className="stack-form" onSubmit={handleAdminLogin}>
                    <p className="muted-copy">
                      Administrator access grants full authority to view all users, manage organization approvals,
                      inspect sensors, and review system logs.
                    </p>
                    <label>
                      Administrator Access Key
                      <input
                        type="password"
                        value={adminKey}
                        onChange={e => setAdminKey(e.target.value)}
                        placeholder="Enter administrator key (e.g. Leafline@123)"
                        required
                      />
                    </label>
                    <button className="btn primary full" disabled={busy}>
                      {busy ? 'Authenticating…' : 'Administrator Login →'}
                    </button>
                  </form>
                )}

                {/* 2. User Login Form */}
                {authMode === 'user_login' && (
                  <form className="stack-form" onSubmit={handleUserLogin}>
                    <p className="muted-copy">
                      Individual farmers and growers can log in with their registered email or User ID to access their farm's weather and sensors.
                    </p>
                    <label>
                      Email Address or User ID
                      <input
                        type="text"
                        value={userLoginData.email}
                        onChange={e => setUserLoginData({ ...userLoginData, email: e.target.value })}
                        placeholder="e.g. ramesh.kumar@leafline.ag or USR1"
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={userLoginData.password}
                        onChange={e => setUserLoginData({ ...userLoginData, password: e.target.value })}
                        placeholder="Enter your password"
                        required
                      />
                    </label>
                    <button className="btn primary full" disabled={busy}>
                      {busy ? 'Logging in…' : 'User Login →'}
                    </button>
                  </form>
                )}

                {/* 3. Organization Login Form */}
                {authMode === 'org_login' && (
                  <form className="stack-form" onSubmit={handleOrgLogin}>
                    <p className="muted-copy">
                      Approved agricultural organizations, universities, and research institutes can log in to view aggregated data and export PDF reports.
                    </p>
                    <label>
                      Official Email, Request ID, or Organization ID
                      <input
                        type="text"
                        value={orgLoginData.identifier}
                        onChange={e => setOrgLoginData({ ...orgLoginData, identifier: e.target.value })}
                        placeholder="e.g. agritech@karnataka.gov.in or RQ1 or ORG1"
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={orgLoginData.password}
                        onChange={e => setOrgLoginData({ ...orgLoginData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                    </label>
                    <button className="btn primary full" disabled={busy}>
                      {busy ? 'Logging in…' : 'Organization Login →'}
                    </button>
                  </form>
                )}

                {/* 4. Individual User Registration Form */}
                {authMode === 'user_register' && (
                  <form className="stack-form" onSubmit={handleUserRegister}>
                    <div className="form-eyebrow">NEW FARMER ACCOUNT</div>
                    <h3>Individual User Registration</h3>
                    <p className="muted-copy">
                      Create an individual farmer account to register personal sensors and view localized farm forecasts.
                    </p>

                    <div className="form-grid">
                      <label>
                        Full Name *
                        <input
                          required
                          value={userRegData.fullName}
                          onChange={e => setUserRegData({ ...userRegData, fullName: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                        />
                      </label>
                      <label>
                        Email Address *
                        <input
                          type="email"
                          required
                          value={userRegData.email}
                          onChange={e => setUserRegData({ ...userRegData, email: e.target.value })}
                          placeholder="farmer@example.com"
                        />
                      </label>
                      <label>
                        Mobile Number *
                        <input
                          required
                          value={userRegData.mobile}
                          onChange={e => setUserRegData({ ...userRegData, mobile: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </label>
                      <label>
                        Password *
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={userRegData.password}
                          onChange={e => setUserRegData({ ...userRegData, password: e.target.value })}
                          placeholder="Minimum 6 characters"
                        />
                      </label>
                      <label>
                        Farm Name
                        <input
                          value={userRegData.farmName}
                          onChange={e => setUserRegData({ ...userRegData, farmName: e.target.value })}
                          placeholder="e.g. Surya Sunflower Farm"
                        />
                      </label>
                      <label>
                        Farm Location / Field
                        <input
                          value={userRegData.farmLocation}
                          onChange={e => setUserRegData({ ...userRegData, farmLocation: e.target.value })}
                          placeholder="e.g. Dharwad Field A"
                        />
                      </label>
                      <label>
                        State
                        <input
                          value={userRegData.state}
                          onChange={e => setUserRegData({ ...userRegData, state: e.target.value })}
                          placeholder="Karnataka"
                        />
                      </label>
                      <label>
                        District
                        <input
                          value={userRegData.district}
                          onChange={e => setUserRegData({ ...userRegData, district: e.target.value })}
                          placeholder="Dharwad"
                        />
                      </label>
                    </div>

                    <button className="btn primary full" disabled={busy}>
                      {busy ? 'Registering…' : 'Register Individual User →'}
                    </button>
                  </form>
                )}

                {/* 5. Organization Registration Form */}
                {authMode === 'org_register' && (
                  <form className="stack-form" onSubmit={handleOrgRegister}>
                    <div className="form-eyebrow">ORGANIZATION ONBOARDING</div>
                    <h3>Organization Registration</h3>
                    <p className="muted-copy">
                      Submit an organization registration request. A unique Request ID (e.g. RQ1) will be assigned.
                      Once approved by the Administrator, your Organization ID will be activated for login.
                    </p>

                    <label>
                      Organization / Institute Name *
                      <input
                        required
                        value={orgRegData.organizationName}
                        onChange={e => setOrgRegData({ ...orgRegData, organizationName: e.target.value })}
                        placeholder="e.g. Karnataka AgriTech Research Institute"
                      />
                    </label>

                    <div className="form-grid">
                      <label>
                        Organization Type *
                        <select
                          value={orgRegData.organizationType}
                          onChange={e => setOrgRegData({ ...orgRegData, organizationType: e.target.value })}
                        >
                          <option>Research institution</option>
                          <option>University / Academic</option>
                          <option>Agriculture Department / Govt</option>
                          <option>Farmer Producer Org (FPO)</option>
                          <option>Private Agronomy Company</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <label>
                        Official Email *
                        <input
                          type="email"
                          required
                          value={orgRegData.email}
                          onChange={e => setOrgRegData({ ...orgRegData, email: e.target.value })}
                          placeholder="contact@institute.gov.in"
                        />
                      </label>
                      <label>
                        Contact Person Name *
                        <input
                          required
                          value={orgRegData.contactPerson}
                          onChange={e => setOrgRegData({ ...orgRegData, contactPerson: e.target.value })}
                          placeholder="Dr. Anand Rao"
                        />
                      </label>
                      <label>
                        Contact Number *
                        <input
                          required
                          value={orgRegData.contactNumber}
                          onChange={e => setOrgRegData({ ...orgRegData, contactNumber: e.target.value })}
                          placeholder="+91 80 2345 6789"
                        />
                      </label>
                      <label>
                        State *
                        <input
                          required
                          value={orgRegData.state}
                          onChange={e => setOrgRegData({ ...orgRegData, state: e.target.value })}
                          placeholder="Karnataka"
                        />
                      </label>
                      <label>
                        District *
                        <input
                          required
                          value={orgRegData.district}
                          onChange={e => setOrgRegData({ ...orgRegData, district: e.target.value })}
                          placeholder="Bengaluru Urban"
                        />
                      </label>
                    </div>

                    <label>
                      Official Address
                      <input
                        value={orgRegData.address}
                        onChange={e => setOrgRegData({ ...orgRegData, address: e.target.value })}
                        placeholder="Campus, Road, City"
                      />
                    </label>

                    <label>
                      Organization Description & Purpose
                      <textarea
                        value={orgRegData.description}
                        onChange={e => setOrgRegData({ ...orgRegData, description: e.target.value })}
                        placeholder="Briefly state your purpose for accessing Leafline weather and sensor intelligence..."
                        rows={2}
                      />
                    </label>

                    <label>
                      Account Password *
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={orgRegData.password}
                        onChange={e => setOrgRegData({ ...orgRegData, password: e.target.value })}
                        placeholder="Set account password"
                      />
                    </label>

                    <button className="btn primary full" disabled={busy}>
                      {busy ? 'Submitting…' : 'Submit Organization Request →'}
                    </button>
                  </form>
                )}

                {/* 6. Organization Status Tracking */}
                {authMode === 'track_status' && (
                  <div className="stack-form">
                    <div className="form-eyebrow">REGISTRATION TRACKING</div>
                    <h3>Check Organization Request Status</h3>
                    <p className="muted-copy">
                      Enter your Request ID (e.g. RQ1, RQ2) to check the review status of your organization application.
                    </p>

                    <label>
                      Request ID
                      <div className="status-search-box">
                        <input
                          value={trackingReqId}
                          onChange={e => setTrackingReqId(e.target.value)}
                          placeholder="e.g. RQ1 or RQ2"
                        />
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() => checkStatus()}
                          disabled={busy || !trackingReqId}
                        >
                          <Search size={14} /> Check
                        </button>
                      </div>
                    </label>

                    {trackResult && (
                      <div className={`status-result-card ${trackResult.status.toLowerCase()}`}>
                        <div className="status-head">
                          <b>{trackResult.organizationName}</b>
                          <span className={`status-pill ${trackResult.status.toLowerCase()}`}>
                            {trackResult.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="status-meta">
                          <div><span>Request ID:</span> <b>{trackResult.requestId}</b></div>
                          <div><span>Official Email:</span> <b>{trackResult.email}</b></div>
                          {trackResult.organizationId && (
                            <div><span>Organization ID:</span> <b className="org-id-badge">{trackResult.organizationId}</b></div>
                          )}
                          <div><span>Submitted:</span> <b>{new Date(trackResult.createdAt).toLocaleDateString()}</b></div>
                        </div>

                        {trackResult.status === 'Pending' && (
                          <div className="status-explain warning">
                            <Info size={16} />
                            <span>Your request is awaiting Administrator review. Login will be enabled upon acceptance.</span>
                          </div>
                        )}
                        {trackResult.status === 'Accepted' && (
                          <div className="status-explain success">
                            <CheckCircle2 size={16} />
                            <div>
                              <b>Approved! Your Organization ID is {trackResult.organizationId}.</b>
                              <p>You can now proceed to Organization Login using your registered email and password.</p>
                              <button
                                className="btn primary small-btn"
                                onClick={() => {
                                  setAuthMode('org_login');
                                  setOrgLoginData(prev => ({ ...prev, identifier: trackResult.organizationId || trackResult.requestId }));
                                }}
                              >
                                Go to Organization Login →
                              </button>
                            </div>
                          </div>
                        )}
                        {trackResult.status === 'Rejected' && (
                          <div className="status-explain danger">
                            <XCircle size={16} />
                            <span>Your application was reviewed and rejected by the Administrator. Access denied.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Navigation Links */}
                <div className="auth-footer-links">
                  {authMode.includes('login') ? (
                    <>
                      <div className="auth-link-row">
                        <span>New farmer?</span>
                        <button type="button" onClick={() => { setAuthMode('user_register'); setError(''); }}>
                          Register as Individual User
                        </button>
                      </div>
                      <div className="auth-link-row">
                        <span>New organization?</span>
                        <button type="button" onClick={() => { setAuthMode('org_register'); setError(''); }}>
                          Register Organization
                        </button>
                      </div>
                      <div className="auth-link-row">
                        <span>Submitted a request?</span>
                        <button type="button" onClick={() => { setAuthMode('track_status'); setError(''); }}>
                          Track Organization Status
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="auth-link-row center">
                      <button type="button" onClick={() => { setAuthMode('admin_login'); setError(''); }}>
                        ← Back to Login Options
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            /* ---------------- AUTHENTICATED DASHBOARDS ---------------- */
            <>
              {/* ==================== 1. OVERVIEW DASHBOARD ==================== */}
              {tab === 'overview' && (
                <>
                  <div className="location-bar">
                    <div>
                      <span className="location-label">LOCATION & SENSOR SCOPE</span>
                      <b>
                        <MapPin className="location-pin" size={17} />
                        {role === 'user'
                          ? `${userProfile.farmName || 'My Farm'} (${detectedLocation || userProfile.farmLocation || 'Field'}), ${userProfile.district || 'Karnataka'}`
                          : role === 'organization'
                          ? `${userProfile.name} Operations Hub (${userProfile.district || 'Karnataka'})`
                          : 'System Overview · All Agricultural Zones'}
                      </b>
                    </div>
                    <div className="coordinate-inputs">
                      {role === 'user' && <button className="btn secondary" onClick={fetchMyCurrentLocation} disabled={locationLoading}>
                        <MapPin size={14} /> {locationLoading ? 'Fetching location…' : 'Fetch My Current Location'}
                      </button>}
                      {role === 'user' && <button className="btn secondary" onClick={useRegisteredFarmLocation}>Use Farm Location</button>}
                      <label>Latitude <input value={lat} onChange={e => setLat(e.target.value)} /></label>
                      <label>Longitude <input value={lon} onChange={e => setLon(e.target.value)} /></label>
                      <button className="btn primary" onClick={loadWeather} disabled={busy}>
                        <RefreshCw size={14} /> Refresh
                      </button>
                    </div>
                  </div>

                  {role === 'user' && detectedLocation && <div className="muted-tag" style={{marginTop:'8px'}}>Detected location: {detectedLocation} · {Number(lat).toFixed(5)}, {Number(lon).toFixed(5)}</div>}
                  <div className="section-title">
                    <div>
                      <h2>Current Weather Conditions</h2>
                      <p>Live observation from Open-Meteo & local weather models</p>
                    </div>
                    <span className="muted-tag">
                      {weather ? new Date(weather.observedAt).toLocaleString() : 'Click Refresh to retrieve live data'}
                    </span>
                  </div>

                  {/* Top Weather Cards */}
                  <div className="metric-grid">
                    <Metric icon={Thermometer} label="Temperature" value={weather?.temperatureC != null ? `${weather.temperatureC}°C` : '—'} tint="orange" />
                    <Metric icon={Droplets} label="Relative Humidity" value={weather?.humidityPct != null ? `${weather.humidityPct}%` : '—'} tint="blue" />
                    <Metric icon={CloudRain} label="Precipitation" value={weather?.rainfallMm != null ? `${weather.rainfallMm} mm` : '—'} tint="teal" />
                    <Metric icon={Wind} label="Wind Speed" value={weather?.windSpeedKmh != null ? `${weather.windSpeedKmh} km/h` : '—'} tint="purple" />
                  </div>

                  {/* Two Column Summary */}
                  <div className="two-col">
                    {/* Left: Weather Source Details */}
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h3>Weather Station Details</h3>
                          <p>Provider observation & cache status</p>
                        </div>
                        <Cloud size={19} />
                      </div>
                      {weather ? (
                        <>
                          <div className="source-row">
                            <span className="source-badge">OPEN-METEO API</span>
                            <span className={`freshness ${weather.stale ? 'stale' : ''}`}>
                              {weather.stale ? 'CACHED SNAPSHOT' : 'LIVE OBSERVATION'}
                            </span>
                          </div>
                          <div className="data-list">
                            <DataRow label="Coordinates" value={`${weather.latitude}, ${weather.longitude}`} />
                            <DataRow label="Observation Time" value={new Date(weather.observedAt).toLocaleString()} />
                            <DataRow label="Fetched At" value={new Date(weather.fetchedAt).toLocaleString()} />
                            <DataRow label="Source" value={weather.source} />
                          </div>
                        </>
                      ) : (
                        <Empty text="Refresh weather to retrieve live observation from Open-Meteo." />
                      )}
                    </div>

                    {/* Right: Role-Specific Summary */}
                    <div className="panel insight-panel">
                      <div className="panel-head">
                        <div>
                          <h3>
                            {role === 'admin' ? 'System Overview' : role === 'organization' ? 'Organization Summary' : 'Farmer Farm Profile'}
                          </h3>
                          <p>
                            {role === 'admin' ? 'Active database and telemetry statistics' : 'Operational overview'}
                          </p>
                        </div>
                        <Gauge size={19} />
                      </div>

                      {role === 'admin' && adminStats && (
                        <div className="stats-metric-tiles">
                          <div className="stat-tile"><span>Registered Users</span><b>{adminStats.totalUsers}</b></div>
                          <div className="stat-tile"><span>Organizations</span><b>{adminStats.acceptedOrganizations} <small>({adminStats.pendingOrganizations} pending)</small></b></div>
                          <div className="stat-tile"><span>Active Sensors</span><b>{adminStats.activeSensors} / {adminStats.totalSensors}</b></div>
                          <div className="stat-tile"><span>Sensor Readings</span><b>{adminStats.totalReadings}</b></div>
                        </div>
                      )}

                      {role === 'user' && (
                        <div className="data-list">
                          <DataRow label="User ID" value={userProfile.userId || 'USR1'} />
                          <DataRow label="Farmer Name" value={userProfile.name || 'Ramesh Kumar'} />
                          <DataRow label="Farm Name" value={userProfile.farmName || 'Surya Sunflower Farm'} />
                          <DataRow label="Location" value={userProfile.farmLocation || 'Dharwad Field A'} />
                          <DataRow label="Associated Org" value={userProfile.organizationId || 'None'} />
                        </div>
                      )}

                      {role === 'organization' && (
                        <div className="data-list">
                          <DataRow label="Organization ID" value={userProfile.organizationId || 'ORG1'} />
                          <DataRow label="Organization Name" value={userProfile.name || 'AgriTech'} />
                          <DataRow label="Official Email" value={userProfile.email || 'agritech@gov.in'} />
                          <DataRow label="Account Type" value="Approved Research & Compliance" />
                        </div>
                      )}

                      <div className="health-row" style={{ marginTop: '14px' }}>
                        <span className="health-icon"><CheckCircle2 size={16} /></span>
                        <div>
                          <b>Weather Service Online</b>
                          <small>Microservice database & telemetry engines operational</small>
                        </div>
                        <span className="health-ok">ONLINE</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ==================== 2. FORECAST DASHBOARD ==================== */}
              {tab === 'forecast' && (
                <>
                  <div className="toolbar panel">
                    <div>
                      <h2>Multi-Day Weather Forecast</h2>
                      <p>Open-Meteo forecast snapshots with temperature, precipitation, and wind projections.</p>
                    </div>
                    <div className="toolbar-controls">
                      <label>
                        Forecast Range
                        <select value={days} onChange={e => setDays(e.target.value)}>
                          <option value="3">3 Days</option>
                          <option value="7">7 Days</option>
                          <option value="14">14 Days</option>
                          <option value="16">16 Days</option>
                        </select>
                      </label>
                      <button className="btn primary" onClick={loadForecast} disabled={busy}>
                        <RefreshCw size={14} /> Load Forecast
                      </button>
                    </div>
                  </div>

                  {forecast ? (
                    <>
                      <div className="forecast-meta">
                        <span className={`freshness ${forecast.stale ? 'stale' : ''}`}>
                          {forecast.stale ? 'STORED SNAPSHOT (FALLBACK)' : 'LIVE OPEN-METEO FORECAST'}
                        </span>
                        <span>
                          Coordinates: {forecast.latitude}, {forecast.longitude} · Fetched {new Date(forecast.fetchedAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Forecast Visual Chart (SVG) */}
                      <div className="panel" style={{ marginBottom: '18px' }}>
                        <div className="panel-head">
                          <div>
                            <h3>Temperature & Rainfall Projection ({forecast.days.length} Days)</h3>
                            <p>Daily maximum/minimum temperatures (°C) and total precipitation (mm)</p>
                          </div>
                          <BarChart2 size={18} />
                        </div>
                        <ForecastChart days={forecast.days} />
                      </div>

                      {/* Forecast Cards Grid */}
                      <div className="forecast-grid">
                        {forecast.days.map(d => (
                          <div className="forecast-card" key={d.date}>
                            <span className="forecast-date">
                              {new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <CloudSun className="forecast-cloud" size={26} />
                            <b>
                              {d.temperatureMaxC ?? '—'}° <small>/ {d.temperatureMinC ?? '—'}°C</small>
                            </b>
                            <div className="forecast-details">
                              <span><CloudRain size={13} /> {d.rainfallSumMm ?? 0} mm</span>
                              <span><Wind size={13} /> {d.windSpeedMaxKmh ?? '—'} km/h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Empty text="Choose a duration (7, 14, or 16 days) and click Load Forecast." />
                  )}
                </>
              )}

              {/* ==================== 3. SENSOR DATA DASHBOARD ==================== */}
              {tab === 'sensors' && (
                <>
                  <div className="section-title">
                    <div>
                      <h2>Registered Sensors & Telemetry Intake</h2>
                      <p>
                        {role === 'admin'
                          ? 'View registered sensors and their device details across the system.'
                          : role === 'user'
                            ? 'Register your own sensors and submit field readings directly.'
                            : 'View sensors and readings associated with your organization.'}
                      </p>
                    </div>
                    {role === 'user' && <button className="btn primary" onClick={() => setShowSensorModal(true)}>
                      <PlusCircle size={15} /> Register New Sensor
                    </button>}
                  </div>

                  {/* Register Sensor Modal / Expandable Form */}
                  {role === 'user' && showSensorModal && (
                    <div className="panel modal-inline">
                      <div className="panel-head">
                        <div>
                          <h3>Register a New Sensor</h3>
                          <p>
                            Farmers and organizations may own their own physical sensors (e.g. DHT22, soil probes, rain gauges).
                            Enter sensor details to register it with the Weather Service.
                          </p>
                        </div>
                        <button className="icon-btn" onClick={() => setShowSensorModal(false)}><X size={16} /></button>
                      </div>

                      <form className="stack-form" onSubmit={handleRegisterSensor}>
                        <div className="form-grid">
                          <label>
                            Sensor Name *
                            <input
                              required
                              value={newSensor.name}
                              onChange={e => setNewSensor({ ...newSensor, name: e.target.value })}
                              placeholder="e.g. North Plot Soil Moisture"
                            />
                          </label>
                          <label>
                            Sensor Type *
                            <select
                              value={newSensor.sensorType}
                              onChange={e => {
                                const t = e.target.value;
                                let m = 'DHT22', meas = 'Temperature & Humidity', u = '°C / %';
                                if (t === 'Soil Moisture Sensor') { m = 'Capacitive v1.2'; meas = 'Soil Moisture'; u = '%'; }
                                else if (t === 'Soil pH Sensor') { m = 'pH-4502C'; meas = 'Soil pH'; u = 'pH'; }
                                else if (t === 'Rain Gauge') { m = 'RG-11'; meas = 'Rainfall'; u = 'mm'; }
                                else if (t === 'Anemometer') { m = 'QS-FS01'; meas = 'Wind Speed'; u = 'km/h'; }
                                setNewSensor({ ...newSensor, sensorType: t, model: m, measurementType: meas, measurementUnit: u });
                              }}
                            >
                              <option>DHT22</option>
                              <option>Soil Moisture Sensor</option>
                              <option>Soil pH Sensor</option>
                              <option>Rain Gauge</option>
                              <option>Anemometer</option>
                              <option>Multi-parameter Station</option>
                            </select>
                          </label>
                          <label>
                            Sensor Manufacturer *
                            <input
                              required
                              value={newSensor.manufacturer}
                              onChange={e => setNewSensor({ ...newSensor, manufacturer: e.target.value })}
                              placeholder="e.g. Adafruit, DFRobot, Sensorex"
                            />
                          </label>
                          <label>
                            Sensor Model *
                            <input
                              required
                              value={newSensor.model}
                              onChange={e => setNewSensor({ ...newSensor, model: e.target.value })}
                              placeholder="e.g. DHT22 / AM2302"
                            />
                          </label>
                          <label>
                            What It Measures *
                            <input
                              required
                              value={newSensor.measurementType}
                              onChange={e => setNewSensor({ ...newSensor, measurementType: e.target.value })}
                              placeholder="e.g. Temperature & Humidity, Soil Moisture"
                            />
                          </label>
                          <label>
                            Measurement Unit *
                            <input
                              required
                              value={newSensor.measurementUnit}
                              onChange={e => setNewSensor({ ...newSensor, measurementUnit: e.target.value })}
                              placeholder="e.g. °C, %, pH, mm"
                            />
                          </label>
                          <label>
                            Sensor Device ID (Unique) *
                            <input
                              required
                              value={newSensor.deviceId}
                              onChange={e => setNewSensor({ ...newSensor, deviceId: e.target.value })}
                              placeholder="e.g. sensor-soil-101"
                            />
                          </label>
                          <label>
                            Farm / Location *
                            <input
                              required
                              value={newSensor.farmLocation}
                              onChange={e => setNewSensor({ ...newSensor, farmLocation: e.target.value })}
                              placeholder="e.g. Dharwad Field A"
                            />
                          </label>
                          {role === 'admin' && (
                            <label>
                              Associated User ID
                              <input
                                value={newSensor.userId}
                                onChange={e => setNewSensor({ ...newSensor, userId: e.target.value })}
                                placeholder="e.g. USR1 or USR2"
                              />
                            </label>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                          <button className="btn primary" disabled={busy}>
                            {busy ? 'Registering…' : 'Register Sensor →'}
                          </button>
                          <button type="button" className="btn secondary" onClick={() => setShowSensorModal(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>

                      {newSensorKey && (
                        <div className="key-reveal" style={{ marginTop: '15px' }}>
                          <b>Generated Sensor Key (Show Once):</b>
                          <code>{newSensorKey}</code>
                          <small>Copy this key now. It is used by the sensor hardware in HTTP header X-Sensor-Key.</small>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Two Column Layout: Submit Reading & Registered Sensors List */}
                  <div
                    className="two-col sensor-layout"
                    style={role === 'admin' ? { gridTemplateColumns: '1fr' } : undefined}
                  >
                    {/* Submit Reading Box: individual users only */}
                    {role === 'user' && <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h3>Submit Field Reading</h3>
                          <p>Record a manual or calibrated reading for a registered sensor</p>
                        </div>
                        <RadioTower size={19} />
                      </div>

                      <form className="stack-form" onSubmit={handleSubmitReading}>
                        <label>
                          Select Registered Sensor *
                          <select
                            value={submitReadingData.deviceId}
                            onChange={e => {
                              const s = sensors.find(x => x.deviceId === e.target.value);
                              setSubmitReadingData({
                                ...submitReadingData,
                                deviceId: e.target.value,
                                measurementType: s?.measurementType || 'Temperature & Humidity',
                                measurementUnit: s?.measurementUnit || '°C'
                              });
                            }}
                          >
                            {sensors.map(s => (
                              <option key={s.deviceId} value={s.deviceId}>
                                {s.name} ({s.model}) — ID: {s.deviceId}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="form-grid">
                          <label>
                            Measurement Value *
                            <input
                              type="number"
                              step="any"
                              required
                              value={submitReadingData.readingValue}
                              onChange={e => setSubmitReadingData({ ...submitReadingData, readingValue: e.target.value })}
                              placeholder="e.g. 28.5"
                            />
                          </label>
                          <label>
                            Measurement Unit
                            <input
                              value={submitReadingData.measurementUnit}
                              onChange={e => setSubmitReadingData({ ...submitReadingData, measurementUnit: e.target.value })}
                              placeholder="e.g. °C, %, pH"
                            />
                          </label>
                          <label>
                            Temperature (°C)
                            <input
                              type="number"
                              step="any"
                              value={submitReadingData.temperatureC}
                              onChange={e => setSubmitReadingData({ ...submitReadingData, temperatureC: e.target.value })}
                              placeholder="Optional"
                            />
                          </label>
                          <label>
                            Relative Humidity (%)
                            <input
                              type="number"
                              step="any"
                              value={submitReadingData.humidityPct}
                              onChange={e => setSubmitReadingData({ ...submitReadingData, humidityPct: e.target.value })}
                              placeholder="Optional"
                            />
                          </label>
                          <label>
                            Soil Moisture (%)
                            <input
                              type="number"
                              step="any"
                              value={submitReadingData.soilMoisturePct}
                              onChange={e => setSubmitReadingData({ ...submitReadingData, soilMoisturePct: e.target.value })}
                              placeholder="Optional"
                            />
                          </label>
                          <label>
                            Soil pH
                            <input
                              type="number"
                              step="any"
                              value={submitReadingData.soilPh}
                              onChange={e => setSubmitReadingData({ ...submitReadingData, soilPh: e.target.value })}
                              placeholder="Optional"
                            />
                          </label>
                        </div>

                        <button className="btn primary full" disabled={busy || !sensors.length}>
                          {busy ? 'Submitting…' : 'Submit Sensor Reading →'}
                        </button>
                      </form>
                    </div>
                    }

                    {/* Registered Sensors List */}
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h3>Registered Sensors ({sensors.length})</h3>
                          <p>Sensors currently registered to this account</p>
                        </div>
                        <button className="icon-btn" onClick={loadSensors}><RefreshCw size={15} /></button>
                      </div>

                      {sensors.length ? (
                        <div className="sensor-scroll-list">
                          {sensors.map(s => (
                            <div className="sensor-row" key={s.deviceId}>
                              <span className="sensor-icon"><RadioTower size={17} /></span>
                              <div>
                                <b>{s.name}</b>
                                <small>
                                  {s.sensorType} · Model: {s.model} · Measures: {s.measurementType} ({s.measurementUnit})
                                </small>
                                <small style={{ color: '#446e50' }}>
                                  ID: {s.deviceId} · User: {s.userId || 'USR1'} · Loc: {s.farmLocation || 'Field'}
                                </small>
                              </div>
                              <span className={`status-dot ${s.active ? 'on' : 'off'}`}>
                                {s.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty text={role === 'user' ? "No sensors registered yet. Click 'Register New Sensor' above." : "No registered sensors are available."} />
                      )}
                    </div>
                  </div>

                  {/* Recent readings remain available to users and organizations; administrators have a read-only sensor registry view. */}
                  {role !== 'admin' && <div className="panel table-panel" style={{ marginTop: '18px' }}>
                    <div className="table-summary">
                      <b>Recent Sensor Telemetry Intake</b> · Latest readings recorded
                    </div>
                    {readings.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Timestamp</th>
                              <th>User ID</th>
                              <th>Sensor Name</th>
                              <th>Model</th>
                              <th>Measurement Type</th>
                              <th>Reading Value</th>
                              <th>Transport</th>
                            </tr>
                          </thead>
                          <tbody>
                            {readings.map(r => (
                              <tr key={r.id}>
                                <td>{new Date(r.recordedAt).toLocaleString()}</td>
                                <td><span className="type-pill">{r.userId || 'USR1'}</span></td>
                                <td><b>{r.sensorName || r.deviceId}</b></td>
                                <td>{r.sensorModel || 'DHT22'}</td>
                                <td>{r.measurementType || 'Weather & Environment'}</td>
                                <td>
                                  <b>
                                    {r.readingValue != null ? `${r.readingValue} ${r.measurementUnit || ''}` : `${r.temperatureC ?? '—'}°C`}
                                  </b>
                                </td>
                                <td><span className="source-badge">{r.transport || 'http'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text="No readings submitted yet." />
                    )}
                  </div>}
                  {role === 'organization' && <div className="panel table-panel" style={{marginTop:'18px'}}>
                    <div className="table-summary"><b>Sensor Readings from Affiliated Users</b> · Organization-scoped records</div>
                    {readings.length ? <div className="table-wrap"><table>
                      <thead><tr><th>User ID</th><th>User</th><th>Sensor ID</th><th>Sensor</th><th>Type / Manufacturer</th><th>Model</th><th>Parameter</th><th>Value</th><th>Timestamp</th><th>Farm / Location</th></tr></thead>
                      <tbody>{readings.map(r => <tr key={r.id}><td>{r.userId}</td><td>{r.userName || '—'}</td><td>{r.deviceId}</td><td>{r.sensorName}</td><td>{r.sensorType || '—'} / {r.manufacturer || '—'}</td><td>{r.sensorModel}</td><td>{r.measurementType}</td><td>{r.readingValue ?? '—'} {r.measurementUnit || ''}</td><td>{new Date(r.recordedAt).toLocaleString()}</td><td>{r.fieldId || '—'}</td></tr>)}</tbody>
                    </table></div> : <Empty text="No sensor readings have been submitted by users associated with this organization."/>}
                  </div>}
                </>
              )}

              {/* ==================== 4. WEATHER ANALYSIS DASHBOARD ==================== */}
              {tab === 'analysis' && (
                <>
                  <div className="section-title">
                    <div>
                      <h2>Weather Analysis: Forecast vs. Sensor Data</h2>
                      <p>
                        Visual comparison of predictive weather forecast parameters alongside actual physical sensor observations.
                      </p>
                    </div>
                    <button className="btn primary" onClick={loadWeatherAnalysis} disabled={busy}>
                      <RefreshCw size={14} /> Refresh Analysis
                    </button>
                  </div>

                  {/* SECTION A: FORECAST DATA (TOP) */}
                  <div className="analysis-section-block">
                    <div className="analysis-section-header forecast-header">
                      <div className="badge-pill badge-forecast">
                        <CloudSun size={14} />
                        <span>FORECAST</span>
                      </div>
                      <h3>A. Weather Forecast Data (Open-Meteo Integration)</h3>
                      <p>Predictive meteorological model projections for the current region.</p>
                    </div>

                    {analysisData.forecast.length ? (
                      <div className="analysis-cards-grid">
                        {analysisData.forecast.slice(0, 6).map((item, idx) => (
                          <div className="analysis-card forecast-card-item" key={idx}>
                            <div className="card-top-tag">
                              <span className="badge-pill badge-forecast">FORECAST</span>
                              <span className="card-date-label">
                                {new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="analysis-main-val">
                              <b>{item.tempMaxC ?? '—'}° <small>/ {item.tempMinC ?? '—'}°C</small></b>
                              <span className="sub-label">Projected Daily Temp</span>
                            </div>

                            <div className="analysis-card-meta">
                              <div><Droplets size={13} /> Humidity: <b>{item.humidityMeanPct ?? '—'}%</b></div>
                              <div><CloudRain size={13} /> Rainfall: <b>{item.rainfallMm ?? 0} mm</b></div>
                              <div><Wind size={13} /> Wind: <b>{item.windSpeedMaxKmh ?? '—'} km/h</b></div>
                              <div><Info size={13} /> Source: <b>{item.provider}</b></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="panel"><Empty text="Forecast data loading or unavailable." /></div>
                    )}
                  </div>

                  {/* SECTION B: SENSOR DATA (BOTTOM) */}
                  <div className="analysis-section-block" style={{ marginTop: '26px' }}>
                    <div className="analysis-section-header sensor-header">
                      <div className="badge-pill badge-sensor">
                        <RadioTower size={14} />
                        <span>SENSOR DATA</span>
                      </div>
                      <h3>B. Actual Field Sensor Data</h3>
                      <p>Live physical telemetry received from registered in-field agricultural sensors.</p>
                    </div>

                    {analysisData.sensors.length ? (
                      <div className="analysis-cards-grid">
                        {analysisData.sensors.slice(0, 6).map((item) => (
                          <div className="analysis-card sensor-card-item" key={item.id}>
                            <div className="card-top-tag">
                              <span className="badge-pill badge-sensor">SENSOR DATA</span>
                              <span className="card-user-tag">User: {item.userId}{item.userName ? ` · ${item.userName}` : ''}</span>
                            </div>

                            <div className="sensor-card-title">
                              <b>{item.sensorName}</b>
                              <small>{item.sensorType || 'Sensor'} · {item.manufacturer || 'Manufacturer unavailable'} · Model: {item.sensorModel} ({item.deviceId})</small>
                            </div>

                            <div className="analysis-main-val">
                              <b>
                                {item.readingValue != null ? `${item.readingValue} ${item.measurementUnit || ''}` : `${item.temperatureC ?? '—'}°C`}
                              </b>
                              <span className="sub-label">{item.measurementType}</span>
                            </div>

                            <div className="analysis-card-meta">
                              <div><ClockIcon /> Observed: <b>{new Date(item.recordedAt).toLocaleString()}</b></div>
                              {item.temperatureC != null && <div>Temp: <b>{item.temperatureC}°C</b></div>}
                              {item.humidityPct != null && <div>Humidity: <b>{item.humidityPct}%</b></div>}
                              {item.rainfallMm != null && <div>Rainfall: <b>{item.rainfallMm} mm</b></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="panel">
                        <Empty text="No sensor data submitted yet. Register a sensor in the Sensor Data tab and submit a reading to view it here." />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ==================== 5. HISTORICAL DATA DASHBOARD ==================== */}
              {tab === 'history' && (
                <>
                  <div className="toolbar panel">
                    <div>
                      <h2>Historical Weather & Sensor Records</h2>
                      <p>
                        {role === 'user'
                          ? 'Isolated historical records for your registered User ID.'
                          : role === 'organization'
                          ? 'Historical data for all farmers affiliated with your organization.'
                          : 'System-wide historical sensor and weather observations with multi-field filtering.'}
                      </p>
                      {lastHistoryRefresh && <small className="muted-tag">Last refreshed: {lastHistoryRefresh.toLocaleString()}</small>}
                    </div>
                    <button className="btn secondary" onClick={loadHistory} disabled={busy}><RefreshCw size={14}/> {busy ? 'Refreshing…' : 'Refresh'}</button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="panel filter-panel">
                    <div className="filter-grid">
                      {role === 'admin' && (
                        <label>
                          User Filter
                          <input
                            value={filterUser}
                            onChange={e => setFilterUser(e.target.value)}
                            placeholder="All Users or USR1..."
                          />
                        </label>
                      )}
                      <label>
                        Sensor Filter
                        <select value={filterSensor} onChange={e => setFilterSensor(e.target.value)}>
                          <option value="">All Sensors</option>
                          {sensors.map(s => (
                            <option key={s.deviceId} value={s.deviceId}>{s.name} ({s.deviceId})</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Measurement Type
                        <select value={filterMeasType} onChange={e => setFilterMeasType(e.target.value)}>
                          <option value="all">All Measurements</option>
                          <option value="Temperature">Temperature</option>
                          <option value="Humidity">Humidity</option>
                          <option value="Soil Moisture">Soil Moisture</option>
                          <option value="Soil pH">Soil pH</option>
                          <option value="Rainfall">Rainfall</option>
                          <option value="Wind Speed">Wind Speed</option>
                        </select>
                      </label>
                      <label>
                        From Date
                        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                      </label>
                      <label>
                        To Date
                        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                      </label>
                      <div style={{ display: 'flex', alignItems: 'end' }}>
                        <button className="btn primary full" onClick={loadHistory} disabled={busy}>
                          <Search size={14} /> Filter Records
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Historical Table */}
                  <div className="panel table-panel">
                    <div className="table-summary">
                      <b>{historyTotal} Historical Records Found</b> · Filtered by role isolation
                    </div>
                    {historyItems.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Date / Time</th>
                              <th>User ID</th>
                              <th>Sensor / Device</th>
                              <th>Model</th>
                              <th>Measurement Type</th>
                              <th>Value</th>
                              <th>Location / Field</th>
                              <th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyItems.filter(item => item.type !== 'forecast').map(item => (
                              <tr key={`${item.type}-${item.id}`}>
                                <td>{new Date(item.recordedAt).toLocaleString()}</td>
                                <td>
                                  <span className={`type-pill ${item.userId === 'SYSTEM' ? 'system' : ''}`}>
                                    {item.userId}
                                  </span>
                                </td>
                                <td><b>{item.sensorName || item.deviceId}</b></td>
                                <td>{item.sensorModel || '—'}</td>
                                <td>{item.measurementType || 'Weather Obs'}</td>
                                <td>
                                  <b>
                                    {item.readingValue != null ? `${item.readingValue} ${item.measurementUnit || ''}` : `${item.temperatureC ?? '—'}°C`}
                                  </b>
                                </td>
                                <td>{item.fieldId || 'Field A'}</td>
                                <td><span className="source-badge">{item.source || 'http'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text="No historical records match the selected filters." />
                    )}
                  </div>

                  <div className="panel table-panel" style={{marginTop:'18px'}}>
                    <div className="table-summary"><b>Historical Weather / Forecast Snapshots</b> · Forecast snapshots are projections saved at retrieval time, not actual observations.</div>
                    {historyItems.filter(item => item.type === 'forecast').length ? (
                      <div className="table-wrap"><table>
                        <thead><tr><th>Retrieved At</th><th>Forecast Date</th><th>Location</th><th>Coordinates</th><th>Max / Min Temp</th><th>Humidity</th><th>Rainfall</th><th>Wind</th></tr></thead>
                        <tbody>{historyItems.filter(item => item.type === 'forecast').map(item => <tr key={`forecast-${item.id}`}>
                          <td>{new Date(item.fetchedAt).toLocaleString()}</td><td>{item.forecastDate}</td>
                          <td>{item.locationName || 'Saved coordinates'}</td><td>{Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}</td>
                          <td>{item.temperatureMaxC ?? '—'}° / {item.temperatureMinC ?? '—'}°C</td><td>{item.humidityMeanPct ?? '—'}%</td>
                          <td>{item.rainfallMm ?? '—'} mm</td><td>{item.windSpeedMaxKmh ?? '—'} km/h</td>
                        </tr>)}</tbody>
                      </table></div>
                    ) : <Empty text="No stored forecast snapshots are available for this account and location yet. Forecast history starts accumulating when forecasts are fetched."/>}
                  </div>
                </>
              )}

              {/* ==================== 6. ADMINISTRATION DASHBOARD (ADMIN ONLY) ==================== */}
              {tab === 'admin' && role === 'admin' && (
                <>
                  {/* System Stats Overview */}
                  {adminStats && (
                    <div className="metric-grid">
                      <Metric icon={Users} label="Total Registered Users" value={adminStats.totalUsers} tint="green" />
                      <Metric icon={Building2} label="Organizations" value={`${adminStats.acceptedOrganizations} Active`} tint="teal" />
                      <Metric icon={AlertCircle} label="Pending Org Requests" value={adminStats.pendingOrganizations} tint="orange" />
                      <Metric icon={RadioTower} label="Registered Sensors" value={adminStats.totalSensors} tint="purple" />
                    </div>
                  )}

                  {/* Organization Requests Management */}
                  <div className="panel table-panel" style={{ marginBottom: '22px' }}>
                    <div className="table-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b>Organization Registration & Data Access Requests</b>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#889988' }}>
                          Review submitted requests. Approving sets status to Accepted and assigns an Organization ID for login.
                        </p>
                      </div>
                      <button className="icon-btn" onClick={loadAdminData}><RefreshCw size={15} /></button>
                    </div>

                    {adminOrgs.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Request ID</th>
                              <th>Organization Name</th>
                              <th>Type</th>
                              <th>Official Email</th>
                              <th>Contact Person</th>
                              <th>Status</th>
                              <th>Organization ID</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminOrgs.map(org => (
                              <tr key={org.id}>
                                <td><b>{org.requestId}</b></td>
                                <td>
                                  <b>{org.name}</b>
                                  <small style={{ display: 'block', color: '#889988' }}>{org.district}, {org.state}</small>
                                </td>
                                <td>{org.organizationType}</td>
                                <td>{org.email}</td>
                                <td>{org.contactPerson} ({org.contactNumber})</td>
                                <td>
                                  <span className={`status-pill ${org.status.toLowerCase()}`}>
                                    {org.status}
                                  </span>
                                </td>
                                <td>
                                  {org.organizationId ? <b className="org-id-badge">{org.organizationId}</b> : '—'}
                                </td>
                                <td>
                                  {org.status === 'Pending' ? (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        className="btn primary small-btn"
                                        onClick={() => reviewOrgRequest(org.requestId, true)}
                                        disabled={busy}
                                      >
                                        <Check size={12} /> Accept
                                      </button>
                                      <button
                                        className="btn danger small-btn"
                                        onClick={() => reviewOrgRequest(org.requestId, false)}
                                        disabled={busy}
                                      >
                                        <X size={12} /> Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#889988' }}>Reviewed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text="No organization registration requests found." />
                    )}
                  </div>

                  {/* Registered Users Table */}
                  <div className="panel table-panel" style={{ marginBottom: '22px' }}>
                    <div className="table-summary">
                      <b>Registered Individual Users ({adminUsers.length})</b>
                    </div>
                    {adminUsers.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>User ID</th>
                              <th>Full Name</th>
                              <th>Email Address</th>
                              <th>Mobile Number</th>
                              <th>Farm Name & Location</th>
                              <th>State / District</th>
                              <th>Associated Org</th>
                              <th>Registered Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUsers.map(u => (
                              <tr key={u.id}>
                                <td><span className="type-pill">{u.userId}</span></td>
                                <td><b>{u.fullName}</b></td>
                                <td>{u.email}</td>
                                <td>{u.mobile || '—'}</td>
                                <td>{u.farmName || '—'} ({u.farmLocation || 'Field'})</td>
                                <td>{u.district || '—'}, {u.state || '—'}</td>
                                <td>{u.organizationId || 'None'}</td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text="No individual users registered." />
                    )}
                  </div>

                  {/* Audit Logs */}
                  <div className="panel audit-panel">
                    <div className="panel-head">
                      <div>
                        <h3>System Audit History</h3>
                        <p>Immutable administrative activities recorded by Weather Service</p>
                      </div>
                      <ClipboardList size={18} />
                    </div>
                    {adminAudit.length ? (
                      adminAudit.map(a => (
                        <div className="audit-row" key={a.id}>
                          <span>{a.action}</span>
                          <b>{a.resource}</b>
                          <small>{a.detail}</small>
                          <small>{new Date(a.createdAt).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <Empty text="No audit records yet." />
                    )}
                  </div>
                </>
              )}

              {/* ==================== 7. ACCOUNT INFORMATION (USER ONLY) ==================== */}
              {tab === 'account' && role === 'user' && (
                <>
                  <div className="two-col">
                    {/* User Profile Card */}
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h3>Farmer Profile Information</h3>
                          <p>Account identity and contact details</p>
                        </div>
                        <User size={19} />
                      </div>
                      <div className="data-list">
                        <DataRow label="Assigned User ID" value={userProfile.userId || 'USR1'} />
                        <DataRow label="Full Name" value={userProfile.name || 'Ramesh Kumar'} />
                        <DataRow label="Email Address" value={userProfile.email || 'ramesh.kumar@leafline.ag'} />
                        <DataRow label="Mobile Number" value={userProfile.mobile || '+91 98765 43210'} />
                        <DataRow label="Account Role" value="Individual Farmer / Grower" />
                        <DataRow label="Affiliated Organization" value={userProfile.organizationId || 'Independent Grower'} />
                      </div>
                    </div>

                    {/* Farm Details Card */}
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h3>Farm & Field Information</h3>
                          <p>Geographical coordinates and location settings</p>
                        </div>
                        <MapPin size={19} />
                      </div>
                      <div className="data-list">
                        <DataRow label="Farm Name" value={userProfile.farmName || 'Surya Sunflower Farm'} />
                        <DataRow label="Farm Location" value={userProfile.farmLocation || 'Dharwad Field A'} />
                        <DataRow label="District & State" value={`${userProfile.district || 'Dharwad'}, ${userProfile.state || 'Karnataka'}`} />
                        <DataRow label="Default Latitude" value={lat} />
                        <DataRow label="Default Longitude" value={lon} />
                        <DataRow label="Registered Sensors Count" value={sensors.length} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ==================== 8. DATA EXPORT / REPORTS (ORG & ADMIN) ==================== */}
              {tab === 'reports' && (
                <>
                  <div className="section-title">
                    <div>
                      <h2>Data Export & PDF Reports</h2>
                      <p>
                        Generate verifiable PDF reports containing actual weather and sensor observations with Leafline branding.
                      </p>
                    </div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      <button className="btn primary" onClick={() => downloadScopedExport('pdf')} disabled={reportDownloading || busy}><Download size={15}/> {reportDownloading ? 'Generating…' : 'Download PDF'}</button>
                      <button className="btn secondary" onClick={() => downloadScopedExport('csv')} disabled={reportDownloading || busy}>Download CSV</button>
                      <button className="btn secondary" onClick={() => downloadScopedExport('xlsx')} disabled={reportDownloading || busy}>Download Excel</button>
                    </div>
                  </div>

                  {/* Filter & Controls Panel */}
                  <div className="panel filter-panel" style={{ marginBottom: '18px' }}>
                    <div className="filter-grid">
                      <label>
                        Data Type / Data Scope
                        <select value={exportScope} onChange={e => setExportScope(e.target.value)}>
                          <option value="forecast">Forecast Data Only</option>
                          <option value="sensor">Sensor Data Only</option>
                          <option value="both">Both Forecast and Sensor Data</option>
                        </select>
                      </label>
                      <label>
                        From Date
                        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                      </label>
                      <label>
                        To Date
                        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                      </label>
                      {(exportScope === 'forecast' || exportScope === 'both') && <label>
                        Forecast Location
                        <input value={exportLocation} onChange={e => setExportLocation(e.target.value)} placeholder="All locations" />
                      </label>}
                      {exportScope !== 'forecast' && <label>
                        User Scope
                        <input
                          value={filterUser}
                          onChange={e => setFilterUser(e.target.value)}
                          placeholder="All affiliated users..."
                        />
                      </label>}
                      {exportScope !== 'forecast' && <label>
                        Sensor Scope
                        <select value={filterSensor} onChange={e => setFilterSensor(e.target.value)}>
                          <option value="">All Sensors</option>
                          {sensors.map(s => (
                            <option key={s.deviceId} value={s.deviceId}>{s.name}</option>
                          ))}
                        </select>
                      </label>}
                      {exportScope !== 'forecast' && <label>
                        Measurement Parameter
                        <select value={filterMeasType} onChange={e => setFilterMeasType(e.target.value)}>
                          <option value="all">All Parameters</option>
                          <option value="Temperature">Temperature</option>
                          <option value="Humidity">Humidity</option>
                          <option value="Soil Moisture">Soil Moisture</option>
                          <option value="Soil pH">Soil pH</option>
                          <option value="Rainfall">Rainfall</option>
                        </select>
                      </label>}
                      <div style={{ display: 'flex', alignItems: 'end' }}>
                        <button className="btn secondary full" onClick={loadReportPreview} disabled={busy}>
                          <Search size={14} /> Update Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Report Summary Cards */}
                  {reportPreview?.statistics && (
                    <div className="metric-grid" style={{ marginBottom: '18px' }}>
                      <Metric icon={FileText} label="Total Records" value={reportPreview.statistics.total_readings} tint="green" />
                      <Metric icon={Thermometer} label="Temperature Avg (Span)" value={`${reportPreview.statistics.temp_avg}`} tint="orange" />
                      <Metric icon={Droplets} label="Humidity Avg" value={reportPreview.statistics.humidity_avg} tint="blue" />
                      <Metric icon={CloudRain} label="Rainfall Sum" value={reportPreview.statistics.rainfall_sum} tint="teal" />
                    </div>
                  )}

                  {/* Data Preview Table */}
                  <div className="panel table-panel">
                    <div className="table-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b>Report Data Preview ({reportPreview?.totalCount || 0} matching records · {reportPreview?.forecastCount || 0} forecast · {reportPreview?.sensorCount || 0} sensor)</b>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#889988' }}>
                          Title: Leafline – Weather Service · Organization: {reportPreview?.organizationName} (ID: {reportPreview?.organizationId})
                        </p>
                      </div>
                      <button
                        className="btn primary small-btn"
                        onClick={downloadPdfReport}
                        disabled={reportDownloading}
                      >
                        <FileDown size={14} /> Download PDF
                      </button>
                    </div>

                    {reportPreview?.items?.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            {exportScope === 'forecast' ? (
                              <tr><th>Retrieved At</th><th>Forecast Date</th><th>Location</th><th>Coordinates</th><th>Max / Min Temp</th><th>Humidity</th><th>Rainfall</th><th>Wind</th></tr>
                            ) : exportScope === 'sensor' ? (
                              <tr><th>Date / Time</th><th>User ID</th><th>Sensor Name</th><th>Model</th><th>Measurement</th><th>Value</th><th>Location</th></tr>
                            ) : (
                              <tr><th>Record Type</th><th>Date / Time</th><th>User / Source</th><th>Sensor / Model</th><th>Forecast / Measurement</th><th>Value</th><th>Location / Valid Date</th></tr>
                            )}
                          </thead>
                          <tbody>
                            {reportPreview.items.map(item => item.type === 'forecast' ? (
                              <tr key={`forecast-${item.id}`}>
                                {exportScope === 'both' && <td><span className="type-pill system">FORECAST</span></td>}
                                <td>{new Date(item.fetchedAt || item.recordedAt).toLocaleString()}</td>
                                {exportScope === 'forecast' && <td>{item.forecastDate}</td>}
                                <td>{item.locationName || item.farmLocation || '—'}</td>
                                {exportScope === 'forecast' && <td>{Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}</td>}
                                {exportScope === 'forecast' && <td><b>{item.temperatureMaxC ?? '—'}° / {item.temperatureMinC ?? '—'}°C</b></td>}
                                {exportScope === 'forecast' && <td>{item.humidityMeanPct ?? '—'}%</td>}
                                {exportScope === 'forecast' && <td>{item.rainfallMm ?? '—'} mm ({item.rainfallProbabilityPct ?? '—'}%)</td>}
                                {exportScope === 'forecast' && <td>{item.windSpeedMaxKmh ?? '—'} km/h</td>}
                                {exportScope === 'both' && <td>Open-Meteo</td>}
                                {exportScope === 'both' && <td><b>Open-Meteo Forecast</b></td>}
                                {exportScope === 'both' && <td>Forecast snapshot · valid {item.forecastDate}</td>}
                                {exportScope === 'both' && <td>Tmax {item.temperatureMaxC ?? '—'}°C / Tmin {item.temperatureMinC ?? '—'}°C / RH {item.humidityMeanPct ?? '—'}% / Rain {item.rainfallMm ?? '—'} mm / Wind {item.windSpeedMaxKmh ?? '—'} km/h</td>}
                                {exportScope === 'both' && <td>{item.locationName || item.farmLocation || '—'}</td>}
                              </tr>
                            ) : (
                              <tr key={`sensor-${item.id}`}>
                                {exportScope === 'both' && <td><span className="type-pill">SENSOR DATA</span></td>}
                                <td>{new Date(item.recordedAt).toLocaleString()}</td>
                                <td>{item.userId}</td>
                                <td><b>{item.sensorName}</b> {exportScope === 'both' && `(${item.sensorModel})`}</td>
                                {exportScope !== 'both' && <td>{item.sensorModel}</td>}
                                <td>{item.measurementType}</td>
                                <td><b>{item.readingValue != null ? `${item.readingValue} ${item.measurementUnit || ''}` : '—'}</b></td>
                                <td>{item.farmLocation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text={exportScope === 'forecast' ? 'No stored forecast snapshots match this organization and date/location filter.' : 'No records found matching the selected data scope and filters.'} />
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* FOOTER */}
          <footer className="footer">
            <span>© Leafline Sunflower Health Intelligence Platform</span>
            <span>Weather Service · Independent Microservice v2.0</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------
function Metric({ icon: Icon, label, value, tint = 'green' }) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${tint}`}><Icon size={19} /></span>
      <span className="metric-label">{label}</span>
      <b>{value}</b>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="data-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Cloud size={22} /></div>
      <p>{text}</p>
    </div>
  );
}

function ClockIcon() {
  return <span style={{ marginRight: '4px' }}>⏱</span>;
}

// SVG Forecast Bar & Line Chart
function ForecastChart({ days }) {
  if (!days || !days.length) return null;
  const maxTemp = Math.max(...days.map(d => d.temperatureMaxC || 30), 35);
  const minTemp = Math.min(...days.map(d => d.temperatureMinC || 15), 10);
  const tempRange = Math.max(maxTemp - minTemp, 10);

  const chartWidth = 720;
  const chartHeight = 160;
  const colWidth = chartWidth / days.length;

  return (
    <div className="forecast-chart-container" style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="forecast-svg" style={{ minWidth: '600px', width: '100%' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = 20 + pct * (chartHeight - 50);
          return (
            <g key={i}>
              <line x1="40" y1={y} x2={chartWidth - 20} y2={y} stroke="#edf0ec" strokeWidth="1" strokeDasharray="3 3" />
            </g>
          );
        })}

        {/* Days columns */}
        {days.map((d, idx) => {
          const x = 50 + idx * colWidth;
          const tMax = d.temperatureMaxC ?? 28;
          const tMin = d.temperatureMinC ?? 18;
          const yMax = 20 + (1 - (tMax - minTemp) / tempRange) * (chartHeight - 60);
          const yMin = 20 + (1 - (tMin - minTemp) / tempRange) * (chartHeight - 60);
          const barH = Math.max(yMin - yMax, 6);

          return (
            <g key={d.date} className="chart-day-col">
              {/* Temp span bar */}
              <rect
                x={x + 12}
                y={yMax}
                width={colWidth - 28}
                height={barH}
                rx="4"
                fill="url(#tempGradient)"
              />
              {/* Max temp label */}
              <text x={x + colWidth / 2 - 2} y={yMax - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2d5239">
                {tMax}°
              </text>
              {/* Min temp label */}
              <text x={x + colWidth / 2 - 2} y={yMin + 12} textAnchor="middle" fontSize="9" fill="#758879">
                {tMin}°
              </text>
              {/* Day label */}
              <text x={x + colWidth / 2 - 2} y={chartHeight - 5} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#526b58">
                {new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
              </text>
            </g>
          );
        })}

        {/* Gradient Def */}
        <defs>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.75" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
