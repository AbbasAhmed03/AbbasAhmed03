// ==========================================
// TEG Simulator Bilingual Knowledge Base
// ==========================================
const qaDatabase = [
    { 
        ar_kw: ["hysys", "هايسس", "برنامج", "ليش", "لماذا"], 
        en_kw: ["hysys", "program", "why", "software"],
        ar_ans: "استخدمنا HYSYS للمقارنة فقط، لكن بناء الـ Simulator الخاص بنا يمنحنا مرونة تامة لتعديل الثوابت وبناء واجهات مخصصة لا تحتاج لتراخيص مكلفة.",
        en_ans: "We used HYSYS for comparison only. Building our own Simulator in JavaScript gives us full flexibility to modify constants and build custom apps without expensive licenses."
    },
    { 
        ar_kw: ["رغوة", "foaming", "فوم", "تفور"], 
        en_kw: ["foam", "foaming", "bubbles"],
        ar_ans: "الرغوة تحدث بسبب تلوث الـ TEG بالهيدروكربونات السائلة أو الأملاح. لحلها: نستخدم مضادات الرغوة (Antifoam) ونقوم بتنظيف فلتر الكربون النشط.",
        en_ans: "Foaming occurs due to TEG contamination with liquid hydrocarbons or salts. Solution: inject Antifoam agents and clean the activated carbon filter."
    },
    { 
        ar_kw: ["deg", "teg", "فرق", "مقارنة"], 
        en_kw: ["deg", "teg", "difference", "compare"],
        ar_ans: "فضلنا الـ TEG على الـ DEG لأنه يمتلك استقراراً حرارياً أعلى، ودرجة غليان أعلى (يقلل التبخر)، ويمكن تجديده لتركيز 99% بسهولة، مما يمنحنا نقطة ندى أفضل.",
        en_ans: "We preferred TEG over DEG because it has higher thermal stability, lower vaporization losses, and can be easily regenerated to 99%, providing a better Dew Point."
    },
    { 
        ar_kw: ["بصرة", "فلير", "حرق", "خسارة"], 
        en_kw: ["basra", "basrah", "flare", "flaring", "loss"],
        ar_ans: "حسب التقرير، بلغت الخسائر المالية لحرق الغاز في البصرة (2009-2018) أكثر من 11 مليار دولار. هذا الـ Simulator هو خطوة عملية لمحاكاة معالجة الغاز لتقليل هذا الهدر.",
        en_ans: "According to the report, flaring losses in Basra (2009-2018) exceeded $11 Billion. This Simulator is a practical step to model gas processing and reduce this economic waste."
    },
    { 
        ar_kw: ["fwko", "فاصل", "separator"], 
        en_kw: ["fwko", "separator", "vessel"],
        ar_ans: "الفاصل (FWKO) يفصل الماء الحر والسوائل الهيدروكربونية عن الغاز قبل دخوله للبرج، مما يحمي الـ TEG من التلوث ويمنع مشاكل الرغوة.",
        en_ans: "The FWKO separates free water and liquid hydrocarbons from the gas before entering the contactor, protecting the TEG from contamination and preventing foaming."
    },
    { 
        ar_kw: ["reboiler", "مغلي", "regenerator", "تجديد"], 
        en_kw: ["reboiler", "regenerator", "distillation", "boil"],
        ar_ans: "برج التجديد والمغلي يقومان بتبخير الماء من الـ Rich TEG بينما يبقى الـ TEG سائلاً. نضبط حرارة المغلي عادة حول 204°C.",
        en_ans: "The regenerator and reboiler vaporize water from the Rich TEG while the TEG remains liquid. We typically set the reboiler temperature around 204°C."
    },
    { 
        ar_kw: ["حرارة", "صدمة", "تبادل", "hex", "مبادل"], 
        en_kw: ["heat", "exchanger", "hex", "shock"],
        ar_ans: "نستخدم المبادل الحراري (L/R HEX) لتسخين الـ Rich TEG البارد باستخدام الـ Lean TEG الحار. هذا يوفر طاقة الوقود في المغلي ويمنع الصدمة الحرارية.",
        en_ans: "We use the L/R HEX to heat the cold Rich TEG using the hot Lean TEG. This saves massive fuel gas energy in the reboiler and prevents thermal shock."
    },
    { 
        ar_kw: ["makeup", "تعويض", "نقص"], 
        en_kw: ["makeup", "loss", "add"],
        ar_ans: "رغم كفاءة النظام، نفقد كميات قليلة من الـ TEG مع الغاز. تيار الـ Makeup TEG يضيف غلايكول جديد للحفاظ على التركيز ومنع جفاف المضخات.",
        en_ans: "Despite system efficiency, we lose small amounts of TEG with the gas. The Makeup TEG stream adds fresh glycol to maintain concentration and prevent pump cavitation."
    },
    { 
        ar_kw: ["hydrate", "هيدرات", "انسداد", "ثلج"], 
        en_kw: ["hydrate", "ice", "blockage"],
        ar_ans: "الهيدرات هي بلورات تشبه الثلج تتكون من الغاز والماء تحت ضغط عالٍ. وظيفة وحدة الـ TEG هي إزالة الماء لمنع تكون هذه الهيدرات وسد الأنابيب.",
        en_ans: "Hydrates are ice-like crystals formed by gas and water under high pressure. The TEG unit removes water to prevent hydrates from forming and blocking pipelines."
    },
    { 
        ar_kw: ["من انت", "شنو انت", "شسمك", "مساعد"], 
        en_kw: ["who are you", "name", "assistant"],
        ar_ans: "أنا المساعد الذكي لمشروع TEG Simulator Pro، تم تطويري لمساعدتك في فهم العمليات الكيميائية وحل المشاكل التشغيلية في وحدات الغاز. 🤖",
        en_ans: "I am the TEG Simulator Pro Smart Assistant, developed to help you understand chemical processes and solve operational issues in gas units. 🤖"
    }
];

// ==========================================
// Chatbot UI Controllers
// ==========================================
function toggleChatbot() {
    const chatWindow = document.getElementById('chatbot-window');
    chatWindow.classList.toggle('hidden');
}

function handleChat(event) {
    if (event.key === 'Enter') processUserMessage();
}

function processUserMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    if (message === '') return;

    appendMessage('user-msg', message);
    inputField.value = '';

    setTimeout(() => {
        const reply = findAnswer(message, currentLang);
        appendMessage('bot-msg', reply);
    }, 600);
}

function formatChatText(text) {
    let formatted = text.replace(/\n/g, '<br>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
}

function appendMessage(className, text) {
    const chatContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = className;
    msgDiv.innerHTML = formatChatText(text); // Supports bold and line breaks
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; 
}

// ==========================================
// NLP & Engineering Analysis Engine
// ==========================================
function findAnswer(userMsg, lang) {
    const cleanMsg = userMsg.toLowerCase();
    
    // 1. Check if the user is asking for Live Operational Analysis
    const analysisKwAr = ["تحليل", "تقييم", "نصيحة", "شيك", "وضع", "حالة", "نتيجة"];
    const analysisKwEn = ["analyze", "evaluate", "advice", "check", "status", "report", "result"];
    
    const isAnalysisReq = lang === 'ar' ? analysisKwAr.some(kw => cleanMsg.includes(kw)) : analysisKwEn.some(kw => cleanMsg.includes(kw));
    
    if (isAnalysisReq) {
        return generateDynamicAnalysis(lang);
    }

    // 2. Check general QA Database
    for (let item of qaDatabase) {
        let isMatch = false;
        if (lang === 'ar') {
            isMatch = item.ar_kw.some(kw => cleanMsg.includes(kw));
            if (isMatch) return item.ar_ans;
        } else {
            isMatch = item.en_kw.some(kw => cleanMsg.includes(kw));
            if (isMatch) return item.en_ans;
        }
    }
    
    // 3. Fallback answer
    return lang === 'ar' 
        ? "سؤال ممتاز! لكنه خارج قاعدة بياناتي. اطلب مني **تحليل المحطة**، أو اسألني عن أسباب **الرغوة**." 
        : "Great question! But it's outside my current database. Try asking me to **analyze** the plant, or ask about **foaming**.";
}

// ==========================================
// Dynamic Plant Analyzer (The Smart Feature)
// ==========================================
// ==========================================
// Advanced Dynamic Plant Analyzer (Senior Engineer Level)
// ==========================================
function generateDynamicAnalysis(lang) {
    if (!window.lastSimData || !window.lastSimData.streams) {
        return lang === 'ar' 
            ? "⚠️ لا توجد بيانات في الذاكرة. يرجى تشغيل المحاكاة (Run Simulation) أولاً ليتمكن المحرك الثيرموديناميكي من تحليل النتائج." 
            : "⚠️ No data in memory. Please run the simulation first so the thermodynamic engine can analyze the results.";
    }

    const streams = window.lastSimData.streams;
    const balances = window.lastSimData.balances;
    
    // استخراج القيم الحية من المحاكاة
    const gasInT = streams["Gas Inlet"].T;
    const tegInT = streams["TEG Feed"].T;
    const rebT = streams["Regen Bttms"].T;
    const dryGasH2O = streams["Dry Gas"].comp["H2O"] || 0;
    const tegFlow = streams["TEG Feed"].flow;
    const makeupFlow = streams["Makeup TEG"].flow;
    const dryGasFlow = streams["Dry Gas"].flow;

    // حسابات هندسية متقدمة داخل البوت
    const deltaT = tegInT - gasInT;
    const makeupPercentage = (makeupFlow / tegFlow) * 100;
    let statusIcon = "🟢"; // حالة المحطة العامة
    let errorCount = 0;

    let adviceAr = "📋 **تقرير المهندس  للحالة التشغيلية:**\n";
    let adviceEn = "📋 **Wise Assistant Operational Report:**\n";
    adviceAr += "━━━━━━━━━━━━━━━━\n";
    adviceEn += "━━━━━━━━━━━━━━━━\n";

    // --- 1. Dehydration Efficiency (جودة التجفيف) ---
    adviceAr += "💧 **1. كفاءة التجفيف (نقطة الندى):**\n";
    adviceEn += "💧 **1. Dehydration Efficiency (Dew Point):**\n";
    if (dryGasH2O > 0.0005) {
        adviceAr += "   ❌ **فشل:** نسبة الماء في الغاز الجاف ("+ dryGasH2O.toFixed(4) +") تتجاوز المواصفات. خطر تكون الهيدرات عالٍ جداً. **الحل:** قم بزيادة معدل تدوير الغلايكول (TEG Feed) أو تأكد من كفاءة المغلّي.\n";
        adviceEn += "   ❌ **FAIL:** Water content in Dry Gas ("+ dryGasH2O.toFixed(4) +") exceeds pipeline specs. High hydrate risk. **Action:** Increase TEG circulation rate or check reboiler.\n";
        errorCount++; statusIcon = "🔴";
    } else {
        adviceAr += "   ✅ **ممتاز:** الغاز مطابق لمواصفات خطوط الأنابيب التصديرية (محتوى مائي منخفض جداً).\n";
        adviceEn += "   ✅ **OPTIMAL:** Gas meets export pipeline specifications (very low water content).\n";
    }

    // --- 2. Thermal & Foaming Analysis (الاستقرار الحراري والرغوة) ---
    adviceAr += "\n🌡️ **2. الاستقرار الحراري لبرج الامتصاص:**\n";
    adviceEn += "\n🌡️ **2. Absorber Thermal Stability:**\n";
    if (deltaT < 4) {
        adviceAr += "   ⚠️ **خطر الرغوة (Foaming):** حرارة الغلايكول قريبة جداً من الغاز (الفرق "+ deltaT.toFixed(1) +"°C فقط). ستتكثف الهيدروكربونات الثقيلة مسببة رغوة شديدة وفقدان للغلايكول. **الحل:** ارفع حرارة TEG Feed.\n";
        adviceEn += "   ⚠️ **FOAMING RISK:** TEG temp is too close to Gas temp (Delta T = "+ deltaT.toFixed(1) +"°C). Heavy hydrocarbons will condense causing severe foaming. **Action:** Raise TEG Feed Temp.\n";
        errorCount++; statusIcon = (statusIcon === "🟢") ? "🟡" : statusIcon;
    } else if (deltaT > 15) {
        adviceAr += "   ⚠️ **هدر طاقة:** فرق الحرارة مرتفع جداً ("+ deltaT.toFixed(1) +"°C). هذا يقلل من قدرة الغلايكول على الامتصاص ويزيد تبخره مع الغاز.\n";
        adviceEn += "   ⚠️ **ENERGY WASTE:** Temp delta is too high ("+ deltaT.toFixed(1) +"°C). This reduces absorption capacity and increases TEG vaporization losses.\n";
        errorCount++; statusIcon = (statusIcon === "🟢") ? "🟡" : statusIcon;
    } else {
        adviceAr += "   ✅ **مثالي:** فرق الحرارة ("+ deltaT.toFixed(1) +"°C) يمنع التكثف ويضمن أفضل قوة دافعة (Driving Force) للامتصاص.\n";
        adviceEn += "   ✅ **OPTIMAL:** Temp delta ("+ deltaT.toFixed(1) +"°C) prevents condensation and ensures the best mass transfer driving force.\n";
    }

    // --- 3. Regeneration Integrity (سلامة التجديد) ---
    adviceAr += "\n🔥 **3. سلامة برج التجديد والمغلّي:**\n";
    adviceEn += "\n🔥 **3. Regeneration Integrity:**\n";
    if (rebT > 206) {
        adviceAr += "   🚨 **حالة حرجة:** حرارة المغلّي ("+ rebT.toFixed(1) +"°C) تجاوزت الحد المسموح. الغلايكول يحترق الآن (Thermal Degradation) وتتكون ترسبات كربونية ستدمر الأنابيب. **الحل:** خفض حرارة المغلّي فوراً!\n";
        adviceEn += "   🚨 **CRITICAL:** Reboiler temp ("+ rebT.toFixed(1) +"°C) exceeds limits. TEG is undergoing thermal degradation (cracking). Carbon deposits will foul the system. **Action:** Reduce Reboiler Temp immediately!\n";
        errorCount++; statusIcon = "🔴";
    } else if (rebT < 195) {
        adviceAr += "   ⚠️ **تجديد ضعيف:** حرارة المغلّي منخفضة ("+ rebT.toFixed(1) +"°C). لن يتبخر الماء بالكامل، وسيعود الغلايكول للبرج رطباً (Low Purity).\n";
        adviceEn += "   ⚠️ **POOR STRIPPING:** Reboiler temp is low ("+ rebT.toFixed(1) +"°C). Water won't vaporize fully, leading to low Lean TEG purity.\n";
        errorCount++; statusIcon = (statusIcon === "🟢") ? "🟡" : statusIcon;
    } else {
        adviceAr += "   ✅ **نقاء عالي:** درجة حرارة المغلّي ("+ rebT.toFixed(1) +"°C) ممتازة لفصل الماء دون إتلاف جزيئات الغلايكول.\n";
        adviceEn += "   ✅ **HIGH PURITY:** Reboiler temp ("+ rebT.toFixed(1) +"°C) is excellent for maximum water stripping without degrading TEG.\n";
    }

    // --- 4. Economic Analysis (التحليل الاقتصادي) ---
    adviceAr += "\n💰 **4. التحليل الاقتصادي والفاقد (Losses):**\n";
    adviceEn += "\n💰 **4. Economic & Loss Analysis:**\n";
    if (makeupPercentage > 1.5) {
        adviceAr += "   ⚠️ **خسارة مالية:** معدل تعويض الغلايكول يمثل ("+ makeupPercentage.toFixed(2) +"%) من التدوير، وهو رقم مرتفع. يوجد ضياع ميكانيكي (Carryover) أو تبخر عالي. راجع كفاءة صائد القطرات (Mist Extractor).\n";
        adviceEn += "   ⚠️ **FINANCIAL LOSS:** TEG makeup rate is ("+ makeupPercentage.toFixed(2) +"%) of circulation, which is high. Suspected mechanical carryover or high vaporization. Check Mist Extractor efficiency.\n";
    } else {
        adviceAr += "   ✅ **اقتصاد مستدام:** معدل الفاقد ("+ makeupPercentage.toFixed(2) +"%) ضمن الحدود الصناعية المقبولة \n";
        adviceEn += "   ✅ **SUSTAINABLE:** TEG loss rate ("+ makeupPercentage.toFixed(2) +"%) is well within acceptable industrial limits.\n";
    }

    // --- Final Conclusion ---
    adviceAr += "\n━━━━━━━━━━━━━━━\n";
    adviceEn += "\n━━━━━━━━━━━━━━━\n";
    if (statusIcon === "🟢") {
        adviceAr += "🌟 **الخلاصة:** المحطة تعمل بكفاءة هندسية واقتصادية مثالية. لا توجد إجراءات مطلوبة.";
        adviceEn += "🌟 **CONCLUSION:** Plant is operating at peak engineering and economic efficiency. No action required.";
    } else if (statusIcon === "🟡") {
        adviceAr += "🔔 **الخلاصة:** المحطة تعمل، لكنها تحتاج لضبط بعض العوامل (Tuning) لتحسين الأداء ومنع تفاقم المشاكل.";
        adviceEn += "🔔 **CONCLUSION:** Plant is running, but requires parameter tuning to optimize performance and prevent escalating issues.";
    } else {
        adviceAr += "🛑 **الخلاصة:** المحطة في وضع خطر (Shutdown Risk). يرجى التدخل الهندسي الفوري بناءً على التوصيات أعلاه!";
        adviceEn += "🛑 **CONCLUSION:** Plant is in a high-risk state (Shutdown Risk). Immediate engineering intervention required based on the actions above!";
    }

    return lang === 'ar' ? adviceAr : adviceEn;
}