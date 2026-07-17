// Dictionary for UI Translation
const translations = {
    en: {
        nav_sim: "💻 Plant Simulator",
        nav_admin: "📊 Admin Panel",
        hero_title: "Plant Operating Parameters",
        lbl_gas_inlet: "Gas Inlet Flow (kmol/h)",
        lbl_water_sat: "Water to Saturate (kmol/h)",
        lbl_feed_temp: "Feed Temp (°C)",
        lbl_target_h2o: "Target H2O in Dry Gas (Frac)",
        lbl_teg_feed: "TEG Feed (kmol/h)",
        lbl_makeup_teg: "Makeup TEG (kmol/h)",
        btn_run: "▶ Run Simulation",
        pfd_title: "Process Flow Diagram",
        chat_toggle: "💬 Smart Assistant",
        chat_header: "TEG Expert AI",
        chat_placeholder: "Type your question here...",
        chat_send: "Send",
        bot_welcome: "Hello Engineer! I am the smart assistant for the TEG Simulator. Ask me anything about equipment, balances, or Basra's gas operations.",
        
        // Equipment Names
        eq_sat: "Saturate",
        eq_fwko: "FWKO TK",
        eq_abs: "Absorber T-100",
        eq_vlv: "VLV-100",
        eq_hex: "L/R HEX",
        eq_reg: "Regenerator",
        eq_mix: "MIX-100",
        eq_pump: "P-100"
    },
    ar: {
        nav_sim: "💻 محاكي المحطة",
        nav_admin: "📊 لوحة التحكم",
        hero_title: "عوامل تشغيل المحطة",
        lbl_gas_inlet: "تدفق الغاز الداخل (kmol/h)",
        lbl_water_sat: "ماء التشبع (kmol/h)",
        lbl_feed_temp: "حرارة التغذية (°C)",
        lbl_target_h2o: "الماء المستهدف في الغاز الجاف",
        lbl_teg_feed: "تدفق الغلايكول (kmol/h)",
        lbl_makeup_teg: "غلايكول التعويض (kmol/h)",
        btn_run: "▶ تشغيل المحاكاة",
        pfd_title: "مخطط سير العمليات (PFD)",
        chat_toggle: "💬 المساعد الذكي",
        chat_header: "خبير الذكاء الاصطناعي",
        chat_placeholder: "اكتب سؤالك هنا...",
        chat_send: "إرسال",
        bot_welcome: "مرحباً يا مهندس! أنا المساعد الذكي لمشروع TEG Simulator. اسألني أي سؤال عن المعدات، الموازنات، أو مشاكل تشغيل غاز البصرة.",
        
        // ترجمة أسماء المعدات
        eq_sat: "وحدة التشبع",
        eq_fwko: "الفاصل (FWKO)",
        eq_abs: "برج الامتصاص",
        eq_vlv: "صمام الخفض",
        eq_hex: "المبادل الحراري",
        eq_reg: "برج التجديد",
        eq_mix: "وحدة الخلط",
        eq_pump: "مضخة P-100"
    }
};

let currentLang = 'en';

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    const langBtn = document.getElementById('lang-toggle-btn');
    if(langBtn) langBtn.innerHTML = currentLang === 'en' ? '🌐 العربية' : '🌐 English';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerHTML = translations[currentLang][key];
            }
        }
    });

    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) welcomeMsg.innerText = translations[currentLang].bot_welcome;
}