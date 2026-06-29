/**
 * نظام شركة SKY - المحرك البرمجي الرئيسي لإدارة الحسابات والأقساط والخزينة
 * المطور: Khalifa (ADMIN)
 * الربط: Firebase Firestore (Real-time Sync)
 */

// ================= STATE MANAGEMENT & INITIAL DATABASE =================
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
    offlineMode: false,
    companyName: 'شركة SKY',
    companyLogo: '',
    templates: {
      reminder: `مرحباً أ/ {{الاسم}}،
نود تذكيركم بموعد استحقاق القسط الشهري لعقدكم رقم {{العقد}} لدى {{اسم_الشركة}}.
المبلغ المطلوب: {{القسط}} ج.م.
تاريخ الاستحقاق: {{التاريخ}}.
يرجى التنسيق مع المحصل لتسوية المبلغ في الموعد المحدد. شكراً لتعاونكم المتواصل 🌹`,
      warning: `تنبيه هام وعاجل ⚠️
السيد/ {{الاسم}}،
نحيطكم علماً بتجاوز تاريخ استحقاق قسطكم لعقد رقم {{العقد}} والمستحق بتاريخ {{التاريخ}}، وقد انقضت فترة السماح.
تفاصيل المتأخرات:
- قيمة القسط الأصلية: {{القسط}} ج.م
- غرامة التأخير المتراكمة: {{الغرامة}} ج.م
إجمالي المبلغ المطلوب سداده فوراً: {{المطلوب}} ج.م.
نرجو السداد الفوري لتفادي اتخاذ الإجراءات القانونية.`,
      receipt: `تم استلام دفعتكم بنجاح 🧾
أ/ {{الاسم}}،
نشكركم على سداد القسط الشهري لعقدكم رقم {{العقد}} لدى {{اسم_الشركة}}.
المبلغ المحصل: {{القسط}} ج.م.
رقم إيصال التحصيل: {{الإيصال}}.
تم تسجيل المبلغ بخزيناتنا المالية وتحديث حسابكم. دمتم بكل خير ✨`
    }
  }
};

// Real-time Listeners tracking
let realtimeUnsubscribers = {};

// Temp file upload storage
let tempUploads = {
  clientCardImg: '',
  clientContractImg: '',
  guarantorCardImg: '',
  guarantorContractImg: ''
};

// Keep track of expanded client IDs
let expandedClients = new Set();

// ================= SESSION / LOGIN MANAGEMENT =================
let currentUser = null;

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

// ================= FIREBASE INITIALIZATION & REAL-TIME SYNC =================
async function initializeRealTimeSync() {
  console.log("🔄 جاري تهيئة المزامنة الحية من Firebase...");
  
  if (!window.FirebaseService.isAvailable()) {
    console.warn("⚠️ Firebase غير متاح - سيتم العمل بالبيانات المحلية فقط");
    showToast('⚠️ تنبيه: Firebase غير متصل - يعمل النظام بالبيانات المحلية', 'warning');
    return;
  }

  try {
    // تحميل البيانات الأولية
    console.log("📥 جاري تحميل البيانات من Firebase...");
    const firebaseData = await window.FirebaseService.loadAllData();
    
    if (firebaseData) {
      // دمج البيانات من Firebase
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
      
      console.log("✅ تم تحميل البيانات بنجاح من Firebase");
      showToast('✅ تم تحميل البيانات من السحابة بنجاح', 'success');
    }

    // إنشاء Listeners للتحديثات الحية
    setupRealtimeListeners();
    
    updateSyncStatusUI();
  } catch (error) {
    console.error("❌ خطأ في تهيئة المزامنة:", error);
    showToast('❌ حدث خطأ في المزامنة - سيتم استخدام البيانات المحلية', 'error');
  }
}

function setupRealtimeListeners() {
  console.log("🔄 جاري إنشاء Real-time Listeners...");
  
  const collections = ['clients', 'inventory', 'contracts', 'installments', 'collectorCustodies', 'treasuryTransactions', 'users', 'auditLogs'];
  
  collections.forEach(collectionName => {
    // إيقاف أي listener قديم
    if (realtimeUnsubscribers[collectionName]) {
      realtimeUnsubscribers[collectionName]();
      console.log(`🔇 تم إيقاف listener القديم لـ ${collectionName}`);
    }

    // إنشاء listener جديد
    realtimeUnsubscribers[collectionName] = window.FirebaseService.listenToCollection(
      collectionName,
      (updatedData) => {
        // تحديث البيانات المحلية
        db[collectionName] = updatedData;
        console.log(`🔄 تحديث ${collectionName}: ${updatedData.length} عنصر`);
        
        // إعادة رسم الواجهة إذا كانت التبويبة المتعلقة مفتوحة
        renderAllTabs();
      }
    );

    console.log(`✅ تم إنشاء listener لـ ${collectionName}`);
  });

  console.log("✅ تم إنشاء جميع Real-time Listeners بنجاح");
}

function saveToLocalStorage() {
  localStorage.setItem('sky_erp_db', JSON.stringify(db));
}

// ================= SYNC WITH FIREBASE =================
async function syncWithAppsScript(action, payload = {}) {
  // الآن نستخدم Firebase فقط
  if (!window.FirebaseService.isAvailable()) {
    console.warn("⚠️ Firebase غير متاح - سيتم الحفظ محلياً فقط");
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

// ================= INITIALIZATION =================
async function initDatabase() {
  console.log("🚀 جاري تهيئة نظام SKY ERP...");
  
  applyCompanyBranding();
  
  // تهيئة Firebase المزامنة الحية
  await initializeRealTimeSync();
  
  updateSyncStatusUI();
  console.log("✅ تمت تهيئة النظام بنجاح");
}

// ================= MORE FUNCTIONS (PLACEHOLDER FOR OTHER CODE) =================
// يتم إضافة باقي الدوال من app.js الأصلي هنا...
// (renderDashboard, renderClients, إلخ)

