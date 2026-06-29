/**
 * نظام شركة SKY - المحرك البرمجي الرئيسي لإدارة الحسابات والأقساط والخزينة
 * المطور: Khalifa (ADMIN)
 */

// ================= STATE MANAGEMENT & INITIAL DATABASE =================
let db = {
  clients: [],
  inventory: [],
  brands: ['Oppo', 'Samsung', 'iPhone'], // Default Brands/Categories
  suppliers: [],
  contracts: [],
  installments: [],
  collectorCustodies: [],
  treasuryTransactions: [],
  users: [],
  auditLogs: [],
  settings: {
    gasUrl: 'https://script.google.com/macros/s/AKfycbzQE5jVPI2bEXq2QyJiW-_7-N8WM65iEe1VgKtyIiTKpKUNvlimsp8lhsjx9VUY2Kei/exec',
    offlineMode: true,
    companyName: 'شركة SKY',
    companyLogo: '', // Base64 or URL
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

// Temp file upload storage (base64)
let tempUploads = {
  clientCardImg: '',
  clientContractImg: '',
  guarantorCardImg: '',
  guarantorContractImg: ''
};

// Keep track of expanded client IDs in Collections Tab
let expandedClients = new Set();

// Default Seed Data
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
    {
      id: 'cli-1',
      name: 'محمد بطيخه',
      nationalId: '29012345678901',
      phone: '01011042041',
      address: 'البحيرة - دمنهور - شارع الجمهورية',
      locationUrl: 'https://maps.google.com/?q=31.041381,30.470438',
      nationalIdImg: 'id_card_mohamed.jpg',
      contractImg: 'signed_contract_mohamed.pdf',
      guarantorName: 'محمد (صديق)',
      guarantorNationalId: '29209876543210',
      guarantorPhone: '0111111111111',
      guarantorRelation: 'صديق مقرب',
      guarantorJob: 'محاسب بشركة الكهرباء',
      guarantorAddress: 'البحيرة - دمنهور - خلف المحافظة',
      guarantorCardImg: 'id_card_guarantor.jpg',
      guarantorContractImg: ''
    },
    {
      id: 'cli-2',
      name: 'أحمد خليل',
      nationalId: '29509876543210',
      phone: '01222223344',
      address: 'كفر الدوار - شارع بورسعيد',
      locationUrl: 'https://maps.google.com/?q=31.1345,30.1287',
      nationalIdImg: 'id_card_ahmed.jpg',
      contractImg: '',
      guarantorName: 'علي خليل (أخ)',
      guarantorNationalId: '28809876543211',
      guarantorPhone: '01555556677',
      guarantorRelation: 'شقيق',
      guarantorJob: 'تاجر ملابس',
      guarantorAddress: 'كفر الدوار - الميدان الرئيسي',
      guarantorCardImg: '',
      guarantorContractImg: ''
    }
  ],
  inventory: [
    { id: 'dev-1', brand: 'Oppo', name: 'a3x 128/4', serial: 'SN-OPPO-A3X-001', costPrice: 4000, sellingPrice: 5000, supplier: 'شركة الفتح للاستيراد', status: 'sold_installment', soldTo: 'محمد بطيخه' },
    { id: 'dev-2', brand: 'Samsung', name: 'Galaxy A15 128GB', serial: 'SN-SAMS-A15-002', costPrice: 5500, sellingPrice: 7000, supplier: 'المتحدة لتوزيع الإلكترونيات', status: 'available', soldTo: '' },
    { id: 'dev-3', brand: 'Oppo', name: 'Reno 11 F', serial: 'SN-OPPO-R11-003', costPrice: 10000, sellingPrice: 13000, supplier: 'شركة الفتح للاستيراد', status: 'available', soldTo: '' },
    { id: 'dev-4', brand: 'iPhone', name: 'Pro Max 256GB 13', serial: 'SN-APPL-IP13-004', costPrice: 28000, sellingPrice: 35000, supplier: 'المتحدة لتوزيع الإلكترونيات', status: 'available', soldTo: '' }
  ],
  contracts: [
    {
      id: 'con-218360',
      clientId: 'cli-1',
      clientName: 'محمد بطيخه',
      clientPhone: '01011042041',
      deviceId: 'dev-1',
      deviceInfo: 'Oppo a3x 128/4',
      totalValue: 74100,
      downPayment: 5000,
      remainingAmount: 69100,
      monthlyInstallment: 6175,
      duration: 12,
      graceDays: 5,
      fineType: 'flat',
      fineValue: 10,
      collectorId: 'usr-2',
      collectorName: 'أحمد الجمل',
      startDate: '2026-05-09',
      status: 'active'
    }
  ],
  installments: [],
  collectorCustodies: [],
  treasuryTransactions: [
    { id: 'tx-1', timestamp: '2026-06-09 18:14', type: 'deposit', amount: 500000, notes: 'رأس مال افتتاحي للشركة' },
    { id: 'tx-2', timestamp: '2026-06-09 18:15', type: 'inventory_purchase', amount: -4000, notes: 'شراء Oppo a3x 128/4 من شركة الفتح للاستيراد' },
    { id: 'tx-3', timestamp: '2026-06-09 18:15', type: 'inventory_purchase', amount: -5500, notes: 'شراء Galaxy A15 من المتحدة لتوزيع الإلكترونيات' },
    { id: 'tx-4', timestamp: '2026-06-09 18:15', type: 'inventory_purchase', amount: -10000, notes: 'شراء Reno 11 F من شركة الفتح للاستيراد' },
    { id: 'tx-5', timestamp: '2026-06-09 18:15', type: 'inventory_purchase', amount: -28000, notes: 'شراء iPhone 13 Pro Max من المتحدة لتوزيع الإلكترونيات' },
    { id: 'tx-6', timestamp: '2026-06-09 18:16', type: 'collection', amount: 5000, notes: 'دفعة مقدمة لعقد رقم 218360 للعميل محمد بطيخه' }
  ],
  auditLogs: [
    { user: 'خليفة (ADMIN)', actionType: 'تهيئة النظام', details: 'تهيئة النظام الافتراضي للشركة بنجاح', timestamp: '2026-06-09 18:00' },
    { user: 'خليفة (ADMIN)', actionType: 'إضافة قطعة', details: 'إضافة قطعة بسيريال SN-OPPO-A3X-001 للصنف Oppo a3x 128/4', timestamp: '2026-06-09 18:10' },
    { user: 'خليفة (ADMIN)', actionType: 'إنشاء عقد', details: 'إنشاء عقد تقسيط رقم 218360 للعميل محمد بطيخه لجهاز Oppo a3x 128/4', timestamp: '2026-06-09 18:16' }
  ],
  settings: {
    gasUrl: '',
    offlineMode: true,
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

// Function to generate due installments for seeded contracts on startup
function generateSeededInstallments() {
  db.installments = [];
  db.contracts.forEach(contract => {
    let start = new Date(contract.startDate);
    for (let i = 1; i <= contract.duration; i++) {
      let dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + (i - 1));
      
      db.installments.push({
        id: `${contract.id}_${i}`,
        contractId: contract.id,
        clientId: contract.clientId,
        clientName: contract.clientName,
        clientPhone: contract.clientPhone,
        guarantorName: db.clients.find(c => c.id === contract.clientId)?.guarantorName || '',
        guarantorPhone: db.clients.find(c => c.id === contract.clientId)?.guarantorPhone || '',
        collectorName: contract.collectorName,
        installmentNum: i,
        amount: contract.monthlyInstallment,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
        paidAmount: 0,
        paidDate: '',
        receiptId: '',
        delayFines: 0
      });
    }
  });
}

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

async function performLogin() {
  const usernameInput = document.getElementById('login-username-input').value.trim();
  const passwordInput = document.getElementById('login-password-input').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  if (!usernameInput || !passwordInput) {
    errorMsg.textContent = "الرجاء إدخال اسم المستخدم وكلمة المرور";
    return;
  }

  try {
    // 1. استعلام حقيقي من فايربيس للبحث عن المستخدم
    const q = query(
      collection(db, "users"), 
      where("username", "==", usernameInput), 
      where("password", "==", passwordInput)
    );
    
    const querySnapshot = await getDocs(q);

    // 2. التحقق من النتيجة
    if (!querySnapshot.empty) {
      // تم العثور على المستخدم في فايربيس
      const userDoc = querySnapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() };
      
      currentUser = user;
      localStorage.setItem('sky_erp_current_user', user.id); // للحفاظ على الجلسة عند عمل تحديث للصفحة
      
      hideLoginScreen();
      updateUIForRole();
      document.getElementById('current-user-display').textContent = `${user.name} (${user.role})`;
      document.getElementById('header-username').textContent = user.name;
      errorMsg.textContent = ""; 
    } else {
      // لم يتم العثور على المستخدم
      errorMsg.textContent = "اسم المستخدم أو كلمة المرور غير صحيحة.";
    }
  } catch (error) {
    console.error("خطأ أثناء تسجيل الدخول:", error);
    errorMsg.textContent = "حدث خطأ في الاتصال بقاعدة البيانات. راجع اتصالك بالإنترنت.";
  }
}

function updateUIForRole() {
  const isCollector = currentUser && currentUser.role === 'COLLECTOR';
  
  // 1. إظهار/إخفاء العناصر الخاصة بالمشرف فقط
  const adminEls = document.querySelectorAll('.admin-only');
  adminEls.forEach(el => {
    if (isAdmin()) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  
  // 2. إخفاء التبويبات غير المصرح بها للمحصل من القائمة الجانبية
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
  
  // 3. تحديث شارة دور المستخدم في أعلى الصفحة
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
      
      // فتح الصفحة الأخيرة النشطة المفتوحة مسبقاً أو فتح لوحة القيادة كوضع افتراضي
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

function initDatabase() {
  const isLocalFile = window.location.protocol === 'file:';
  const localData = localStorage.getItem('sky_erp_db');
  if (localData) {
    db = JSON.parse(localData);
    if (db.settings.offlineMode === undefined) {
      db.settings.offlineMode = isLocalFile;
    }
    if (!db.brands) db.brands = ['Oppo', 'Samsung', 'iPhone', 'Xiaomi'];
    if (!db.settings.companyName) db.settings.companyName = 'شركة SKY';
    if (!db.settings.companyLogo) db.settings.companyLogo = '';
    if (!db.settings.templates) {
      db.settings.templates = defaultSeedData.settings.templates;
    }
    // هجرة البيانات: التأكد من أن جميع الحسابات القديمة تمتلك كلمة مرور لمنع فشل تسجيل الدخول
    if (db.users) {
      let updated = false;
      db.users.forEach(u => {
        if (!u.password) {
          const seedUser = defaultSeedData.users.find(su => su.username === u.username);
          u.password = seedUser ? seedUser.password : '123';
          updated = true;
        }
      });
      if (updated) {
        saveToLocalStorage();
      }
    }
  } else {
    db = defaultSeedData;
    db.settings.offlineMode = isLocalFile;
    generateSeededInstallments();
    saveToLocalStorage();
  }
  
  applyCompanyBranding();
  updateSyncStatusUI();
}

function saveToLocalStorage() {
  localStorage.setItem('sky_erp_db', JSON.stringify(db));
}

// ================= BACKUP & RESTORE SYSTEM =================
window.exportBackup = function() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
  
  const backupPayload = {
    _meta: {
      version: '1.0',
      system: 'SKY ERP',
      createdAt: now.toISOString(),
      createdBy: getCurrentUserName(),
      label: `نسخة احتياطية - ${dateStr}`
    },
    data: {
      clients: db.clients,
      inventory: db.inventory,
      brands: db.brands,
      suppliers: db.suppliers,
      contracts: db.contracts,
      installments: db.installments,
      collectorCustodies: db.collectorCustodies,
      treasuryTransactions: db.treasuryTransactions,
      users: db.users,
      auditLogs: db.auditLogs,
      settings: db.settings
    }
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SKY_ERP_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logAction('نسخ احتياطي', `تم تصدير نسخة احتياطية كاملة: ${backupPayload._meta.label}`);
  showToast('✅ تم حفظ النسخة الاحتياطية بنجاح!', 'success');
};

window.triggerRestoreBackup = function() {
  // Open confirmation modal first
  const modal = document.getElementById('backup-restore-confirm-modal');
  if (modal) modal.classList.remove('hidden');
};

window.confirmRestoreBackup = function() {
  const modal = document.getElementById('backup-restore-confirm-modal');
  if (modal) modal.classList.add('hidden');
  // Trigger file picker
  const fileInput = document.getElementById('backup-restore-file-input');
  if (fileInput) fileInput.click();
};

window.handleRestoreFileSelected = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);

      // Validate it's a SKY ERP backup
      if (!parsed._meta || parsed._meta.system !== 'SKY ERP' || !parsed.data) {
        showToast('❌ الملف المختار ليس نسخة احتياطية صحيحة لنظام SKY ERP!', 'error');
        return;
      }

      const restoredData = parsed.data;
      const meta = parsed._meta;

      // Restore all data
      if (restoredData.clients) db.clients = restoredData.clients;
      if (restoredData.inventory) db.inventory = restoredData.inventory;
      if (restoredData.brands) db.brands = restoredData.brands;
      if (restoredData.suppliers) db.suppliers = restoredData.suppliers;
      if (restoredData.contracts) db.contracts = restoredData.contracts;
      if (restoredData.installments) db.installments = restoredData.installments;
      if (restoredData.collectorCustodies) db.collectorCustodies = restoredData.collectorCustodies;
      if (restoredData.treasuryTransactions) db.treasuryTransactions = restoredData.treasuryTransactions;
      if (restoredData.users) db.users = restoredData.users;
      if (restoredData.auditLogs) db.auditLogs = restoredData.auditLogs;
      if (restoredData.settings) {
        // Preserve current connection settings, only restore data-related settings
        const currentConnectionSettings = {
          gasUrl: db.settings.gasUrl,
          offlineMode: db.settings.offlineMode
        };
        db.settings = { ...restoredData.settings, ...currentConnectionSettings };
      }

      saveToLocalStorage();
      applyCompanyBranding();
      updateSyncStatusUI();
      renderAllTabs();

      logAction('استرجاع نسخة احتياطية', `تم استرجاع النسخة: ${meta.label} (أنشئت بواسطة: ${meta.createdBy})`);
      showToast(`✅ تم استرجاع النسخة الاحتياطية بنجاح! (${meta.label})`, 'success');

    } catch (err) {
      showToast('❌ خطأ في قراءة الملف. تأكد أنه ملف JSON صحيح!', 'error');
      console.error('Restore error:', err);
    }
    // Reset file input so user can pick same file again if needed
    event.target.value = '';
  };
  reader.readAsText(file, 'utf-8');
};

function showToast(message, type = 'success') {
  // Remove existing toasts
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
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Auto-remove after 4 seconds
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
  
  db.auditLogs.unshift({
    user: userName,
    actionType: actionType,
    details: details,
    timestamp: timestamp
  });
  
  if (db.auditLogs.length > 100) db.auditLogs.pop();
  saveToLocalStorage();
  
  syncWithAppsScript('addAuditLog', { user: userName, actionType, details, timestamp });
}

function applyCompanyBranding() {
  const name = db.settings.companyName || 'شركة SKY';
  const logo = db.settings.companyLogo || '';

  document.getElementById('company-name-display').textContent = name;
  document.getElementById('header-company-subtitle').textContent = `تتابع الآن لوحة التحكم المالية الموحدة والرقابة الإدارية الذكية لمبيعات التقسيط وحسابات الأمانة لدى ${name}.`;
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

// ================= BACKEND APPS SCRIPT SYNC =================
function getApiUrl() {
  return db.settings.gasUrl || './backend.php';
}

async function syncWithAppsScript(action, payload = {}) {
  if (db.settings.offlineMode) {
    return { success: true, offline: true };
  }

  // Use Firebase if initialized
  if (window.FirebaseService && window.FirebaseService.isAvailable()) {
    return await window.FirebaseService.syncAction(action, payload);
  }

  // Fallback to PHP / Google Apps Script
  const url = getApiUrl();
  if (!url) {
    return { success: true, offline: true };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, data: payload })
    });
    return await response.json();
  } catch (error) {
    console.error('Server sync error:', error);
    return { success: false, error: error.message };
  }
}

async function loadFromServer() {
  if (db.settings.offlineMode) return;

  const statusMsg = document.getElementById('connection-status-msg');
  if (statusMsg) statusMsg.innerHTML = '<span class="text-indigo-600">جاري تحميل البيانات من السحابة...</span>';

  // Use Firebase if initialized
  if (window.FirebaseService && window.FirebaseService.isAvailable()) {
    try {
      const fbData = await window.FirebaseService.loadAllData();
      if (fbData) {
        db.clients = fbData.clients.length > 0 ? fbData.clients : db.clients;
        db.inventory = fbData.inventory.length > 0 ? fbData.inventory : db.inventory;
        db.contracts = fbData.contracts.length > 0 ? fbData.contracts : db.contracts;
        db.installments = fbData.installments.length > 0 ? fbData.installments : db.installments;
        db.collectorCustodies = fbData.collectorCustodies.length > 0 ? fbData.collectorCustodies : db.collectorCustodies;
        db.treasuryTransactions = fbData.treasuryTransactions.length > 0 ? fbData.treasuryTransactions : db.treasuryTransactions;
        db.users = fbData.users.length > 0 ? fbData.users : db.users;
        db.auditLogs = fbData.auditLogs.length > 0 ? fbData.auditLogs : db.auditLogs;
        
        saveToLocalStorage();
        renderAllTabs();
        
        if (statusMsg) statusMsg.innerHTML = '<span class="text-emerald-600">تمت المزامنة بنجاح (Firebase)!</span>';
        updateSyncStatusUI();
        return;
      }
    } catch (e) {
      console.error("Firebase load error", e);
    }
  }

  // Fallback to PHP / Google Apps Script
  const url = getApiUrl();
  if (!url) return;
  
  try {
    const fetchUrl = url.includes('?') ? `${url}&action=getAllData` : `${url}?action=getAllData`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow'
    });
    const result = await response.json();
    if (result.success && result.data) {
      db.clients = result.data.clients || db.clients;
      db.inventory = result.data.inventory || db.inventory;
      db.contracts = result.data.contracts || db.contracts;
      db.installments = result.data.installments || db.installments;
      db.collectorCustodies = result.data.collectorCustodies || db.collectorCustodies;
      db.treasuryTransactions = result.data.treasuryTransactions || db.treasuryTransactions;
      db.users = result.data.users || db.users;
      db.auditLogs = result.data.auditLogs || db.auditLogs;
      
      saveToLocalStorage();
      renderAllTabs();
      
      if (statusMsg) statusMsg.innerHTML = '<span class="text-emerald-600">تمت المزامنة بنجاح!</span>';
      updateSyncStatusUI();
    }
  } catch (error) {
    console.error('Failed to load from server:', error);
    if (statusMsg) statusMsg.innerHTML = '<span class="text-rose-600">فشل الاتصال، تم تشغيل وضع عدم الاتصال.</span>';
    updateSyncStatusUI();
  }
}

function updateSyncStatusUI() {
  const headerBadge = document.getElementById('header-sync-badge');
  const settingsBadge = document.getElementById('sync-status-badge');
  
  const isOffline = db.settings.offlineMode;
  const usingPhp = !db.settings.gasUrl;
  
  let text = '';
  let badgeClass = '';
  let icon = '';
  
  if (isOffline) {
    text = 'وضع محاكاة أوفلاين ⚠️';
    badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
    icon = '<i class="fa-solid fa-triangle-exclamation animate-pulse"></i>';
  } else {
    if (usingPhp) {
      text = 'متصل محلياً (PHP/SQLite) 🟢';
      badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      icon = '<span class="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>';
    } else {
      text = 'متصل سحابياً (جوجل شيت) 🟢';
      badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-250';
      icon = '<span class="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>';
    }
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

// ================= DYNAMIC CALCULATIONS (OVERDUE FINES) =================
function calculateFinesForInstallment(inst, contract) {
  if (inst.status === 'paid') return inst.delayFines || 0;
  
  const today = new Date();
  const due = new Date(inst.dueDate);
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= contract.graceDays) {
    return 0;
  }
  
  if (contract.fineType === 'flat') {
    return diffDays * contract.fineValue;
  } else if (contract.fineType === 'percent') {
    return parseFloat((inst.amount * (contract.fineValue / 100) * diffDays).toFixed(2));
  }
  return 0;
}

function getInstallmentOverdueStatus(inst) {
  const contract = db.contracts.find(c => c.id === inst.contractId);
  if (!contract) return { statusText: 'خطأ بالعقد', overdueDays: 0, fine: 0, totalDue: inst.amount, statusColor: 'badge-danger' };

  if (inst.status === 'paid') {
    return {
      statusText: 'تم السداد',
      overdueDays: 0,
      fine: inst.delayFines || 0,
      totalDue: inst.amount,
      statusColor: 'badge-success'
    };
  }

  const today = new Date();
  const due = new Date(inst.dueDate);
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      statusText: 'بالانتظار موعد الاستحقاق',
      overdueDays: 0,
      fine: 0,
      totalDue: inst.amount,
      statusColor: 'badge-info'
    };
  }

  const fine = calculateFinesForInstallment(inst, contract);
  const totalDue = inst.amount + fine;

  if (diffDays <= contract.graceDays) {
    return {
      statusText: `متأخر (${diffDays} يوم) - بفترة السماح`,
      overdueDays: diffDays,
      fine: 0,
      totalDue: inst.amount,
      statusColor: 'badge-warning'
    };
  }

  return {
    statusText: `متأخر (${diffDays} يوم) - خارج السماح`,
    overdueDays: diffDays,
    fine: fine,
    totalDue: totalDue,
    statusColor: 'badge-danger'
  };
}

// ================= TAB RENDERING ENGINES =================
function renderActiveTab(tabName) {
  switch (tabName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'clients':
      renderClients();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'contracts':
      renderContracts();
      break;
    case 'collections':
      renderCollections();
      break;
    case 'treasury':
      renderTreasury();
      break;
    case 'users':
      renderUsers();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

function renderAllTabs() {
  const activeTabBtn = document.querySelector('#sidebar-menu a.bg-indigo-600');
  if (activeTabBtn) {
    const tabName = activeTabBtn.getAttribute('data-tab');
    renderActiveTab(tabName);
  }
}

// --- 1. DASHBOARD ---
let financialChartInstance = null;

function renderDashboard() {
  const totalTreasury = db.treasuryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  document.getElementById('kpi-treasury-balance').textContent = `${totalTreasury.toLocaleString()} ج.م`;
  
  const directSales = db.treasuryTransactions.filter(tx => tx.type === 'cash_sale').reduce((sum, tx) => sum + tx.amount, 0);
  const contractSales = db.contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const totalSales = directSales + contractSales;
  document.getElementById('kpi-total-sales').textContent = `${totalSales.toLocaleString()} ج.م`;

  const activeCollections = db.treasuryTransactions.filter(tx => tx.type === 'collection').reduce((sum, tx) => sum + tx.amount, 0);
  document.getElementById('kpi-active-collections').textContent = `${activeCollections.toLocaleString()} ج.م`;

  const totalExpenses = Math.abs(db.treasuryTransactions.filter(tx => tx.type === 'expense' || tx.type === 'inventory_purchase').reduce((sum, tx) => sum + tx.amount, 0));
  document.getElementById('kpi-total-expenses').textContent = `${totalExpenses.toLocaleString()} ج.م`;

  let totalOverdueVal = 0;
  let overdueCount = 0;
  db.installments.forEach(inst => {
    if (inst.status !== 'paid') {
      const stats = getInstallmentOverdueStatus(inst);
      if (stats.overdueDays > 0) {
        totalOverdueVal += stats.totalDue;
        overdueCount++;
      }
    }
  });
  document.getElementById('kpi-overdue-installments').textContent = `${totalOverdueVal.toLocaleString()} ج.م`;
  
  const overdueContainer = document.getElementById('kpi-overdue-container');
  const overdueAlertText = document.getElementById('kpi-overdue-alert-text');
  const overdueIconBg = document.getElementById('kpi-overdue-icon-bg');
  
  if (totalOverdueVal > 0) {
    overdueContainer.classList.add('border-red-400', 'bg-red-50/20');
    overdueIconBg.className = 'p-3 bg-red-100 text-red-600 rounded-xl animate-pulse-warning';
    overdueAlertText.innerHTML = `<span class="flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation"></i> يوجد عدد ${overdueCount} قسط متأخر بالذمة</span>`;
  } else {
    overdueContainer.classList.remove('border-red-400', 'bg-red-50/20');
    overdueIconBg.className = 'p-3 bg-amber-50 text-amber-500 rounded-xl';
    overdueAlertText.innerHTML = `<span>كل الأقساط منتظمة بالكامل</span>`;
  }

  const inventoryCapital = db.inventory.filter(dev => dev.status === 'available').reduce((sum, dev) => sum + dev.costPrice, 0);
  document.getElementById('kpi-inventory-capital').textContent = `${inventoryCapital.toLocaleString()} ج.م`;

  const totalRemainingContractBalance = db.installments.filter(inst => inst.status !== 'paid').reduce((sum, inst) => sum + inst.amount, 0);
  document.getElementById('kpi-expected-profits').textContent = `${totalRemainingContractBalance.toLocaleString()} ج.م`;

  const totalInsts = db.installments.length;
  const badDebtRate = totalInsts > 0 ? Math.round((overdueCount / totalInsts) * 100) : 0;
  document.getElementById('kpi-bad-debt-rate').textContent = `${badDebtRate}%`;
  document.getElementById('kpi-bad-debt-bar').style.width = `${badDebtRate}%`;

  const timeline = document.getElementById('dashboard-audit-timeline');
  timeline.innerHTML = '';
  db.auditLogs.slice(0, 5).forEach(log => {
    let colorClass = 'bg-slate-200 text-slate-800';
    if (log.actionType.includes('إضافة') || log.actionType.includes('شراء')) colorClass = 'bg-indigo-50 text-indigo-700 border border-indigo-100';
    if (log.actionType.includes('إنشاء') || log.actionType.includes('بيع') || log.actionType.includes('تعديل')) colorClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (log.actionType.includes('تحصيل') || log.actionType.includes('اعتماد')) colorClass = 'bg-blue-50 text-blue-700 border border-blue-100';
    if (log.actionType.includes('صرف')) colorClass = 'bg-rose-50 text-rose-700 border border-rose-100';

    const item = document.createElement('div');
    item.className = 'relative timeline-item flex gap-4 pr-6 pb-4';
    item.innerHTML = `
      <div class="absolute right-[9px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400 z-10"></div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <span class="text-xs font-semibold ${colorClass} px-2 py-0.5 rounded">${log.actionType}</span>
          <span class="text-[10px] text-slate-400 font-mono">${log.timestamp}</span>
        </div>
        <p class="text-xs text-slate-600 mt-1.5"><span class="font-bold text-slate-700">${log.user}</span>: ${log.details}</p>
      </div>
    `;
    timeline.appendChild(item);
  });

  const canvas = document.getElementById('financialTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (financialChartInstance) {
    financialChartInstance.destroy();
  }

  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
  const salesData = [120000, 150000, 180000, 220000, 260000, totalSales];
  const collectionData = [80000, 110000, 130000, 160000, 200000, activeCollections];

  financialChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'إجمالي المبيعات',
          data: salesData,
          backgroundColor: 'rgba(79, 70, 229, 0.85)',
          borderRadius: 8,
          borderWidth: 0,
          barPercentage: 0.6
        },
        {
          label: 'إجمالي التحصيلات الفعالة',
          data: collectionData,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 8,
          borderWidth: 0,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Cairo', size: 11 } }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Cairo', size: 10 } }
        }
      }
    }
  });
}

// --- 2. CLIENTS & GUARANTORS ---
function renderClients() {
  const searchVal = document.getElementById('client-search-input').value.toLowerCase();
  const tbody = document.getElementById('clients-table-body');
  const emptyState = document.getElementById('clients-empty-state');
  
  tbody.innerHTML = '';
  
  const filtered = db.clients.filter(c => 
    c.name.toLowerCase().includes(searchVal) || 
    c.nationalId.includes(searchVal) || 
    c.phone.includes(searchVal)
  );

  document.getElementById('total-clients-count').textContent = db.clients.length;

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="p-4 font-bold text-slate-800">${c.name}</td>
      <td class="p-4 text-slate-500 font-mono">${c.nationalId}</td>
      <td class="p-4 font-mono">${c.phone}</td>
      <td class="p-4 text-slate-800">${c.guarantorName || '-'}</td>
      <td class="p-4 text-slate-500">${c.guarantorRelation || '-'}</td>
      <td class="p-4">
        ${c.locationUrl ? `<a href="${c.locationUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-semibold"><i class="fa-solid fa-location-dot"></i> عرض الخريطة</a>` : '<span class="text-slate-400">لا يوجد</span>'}
      </td>
      <td class="p-4 text-center">
        <div class="inline-flex gap-1.5">
          <button onclick="viewClientDetails('${c.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-all">الملف الكامل</button>
          <button onclick="editClient('${c.id}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold transition-all flex items-center gap-1"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
          <button onclick="deleteClient('${c.id}')" class="p-1 text-rose-500 hover:bg-rose-50 rounded-md text-xs transition-all"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- 3. INVENTORY & DEVICES ---
function renderInventory() {
  const searchVal = document.getElementById('inventory-search').value.toLowerCase();
  const tbody = document.getElementById('inventory-table-body');
  const emptyState = document.getElementById('inventory-empty-state');
  
  tbody.innerHTML = '';
  
  document.getElementById('inv-suppliers-count').textContent = db.suppliers.length;
  document.getElementById('inv-total-count').textContent = [...new Set(db.inventory.map(d => `${d.brand}_${d.name}`))].length;
  document.getElementById('inv-available-count').textContent = db.inventory.filter(d => d.status === 'available').length;
  document.getElementById('inv-sold-count').textContent = db.inventory.filter(d => d.status.startsWith('sold')).length;

  const grouped = {};
  db.inventory.forEach(dev => {
    const key = `${dev.brand}_${dev.name}_${dev.costPrice}_${dev.sellingPrice}_${dev.supplier}`;
    if (!grouped[key]) {
      grouped[key] = {
        brand: dev.brand,
        name: dev.name,
        costPrice: dev.costPrice,
        sellingPrice: dev.sellingPrice,
        supplier: dev.supplier,
        devices: []
      };
    }
    grouped[key].devices.push(dev);
  });

  const groupedList = Object.values(grouped).filter(group => {
    return group.name.toLowerCase().includes(searchVal) || group.brand.toLowerCase().includes(searchVal);
  });

  if (groupedList.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  groupedList.forEach(group => {
    const totalQty = group.devices.length;
    const availQty = group.devices.filter(d => d.status === 'available').length;
    
    const serialBadges = group.devices.map(d => {
      let bg = 'bg-slate-100 text-slate-600';
      let title = 'متاح';
      if (d.status === 'sold_installment') {
        bg = 'bg-indigo-50 text-indigo-700 border border-indigo-100';
        title = `قسط لـ: ${d.soldTo}`;
      } else if (d.status === 'sold_cash') {
        bg = 'bg-amber-50 text-amber-700 border border-amber-100';
        title = `كاش لـ: ${d.soldTo}`;
      }
      return `<span class="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded ${bg} m-0.5" title="${title}">${d.serial}</span>`;
    }).join(' ');

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="p-4 font-bold text-slate-800">${group.brand}</td>
      <td class="p-4">${group.name}</td>
      <td class="p-4 text-slate-600 text-xs">${group.supplier || '-'}</td>
      <td class="p-4 font-bold font-mono text-emerald-600">${group.costPrice.toLocaleString()} ج.م</td>
      <td class="p-4 font-bold font-mono text-indigo-600">${group.sellingPrice.toLocaleString()} ج.م</td>
      <td class="p-4">
        <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold">
          ${availQty} متاح / ${totalQty} كلي
        </span>
      </td>
      <td class="p-4 max-w-xs overflow-hidden">${serialBadges}</td>
      <td class="p-4 text-center">
        <div class="inline-flex gap-1.5">
          ${availQty > 0 ? `
            <button onclick="openCashSaleModalGrouped('${group.brand}', '${group.name}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all flex items-center gap-1">
              <i class="fa-solid fa-money-bill-wave"></i> بيع كاش
            </button>
          ` : `<span class="text-xs text-slate-400 font-semibold">نفذت الكمية</span>`}
          <button onclick="editDeviceGroup('${group.brand}', '${group.name}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold transition-all flex items-center gap-1"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
          <button onclick="deleteDeviceGroup('${group.brand}', '${group.name}')" class="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Cash Sale Modal for grouped items
window.openCashSaleModalGrouped = function(brand, name) {
  const availableDevices = db.inventory.filter(d => d.brand === brand && d.name === name && d.status === 'available');
  if (availableDevices.length === 0) return;

  const infoEl = document.getElementById('cash-sale-device-info');
  infoEl.innerHTML = `
    <div class="space-y-2">
      <p>الجهاز: <strong>${brand} ${name}</strong></p>
      <div>
        <label class="form-label text-xs">اختر الرقم التسلسلي (سيريال) المراد بيعه:</label>
        <select id="cash-sale-serial-select" class="form-input text-xs py-1">
          ${availableDevices.map(d => `<option value="${d.id}">${d.serial}</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  document.getElementById('cash-sale-brand-model').value = `${brand} ${name}`;
  document.getElementById('cash-sale-price').value = availableDevices[0].sellingPrice;
  openModal('cash-sale-modal');
};

window.deleteDeviceGroup = async function(brand, name) {
  if (!isAdmin()) {
    alert('⛔ حذف المخزون مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  if (confirm(`هل أنت متأكد من حذف جميع القطع المتاحة من (${brand} ${name}) بالمخزن؟`)) {
    const beforeCount = db.inventory.length;
    db.inventory = db.inventory.filter(d => !(d.brand === brand && d.name === name && d.status === 'available'));
    const afterCount = db.inventory.length;
    const deletedCount = beforeCount - afterCount;
    
    saveToLocalStorage();
    logAction('حذف كمية أجهزة', `تم حذف عدد ${deletedCount} قطعة من صنف ${brand} ${name} من المخزون`);
    
    await syncWithAppsScript('deleteDeviceGroup', { brand, name });
    
    renderInventory();
    renderDashboard();
  }
};

window.editDeviceGroup = function(brand, name) {
  if (!isAdmin()) {
    alert('⛔ تعديل المخزون مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  const sampleDev = db.inventory.find(d => d.brand === brand && d.name === name);
  if (!sampleDev) return;

  document.getElementById('edit-inv-brand').value = brand;
  document.getElementById('edit-inv-name').value = name;
  document.getElementById('edit-inv-cost').value = sampleDev.costPrice;
  document.getElementById('edit-inv-price').value = sampleDev.sellingPrice;
  document.getElementById('edit-inv-supplier').value = sampleDev.supplier || '';
  openModal('edit-inventory-modal');
};

window.saveInventoryEdit = async function() {
  if (!isAdmin()) return;
  const brand = document.getElementById('edit-inv-brand').value;
  const name = document.getElementById('edit-inv-name').value;
  const newCost = parseFloat(document.getElementById('edit-inv-cost').value) || 0;
  const newPrice = parseFloat(document.getElementById('edit-inv-price').value) || 0;
  const newSupplier = document.getElementById('edit-inv-supplier').value.trim();

  db.inventory.forEach(d => {
    if (d.brand === brand && d.name === name) {
      d.costPrice = newCost;
      d.sellingPrice = newPrice;
      d.supplier = newSupplier;
    }
  });

  saveToLocalStorage();
  logAction('تعديل مخزون', `تعديل أسعار صنف ${brand} ${name}: تكلفة ${newCost} ج.م، بيع ${newPrice} ج.م`);
  
  await syncWithAppsScript('updateDeviceGroup', { brand, name, costPrice: newCost, sellingPrice: newPrice, supplier: newSupplier });
  
  closeModal('edit-inventory-modal');
  renderInventory();
  renderDashboard();
};

// --- 4. CONTRACTS & SALES ---
function renderContracts() {
  const searchVal = document.getElementById('contract-search-input').value.toLowerCase();
  const tbody = document.getElementById('contracts-table-body');
  const emptyState = document.getElementById('contracts-empty-state');
  
  tbody.innerHTML = '';
  
  const filtered = db.contracts.filter(c => 
    c.clientName.toLowerCase().includes(searchVal) || 
    c.id.includes(searchVal)
  );

  document.getElementById('total-contracts-count').textContent = db.contracts.length;

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach(c => {
    const contractInsts = db.installments.filter(inst => inst.contractId === c.id);
    const paidVal = contractInsts.filter(inst => inst.status === 'paid').reduce((sum, inst) => sum + inst.amount, 0);
    const totalInstsAmount = contractInsts.reduce((sum, inst) => sum + inst.amount, 0);
    
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors text-xs sm:text-sm';
    tr.innerHTML = `
      <td class="p-4 font-bold text-slate-700 font-mono">${c.id.replace('con-', '')}</td>
      <td class="p-4 font-bold text-slate-800">${c.clientName}</td>
      <td class="p-4 font-mono text-slate-500">${c.clientPhone}</td>
      <td class="p-4 font-semibold text-slate-600">${c.collectorName || 'غير مسند'}</td>
      <td class="p-4 text-slate-600">${c.deviceInfo}</td>
      <td class="p-4 font-bold font-mono text-slate-800">${c.totalValue.toLocaleString()} ج.م</td>
      <td class="p-4 font-bold font-mono text-indigo-600">${c.monthlyInstallment.toLocaleString()} ج.م</td>
      <td class="p-4 font-mono text-xs text-slate-500">${c.startDate}</td>
      <td class="p-4">
        <div class="flex flex-col gap-1">
          <span class="font-bold font-mono text-xs text-slate-700">${paidVal.toLocaleString()} / ${totalInstsAmount.toLocaleString()} ج.م</span>
          <div class="w-24 bg-slate-100 rounded-full h-1 overflow-hidden">
            <div class="bg-indigo-600 h-1" style="width: ${(paidVal/totalInstsAmount * 100) || 0}%"></div>
          </div>
        </div>
      </td>
      <td class="p-4 text-center">
         <div class="inline-flex gap-1.5">
           <button onclick="viewContractDetails('${c.id}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-all">التفاصيل</button>
           <button onclick="editContract('${c.id}')" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold flex items-center gap-1"><i class="fa-solid fa-pen"></i></button>
           <button onclick="deleteContract('${c.id}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-1"><i class="fa-solid fa-trash"></i></button>
         </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- 5. COLLECTIONS ---
function renderCollections() {
  const searchVal = document.getElementById('collection-search-input').value.toLowerCase();
  const monthFilter = document.getElementById('collection-filter-month').value;
  const statusFilter = document.getElementById('collection-filter-status').value;
  const cardsList = document.getElementById('collections-cards-list');
  const emptyState = document.getElementById('collections-empty-state');
  
  cardsList.innerHTML = '';
  
  const filteredInstallments = db.installments.filter(inst => {
    const matchesSearch = inst.clientName.toLowerCase().includes(searchVal) || inst.clientPhone.includes(searchVal) || inst.contractId.includes(searchVal);
    const instMonth = inst.dueDate.substring(0, 7);
    const matchesMonth = monthFilter === 'all' ? true : instMonth === monthFilter;
    
    const statusInfo = getInstallmentOverdueStatus(inst);
    let matchesStatus = true;
    if (statusFilter === 'paid') {
      matchesStatus = inst.status === 'paid';
    } else if (statusFilter === 'overdue') {
      matchesStatus = inst.status !== 'paid' && statusInfo.overdueDays > 0;
    } else if (statusFilter === 'pending') {
      matchesStatus = inst.status !== 'paid' && statusInfo.overdueDays === 0;
    }
    
    return matchesSearch && matchesMonth && matchesStatus;
  });

  if (filteredInstallments.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const groupedByClient = {};
  filteredInstallments.forEach(inst => {
    const contract = db.contracts.find(c => c.id === inst.contractId);
    const clientId = contract?.clientId || 'unknown';
    if (!groupedByClient[clientId]) {
      groupedByClient[clientId] = {
        clientId: clientId,
        clientName: inst.clientName,
        clientPhone: inst.clientPhone,
        guarantorName: inst.guarantorName,
        guarantorPhone: inst.guarantorPhone,
        installments: []
      };
    }
    groupedByClient[clientId].installments.push(inst);
  });

  Object.values(groupedByClient).forEach(clientGroup => {
    const client = db.clients.find(c => c.id === clientGroup.clientId);
    const totalRemaining = clientGroup.installments.filter(i => i.status !== 'paid').reduce((sum, i) => {
      const stats = getInstallmentOverdueStatus(i);
      return sum + stats.totalDue;
    }, 0);
    const totalInsts = clientGroup.installments.length;
    const paidCount = clientGroup.installments.filter(i => i.status === 'paid').length;
    
    const isExpanded = expandedClients.has(clientGroup.clientId);
    
    const clientCard = document.createElement('div');
    clientCard.className = 'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200';
    
    clientCard.innerHTML = `
      <div onclick="toggleClientInstallments('${clientGroup.clientId}')" class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors select-none">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            <i class="fa-solid ${isExpanded ? 'fa-folder-open' : 'fa-folder'} text-lg"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-md">${clientGroup.clientName}</h4>
            <p class="text-xs text-slate-400 font-mono mt-0.5">${client?.address || 'البحيرة'} | هاتف: ${clientGroup.clientPhone}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div class="text-slate-500">
            الضامن: <span class="font-bold text-slate-700">${clientGroup.guarantorName || 'لا يوجد'}</span> 
            ${clientGroup.guarantorPhone ? `<span class="font-mono font-medium text-slate-500">(${clientGroup.guarantorPhone})</span>` : ''}
          </div>
          <div class="bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-lg">
            إجمالي المستحق حالياً: <span class="font-black text-sm">${totalRemaining.toLocaleString()} ج.م</span>
          </div>
          <div class="bg-slate-100 text-slate-700 py-1.5 px-2.5 rounded-lg font-mono">
            الأقساط المنجزة: ${paidCount} / ${totalInsts}
          </div>
          <i class="fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-400 text-sm ml-2"></i>
        </div>
      </div>

      <div class="${isExpanded ? '' : 'hidden'} border-t border-slate-100 p-4 bg-white space-y-3">
        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-150 text-slate-500 font-semibold text-[11px]">
                <th class="p-2.5">رقم الدفعة</th>
                <th class="p-2.5">تاريخ الاستحقاق</th>
                <th class="p-2.5">القسط الأساسي</th>
                <th class="p-2.5">الحالة والتأخير</th>
                <th class="p-2.5">المحصل المسند</th>
                <th class="p-2.5">المبلغ المطلوب</th>
                <th class="p-2.5 text-center">إجراءات المراسلة والتواصل</th>
                <th class="p-2.5 text-center">التحصيل</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${clientGroup.installments.map(inst => {
                const statusInfo = getInstallmentOverdueStatus(inst);
                
                let collectorOptions = db.users
                  .filter(u => u.role === 'COLLECTOR')
                  .map(u => `<option value="${u.name}" ${inst.collectorName === u.name ? 'selected' : ''}>${u.name}</option>`)
                  .join('');

                const isCollectorDisabled = currentUser && currentUser.role === 'COLLECTOR' ? 'disabled class="form-input text-[11px] py-0.5 px-1 border-slate-200 bg-slate-50 cursor-not-allowed"' : 'class="form-input text-[11px] py-0.5 px-1 border-slate-200 bg-white"';

                return `
                  <tr>
                    <td class="p-2.5 font-bold">قسط ${inst.installmentNum}</td>
                    <td class="p-2.5 font-mono text-slate-500">${inst.dueDate}</td>
                    <td class="p-2.5 font-mono font-bold">${inst.amount.toLocaleString()} ج.م</td>
                    <td class="p-2.5"><span class="badge ${statusInfo.statusColor} font-bold">${statusInfo.statusText}</span></td>
                    <td class="p-2.5">
                      <select onchange="updateCollectorForInstallment('${inst.id}', this.value)" ${isCollectorDisabled}>
                        ${collectorOptions}
                      </select>
                    </td>
                    <td class="p-2.5 font-mono font-bold text-indigo-600">
                      ${statusInfo.totalDue.toLocaleString()} ج.م
                      ${statusInfo.fine > 0 ? `<span class="text-[9px] text-red-500 block">(غرامة ${statusInfo.fine.toLocaleString()})</span>` : ''}
                    </td>
                    <td class="p-2.5 text-center">
                      <div class="inline-flex gap-1 justify-center">
                        <button onclick="openWhatsappModal('${inst.id}', 'reminder')" class="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-[10px] font-bold transition-all"><i class="fa-regular fa-bell"></i> تذكير</button>
                        <button onclick="openWhatsappModal('${inst.id}', 'warning_client')" class="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[10px] font-bold transition-all"><i class="fa-solid fa-triangle-exclamation"></i> إنذار</button>
                        <button onclick="openWhatsappModal('${inst.id}', 'receipt')" class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold transition-all"><i class="fa-regular fa-circle-check"></i> رسالة السداد</button>
                      </div>
                    </td>
                    <td class="p-2.5 text-center">
                      ${inst.status !== 'paid' ? `
                        <button onclick="collectInstallmentBtn('${inst.id}')" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] transition-all"><i class="fa-solid fa-square-check"></i> تحصيل</button>
                      ` : `
                        <span class="text-emerald-600 font-bold"><i class="fa-solid fa-check mr-0.5"></i> معتمد</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    cardsList.appendChild(clientCard);
  });
}

window.toggleClientInstallments = function(clientId) {
  if (expandedClients.has(clientId)) {
    expandedClients.delete(clientId);
  } else {
    expandedClients.add(clientId);
  }
  renderCollections();
};

window.updateCollectorForInstallment = function(instId, collectorName) {
  const inst = db.installments.find(i => i.id === instId);
  if (inst) {
    inst.collectorName = collectorName;
    saveToLocalStorage();
    logAction('تعديل محصل', `تعديل المحصل المسند للقسط رقم ${inst.installmentNum} لعقد ${inst.contractId.replace('con-', '')} إلى ${collectorName}`);
    renderCollections();
  }
};

// --- 6. TREASURY & ACCOUNTS ---
function renderTreasury() {
  const tbody = document.getElementById('treasury-transactions-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const mainBalance = db.treasuryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const pendingCustody = db.collectorCustodies.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  document.getElementById('treasury-balance-card').textContent = `${mainBalance.toLocaleString()} ج.م`;
  document.getElementById('treasury-pending-custody').textContent = `${pendingCustody.toLocaleString()} ج.م`;

  const approvalsBody = document.getElementById('collector-approvals-table-body');
  const approvalsEmpty = document.getElementById('collector-approvals-empty');
  approvalsBody.innerHTML = '';
  
  const pendingApprovals = db.collectorCustodies.filter(c => c.status === 'pending');
  
  if (pendingApprovals.length === 0) {
    approvalsEmpty.classList.remove('hidden');
  } else {
    approvalsEmpty.classList.add('hidden');
    pendingApprovals.forEach(app => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="p-3 font-bold text-slate-800">${app.collectorName}</td>
        <td class="p-3 font-semibold text-slate-700">${app.clientName}</td>
        <td class="p-3 font-mono">${app.contractId.replace('con-', '')}</td>
        <td class="p-3 font-bold font-mono text-indigo-600">${app.amount.toLocaleString()} ج.م</td>
        <td class="p-3 text-slate-500 font-mono text-[10px]">${app.date}</td>
        <td class="p-3 text-center">
          <div class="inline-flex gap-2">
            <button onclick="approveCollectorCustody('${app.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition-all flex items-center gap-1"><i class="fa-solid fa-check"></i> اعتماد وتأكيد</button>
            <button onclick="rejectCollectorCustody('${app.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-semibold transition-all"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      approvalsBody.appendChild(tr);
    });
  }

  db.treasuryTransactions.forEach(tx => {
    let typeText = '';
    let typeClass = '';
    let amountSign = '+';
    let amountClass = 'text-emerald-600';
    
    if (tx.type === 'deposit') {
      typeText = 'إيداع / رأس مال';
      typeClass = 'badge-success';
    } else if (tx.type === 'expense') {
      typeText = 'مصروفات خارجية';
      typeClass = 'badge-danger';
      amountSign = '-';
      amountClass = 'text-rose-600';
    } else if (tx.type === 'collection') {
      typeText = 'تحصيل أقساط';
      typeClass = 'badge-info';
    } else if (tx.type === 'cash_sale') {
      typeText = 'بيع كاش فوري';
      typeClass = 'badge-success';
    } else if (tx.type === 'inventory_purchase') {
      typeText = 'شراء بضاعة ومخزون';
      typeClass = 'badge-danger';
      amountSign = '-';
      amountClass = 'text-rose-600';
    }

    const adminActionBtns = isAdmin() ? `
      <button onclick="editTransaction('${tx.id}')" class="p-1 text-indigo-400 hover:text-indigo-600 rounded transition-colors" title="تعديل"><i class="fa-solid fa-pen"></i></button>
      <button onclick="deleteTransaction('${tx.id}')" class="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
    ` : '';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="p-4 font-mono text-xs text-slate-500">${tx.timestamp}</td>
      <td class="p-4"><span class="badge ${typeClass}">${typeText}</span></td>
      <td class="p-4 text-slate-700 font-medium">${tx.notes}</td>
      <td class="p-4 font-bold font-mono ${amountClass}">${amountSign}${Math.abs(tx.amount).toLocaleString()} ج.م</td>
      <td class="p-4 text-center">
        <div class="inline-flex gap-1">${adminActionBtns}</div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.approveCollectorCustody = async function(id) {
  const custody = db.collectorCustodies.find(c => c.id === id);
  if (!custody) return;
  
  const inst = db.installments.find(i => i.id === custody.installmentId);
  if (!inst) return;
  
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  custody.status = 'approved';
  inst.status = 'paid';
  inst.paidAmount = custody.amount;
  inst.paidDate = timestamp.split(' ')[0];
  inst.receiptId = custody.id;
  
  const contract = db.contracts.find(c => c.id === inst.contractId);
  if (contract) {
    inst.delayFines = calculateFinesForInstallment(inst, contract);
  }

  db.treasuryTransactions.unshift({
    id: `tx-col-${Date.now()}`,
    timestamp: timestamp,
    type: 'collection',
    amount: custody.amount,
    notes: `تحصيل قسط رقم ${inst.installmentNum} لعقد ${inst.contractId.replace('con-', '')} للعميل ${custody.clientName} (بمعرفة المحصل ${custody.collectorName})`
  });

  saveToLocalStorage();
  logAction('اعتماد عهدة', `اعتماد عهدة المحصل ${custody.collectorName} بمبلغ ${custody.amount} ج.م للعميل ${custody.clientName}`);
  
  await syncWithAppsScript('approveCustody', { custodyId: id, installmentId: inst.id, amount: custody.amount, timestamp });

  renderTreasury();
  renderCollections();
  
  openWhatsappModal(inst.id, 'receipt');
};

window.rejectCollectorCustody = function(id) {
  if (confirm('هل أنت متأكد من حذف وإلغاء معاملة التحصيل هذه من عهدة المحصل؟')) {
    db.collectorCustodies = db.collectorCustodies.filter(c => c.id !== id);
    saveToLocalStorage();
    logAction('إلغاء عهدة معلقة', `إلغاء معاملة تحصيل عهدة برقم ${id}`);
    renderTreasury();
  }
};

// --- 7. USER MANAGEMENT ---
function renderUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  db.users.forEach(u => {
    let roleText = 'محصل خارجي';
    let roleColor = 'badge-info';
    if (u.role === 'ADMIN') {
      roleText = 'مشرف النظام (Admin)';
      roleColor = 'badge-danger';
    } else if (u.role === 'STAFF') {
      roleText = 'مدخل بيانات';
      roleColor = 'badge-success';
    }

    const adminBtns = isAdmin() ? `
      <button onclick="editUser('${u.id}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold transition-all flex items-center gap-1"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
      <button onclick="deleteUser('${u.id}')" class="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"><i class="fa-solid fa-trash"></i></button>
    ` : '<span class="text-xs text-slate-400">للمشرف فقط</span>';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="p-4 font-bold text-slate-800">${u.name}</td>
      <td class="p-4 font-mono text-slate-500">${u.username}</td>
      <td class="p-4 font-mono">${u.phone || '-'}</td>
      <td class="p-4"><span class="badge ${roleColor}">${roleText}</span></td>
      <td class="p-4 text-slate-600">${u.area || '-'}</td>
      <td class="p-4 text-center">
        <div class="inline-flex gap-1.5">${adminBtns}</div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editUser = function(userId) {
  if (!isAdmin()) {
    alert('⛔ هذه العملية مخصصة للمشرف (ADMIN) فقط.');
    return;
  }
  const u = db.users.find(x => x.id === userId);
  if (!u) return;

  document.getElementById('edit-user-id').value = u.id;
  document.getElementById('edit-user-fullname').value = u.name || '';
  document.getElementById('edit-user-username').value = u.username || '';
  document.getElementById('edit-user-phone').value = u.phone || '';
  document.getElementById('edit-user-role').value = u.role || 'COLLECTOR';
  document.getElementById('edit-user-area').value = u.area || '';
  document.getElementById('edit-user-password').value = '';
  openModal('edit-user-modal');
};

window.saveUserEdits = async function() {
  if (!isAdmin()) {
    alert('⛔ هذه العملية مخصصة للمشرف (ADMIN) فقط.');
    return;
  }
  const userId = document.getElementById('edit-user-id').value;
  const u = db.users.find(x => x.id === userId);
  if (!u) return;

  u.name = document.getElementById('edit-user-fullname').value.trim();
  u.username = document.getElementById('edit-user-username').value.trim();
  u.phone = document.getElementById('edit-user-phone').value.trim();
  u.role = document.getElementById('edit-user-role').value;
  u.area = document.getElementById('edit-user-area').value.trim();
  const newPass = document.getElementById('edit-user-password').value.trim();
  if (newPass) u.password = newPass;

  saveToLocalStorage();
  logAction('تعديل مستخدم', `تعديل بيانات المستخدم ${u.name} (${u.role})`);
  await syncWithAppsScript('updateUser', u);

  closeModal('edit-user-modal');
  renderUsers();
  populateDropdowns();
};

// --- 8. SYSTEM SETTINGS ---
function renderSettings() {
  document.getElementById('setting-company-name').value = db.settings.companyName || 'شركة SKY';
  document.getElementById('setting-company-logo-url').value = db.settings.companyLogo || '';
  
  document.getElementById('setting-offline-mode').checked = db.settings.offlineMode;

  const t = db.settings.templates || defaultSeedData.settings.templates;
  document.getElementById('template-reminder').value = t.reminder;
  document.getElementById('template-warning').value = t.warning;
  document.getElementById('template-receipt').value = t.receipt;
}

// ================= MODAL INTERACTIONS =================
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
};

// ================= IMAGE UPLOAD =================
function setupFileReader(inputId, tempKey, previewBoxId, statusId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      tempUploads[tempKey] = e.target.result;
      document.getElementById(statusId).textContent = `تم اختيار: ${file.name}`;
      
      const previewBox = document.getElementById(previewBoxId);
      previewBox.classList.remove('hidden');
      previewBox.querySelector('span').textContent = file.name;
    };
    reader.readAsDataURL(file);
  });
}

setupFileReader('client-card-img', 'clientCardImg', 'client-card-img-preview-box', 'client-card-img-status');
setupFileReader('client-contract-img', 'clientContractImg', 'client-contract-img-preview-box', 'client-contract-img-status');
setupFileReader('guarantor-card-img', 'guarantorCardImg', 'guarantor-card-img-preview-box', 'guarantor-card-img-status');
setupFileReader('guarantor-contract-img', 'guarantorContractImg', 'guarantor-contract-img-preview-box', 'guarantor-contract-img-status');

window.viewDocument = function(inputId) {
  let base64Data = '';
  let filename = '';

  if (inputId === 'client-card-img') {
    base64Data = tempUploads.clientCardImg;
    filename = document.getElementById('client-card-img-preview-box').querySelector('span').textContent;
  } else if (inputId === 'client-contract-img') {
    base64Data = tempUploads.clientContractImg;
    filename = document.getElementById('client-contract-img-preview-box').querySelector('span').textContent;
  } else if (inputId === 'guarantor-card-img') {
    base64Data = tempUploads.guarantorCardImg;
    filename = document.getElementById('guarantor-card-img-preview-box').querySelector('span').textContent;
  } else if (inputId === 'guarantor-contract-img') {
    base64Data = tempUploads.guarantorContractImg;
    filename = document.getElementById('guarantor-contract-img-preview-box').querySelector('span').textContent;
  }

  if (!base64Data) {
    alert('لا توجد صورة مستند لعرضها أو الصورة ليست بصيغة مدعومة للمعاينة.');
    return;
  }

  document.getElementById('preview-modal-img').src = base64Data;
  document.getElementById('preview-modal-title').textContent = filename;
  openModal('image-preview-modal');
};

window.removeDocument = function(inputId) {
  if (confirm('هل أنت متأكد من حذف هذا المستند؟')) {
    if (inputId === 'client-card-img') {
      tempUploads.clientCardImg = '';
      document.getElementById('client-card-img').value = '';
      document.getElementById('client-card-img-status').textContent = 'لم يتم الرفع';
      document.getElementById('client-card-img-preview-box').classList.add('hidden');
    } else if (inputId === 'client-contract-img') {
      tempUploads.clientContractImg = '';
      document.getElementById('client-contract-img').value = '';
      document.getElementById('client-contract-img-status').textContent = 'لم يتم الرفع';
      document.getElementById('client-contract-img-preview-box').classList.add('hidden');
    } else if (inputId === 'guarantor-card-img') {
      tempUploads.guarantorCardImg = '';
      document.getElementById('guarantor-card-img').value = '';
      document.getElementById('guarantor-card-img-status').textContent = 'لم يتم الرفع';
      document.getElementById('guarantor-card-img-preview-box').classList.add('hidden');
    } else if (inputId === 'guarantor-contract-img') {
      tempUploads.guarantorContractImg = '';
      document.getElementById('guarantor-contract-img').value = '';
      document.getElementById('guarantor-contract-img-status').textContent = 'لم يتم الرفع';
      document.getElementById('guarantor-contract-img-preview-box').classList.add('hidden');
    }
  }
};

document.getElementById('setting-company-logo-file').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    db.settings.companyLogo = e.target.result;
    document.getElementById('setting-company-logo-url').value = 'تم تحميل لوجو محلي كـ Base64';
    saveToLocalStorage();
    applyCompanyBranding();
  };
  reader.readAsDataURL(file);
});

// ================= WHATSAPP INTEGRATION =================
let activeWhatsappPayload = { phone: '', text: '' };

window.openWhatsappModal = function(instId, templateType) {
  const inst = db.installments.find(i => i.id === instId);
  if (!inst) return;

  const contract = db.contracts.find(c => c.id === inst.contractId);
  const client = db.clients.find(c => c.id === contract?.clientId);
  if (!client) return;

  const statusInfo = getInstallmentOverdueStatus(inst);
  
  const templates = db.settings.templates || defaultSeedData.settings.templates;
  let templateText = '';
  let targetPhone = client.phone;
  let recipientName = client.name;

  if (templateType === 'reminder') {
    templateText = templates.reminder;
  } else if (templateType === 'warning_client') {
    templateText = templates.warning;
  } else if (templateType === 'receipt') {
    templateText = templates.receipt;
  }

  if (!templateText) {
    templateText = "تنبيه من الشركة بخصوص العقد رقم {{العقد}}.";
  }

  const companyName = db.settings.companyName || 'شركة SKY';
  let resolvedMsg = templateText
    .replace(/{{الاسم}}/g, client.name)
    .replace(/{{القسط}}/g, inst.amount.toLocaleString())
    .replace(/{{التاريخ}}/g, inst.dueDate)
    .replace(/{{العقد}}/g, inst.contractId.replace('con-', ''))
    .replace(/{{الغرامة}}/g, statusInfo.fine.toLocaleString())
    .replace(/{{المطلوب}}/g, statusInfo.totalDue.toLocaleString())
    .replace(/{{الإيصال}}/g, inst.receiptId || '')
    .replace(/{{الضامن}}/g, client.guarantorName || 'لا يوجد')
    .replace(/{{اسم_الشركة}}/g, companyName);

  document.getElementById('wa-recipient-name').value = recipientName;
  document.getElementById('wa-recipient-phone').value = targetPhone;
  document.getElementById('wa-message-text').value = resolvedMsg;
  
  let formattedPhone = targetPhone;
  if (targetPhone.startsWith('0')) {
    formattedPhone = '2' + targetPhone;
  }
  
  activeWhatsappPayload = {
    phone: formattedPhone,
    text: resolvedMsg
  };

  openModal('whatsapp-modal');
};

window.sendPreparedWhatsapp = function() {
  const editedText = document.getElementById('wa-message-text').value;
  const url = `https://wa.me/${activeWhatsappPayload.phone}?text=${encodeURIComponent(editedText)}`;
  window.open(url, '_blank');
  closeModal('whatsapp-modal');
  logAction('إرسال واتساب', `إرسال رسالة تواصل إلى الهاتف ${activeWhatsappPayload.phone}`);
};

// ================= BULK WHATSAPP OPERATIONS =================
window.openBulkWhatsappModal = function() {
  const select = document.getElementById('bulk-wa-month-select');
  select.innerHTML = '';
  
  const months = [...new Set(db.installments.map(i => i.dueDate.substring(0, 7)))].sort();
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });

  if (months.length === 0) {
    alert('لا توجد أقساط مسجلة لجدولة الرسائل الجماعية.');
    return;
  }

  renderBulkClientsList();
  openModal('bulk-whatsapp-modal');
};

function renderBulkClientsList() {
  const month = document.getElementById('bulk-wa-month-select').value;
  const type = document.getElementById('bulk-wa-type-select').value;
  const listContainer = document.getElementById('bulk-wa-clients-list');
  listContainer.innerHTML = '';

  const targetInsts = db.installments.filter(inst => {
    const matchesMonth = inst.dueDate.substring(0, 7) === month;
    const stats = getInstallmentOverdueStatus(inst);
    
    if (type === 'reminder') {
      return matchesMonth && inst.status !== 'paid';
    } else {
      return matchesMonth && inst.status !== 'paid' && stats.overdueDays > 0;
    }
  });

  if (targetInsts.length === 0) {
    listContainer.innerHTML = '<p class="text-slate-400 text-center py-4">لا توجد أقساط مطابقة لهذا الفلتر.</p>';
    document.getElementById('btn-start-bulk-wa').disabled = true;
    return;
  }
  document.getElementById('btn-start-bulk-wa').disabled = false;

  targetInsts.forEach(inst => {
    const div = document.createElement('div');
    div.className = 'flex justify-between items-center bg-white p-2 rounded border border-slate-100';
    div.innerHTML = `
      <div>
        <span class="font-bold text-slate-700">${inst.clientName}</span>
        <span class="text-slate-400 font-mono">(${inst.dueDate})</span>
      </div>
      <div class="font-mono font-bold text-indigo-600">${inst.amount.toLocaleString()} ج.م</div>
    `;
    listContainer.appendChild(div);
  });
}

document.getElementById('bulk-wa-month-select').addEventListener('change', renderBulkClientsList);
document.getElementById('bulk-wa-type-select').addEventListener('change', renderBulkClientsList);

document.getElementById('btn-start-bulk-wa').addEventListener('click', () => {
  const month = document.getElementById('bulk-wa-month-select').value;
  const type = document.getElementById('bulk-wa-type-select').value;
  
  const targetInsts = db.installments.filter(inst => {
    const matchesMonth = inst.dueDate.substring(0, 7) === month;
    const stats = getInstallmentOverdueStatus(inst);
    if (type === 'reminder') {
      return matchesMonth && inst.status !== 'paid';
    } else {
      return matchesMonth && inst.status !== 'paid' && stats.overdueDays > 0;
    }
  });

  if (targetInsts.length === 0) return;

  alert(`سيتم فتح نافذة WhatsApp لكل عميل تلو الآخر (العدد الإجمالي: ${targetInsts.length}). يرجى إرسال الرسالة في نافذة المتصفح المفتوحة ثم العودة.`);
  
  targetInsts.forEach((inst, idx) => {
    setTimeout(() => {
      const stats = getInstallmentOverdueStatus(inst);
      const companyName = db.settings.companyName || 'شركة SKY';
      const templates = db.settings.templates || defaultSeedData.settings.templates;
      let templateText = type === 'reminder' ? templates.reminder : templates.warning;

      let resolvedMsg = templateText
        .replace(/{{الاسم}}/g, inst.clientName)
        .replace(/{{القسط}}/g, inst.amount.toLocaleString())
        .replace(/{{التاريخ}}/g, inst.dueDate)
        .replace(/{{العقد}}/g, inst.contractId.replace('con-', ''))
        .replace(/{{الغرامة}}/g, stats.fine.toLocaleString())
        .replace(/{{المطلوب}}/g, stats.totalDue.toLocaleString())
        .replace(/{{اسم_الشركة}}/g, companyName);

      let phone = inst.clientPhone;
      if (phone.startsWith('0')) phone = '2' + phone;
      
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(resolvedMsg)}`;
      window.open(url, '_blank');
    }, idx * 1500);
  });
  
  closeModal('bulk-whatsapp-modal');
  logAction('إرسال جماعي', `إرسال رسائل جماعية لشهر ${month} لنوع ${type === 'reminder' ? 'تذكير' : 'إنذار'}`);
});

// ================= CUSTOM TRANSACTIONAL ACTIONS =================
window.collectInstallmentBtn = function(instId) {
  const inst = db.installments.find(i => i.id === instId);
  if (!inst) return;

  const stats = getInstallmentOverdueStatus(inst);
  const collector = inst.collectorName || 'Khalifa (ADMIN)';

  const receiptId = `REC-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  db.collectorCustodies.unshift({
    id: receiptId,
    installmentId: instId,
    contractId: inst.contractId,
    clientName: inst.clientName,
    collectorName: collector,
    amount: stats.totalDue,
    date: timestamp,
    status: 'pending'
  });

  saveToLocalStorage();
  logAction('تحصيل محلي بالعهد', `قام المحصل ${collector} بتحصيل عهدة بقيمة ${stats.totalDue} ج.م من العميل ${inst.clientName} (معلق بانتظار تأكيد الأدمن)`);
  
  syncWithAppsScript('addPendingCustody', { id: receiptId, installmentId: instId, contractId: inst.contractId, clientName: inst.clientName, collectorName: collector, amount: stats.totalDue, date: timestamp });

  renderCollections();
  renderTreasury();
  alert(`تم تسجيل تحصيل المبلغ بالعهدة للمحصل: ${collector}. يرجى تأكيد المبلغ من الخزينة لتسجيله بالخزينة الرئيسية.`);
};

document.getElementById('cash-sale-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedDevId = document.getElementById('cash-sale-serial-select').value;
  const clientName = document.getElementById('cash-client-name').value;
  const clientPhone = document.getElementById('cash-client-phone').value;
  const sellingPrice = parseFloat(document.getElementById('cash-sale-price').value);

  const dev = db.inventory.find(d => d.id === selectedDevId);
  if (!dev) return;

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  dev.status = 'sold_cash';
  dev.soldTo = clientName;

  const txId = `tx-cash-${Date.now()}`;
  db.treasuryTransactions.unshift({
    id: txId,
    timestamp: timestamp,
    type: 'cash_sale',
    amount: sellingPrice,
    notes: `بيع كاش فوري للجهاز ${dev.brand} ${dev.name} (SN: ${dev.serial}) للعميل ${clientName} (هاتف: ${clientPhone})`
  });

  saveToLocalStorage();
  logAction('بيع كاش فوري', `بيع كاش للجهاز ${dev.brand} ${dev.name} بقيمة ${sellingPrice} ج.م للعميل ${clientName}`);
  
  await syncWithAppsScript('cashSale', { devId: selectedDevId, clientName, clientPhone, sellingPrice, timestamp });

  closeModal('cash-sale-modal');
  document.getElementById('cash-sale-form').reset();
  renderInventory();
  renderTreasury();
  renderDashboard();
});

document.getElementById('contract-device-select').addEventListener('change', function() {
  const devId = this.value;
  const dev = db.inventory.find(d => d.id === devId);
  if (dev) {
    document.getElementById('calc-cash-price').textContent = `${dev.sellingPrice.toLocaleString()} ج.م`;
    updateContractCalculation();
  }
});

document.getElementById('contract-interest-type').addEventListener('change', function() {
  const interestValueInput = document.getElementById('contract-interest-value');
  if (this.value === 'none') {
    interestValueInput.disabled = true;
    interestValueInput.value = 0;
  } else {
    interestValueInput.disabled = false;
  }
  updateContractCalculation();
});

document.getElementById('contract-interest-value').addEventListener('input', updateContractCalculation);
document.getElementById('contract-duration').addEventListener('input', updateContractCalculation);
document.getElementById('contract-down-payment').addEventListener('input', updateContractCalculation);

function calcInterestAmount(cashPrice, interestType, interestValue) {
  if (interestType === 'percent') {
    return cashPrice * (interestValue / 100);
  } else if (interestType === 'fixed') {
    return interestValue;
  }
  return 0;
}

function updateContractCalculation() {
  const devId = document.getElementById('contract-device-select').value;
  const dev = db.inventory.find(d => d.id === devId);
  if (!dev) return;

  const duration = parseInt(document.getElementById('contract-duration').value) || 1;
  const downPayment = parseFloat(document.getElementById('contract-down-payment').value) || 0;
  const interestType = document.getElementById('contract-interest-type').value;
  const interestValue = parseFloat(document.getElementById('contract-interest-value').value) || 0;

  const cashPrice = dev.sellingPrice;
  const interest = calcInterestAmount(cashPrice, interestType, interestValue);
  const totalPrice = cashPrice + interest;
  const remaining = Math.max(0, totalPrice - downPayment);
  const monthly = parseFloat((remaining / duration).toFixed(2));

  document.getElementById('calc-cash-price').textContent = `${cashPrice.toLocaleString()} ج.م`;
  document.getElementById('calc-total-price').textContent = `${totalPrice.toLocaleString()} ج.م`;
  document.getElementById('calc-remaining-amount').textContent = `${remaining.toLocaleString()} ج.م`;
  document.getElementById('calc-monthly-installment').textContent = `${monthly.toLocaleString()} ج.م`;
}

document.getElementById('add-contract-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clientId = document.getElementById('contract-client-select').value;
  const deviceId = document.getElementById('contract-device-select').value;
  const duration = parseInt(document.getElementById('contract-duration').value);
  const downPayment = parseFloat(document.getElementById('contract-down-payment').value);
  const graceDays = parseInt(document.getElementById('contract-grace-days').value);
  const fineType = document.getElementById('contract-fine-type').value;
  const fineValue = parseFloat(document.getElementById('contract-fine-value').value);
  const collectorName = document.getElementById('contract-collector-select').value;
  const startDate = document.getElementById('contract-start-date').value;

  const interestType = document.getElementById('contract-interest-type').value;
  const interestValue = parseFloat(document.getElementById('contract-interest-value').value) || 0;

  const client = db.clients.find(c => c.id === clientId);
  const dev = db.inventory.find(d => d.id === deviceId);
  const collector = db.users.find(u => u.name === collectorName);

  if (!client || !dev) {
    alert('العميل أو الجهاز غير متوافق.');
    return;
  }

  const cashPrice = dev.sellingPrice;
  const interest = calcInterestAmount(cashPrice, interestType, interestValue);
  const totalValue = cashPrice + interest;
  const contractId = `con-${Math.floor(100000 + Math.random() * 900000)}`;
  const remaining = Math.max(0, totalValue - downPayment);
  const monthly = parseFloat((remaining / duration).toFixed(2));

  const contract = {
    id: contractId,
    clientId: clientId,
    clientName: client.name,
    clientPhone: client.phone,
    deviceId: deviceId,
    deviceInfo: `${dev.brand} ${dev.name}`,
    cashPrice: cashPrice,
    interestType: interestType,
    interestValue: interestValue,
    interestAmount: interest,
    totalValue: totalValue,
    downPayment: downPayment,
    remainingAmount: remaining,
    monthlyInstallment: monthly,
    duration: duration,
    graceDays: graceDays,
    fineType: fineType,
    fineValue: fineValue,
    collectorId: collector?.id || 'usr-1',
    collectorName: collectorName,
    startDate: startDate,
    status: 'active'
  };

  db.contracts.unshift(contract);
  dev.status = 'sold_installment';
  dev.soldTo = client.name;

  let start = new Date(startDate);
  for (let i = 1; i <= duration; i++) {
    let dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + (i - 1));

    db.installments.push({
      id: `${contractId}_${i}`,
      contractId: contractId,
      clientId: clientId,
      clientName: client.name,
      clientPhone: client.phone,
      guarantorName: client.guarantorName,
      guarantorPhone: client.guarantorPhone,
      collectorName: collectorName,
      installmentNum: i,
      amount: monthly,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending',
      paidAmount: 0,
      paidDate: '',
      receiptId: '',
      delayFines: 0
    });
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (downPayment > 0) {
    db.treasuryTransactions.unshift({
      id: `tx-dp-${Date.now()}`,
      timestamp: timestamp,
      type: 'collection',
      amount: downPayment,
      notes: `مقدم عقد التقسيط رقم ${contractId.replace('con-', '')} للعميل ${client.name} (جهاز ${dev.brand} ${dev.name})`
    });
  }

  saveToLocalStorage();
  logAction('إنشاء عقد', `تم إنشاء عقد بيع وتقسيط رقم ${contractId.replace('con-', '')} للعميل ${client.name}`);
  
  await syncWithAppsScript('addContract', { contract, timestamp });

  closeModal('add-contract-modal');
  document.getElementById('add-contract-form').reset();
  
  renderContracts();
  renderInventory();
  renderCollections();
  renderTreasury();
  renderDashboard();
});

document.getElementById('add-brand-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('brand-name').value.trim();
  if (!name) return;

  if (db.brands.includes(name)) {
    alert('هذا الصنف مسجل بالفعل.');
    return;
  }

  db.brands.push(name);
  saveToLocalStorage();
  logAction('إضافة صنف', `تم إضافة صنف/ماركة جديدة: ${name}`);

  closeModal('add-brand-modal');
  document.getElementById('add-brand-form').reset();
  populateDropdowns();
  renderInventory();
});

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const editId = document.getElementById('user-edit-id').value;
    const name = document.getElementById('user-fullname').value;
    const username = document.getElementById('user-username').value;
    const phone = document.getElementById('user-phone').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const area = document.getElementById('user-area').value;

    if (editId) {
      const u = db.users.find(x => x.id === editId);
      if (u) {
        u.name = name;
        u.username = username;
        u.phone = phone;
        if (password) u.password = password;
        u.role = role;
        u.area = area;

        saveToLocalStorage();
        logAction('تعديل مستخدم', `تعديل بيانات المستخدم ${name} بصلاحية ${role}`);
        await syncWithAppsScript('updateUser', u);
      }
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        username,
        password,
        role,
        area
      };

      db.users.push(newUser);
      saveToLocalStorage();
      logAction('إضافة مستخدم', `إضافة المستخدم الجديد ${name} بصلاحية ${role}`);
      await syncWithAppsScript('addUser', newUser);
    }

    closeModal('add-user-modal');
    document.getElementById('add-user-form').reset();
    renderUsers();
    populateDropdowns();
  } catch (err) {
    console.error('Error saving user:', err);
    alert('حدث خطأ أثناء حفظ المستخدم. يرجى مراجعة البيانات.');
  }
});

document.getElementById('add-supplier-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('supplier-name').value;
  const phone = document.getElementById('supplier-phone').value;
  const notes = document.getElementById('supplier-notes').value;

  db.suppliers.push({ name, phone, notes });
  saveToLocalStorage();
  logAction('إضافة تاجر', `تم إضافة تاجر/مورد جديد ${name}`);

  closeModal('add-supplier-modal');
  document.getElementById('add-supplier-form').reset();
  populateDropdowns();
  renderInventory();
});

document.getElementById('add-device-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const brand = document.getElementById('device-brand-select').value;
  const name = document.getElementById('device-name').value;
  const serialRaw = document.getElementById('device-serial').value;
  const costPrice = parseFloat(document.getElementById('device-cost').value);
  const sellingPrice = parseFloat(document.getElementById('device-price').value);
  const supplier = document.getElementById('device-supplier').value;

  const serials = serialRaw.split(',')
    .map(s => s.trim())
    .filter(s => s !== '');

  if (serials.length === 0) {
    alert('يرجى كتابة رقم تسلسلي واحد على الأقل.');
    return;
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  serials.forEach((serial, index) => {
    const newDevice = {
      id: `dev-${Date.now()}-${index}`,
      brand,
      name,
      serial,
      costPrice,
      sellingPrice,
      supplier,
      status: 'available',
      soldTo: ''
    };

    db.inventory.push(newDevice);

    db.treasuryTransactions.unshift({
      id: `tx-pur-${Date.now()}-${index}`,
      timestamp: timestamp,
      type: 'inventory_purchase',
      amount: -costPrice,
      notes: `شراء قطعة ${brand} ${name} (SN: ${serial}) من التاجر ${supplier}`
    });
  });

  saveToLocalStorage();
  logAction('إضافة قطعة', `إضافة عدد ${serials.length} قطعة من ${brand} ${name} بمجموع تكلفة ${(costPrice * serials.length)} ج.م`);

  if (serials.length > 0) {
    await syncWithAppsScript('addDevice', { 
      newDevice: { brand, name, serial: serials.join(', '), costPrice, sellingPrice, supplier, status: 'available', soldTo: '' }, 
      timestamp 
    });
  }

  closeModal('add-device-modal');
  document.getElementById('add-device-form').reset();
  renderInventory();
  renderTreasury();
  renderDashboard();
});

window.openAddClientModal = function() {
  document.getElementById('client-edit-id').value = '';
  document.getElementById('add-client-form').reset();
  
  tempUploads = {
    clientCardImg: '',
    clientContractImg: '',
    guarantorCardImg: '',
    guarantorContractImg: ''
  };

  document.getElementById('client-card-img-preview-box').classList.add('hidden');
  document.getElementById('client-contract-img-preview-box').classList.add('hidden');
  document.getElementById('guarantor-card-img-preview-box').classList.add('hidden');
  document.getElementById('guarantor-contract-img-preview-box').classList.add('hidden');

  document.getElementById('client-card-img-status').textContent = 'لم يتم الرفع';
  document.getElementById('client-contract-img-status').textContent = 'لم يتم الرفع';
  document.getElementById('guarantor-card-img-status').textContent = 'لم يتم الرفع';
  document.getElementById('guarantor-contract-img-status').textContent = 'لم يتم الرفع';

  document.getElementById('client-modal-title').textContent = 'إضافة عميل وضامن جديد للمبيعات';
  openModal('add-client-modal');
};

window.editClient = function(clientId) {
  const c = db.clients.find(x => x.id === clientId);
  if (!c) return;

  document.getElementById('client-edit-id').value = c.id;
  
  document.getElementById('client-fullname').value = c.name || '';
  document.getElementById('client-national-id').value = c.nationalId || '';
  document.getElementById('client-phone').value = c.phone || '';
  document.getElementById('client-address').value = c.address || '';
  document.getElementById('client-location-url').value = c.locationUrl || '';

  document.getElementById('guarantor-fullname').value = c.guarantorName || '';
  document.getElementById('guarantor-national-id').value = c.guarantorNationalId || '';
  document.getElementById('guarantor-phone').value = c.guarantorPhone || '';
  document.getElementById('guarantor-relation').value = c.guarantorRelation || '';
  document.getElementById('guarantor-job').value = c.guarantorJob || '';
  document.getElementById('guarantor-address').value = c.guarantorAddress || '';

  tempUploads.clientCardImg = c.nationalIdImg || '';
  tempUploads.clientContractImg = c.contractImg || '';
  tempUploads.guarantorCardImg = c.guarantorCardImg || '';
  tempUploads.guarantorContractImg = c.guarantorContractImg || '';

  setupPreviewBox('client-card-img-preview-box', 'client-card-img-status', c.nationalIdImg, 'بطاقة العميل');
  setupPreviewBox('client-contract-img-preview-box', 'client-contract-img-status', c.contractImg, 'عقد العميل');
  setupPreviewBox('guarantor-card-img-preview-box', 'guarantor-card-img-status', c.guarantorCardImg, 'بطاقة الضامن');
  setupPreviewBox('guarantor-contract-img-preview-box', 'guarantor-contract-img-status', c.guarantorContractImg, 'عقد الضامن');

  document.getElementById('client-modal-title').textContent = 'تعديل بيانات العميل والضامن المعني';
  openModal('add-client-modal');
};

function setupPreviewBox(previewId, statusId, base64Data, label) {
  const box = document.getElementById(previewId);
  const status = document.getElementById(statusId);
  
  if (base64Data && base64Data.startsWith('data:image')) {
    box.classList.remove('hidden');
    box.querySelector('span').textContent = label;
    status.textContent = 'تم توفير مستند مخزن';
  } else {
    box.classList.add('hidden');
    status.textContent = 'لم يتم الرفع';
  }
}

document.getElementById('add-client-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = document.getElementById('client-edit-id').value;

  const name = document.getElementById('client-fullname').value;
  const nationalId = document.getElementById('client-national-id').value;
  const phone = document.getElementById('client-phone').value;
  const address = document.getElementById('client-address').value;
  const locationUrl = document.getElementById('client-location-url').value;
  
  const guarantorName = document.getElementById('guarantor-fullname').value;
  const guarantorNationalId = document.getElementById('guarantor-national-id').value;
  const guarantorPhone = document.getElementById('guarantor-phone').value;
  const guarantorRelation = document.getElementById('guarantor-relation').value;
  const guarantorJob = document.getElementById('guarantor-job').value;
  const guarantorAddress = document.getElementById('guarantor-address').value;

  let nationalIdImg = tempUploads.clientCardImg;
  let contractImg = tempUploads.clientContractImg;
  let guarantorCardImg = tempUploads.guarantorCardImg;
  let guarantorContractImg = tempUploads.guarantorContractImg;

  // Use Firebase Storage if available (uploads and returns secure URL)
  if (window.FirebaseService && window.FirebaseService.isAvailable()) {
    const statusMsg = document.getElementById('client-modal-title');
    const originalTitle = statusMsg.textContent;
    statusMsg.textContent = 'جاري رفع الصور المشفرة... يرجى الانتظار';
    
    nationalIdImg = await window.FirebaseService.uploadImage(nationalIdImg, 'clients/cards', `card_${nationalId}`);
    contractImg = await window.FirebaseService.uploadImage(contractImg, 'clients/contracts', `contract_${nationalId}`);
    guarantorCardImg = await window.FirebaseService.uploadImage(guarantorCardImg, 'guarantors/cards', `gcard_${guarantorNationalId || nationalId}`);
    guarantorContractImg = await window.FirebaseService.uploadImage(guarantorContractImg, 'guarantors/contracts', `gcontract_${guarantorNationalId || nationalId}`);
    
    statusMsg.textContent = originalTitle;
  }

  if (editId) {
    const c = db.clients.find(x => x.id === editId);
    if (c) {
      c.name = name;
      c.nationalId = nationalId;
      c.phone = phone;
      c.address = address;
      c.locationUrl = locationUrl;
      c.nationalIdImg = nationalIdImg;
      c.contractImg = contractImg;
      c.guarantorName = guarantorName;
      c.guarantorNationalId = guarantorNationalId;
      c.guarantorPhone = guarantorPhone;
      c.guarantorRelation = guarantorRelation;
      c.guarantorJob = guarantorJob;
      c.guarantorAddress = guarantorAddress;
      c.guarantorCardImg = guarantorCardImg;
      c.guarantorContractImg = guarantorContractImg;

      logAction('تعديل عميل', `تعديل بيانات العميل ${name} وضامنه ${guarantorName}`);
      await syncWithAppsScript('updateClient', c);
    }
  } else {
    const newClient = {
      id: `cli-${Date.now()}`,
      name,
      nationalId,
      phone,
      address,
      locationUrl,
      nationalIdImg,
      contractImg,
      guarantorName,
      guarantorNationalId,
      guarantorPhone,
      guarantorRelation,
      guarantorJob,
      guarantorAddress,
      guarantorCardImg,
      guarantorContractImg
    };
    db.clients.push(newClient);
    logAction('إضافة عميل', `إضافة العميل الجديد ${name} وضامنه ${guarantorName}`);
    await syncWithAppsScript('addClient', newClient);
  }

  saveToLocalStorage();
  closeModal('add-client-modal');
  document.getElementById('add-client-form').reset();
  renderClients();
  populateDropdowns();
});

document.getElementById('expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const notes = document.getElementById('expense-notes').value;

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const txId = `tx-exp-${Date.now()}`;
  db.treasuryTransactions.unshift({
    id: txId,
    timestamp: timestamp,
    type: 'expense',
    amount: -amount,
    notes: `مصروف (${category}): ${notes}`
  });

  saveToLocalStorage();
  logAction('صرف مصروف', `صرف مبلغ ${amount} ج.م كبند مصروفات (${category})`);

  await syncWithAppsScript('addExpense', { amount, category, notes, timestamp });

  closeModal('expense-modal');
  document.getElementById('expense-form').reset();
  renderTreasury();
  renderDashboard();
});

document.getElementById('deposit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const notes = document.getElementById('deposit-notes').value;

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const txId = `tx-dep-${Date.now()}`;
  db.treasuryTransactions.unshift({
    id: txId,
    timestamp: timestamp,
    type: 'deposit',
    amount: amount,
    notes: notes
  });

  saveToLocalStorage();
  logAction('إيداع خزينة', `إيداع مبلغ ${amount} ج.م بالخزينة لـ: ${notes}`);

  await syncWithAppsScript('addDeposit', { amount, notes, timestamp });

  closeModal('deposit-modal');
  document.getElementById('deposit-form').reset();
  renderTreasury();
  renderDashboard();
});

window.deleteClient = function(id) {
  if (confirm('هل أنت متأكد من حذف هذا العميل نهائياً من النظام؟ لا يمكن الرجوع عن هذا الخيار.')) {
    const client = db.clients.find(c => c.id === id);
    db.clients = db.clients.filter(c => c.id !== id);
    saveToLocalStorage();
    if (client) logAction('حذف عميل', `حذف العميل ${client.name} من السجلات`);
    renderClients();
    populateDropdowns();
  }
};

window.deleteTransaction = function(id) {
  if (!isAdmin()) {
    alert('⛔ حذف الحركات المالية مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  if (confirm('هل أنت متأكد من حذف هذه حركة المالية؟ سيؤثر هذا على إجمالي رصيد الخزينة.')) {
    const tx = db.treasuryTransactions.find(t => t.id === id);
    db.treasuryTransactions = db.treasuryTransactions.filter(t => t.id !== id);
    saveToLocalStorage();
    if (tx) logAction('حذف حركة مالية', `حذف المعاملة المالية بقيمة ${tx.amount} ج.م`);
    renderTreasury();
    renderDashboard();
  }
};

window.editTransaction = function(id) {
  if (!isAdmin()) {
    alert('⛔ تعديل الحركات المالية مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  const tx = db.treasuryTransactions.find(t => t.id === id);
  if (!tx) return;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-amount').value = Math.abs(tx.amount);
  document.getElementById('edit-tx-notes').value = tx.notes;
  openModal('edit-transaction-modal');
};

window.saveTransactionEdit = function() {
  if (!isAdmin()) return;
  const id = document.getElementById('edit-tx-id').value;
  const tx = db.treasuryTransactions.find(t => t.id === id);
  if (!tx) return;

  const newAmt = parseFloat(document.getElementById('edit-tx-amount').value);
  const newNotes = document.getElementById('edit-tx-notes').value.trim();

  tx.amount = tx.amount < 0 ? -Math.abs(newAmt) : Math.abs(newAmt);
  tx.notes = newNotes;

  saveToLocalStorage();
  logAction('تعديل حركة مالية', `تعديل حركة مالية رقم ${id} بقيمة جديدة ${tx.amount} ج.م`);
  closeModal('edit-transaction-modal');
  renderTreasury();
  renderDashboard();
};

window.deleteUser = function(id) {
  if (!isAdmin()) {
    alert('⛔ حذف المستخدمين مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  if (currentUser && currentUser.id === id) {
    alert('⛔ لا يمكنك حذف حسابك الخاص وأنت مسجل دخول.');
    return;
  }
  if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
    const user = db.users.find(u => u.id === id);
    db.users = db.users.filter(u => u.id !== id);
    saveToLocalStorage();
    if (user) logAction('حذف مستخدم', `حذف المستخدم ${user.name}`);
    renderUsers();
    populateDropdowns();
  }
};

window.editContract = function(contractId) {
  if (!isAdmin()) {
    alert('⛔ تعديل العقود مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  const c = db.contracts.find(x => x.id === contractId);
  if (!c) return;

  document.getElementById('edit-contract-id').value = c.id;
  document.getElementById('edit-contract-collector').value = c.collectorName || '';
  document.getElementById('edit-contract-grace').value = c.graceDays || 5;
  document.getElementById('edit-contract-fine-type').value = c.fineType || 'flat';
  document.getElementById('edit-contract-fine-value').value = c.fineValue || 0;
  document.getElementById('edit-contract-status').value = c.status || 'active';
  openModal('edit-contract-modal');
};

window.saveContractEdit = async function() {
  if (!isAdmin()) return;
  const contractId = document.getElementById('edit-contract-id').value;
  const c = db.contracts.find(x => x.id === contractId);
  if (!c) return;

  const newCollector = document.getElementById('edit-contract-collector').value.trim();
  c.collectorName = newCollector;
  c.graceDays = parseInt(document.getElementById('edit-contract-grace').value) || 5;
  c.fineType = document.getElementById('edit-contract-fine-type').value;
  c.fineValue = parseFloat(document.getElementById('edit-contract-fine-value').value) || 0;
  c.status = document.getElementById('edit-contract-status').value;

  db.installments.forEach(inst => {
    if (inst.contractId === contractId) {
      inst.collectorName = newCollector;
    }
  });

  saveToLocalStorage();
  logAction('تعديل عقد', `تعديل بيانات العقد رقم ${contractId.replace('con-', '')} للعميل ${c.clientName}`);
  
  await syncWithAppsScript('updateContract', c);
  
  closeModal('edit-contract-modal');
  renderContracts();
  renderCollections();
};

window.deleteContract = async function(contractId) {
  if (!isAdmin()) {
    alert('⛔ حذف العقود مخصص للمشرف (ADMIN) فقط.');
    return;
  }
  const c = db.contracts.find(x => x.id === contractId);
  if (!c) return;

  if (confirm(`هل أنت متأكد من حذف العقد رقم ${contractId.replace('con-', '')} للعميل ${c.clientName}؟ سيتم حذف جميع أقساطه.`)) {
    const dev = db.inventory.find(d => d.id === c.deviceId);
    if (dev && dev.status === 'sold_installment') {
      dev.status = 'available';
      dev.soldTo = '';
    }
    db.installments = db.installments.filter(inst => inst.contractId !== contractId);
    db.contracts = db.contracts.filter(x => x.id !== contractId);
    saveToLocalStorage();
    logAction('حذف عقد', `حذف العقد رقم ${contractId.replace('con-', '')} للعميل ${c.clientName} وإرجاع الجهاز للمخزن`);
    
    await syncWithAppsScript('deleteContract', { id: contractId });
    
    renderContracts();
    renderInventory();
    renderCollections();
    renderDashboard();
  }
};

// ================= SELECT MENUS & SEARCH FILTERS =================
function populateDropdowns() {
  try {
    const clientSelect = document.getElementById('contract-client-select');
    if (clientSelect) {
      clientSelect.innerHTML = '<option value="">اختر العميل المشتري...</option>';
      db.clients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (الهوية: ${c.nationalId})`;
        clientSelect.appendChild(opt);
      });
    }

    const deviceSelect = document.getElementById('contract-device-select');
    if (deviceSelect) {
      deviceSelect.innerHTML = '<option value="">اختر الجهاز من المتاح بالمخزن...</option>';
      db.inventory.filter(d => d.status === 'available').forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `${d.brand} ${d.name} (SN: ${d.serial}) - سعر: ${d.sellingPrice} ج.م`;
        deviceSelect.appendChild(opt);
      });
    }

    const brandSelect = document.getElementById('device-brand-select');
    if (brandSelect) {
      brandSelect.innerHTML = '';
      db.brands.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        brandSelect.appendChild(opt);
      });
    }

    const supplierSelect = document.getElementById('device-supplier');
    if (supplierSelect) {
      supplierSelect.innerHTML = '';
      db.suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        supplierSelect.appendChild(opt);
      });
    }

    const collectorSelect = document.getElementById('contract-collector-select');
    if (collectorSelect) {
      collectorSelect.innerHTML = '<option value="">اختر المحصل المسئول...</option>';
      db.users.filter(u => u.role === 'COLLECTOR').forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.name;
        opt.textContent = `${u.name} (${u.area})`;
        collectorSelect.appendChild(opt);
      });
    }

    const collectionMonthSelect = document.getElementById('collection-filter-month');
    if (collectionMonthSelect) {
      collectionMonthSelect.innerHTML = '<option value="all">كل الأشهر</option>';
      const months = [...new Set(db.installments.map(i => i.dueDate.substring(0, 7)))].sort();
      months.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        collectionMonthSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error populating dropdowns:', err);
  }
}

document.getElementById('client-search-input').addEventListener('input', renderClients);
document.getElementById('inventory-search').addEventListener('input', renderInventory);
document.getElementById('contract-search-input').addEventListener('input', renderContracts);
document.getElementById('collection-search-input').addEventListener('input', renderCollections);
document.getElementById('collection-filter-month').addEventListener('change', renderCollections);
document.getElementById('collection-filter-status').addEventListener('change', renderCollections);

document.getElementById('btn-save-settings').addEventListener('click', () => {
  const offline = document.getElementById('setting-offline-mode').checked;
  const companyName = document.getElementById('setting-company-name').value.trim();
  const logoUrl = document.getElementById('setting-company-logo-url').value;

  db.settings.offlineMode = offline;
  if (companyName) db.settings.companyName = companyName;
  db.settings.companyLogo = logoUrl;

  if (!db.settings.templates) db.settings.templates = {};
  db.settings.templates.reminder = document.getElementById('template-reminder').value;
  db.settings.templates.warning = document.getElementById('template-warning').value;
  db.settings.templates.receipt = document.getElementById('template-receipt').value;

  saveToLocalStorage();
  applyCompanyBranding();
  updateSyncStatusUI();
  logAction('تعديل إعدادات', `تحديث إعدادات النظام واسم الشركة والتوريد السحابي`);
  alert('تم حفظ إعدادات النظام وهوية الشركة بنجاح!');
  
  if (!offline) {
    loadFromServer();
  }
});

// ================= ⚠️ التعديل الجوهري والنهائي للفحص الذكي =================
// Test connection button removed for Firebase integration.

document.getElementById('btn-seed-data').addEventListener('click', () => {
  if (confirm('هل ترغب في إعادة حقن البيانات الافتراضية؟ سيؤدي هذا لمسح البيانات الحالية.')) {
    db = defaultSeedData;
    generateSeededInstallments();
    saveToLocalStorage();
    logAction('حقن بيانات', 'إعادة تهيئة النظام وحقن البيانات النموذجية للتجربة');
    alert('تم إعادة تهيئة قاعدة البيانات بنجاح!');
    location.reload();
  }
});

document.getElementById('btn-clear-db').addEventListener('click', () => {
  if (confirm('هل أنت متأكد من مسح جميع البيانات المحلية نهائياً؟')) {
    localStorage.removeItem('sky_erp_db');
    alert('تم مسح البيانات بنجاح! سيتم إحياء النظام بقيم فارغة.');
    location.reload();
  }
});

document.getElementById('btn-export-json').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `sky_erp_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

window.exportTransactionsCSV = function() {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "التاريخ والوقت,النوع التقييدي,البيان والشرح بالتفصيل,المبلغ الفعلي المورد بالخزينة\n";
  
  db.treasuryTransactions.forEach(tx => {
    let typeText = tx.type;
    let amountStr = tx.amount;
    csvContent += `"${tx.timestamp}","${typeText}","${tx.notes.replace(/"/g, '""')}","${amountStr}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `sky_treasury_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ================= APPS SCRIPT CODE VIEWER =================
const appsScriptCode = `// كود Google Apps Script لقاعدة بيانات شركة SKY ERP
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'testConnection') {
    initializeSheetsIfNotExist();
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Connected successfully!" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
  if (action === 'getAllData') {
    initializeSheetsIfNotExist();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: loadAllData() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const data = postData.data;
    initializeSheetsIfNotExist();
    let result = { success: false };
    
    if (action === 'addClient') { result = appendRowToSheet('Clients', data); }
    else if (action === 'addDevice') {
      result = appendRowToSheet('Inventory', data.newDevice);
      appendRowToSheet('TreasuryTransactions', { id: "tx-pur-" + Date.now(), timestamp: data.timestamp, type: "inventory_purchase", amount: -data.newDevice.costPrice, notes: "شراء جهاز " + data.newDevice.brand + " " + data.newDevice.name });
    }
    else if (action === 'addContract') {
      result = appendRowToSheet('Contracts', data.contract);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Installments');
      const start = new Date(data.contract.startDate);
      for (let i = 1; i <= data.contract.duration; i++) {
        let dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + (i - 1));
        sheet.appendRow([data.contract.id + "_" + i, data.contract.id, data.contract.clientId, data.contract.clientName, data.contract.clientPhone, data.contract.collectorName, i, data.contract.monthlyInstallment, dueDate.toISOString().split('T')[0], 'pending', 0, '', '', 0]);
      }
      if (data.contract.downPayment > 0) {
        appendRowToSheet('TreasuryTransactions', { id: "tx-dp-" + Date.now(), timestamp: data.timestamp, type: "collection", amount: data.contract.downPayment, notes: "مقدم عقد " + data.contract.id + " للعميل " + data.contract.clientName });
      }
    }
    else if (action === 'addPendingCustody') { result = appendRowToSheet('CollectorCustodies', data); }
    else if (action === 'approveCustody') { result = approveCustodyInSheet(data); }
    else if (action === 'cashSale') { result = registerCashSaleInSheet(data); }
    else if (action === 'addExpense') { result = appendRowToSheet('TreasuryTransactions', { id: "tx-exp-" + Date.now(), timestamp: data.timestamp, type: "expense", amount: -data.amount, notes: "مصروف (" + data.category + "): " + data.notes }); }
    else if (action === 'addDeposit') { result = appendRowToSheet('TreasuryTransactions', { id: "tx-dep-" + Date.now(), timestamp: data.timestamp, type: "deposit", amount: data.amount, notes: data.notes }); }
    else if (action === 'addUser') { result = appendRowToSheet('Users', data); }
    else if (action === 'addAuditLog') { result = appendRowToSheet('Audit_Log', data); }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  }
}

function loadAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    clients: readTable(ss, 'Clients'),
    inventory: readTable(ss, 'Inventory'),
    contracts: readTable(ss, 'Contracts'),
    installments: readTable(ss, 'Installments'),
    collectorCustodies: readTable(ss, 'CollectorCustodies'),
    treasuryTransactions: readTable(ss, 'TreasuryTransactions'),
    users: readTable(ss, 'Users'),
    auditLogs: readTable(ss, 'Audit_Log')
  };
}

function readTable(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  const data = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    headers.forEach((header, index) => { obj[header] = row[index]; });
    data.push(obj);
  }
  return data;
}

function appendRowToSheet(sheetName, obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  const dataRange = sheet.getDataRange();
  let headers = [];
  if (dataRange.getLastRow() === 0) { headers = Object.keys(obj); sheet.appendRow(headers); }
  else { headers = dataRange.getValues()[0]; }
  const rowData = headers.map(header => obj[header] || "");
  sheet.appendRow(rowData);
  return { success: true };
}

function approveCustodyInSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const custodySheet = ss.getSheetByName('CollectorCustodies');
  const custodyValues = custodySheet.getDataRange().getValues();
  for (let i = 1; i < custodyValues.length; i++) {
    if (custodyValues[i][0] === data.custodyId) { custodySheet.getRange(i + 1, custodyValues[0].indexOf('status') + 1).setValue('approved'); break; }
  }
  const instSheet = ss.getSheetByName('Installments');
  const instValues = instSheet.getDataRange().getValues();
  for (let i = 1; i < instValues.length; i++) {
    if (instValues[i][0] === data.installmentId) {
      instSheet.getRange(i + 1, instValues[0].indexOf('status') + 1).setValue('paid');
      instSheet.getRange(i + 1, instValues[0].indexOf('paidAmount') + 1).setValue(data.amount);
      instSheet.getRange(i + 1, instValues[0].indexOf('paidDate') + 1).setValue(data.timestamp.split(' ')[0]);
      instSheet.getRange(i + 1, instValues[0].indexOf('receiptId') + 1).setValue(data.custodyId);
      break;
    }
  }
  appendRowToSheet('TreasuryTransactions', { id: "tx-col-" + Date.now(), timestamp: data.timestamp, type: "collection", amount: data.amount, notes: "اعتماد تحصيل عهدة للدفعة " + data.custodyId });
  return { success: true };
}

function registerCashSaleInSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName('Inventory');
  const invValues = invSheet.getDataRange().getValues();
  for (let i = 1; i < invValues.length; i++) {
    if (invValues[i][0] === data.devId) { invSheet.getRange(i + 1, invValues[0].indexOf('status') + 1).setValue('sold_cash'); invSheet.getRange(i + 1, invValues[0].indexOf('soldTo') + 1).setValue(data.clientName); break; }
  }
  appendRowToSheet('TreasuryTransactions', { id: "tx-cash-" + Date.now(), timestamp: data.timestamp, type: "cash_sale", amount: data.sellingPrice, notes: "بيع كاش فوري للجهاز للعميل " + data.clientName });
  return { success: true };
}

function initializeSheetsIfNotExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tables = {
    'Clients': ['id', 'name', 'nationalId', 'phone', 'address', 'locationUrl', 'nationalIdImg', 'contractImg', 'guarantorName', 'guarantorNationalId', 'guarantorPhone', 'guarantorRelation', 'guarantorJob', 'guarantorAddress', 'guarantorCardImg', 'guarantorContractImg'],
    'Inventory': ['id', 'brand', 'name', 'serial', 'costPrice', 'sellingPrice', 'supplier', 'status', 'soldTo'],
    'Contracts': ['id', 'clientId', 'clientName', 'clientPhone', 'deviceId', 'deviceInfo', 'totalValue', 'downPayment', 'remainingAmount', 'monthlyInstallment', 'duration', 'graceDays', 'fineType', 'fineValue', 'collectorId', 'collectorName', 'startDate', 'status'],
    'Installments': ['id', 'contractId', 'clientId', 'clientName', 'clientPhone', 'collectorName', 'installmentNum', 'amount', 'dueDate', 'status', 'paidAmount', 'paidDate', 'receiptId', 'delayFines'],
    'CollectorCustodies': ['id', 'installmentId', 'contractId', 'clientName', 'collectorName', 'amount', 'date', 'status'],
    'TreasuryTransactions': ['id', 'timestamp', 'type', 'amount', 'notes'],
    'Users': ['id', 'name', 'username', 'password', 'phone', 'role', 'area'],
    'Audit_Log': ['user', 'actionType', 'details', 'timestamp']
  };
  for (let tableName in tables) {
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      sheet.appendRow(tables[tableName]);
      sheet.getRange(1, 1, 1, tables[tableName].length).setFontWeight("bold").setBackground("#f1f5f9").setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  }
}`;

window.showAppsScriptModal = function() {
  document.getElementById('apps-script-code-block').textContent = appsScriptCode;
  openModal('apps-script-modal');
};

window.copyAppsScriptCode = function() {
  navigator.clipboard.writeText(appsScriptCode);
  alert('تم نسخ الكود للحافظة بنجاح!');
};

// ================= CLIENT DETAILS VIEWER =================
window.viewClientDetails = function(clientId) {
  const client = db.clients.find(c => c.id === clientId);
  if (!client) return;

  const clientContracts = db.contracts.filter(c => c.clientId === clientId);
  
  let contractsHtml = clientContracts.map(c => `
    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2">
      <div class="flex justify-between font-bold text-xs text-slate-800">
        <span>رقم العقد: ${c.id.replace('con-', '')}</span>
        <span class="text-indigo-600">${c.totalValue.toLocaleString()} ج.م</span>
      </div>
      <p class="text-[10px] text-slate-500 mt-1">الجهاز: ${c.deviceInfo} | المحصل: ${c.collectorName}</p>
    </div>
  `).join('');

  if (clientContracts.length === 0) {
    contractsHtml = '<p class="text-xs text-slate-400">لا توجد عقود مسجلة لهذا العميل حالياً.</p>';
  }

  const detailDiv = document.createElement('div');
  detailDiv.id = 'client-profile-modal';
  detailDiv.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  
  const docView = (title, data) => {
    if (data && data.startsWith('data:image')) {
      return `<button type="button" onclick="openBase64InPreviewModal('${title}', '${data}')" class="font-bold text-indigo-600 hover:text-indigo-800 underline block mt-1">عرض المستند 👁️</button>`;
    }
    return `<span class="font-semibold text-slate-400 truncate block mt-1">${data || 'غير متوفر'}</span>`;
  };

  detailDiv.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col">
      <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
        <h4 class="font-bold text-lg text-slate-800 flex items-center gap-2"><i class="fa-solid fa-address-card text-indigo-600"></i> الملف التعريفي للعميل</h4>
        <button onclick="document.getElementById('client-profile-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="flex-1 overflow-y-auto space-y-6 text-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h5 class="font-bold text-indigo-600 border-b border-indigo-50 pb-1 mb-2">بيانات العميل</h5>
            <p class="mb-1"><strong>الاسم الرباعي:</strong> ${client.name}</p>
            <p class="mb-1"><strong>الهوية القومية:</strong> ${client.nationalId}</p>
            <p class="mb-1"><strong>الهاتف:</strong> ${client.phone}</p>
            <p class="mb-1"><strong>العنوان:</strong> ${client.address}</p>
            ${client.locationUrl ? `<a href="${client.locationUrl}" target="_blank" class="text-indigo-600 hover:underline text-xs font-semibold"><i class="fa-solid fa-map-pin"></i> عرض خرائط Google</a>` : ''}
          </div>
          <div>
            <h5 class="font-bold text-emerald-600 border-b border-emerald-50 pb-1 mb-2">بيانات الضامن</h5>
            <p class="mb-1"><strong>الاسم الرباعي:</strong> ${client.guarantorName || '-'}</p>
            <p class="mb-1"><strong>الهوية القومية:</strong> ${client.guarantorNationalId || '-'}</p>
            <p class="mb-1"><strong>الهاتف:</strong> ${client.guarantorPhone || '-'}</p>
            <p class="mb-1"><strong>صلة القرابة:</strong> ${client.guarantorRelation || '-'}</p>
            <p class="mb-1"><strong>العنوان:</strong> ${client.guarantorAddress || '-'}</p>
          </div>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h5 class="font-bold text-slate-700 mb-3 text-xs">المستندات والملفات المرفقة:</h5>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div class="bg-white p-2 rounded border border-slate-200">
              <span class="block text-slate-400 text-[10px]">بطاقة العميل</span>
              ${docView('بطاقة العميل', client.nationalIdImg)}
            </div>
            <div class="bg-white p-2 rounded border border-slate-200">
              <span class="block text-slate-400 text-[10px]">عقد العميل</span>
              ${docView('عقد العميل', client.contractImg)}
            </div>
            <div class="bg-white p-2 rounded border border-slate-200">
              <span class="block text-slate-400 text-[10px]">بطاقة الضامن</span>
              ${docView('بطاقة الضامن', client.guarantorCardImg)}
            </div>
            <div class="bg-white p-2 rounded border border-slate-200">
              <span class="block text-slate-400 text-[10px]">عقد الضامن</span>
              ${docView('عقد الضامن', client.guarantorContractImg)}
            </div>
          </div>
        </div>

        <div>
          <h5 class="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">العقود المفتوحة</h5>
          ${contractsHtml}
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex justify-end">
        <button onclick="document.getElementById('client-profile-modal').remove()" class="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(detailDiv);
};

window.openBase64InPreviewModal = function(title, base64) {
  document.getElementById('preview-modal-img').src = base64;
  document.getElementById('preview-modal-title').textContent = title;
  openModal('image-preview-modal');
};

// ================= CONTRACT DETAILS VIEWER =================
window.viewContractDetails = function(contractId) {
  const contract = db.contracts.find(c => c.id === contractId);
  if (!contract) return;

  const contractInsts = db.installments.filter(inst => inst.contractId === contractId);

  let instRows = contractInsts.map(inst => {
    const statusInfo = getInstallmentOverdueStatus(inst);
    return `
      <tr class="hover:bg-slate-50 divide-y divide-slate-100 text-xs">
        <td class="p-3 font-bold">قسط ${inst.installmentNum}</td>
        <td class="p-3 font-mono">${inst.dueDate}</td>
        <td class="p-3 font-mono font-bold">${inst.amount.toLocaleString()} ج.م</td>
        <td class="p-3"><span class="badge ${statusInfo.statusColor} font-bold">${statusInfo.statusText}</span></td>
        <td class="p-3 font-mono font-bold text-indigo-600">${statusInfo.fine > 0 ? `${statusInfo.fine.toLocaleString()} ج.م` : '0'}</td>
        <td class="p-3 font-mono font-bold text-slate-800">${statusInfo.totalDue.toLocaleString()} ج.م</td>
        <td class="p-3 text-center">
          ${inst.status !== 'paid' ? `
            <button onclick="document.getElementById('contract-detail-modal').remove(); collectInstallmentBtn('${inst.id}')" class="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors">تحصيل</button>
          ` : `
            <span class="text-emerald-600 font-bold"><i class="fa-solid fa-check"></i> مدفوع</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  const detailDiv = document.createElement('div');
  detailDiv.id = 'contract-detail-modal';
  detailDiv.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  detailDiv.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
        <h4 class="font-bold text-lg text-slate-800 flex items-center gap-2"><i class="fa-solid fa-file-invoice text-indigo-600"></i> تفاصيل وجدولة أقساط العقد رقم: ${contract.id.replace('con-', '')}</h4>
        <button onclick="document.getElementById('contract-detail-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="flex-1 overflow-y-auto space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
          <p><strong>العميل المشتري:</strong> ${contract.clientName}</p>
          <p><strong>المحصل المسند:</strong> ${contract.collectorName}</p>
          <p><strong>الجهاز المباع:</strong> ${contract.deviceInfo}</p>
          <p><strong>تاريخ العقد:</strong> ${contract.startDate}</p>
          <p><strong>قيمة العقد الإجمالية:</strong> ${contract.totalValue.toLocaleString()} ج.م</p>
          <p><strong>الدفعة المقدمة:</strong> ${contract.downPayment.toLocaleString()} ج.م</p>
          <p><strong>المبلغ المتبقي للتقسيط:</strong> ${contract.remainingAmount.toLocaleString()} ج.م</p>
          <p><strong>قيمة القسط الشهري:</strong> ${contract.monthlyInstallment.toLocaleString()} ج.م</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-bold">
                <th class="p-3">رقم الدفعة</th>
                <th class="p-3">تاريخ الاستحقاق</th>
                <th class="p-3">قيمة القسط الأصلية</th>
                <th class="p-3">الحالة والمدة</th>
                <th class="p-3">غرامة التأخير</th>
                <th class="p-3">إجمالي القيمة المطلوبة</th>
                <th class="p-3 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              ${instRows}
            </tbody>
          </table>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex justify-end">
        <button onclick="document.getElementById('contract-detail-modal').remove()" class="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(detailDiv);
};

// ================= ROUTING & TAB NAVIGATION =================
window.switchTab = function(tabName) {
  // منع المحصل من الانتقال إلى أي تبويب آخر غير التحصيلات
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

  renderActiveTab(tabName);
  localStorage.setItem('sky_erp_active_tab', tabName);

  const sidebar = document.querySelector('aside');
  if (window.innerWidth < 768 && sidebar) {
    sidebar.classList.add('hidden');
  }
};

document.querySelectorAll('#sidebar-menu a').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const activeTab = this.getAttribute('data-tab');
    switchTab(activeTab);
  });
});

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  const sidebar = document.querySelector('aside');
  sidebar.classList.toggle('hidden');
});

// ================= DARK MODE TOGGLE =================
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');

function updateThemeIcon(isDark) {
  if (isDark) {
    themeToggleIcon.className = 'fa-solid fa-sun text-amber-400';
  } else {
    themeToggleIcon.className = 'fa-solid fa-moon';
  }
}

// Check initial theme from localStorage
const storedTheme = localStorage.getItem('sky_erp_theme');
if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  updateThemeIcon(true);
} else {
  document.documentElement.classList.remove('dark');
  updateThemeIcon(false);
}

themeToggleBtn.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('sky_erp_theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
});

document.getElementById('logout-btn').addEventListener('click', () => {
  if (confirm('هل ترغب في تسجيل الخروج؟')) {
    currentUser = null;
    localStorage.removeItem('sky_erp_current_user');
    showLoginScreen();
  }
});

document.getElementById('login-submit-btn').addEventListener('click', performLogin);
document.getElementById('login-password-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performLogin();
});

// ================= INITIALIZATION =================
initDatabase();
tryAutoLogin();
