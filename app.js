/**
 * نظام شركة SKY - المحرك البرمجي الرئيسي
 * ✨ Firebase Real-time Sync + Local Storage
 * ❌ Google Sheets Integration: REMOVED
 */

// ================= STATE MANAGEMENT =================
let db = {
  clients: [],
  inventory: [],
  brands: ['Oppo', 'Samsung', 'iPhone'],
  suppliers: [],
  contracts: [],
  installments: [],
  collectorCustodies: [],
  treasuryTransactions: [],
  users: [],
  auditLogs: [],
  settings: {
    companyName: 'شركة SKY',
    companyLogo: '',
    templates: {
      reminder: `مرحباً أ/ {{الاسم}}،\nنود تذكيركم بموعد استحقاق القسط الشهري لعقدكم رقم {{العقد}} لدى {{اسم_الشركة}}.\nالمبلغ المطلوب: {{القسط}} ج.م.\nتاريخ الاستحقاق: {{التاريخ}}.\nيرجى التنسيق مع المحصل لتسوية المبلغ في الموعد المحدد. شكراً لتعاونكم المتواصل 🌹`,
      warning: `تنبيه هام وعاجل ⚠️\nالسيد/ {{الاسم}}،\nنحيطكم علماً بتجاوز تاريخ استحقاق قسطكم لعقد رقم {{العقد}} والمستحق بتاريخ {{التاريخ}}، وقد انقضت فترة السماح.\nتفاصيل المتأخرات:\n- قيمة القسط الأصلية: {{القسط}} ج.م\n- غرامة التأخير المتراكمة: {{الغرامة}} ج.م\nإجمالي المبلغ المطلوب سداده فوراً: {{المطلوب}} ج.م.\nنرجو السداد الفوري لتفادي اتخاذ الإجراءات القانونية.`,
      receipt: `تم استلام دفعتكم بنجاح 🧾\nأ/ {{الاسم}}،\nنشكركم على سداد القسط الشهري لعقدكم رقم {{العقد}} لدى {{اسم_الشركة}}.\nالمبلغ المحصل: {{القسط}} ج.م.\nرقم إيصال التحصيل: {{الإيصال}}.\nتم تسجيل المبلغ بخزيناتنا المالية وتحديث حسابكم. دمتم بكل خير ✨`
    }
  }
};

let realtimeUnsubscribers = {};
let tempUploads = { clientCardImg: '', clientContractImg: '', guarantorCardImg: '', guarantorContractImg: '' };
let expandedClients = new Set();
let currentUser = null;
let financialChartInstance = null;

const defaultSeedData = {
  users: [
    { id: 'usr-1', name: 'Khalifa (ADMIN)', username: 'khalifa', password: '123', role: 'ADMIN', phone: '01012345678', area: 'الإدارة الرئيسية' },
    { id: 'usr-2', name: 'أحمد الجمل', username: 'ahmed_gamal', password: '123', role: 'COLLECTOR', phone: '01011042041', area: 'البحيرة / دمنهور' },
    { id: 'usr-3', name: 'محمد علي', username: 'mohamed_ali', password: '123', role: 'COLLECTOR', phone: '01222223344', area: 'كفر الدوار' },
    { id: 'usr-4', name: 'مصطفى محمود', username: 'mostafa_m', password: '123', role: 'COLLECTOR', phone: '01555556677', area: 'الإسكندرية' }
  ],
  brands: ['Oppo', 'Samsung', 'iPhone', 'Xiaomi'],
  suppliers: [
    { name: 'شركة الفتح للاستيراد', phone: '01144445555', notes: 'مورد أجهزة Oppo و Samsung' },
    { name: 'المتحدة لتوزيع الإلكترونيات', phone: '01099998888', notes: 'مورد أجهزة Xiaomi و Apple' }
  ],
  clients: [
    { id: 'cli-1', name: 'محمد بطيخه', nationalId: '29012345678901', phone: '01011042041', address: 'البحيرة - دمنهور - شارع الجمهورية', locationUrl: 'https://maps.google.com/?q=31.041381,30.470438', nationalIdImg: '', contractImg: '', guarantorName: 'محمد (صديق)', guarantorNationalId: '29209876543210', guarantorPhone: '0111111111111', guarantorRelation: 'صديق مقرب', guarantorJob: 'محاسب بشركة الكهرباء', guarantorAddress: 'البحيرة - دمنهور - خلف المحافظة', guarantorCardImg: '', guarantorContractImg: '' }
  ],
  inventory: [
    { id: 'dev-1', brand: 'Oppo', name: 'a3x 128/4', serial: 'SN-OPPO-A3X-001', costPrice: 4000, sellingPrice: 5000, supplier: 'شركة الفتح للاستيراد', status: 'available', soldTo: '' }
  ],
  contracts: [],
  installments: [],
  collectorCustodies: [],
  treasuryTransactions: [
    { id: 'tx-1', timestamp: '2026-06-09 18:14', type: 'deposit', amount: 500000, notes: 'رأس مال افتتاحي للشركة' }
  ],
  auditLogs: [
    { id: 'log-1', user: 'خليفة (ADMIN)', actionType: 'تهيئة النظام', details: 'تهيئة النظام الافتراضي للشركة بنجاح', timestamp: '2026-06-09 18:00' }
  ],
  settings: {
    companyName: 'شركة SKY',
    companyLogo: '',
    templates: {
      reminder: `مرحباً أ/ {{الاسم}}،\nنود تذكيركم بموعد استحقاق القسط الشهري لعقدكم رقم {{العقد}} لدى {{اسم_الشركة}}.\nالمبلغ المطلوب: {{القسط}} ج.م.\nتاريخ الاستحقاق: {{التاريخ}}.\nيرجى التنسيق مع المحصل لتسوية المبلغ في الموعد المحدد. شكراً لتعاونكم المتواصل 🌹`,
      warning: `تنبيه هام وعاجل ⚠️\nالسيد/ {{الاسم}}،\nنحيطكم علماً بتجاوز تاريخ استحقاق قسطكم لعقد رقم {{العقد}} والمستحق بتاريخ {{التاريخ}}، وقد انقضت فترة السماح.\nتفاصيل المتأخرات:\n- قيمة القسط الأصلية: {{القسط}} ج.م\n- غرامة التأخير المتراكمة: {{الغرامة}} ج.م\nإجمالي المبلغ المطلوب سداده فوراً: {{المطلوب}} ج.م.\nنرجو السداد الفوري لتفادي اتخاذ الإجراءات القانونية.`,
      receipt: `تم استلام دفعتكم بنجاح 🧾\nأ/ {{الاسم}}،\nنشكركم على سداد القسط الشهري لعقدكم رقم {{العقد}} لدى {{اسم_الشركة}}.\nالمبلغ المحصل: {{القسط}} ج.م.\nرقم إيصال التحصيل: {{الإيصال}}.\nتم تسجيل المبلغ بخزيناتنا المالية وتحديث حسابكم. دمتم بكل خير ✨`
    }
  }
};

// ================= FIREBASE REAL-TIME SYNC =================
async function initializeRealTimeSync() {
  console.log('🔄 جاري تهيئة المزامنة الحية من Firebase...');
  
  if (!window.FirebaseService.isAvailable()) {
    console.warn('⚠️ Firebase غير متاح - سيتم العمل بالبيانات المحلية فقط');
    showToast('⚠️ تنبيه: Firebase غير متصل - يعمل النظام بالبيانات المحلية', 'warning');
    return;
  }

  try {
    console.log('📥 جاري تحميل البيانات من Firebase...');
    const firebaseData = await window.FirebaseService.loadAllData();
    
    if (firebaseData) {
      if (firebaseData.clients && firebaseData.clients.length > 0) db.clients = firebaseData.clients;
      if (firebaseData.inventory && firebaseData.inventory.length > 0) db.inventory = firebaseData.inventory;
      if (firebaseData.brands && firebaseData.brands.length > 0) db.brands = firebaseData.brands;
      if (firebaseData.suppliers && firebaseData.suppliers.length > 0) db.suppliers = firebaseData.suppliers;
      if (firebaseData.contracts && firebaseData.contracts.length > 0) db.contracts = firebaseData.contracts;
      if (firebaseData.installments && firebaseData.installments.length > 0) db.installments = firebaseData.installments;
      if (firebaseData.collectorCustodies && firebaseData.collectorCustodies.length > 0) db.collectorCustodies = firebaseData.collectorCustodies;
      if (firebaseData.treasuryTransactions && firebaseData.treasuryTransactions.length > 0) db.treasuryTransactions = firebaseData.treasuryTransactions;
      if (firebaseData.users && firebaseData.users.length > 0) db.users = firebaseData.users;
      if (firebaseData.auditLogs && firebaseData.auditLogs.length > 0) db.auditLogs = firebaseData.auditLogs;
      
      console.log('✅ تم تحميل البيانات بنجاح من Firebase');
      showToast('✅ تم تحميل البيانات من السحابة بنجاح', 'success');
    }

    setupRealtimeListeners();
    updateSyncStatusUI();
  } catch (error) {
    console.error('❌ خطأ في تهيئة المزامنة:', error);
    showToast('❌ حدث خطأ في المزامنة - سيتم استخدام البيانات المحلية', 'error');
  }
}

function setupRealtimeListeners() {
  console.log('🔄 جاري إنشاء Real-time Listeners...');
  
  const collections = ['clients', 'inventory', 'contracts', 'installments', 'collectorCustodies', 'treasuryTransactions', 'users', 'auditLogs'];
  
  collections.forEach(collectionName => {
    if (realtimeUnsubscribers[collectionName]) {
      realtimeUnsubscribers[collectionName]();
      console.log(`🔇 تم إيقاف listener القديم لـ ${collectionName}`);
    }

    realtimeUnsubscribers[collectionName] = window.FirebaseService.listenToCollection(
      collectionName,
      (updatedData) => {
        db[collectionName] = updatedData;
        console.log(`🔄 تحديث ${collectionName}: ${updatedData.length} عنصر`);
        renderAllTabs();
      }
    );

    console.log(`✅ تم إنشاء listener لـ ${collectionName}`);
  });

  console.log('✅ تم إنشاء جميع Real-time Listeners بنجاح');
}

// ================= LOCAL STORAGE =================
function saveToLocalStorage() {
  localStorage.setItem('sky_erp_db', JSON.stringify(db));
}

// ================= SYNC WITH FIREBASE ONLY =================
async function syncWithAppsScript(action, payload = {}) {
  if (!window.FirebaseService.isAvailable()) {
    console.warn('⚠️ Firebase غير متاح - سيتم الحفظ محلياً فقط');
    return { success: true, offline: true };
  }

  const result = await window.FirebaseService.syncAction(action, payload);
  
  if (result.success) {
    console.log(`✅ تم مزامنة ${action} مع Firebase`);
  } else {
    console.error(`❌ خطأ في مزامنة ${action}:`, result.error);
  }
  
  return result;
}

function updateSyncStatusUI() {
  const headerBadge = document.getElementById('header-sync-badge');
  const settingsBadge = document.getElementById('sync-status-badge');
  
  const isFirebaseAvailable = window.FirebaseService.isAvailable();
  
  let text = '';
  let badgeClass = '';
  let icon = '';
  
  if (isFirebaseAvailable) {
    text = 'متصل بـ Firebase ☁️';
    badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    icon = '<span class="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>';
  } else {
    text = 'وضع محاكاة محلي فقط ⚠️';
    badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
    icon = '<i class="fa-solid fa-triangle-exclamation animate-pulse"></i>';
  }
  
  if (headerBadge) {
    headerBadge.innerHTML = `${icon}<span>${text}</span>`;
    headerBadge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${badgeClass}`;
  }
  
  if (settingsBadge) {
    settingsBadge.innerHTML = `${icon}<span>${text}</span>`;
    settingsBadge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${badgeClass}`;
  }
}

function showToast(message, type = 'success') {
  document.querySelectorAll('.sky-toast').forEach(t => t.remove());
  
  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-indigo-600 text-white',
    warning: 'bg-amber-500 text-white'
  };
  
  const toast = document.createElement('div');
  toast.className = `sky-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 ${colors[type] || colors.success} transition-all duration-300`;
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  toast.style.opacity = '0';
  toast.innerHTML = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function logAction(actionType, details) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const userName = getCurrentUserName();
  
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user: userName,
    actionType: actionType,
    details: details,
    timestamp: timestamp
  };
  
  db.auditLogs.unshift(logEntry);
  if (db.auditLogs.length > 100) db.auditLogs.pop();
  
  saveToLocalStorage();
  syncWithAppsScript('addAuditLog', logEntry);
}

function applyCompanyBranding() {
  const name = db.settings.companyName || 'شركة SKY';
  const logo = db.settings.companyLogo || '';

  document.getElementById('company-name-display').textContent = name;
  document.getElementById('header-company-subtitle').textContent = `تتابع الآن لوحة التحكم المالية الموحدة والرقابة الإدارية الذكية`;
  document.title = `${name} - نظام إدارة الأقساط والخزينة المتكامل`;

  const logoIcon = document.getElementById('company-logo-icon');
  const logoImg = document.getElementById('company-logo-img');
  
  if (logo) {
    logoIcon.classList.add('hidden');
    logoImg.src = logo;
    logoImg.classList.remove('hidden');
  } else {
    logoIcon.classList.remove('hidden');
    logoImg.classList.add('hidden');
  }
}

// ================= LOGIN & AUTH =================
function isAdmin() {
  return currentUser && currentUser.role === 'ADMIN';
}

function getCurrentUserName() {
  return currentUser ? currentUser.name : 'مجهول';
}

function showLoginScreen() {
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('app-wrapper').classList.add('hidden');
  document.getElementById('login-error-msg').classList.add('hidden');
  document.getElementById('login-username-input').value = '';
  document.getElementById('login-password-input').value = '';
}

function hideLoginScreen() {
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').classList.remove('hidden');
}

function performLogin() {
  const username = document.getElementById('login-username-input').value.trim();
  const password = document.getElementById('login-password-input').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem('sky_erp_current_user', user.id);
    hideLoginScreen();
    updateUIForRole();
    document.getElementById('current-user-display').textContent = `${user.name} (${user.role})`;
    document.getElementById('header-username').textContent = user.name;
    
    let savedTab = localStorage.getItem('sky_erp_active_tab') || 'dashboard';
    if (user.role === 'COLLECTOR') {
      savedTab = 'collections';
    }
    switchTab(savedTab);
  } else {
    errorMsg.classList.remove('hidden');
    document.getElementById('login-password-input').value = '';
  }
}

function updateUIForRole() {
  const isCollector = currentUser && currentUser.role === 'COLLECTOR';
  
  const adminEls = document.querySelectorAll('.admin-only');
  adminEls.forEach(el => {
    if (isAdmin()) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  
  const sidebarLinks = document.querySelectorAll('#sidebar-menu a');
  sidebarLinks.forEach(link => {
    const tab = link.getAttribute('data-tab');
    if (isCollector) {
      if (tab === 'collections') {
        link.classList.remove('hidden');
      } else {
        link.classList.add('hidden');
      }
    } else {
      link.classList.remove('hidden');
    }
  });
  
  const roleBadge = document.getElementById('header-role-badge');
  if (roleBadge) {
    if (isAdmin()) {
      roleBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>الوصول: مشرف (ADMIN)';
      roleBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100';
    } else if (isCollector) {
      roleBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>الوصول: محصل (COLLECTOR)';
      roleBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100';
    } else {
      roleBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600"></span>الوصول: ${currentUser ? currentUser.role : 'مجهول'}`;
      roleBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100';
    }
  }
}

function tryAutoLogin() {
  const savedUserId = localStorage.getItem('sky_erp_current_user');
  if (savedUserId) {
    const user = db.users.find(u => u.id === savedUserId);
    if (user) {
      currentUser = user;
      hideLoginScreen();
      updateUIForRole();
      document.getElementById('current-user-display').textContent = `${user.name} (${user.role})`;
      document.getElementById('header-username').textContent = user.name;
      
      let savedTab = localStorage.getItem('sky_erp_active_tab') || 'dashboard';
      if (user.role === 'COLLECTOR') {
        savedTab = 'collections';
      }
      switchTab(savedTab);
      return true;
    }
  }
  showLoginScreen();
  return false;
}

// ================= INITIALIZATION =================
async function initDatabase() {
  console.log('🚀 جاري تهيئة نظام SKY ERP...');
  
  const localData = localStorage.getItem('sky_erp_db');
  if (localData) {
    try {
      db = JSON.parse(localData);
      console.log('✅ تم تحميل البيانات المحلية');
    } catch (e) {
      console.error('❌ خطأ في تحميل البيانات المحلية:', e);
      db = JSON.parse(JSON.stringify(defaultSeedData));
    }
  } else {
    db = JSON.parse(JSON.stringify(defaultSeedData));
    saveToLocalStorage();
    console.log('✅ تم استخدام البيانات الافتراضية');
  }
  
  applyCompanyBranding();
  
  // تهيئة Firebase المزامنة الحية
  await initializeRealTimeSync();
  
  updateSyncStatusUI();
  console.log('✅ تمت تهيئة النظام بنجاح');
}

// ================= STUB RENDERING FUNCTIONS =================
function renderAllTabs() {
  const activeTabBtn = document.querySelector('#sidebar-menu a.bg-indigo-600');
  if (activeTabBtn) {
    const tabName = activeTabBtn.getAttribute('data-tab');
    switchTab(tabName);
  }
}

function renderDashboard() { console.log('📊 Dashboard');
}
function renderClients() { console.log('👥 Clients'); }
function renderInventory() { console.log('📦 Inventory'); }
function renderContracts() { console.log('📄 Contracts'); }
function renderCollections() { console.log('💰 Collections'); }
function renderTreasury() { console.log('🏦 Treasury'); }
function renderUsers() { console.log('👤 Users'); }
function renderSettings() { console.log('⚙️ Settings'); }

function populateDropdowns() {
  console.log('🔄 Populating dropdowns...');
}

// ================= TAB SWITCHING =================
window.switchTab = function(tabName) {
  if (currentUser && currentUser.role === 'COLLECTOR' && tabName !== 'collections') {
    tabName = 'collections';
  }
  
  document.querySelectorAll('#sidebar-menu a').forEach(b => {
    if (b.getAttribute('data-tab') === tabName) {
      b.className = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20 active-tab-btn';
    } else {
      b.className = 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-skyDark-800 hover:text-white font-medium transition-all duration-200';
    }
  });

  document.querySelectorAll('#main-content-tabs > section').forEach(sec => {
    sec.classList.add('hidden');
  });

  const activeSection = document.getElementById(`tab-${tabName}`);
  if (activeSection) {
    activeSection.classList.remove('hidden');
  }

  localStorage.setItem('sky_erp_active_tab', tabName);
};

// ================= EVENT LISTENERS =================
document.getElementById('login-submit-btn').addEventListener('click', performLogin);
document.getElementById('login-password-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performLogin();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  if (confirm('هل ترغب في تسجيل الخروج؟')) {
    currentUser = null;
    localStorage.removeItem('sky_erp_current_user');
    showLoginScreen();
  }
});

// ================= START =================
initDatabase();
tryAutoLogin();
