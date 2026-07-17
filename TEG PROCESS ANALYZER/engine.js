/**
 * TEG Simulator Engine - Advanced Production Grade v15.5
 * Features: Strict Mass Conservation, Targeted VLE Flash, Accurate Enthalpy & Latent Heat.
 */

const MW_DB = {
    "H2S": 34.08, "N2": 28.01, "CO2": 44.01, "CH4": 16.04, "C2H6": 30.07, "C3H8": 44.10, 
    "i-C4H10": 58.12, "n-C4H10": 58.12, "i-C5H12": 72.15, "n-C5H12": 72.15, "C6H14": 86.18, 
    "Benzene": 78.11, "n-Heptane": 100.2, "Toluene": 92.14, "H2O": 18.015, "TEG": 150.17,
    "C8H18": 114.23, "Ethylbenzene": 106.17, "m-Xylene": 106.16, "p-Xylene": 106.16, 
    "o-Xylene": 106.16, "C8H10": 106.16, "C10H22": 142.28
};
const ALL_COMPONENTS = Object.keys(MW_DB);

// تهيئة قاعدة البيانات الافتراضية في حال عدم تحميل admin.js
if (typeof FullProjectDB === 'undefined') {
    window.FullProjectDB = { cpConstants: [] };
}

function initEngineDB() { 
    const saved = localStorage.getItem('teg_cp_db_v15'); 
    if(saved && typeof FullProjectDB !== 'undefined') {
        FullProjectDB.cpConstants = JSON.parse(saved); 
    }
}
initEngineDB();

// ==========================================
// 1. Core Thermo Engine
// ==========================================
class ThermoEngine {
    static getKValue(component, T_C, P_kPa) {
        const relativeVolatility = {
            "C6H14": 0.015, "Benzene": 0.01, "n-Heptane": 0.005, "Toluene": 0.002,
            "C8H18": 0.001, "C8H10": 0.001, "C10H22": 0.0001, "Ethylbenzene": 0.001,
            "m-Xylene": 0.001, "p-Xylene": 0.001, "o-Xylene": 0.001
        };
        let K_base = relativeVolatility[component] || 1.0;
        return K_base * (6204 / P_kPa) * Math.exp((T_C - 30) / 30.0);
    }

    static calculateStreamEnthalpy(stream) {
        let H_total = 0; 
        const T_K = stream.T + 273.15; 
        const T_ref = 298.15; 
        
        if (typeof FullProjectDB === 'undefined' || !FullProjectDB.cpConstants || FullProjectDB.cpConstants.length === 0) return 0;

        ALL_COMPONENTS.forEach(c => {
            let flow_kmol_h = stream.getMolarFlowOf(c);
            if (flow_kmol_h > 0) {
                if (c === "H2O") {
                    if (stream.isGasPhase) {
                        let cpVap = FullProjectDB.cpConstants.find(x => x.comp === "H2O_Vapor") || {a: 33.46, b: 0, c: 0};
                        let H_gas = cpVap.a * (T_K - T_ref) + (cpVap.b / 2) * (Math.pow(T_K, 2) - Math.pow(T_ref, 2)) + (cpVap.c / 3) * (Math.pow(T_K, 3) - Math.pow(T_ref, 3));
                        let H_latent = 44000.0; // الحرارة الكامنة للتبخر بوحدة kJ/kmol
                        H_total += flow_kmol_h * (H_gas + H_latent); 
                    } else {
                        let cpLiq = FullProjectDB.cpConstants.find(x => x.comp === "H2O") || {a: 75.40, b: 0, c: 0};
                        let H_liq = cpLiq.a * (T_K - T_ref);
                        H_total += flow_kmol_h * H_liq;
                    }
                } else {
                    let cpData = FullProjectDB.cpConstants.find(x => x.comp === c) || {a: 30, b: 0, c: 0};
                    let H_molar = cpData.a * (T_K - T_ref) + (cpData.b / 2) * (Math.pow(T_K, 2) - Math.pow(T_ref, 2)) + (cpData.c / 3) * (Math.pow(T_K, 3) - Math.pow(T_ref, 3));
                    H_total += flow_kmol_h * H_molar;
                }
            }
        });
        return H_total / 3600; // الإخراج بالكيلوواط (kW)
    }
}

// ==========================================
// 2. Strict Mass Conservation Stream Class
// ==========================================
class Stream {
    // الاعتماد على التدفقات الجزئية لحفظ الكتلة بنسبة 100% بدلاً من التدفق الكلي
    constructor(name, temp, componentFlows, isGasPhase = true) {
        this.name = name; 
        this.T = temp; 
        this.isGasPhase = isGasPhase;
        
        this.compFlows = {};
        this.flow = 0;
        
        ALL_COMPONENTS.forEach(c => {
            let val = componentFlows[c] || 0;
            if(val < 0) val = 0;
            this.compFlows[c] = val;
            this.flow += val; // التدفق الكلي هو حاصل جمع دقيق للمكونات
        });

        this.comp = {};
        ALL_COMPONENTS.forEach(c => {
            this.comp[c] = this.flow > 0 ? (this.compFlows[c] / this.flow) : 0;
        });
    }
    
    getMolarFlowOf(component) { return this.compFlows[component] || 0; }
    getMassFlowOf(component) { return this.getMolarFlowOf(component) * MW_DB[component]; }
    getTotalMassFlow() { 
        return ALL_COMPONENTS.reduce((sum, c) => sum + this.getMassFlowOf(c), 0); 
    }
    getEnthalpy() { return ThermoEngine.calculateStreamEnthalpy(this); }
}

// ==========================================
// 3. Unit Operations Modules
// ==========================================
class UnitOperation {
    constructor(name) {
        this.name = name;
        this.inlets = [];
        this.outlets = [];
        this.duty = 0;
    }
    addInlet(stream) { this.inlets.push(stream); }
    addOutlet(stream) { this.outlets.push(stream); }
    calculateEnergyBalance() {
        let H_in = this.inlets.reduce((sum, s) => sum + s.getEnthalpy(), 0);
        let H_out = this.outlets.reduce((sum, s) => sum + s.getEnthalpy(), 0);
        this.duty = H_out - H_in; 
    }
    generateBalanceReport() {
        let mI = 0, mO = 0, eI = 0, eO = 0;
        this.inlets.forEach(s => { mI += s.getTotalMassFlow(); eI += s.getEnthalpy(); });
        this.outlets.forEach(s => { mO += s.getTotalMassFlow(); eO += s.getEnthalpy(); });
        return {
            name: this.name,
            inStreams: this.inlets.map(s => s.name),
            outStreams: this.outlets.map(s => s.name),
            massIn: mI, massOut: mO, massError: Math.abs(mI - mO),
            energyIn: eI, energyOut: eO, duty: this.duty
        };
    }
}

class Mixer extends UnitOperation {
    solve(outName, outTemp, outPhase = true) {
        let compFlows = {};
        ALL_COMPONENTS.forEach(c => compFlows[c] = 0);

        this.inlets.forEach(stream => {
            ALL_COMPONENTS.forEach(c => compFlows[c] += stream.getMolarFlowOf(c));
        });
        
        let outStream = new Stream(outName, outTemp, compFlows, outPhase);
        this.addOutlet(outStream);
        this.calculateEnergyBalance();
        return outStream;
    }
}

class DynamicSplitter extends UnitOperation {
    solve(topName, botName, topTemp, botTemp, P_kPa) {
        let feed = this.inlets[0];
        let topCompFlows = {}, botCompFlows = {};

        ALL_COMPONENTS.forEach(c => {
            let totalMoles = feed.getMolarFlowOf(c);
            let vaporFrac = 1.0; 

            if (c === "H2O") {
                vaporFrac = 0.005; // 99.5% من الماء الحر ينزل كسائل في الفاصل المبدئي
            } else if (c === "TEG") {
                vaporFrac = 0.0;
            } else if (["C6H14", "Benzene", "n-Heptane", "Toluene", "C8H18", "C8H10", "C10H22", "Ethylbenzene", "m-Xylene", "p-Xylene", "o-Xylene"].includes(c)) {
                let K = ThermoEngine.getKValue(c, feed.T, P_kPa);
                vaporFrac = K / (0.1 + K); 
                if (vaporFrac > 1) vaporFrac = 1;
            } else {
                // الغازات الخفيفة تمر بنسبة 100% ولا تتكثف
                vaporFrac = 1.0; 
            }

            topCompFlows[c] = totalMoles * vaporFrac;
            botCompFlows[c] = totalMoles - topCompFlows[c];
        });

        let topStream = new Stream(topName, topTemp, topCompFlows, true);
        let botStream = new Stream(botName, botTemp, botCompFlows, false); 
        
        this.addOutlet(topStream);
        this.addOutlet(botStream);
        this.calculateEnergyBalance();
        
        return { top: topStream, bottom: botStream };
    }
}

// ==========================================
// 4. Plant Simulator Orchestrator
// ==========================================
class PlantSimulator {
    constructor(params) {
        this.params = params;
        this.streams = {};
        this.balances = [];
    }

    registerStream(stream) {
        this.streams[stream.name] = stream;
    }

    run() {
        const { feedFlow, waterSatFlow, feedTemp, targetH2O, tegRequiredFlow, makeupTegFlow } = this.params;
        const opPressure = 6204; // kPa
        
        // جلب تركيب الغاز وتهيئته بنظام التدفقات الجزئية
        let baseComp = (typeof FullProjectDB !== 'undefined' && FullProjectDB.compositions) ? FullProjectDB.compositions.gasInlet : {};
        let gasInletFlows = {};
        ALL_COMPONENTS.forEach(c => gasInletFlows[c] = (baseComp[c] || 0) * feedFlow);

        // 1. Mixer (Saturate)
        let gasInlet = new Stream("Gas Inlet", feedTemp, gasInletFlows, true);
        let waterSatFlows = {}; ALL_COMPONENTS.forEach(c => waterSatFlows[c] = 0);
        waterSatFlows["H2O"] = waterSatFlow;
        let waterMakeup = new Stream("Water to Saturate", feedTemp, waterSatFlows, false);
        
        let saturator = new Mixer("1. Saturator Mixer");
        saturator.addInlet(gasInlet);
        saturator.addInlet(waterMakeup);
        let satGas = saturator.solve("Gas+H2O", feedTemp - 0.4, true);
        
        this.registerStream(gasInlet);
        this.registerStream(waterMakeup);
        this.registerStream(satGas);
        this.balances.push(saturator.generateBalanceReport());

        // 2. FWKO Separator (Dynamic)
        let fwko = new DynamicSplitter("2. FWKO Separator");
        fwko.addInlet(satGas);
        let fwkoOuts = fwko.solve("Gas To Contactor", "FWKO Liquid", feedTemp, feedTemp, opPressure);
        
        this.registerStream(fwkoOuts.top);
        this.registerStream(fwkoOuts.bottom);
        this.balances.push(fwko.generateBalanceReport());

        // 3. Absorber T-100
        let absorber = new UnitOperation("3. Absorber T-100");
        let gasToContactor = fwkoOuts.top;
        
        let tegFeedFlows = {}; ALL_COMPONENTS.forEach(c => tegFeedFlows[c] = 0);
        tegFeedFlows["TEG"] = tegRequiredFlow * 0.9788;
        tegFeedFlows["H2O"] = tegRequiredFlow * 0.0181;
        let tegFeed = new Stream("TEG Feed", feedTemp + 5, tegFeedFlows, false);
        
        absorber.addInlet(gasToContactor);
        absorber.addInlet(tegFeed);

        let waterInGas = gasToContactor.getMolarFlowOf("H2O");
        let allowedWaterOut = gasToContactor.flow * targetH2O;
        let waterRemoved = Math.max(0, waterInGas - allowedWaterOut);

        let dryGasFlows = {};
        let richTegFlows = {};
        
        ALL_COMPONENTS.forEach(c => {
            if (c === "H2O") {
                dryGasFlows[c] = waterInGas - waterRemoved;
                richTegFlows[c] = tegFeed.getMolarFlowOf("H2O") + waterRemoved;
            } else if (c === "TEG") {
                dryGasFlows[c] = 0;
                richTegFlows[c] = tegFeed.getMolarFlowOf("TEG");
            } else {
                let K = ThermoEngine.getKValue(c, feedTemp + 5, opPressure);
                let absorbedFrac = 0.005 / Math.pow(K, 1.2); 
                if (absorbedFrac > 0.98) absorbedFrac = 0.98;

                let absorbedMoles = gasToContactor.getMolarFlowOf(c) * absorbedFrac;
                richTegFlows[c] = absorbedMoles;
                dryGasFlows[c] = gasToContactor.getMolarFlowOf(c) - absorbedMoles;
            }
        });

        let dryGas = new Stream("Dry Gas", feedTemp + 5, dryGasFlows, true);
        let richTeg = new Stream("Rich TEG", feedTemp + 5, richTegFlows, false);

        absorber.addOutlet(dryGas);
        absorber.addOutlet(richTeg);
        absorber.calculateEnergyBalance();

        this.registerStream(tegFeed);
        this.registerStream(dryGas);
        this.registerStream(richTeg);
        this.balances.push(absorber.generateBalanceReport());

      // 4. Heat Exchanger
        let hex = new UnitOperation("4. L/R Heat Exchanger");
        let richTegLP = new Stream("Rich TEG (LP)", feedTemp + 5, richTegFlows, false);
        
        let regenBttmsFlow = tegRequiredFlow - makeupTegFlow; 
        let regenBttmsBaseFlows = {}; ALL_COMPONENTS.forEach(c => regenBttmsBaseFlows[c] = 0);
        regenBttmsBaseFlows["TEG"] = regenBttmsFlow * 0.99;
        regenBttmsBaseFlows["H2O"] = regenBttmsFlow * 0.01;
        // 🔴 تغيير الاسم هنا إلى (Assumed) لمنع تضارب الأسماء في تقرير الإكسل
        let regenBttms = new Stream("Regen Bttms (Assumed)", 204.4, regenBttmsBaseFlows, false);
        
        hex.addInlet(richTegLP);
        hex.addInlet(regenBttms);

        let richTegHot = new Stream("Rich TEG (Hot)", 104.4, richTegFlows, false);
        let leanTegCold = new Stream("Lean TEG (Cold)", 134.7, regenBttmsBaseFlows, false);
        
        hex.addOutlet(richTegHot);
        hex.addOutlet(leanTegCold);
        hex.calculateEnergyBalance();

        this.registerStream(richTegLP);
        this.registerStream(regenBttms);
        this.registerStream(richTegHot);
        this.registerStream(leanTegCold);
        this.balances.push(hex.generateBalanceReport());

        // 5. TEG Regenerator
        let regenerator = new UnitOperation("5. TEG Regenerator");
        regenerator.addInlet(richTegHot);
        
        let finalRegenBttmsFlows = {};
        let sourGasFlows = {};
        
        ALL_COMPONENTS.forEach(c => {
            let totalIn = richTegHot.getMolarFlowOf(c);
            if (c === "TEG") {
                finalRegenBttmsFlows[c] = totalIn * 0.99999;
                sourGasFlows[c] = totalIn * 0.00001; 
            } else if (c === "H2O") {
                finalRegenBttmsFlows[c] = totalIn * 0.05; 
                sourGasFlows[c] = totalIn * 0.95;       
            } else {
                finalRegenBttmsFlows[c] = 0;
                sourGasFlows[c] = totalIn;
            }
        });
        
        // المجرى الخارج من البرج يحمل الاسم الرسمي المعتمد في التقرير
        let finalRegenBttms = new Stream("Regen Bttms", 204.4, finalRegenBttmsFlows, false);
        let sourGas = new Stream("Sour Gas", 101.7, sourGasFlows, true);
        
        regenerator.addOutlet(finalRegenBttms);
        regenerator.addOutlet(sourGas);
        regenerator.calculateEnergyBalance();
        
        // 🔴 تسجيل المجرى الدقيق لكي تظهر أرقامه في تقرير الـ CSV بشكل صحيح
        this.registerStream(finalRegenBttms);
        this.registerStream(sourGas);
        this.balances.push(regenerator.generateBalanceReport());

        // 6. MIX-100 Makeup
        let makeupMixer = new Mixer("6. MIX-100 Makeup");
        let makeupTegFlows = {}; ALL_COMPONENTS.forEach(c => makeupTegFlows[c] = 0);
        makeupTegFlows["TEG"] = makeupTegFlow * 0.99;
        makeupTegFlows["H2O"] = makeupTegFlow * 0.01;
        
        let makeupTeg = new Stream("Makeup TEG", 15.56, makeupTegFlows, false);
        makeupMixer.addInlet(leanTegCold);
        makeupMixer.addInlet(makeupTeg);
        
        let tegToPump = makeupMixer.solve("TEG to Pump", 102.8, false);
        
        this.registerStream(makeupTeg);
        this.registerStream(tegToPump);
        this.balances.push(makeupMixer.generateBalanceReport());

        return { streams: this.streams, balances: this.balances };
    }
}

// ==========================================
// 5. UI Controller & Export Logic (Global Scope)
// ==========================================
window.runPlantSimulation = function() {
    const params = {
        feedFlow: parseFloat(document.getElementById('feed-flow').value),
        waterSatFlow: parseFloat(document.getElementById('water-sat').value),
        feedTemp: parseFloat(document.getElementById('feed-temp').value),
        targetH2O: parseFloat(document.getElementById('target-h2o').value),
        tegRequiredFlow: parseFloat(document.getElementById('teg-flow').value) || 394.9,
        makeupTegFlow: parseFloat(document.getElementById('makeup-teg').value)
    };

    const sim = new PlantSimulator(params);
    const results = sim.run();

    window.lastSimData = results;

    updatePFDLabels(results.streams); 
    renderDetailedEquipmentReport(results.streams, results.balances);
    setTimeout(drawPipelines, 100); 
    
    if (typeof window.renderOpexDashboard === "function") {
        window.renderOpexDashboard(results.streams, results.balances);
    }
};

function updatePFDLabels(streams) {
    if(streams["Gas Inlet"]) document.getElementById('lbl-feed').innerText = `Gas Inlet\n${streams["Gas Inlet"].flow.toFixed(1)} kmol/h\n${streams["Gas Inlet"].T.toFixed(1)} °C`;
    if(streams["Gas+H2O"]) document.getElementById('lbl-sat').innerText = `Gas+H2O\n${streams["Gas+H2O"].flow.toFixed(1)} kmol/h\n${streams["Gas+H2O"].T.toFixed(1)} °C`;
    if(streams["Dry Gas"]) document.getElementById('lbl-drygas').innerText = `Dry Gas\n${streams["Dry Gas"].flow.toFixed(1)} kmol/h\n${streams["Dry Gas"].T.toFixed(1)} °C`;
    if(streams["TEG Feed"]) document.getElementById('lbl-tegfeed').innerText = `TEG Feed\n${streams["TEG Feed"].flow.toFixed(2)} kmol/h`;
    if(streams["Rich TEG"]) document.getElementById('lbl-richteg').innerText = `Rich TEG\n${streams["Rich TEG"].flow.toFixed(2)} kmol/h`;
    if(streams["Regen Bttms"]) document.getElementById('lbl-leanteg').innerText = `Regen Bttms\n${streams["Regen Bttms"].flow.toFixed(2)} kmol/h\n${streams["Regen Bttms"].T.toFixed(1)} °C`;
    if(streams["Makeup TEG"]) document.getElementById('lbl-makeup').innerText = `Makeup TEG\n${streams["Makeup TEG"].flow.toFixed(2)} kmol/h`;
}

function renderDetailedEquipmentReport(streams, eqBalances) {
    const container = document.getElementById('results-container');
    const tableDiv = document.getElementById('stream-table-div');
    if(!container) return;
    container.style.display = 'block';
    
    // دالة إخفاء الأصفار واستبدالها بشرطة خفيفة
    const formatFlow = (val) => val > 0.0001 ? val.toFixed(4) : '<span style="color:#475569;">-</span>';

    let html = `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 30px;">
                    <h2 style="color: var(--primary); margin: 0;">📄 Comprehensive Plant Report</h2>
                    <button class="btn-run" style="width: auto; padding: 10px 20px; font-size: 0.9rem; margin: 0;" onclick="window.downloadExcel(event)">
                        📊 Download Excel
                    </button>
                </div>`;

    eqBalances.forEach(eq => {
        html += `<div class="card report-card">
                    <h3>⚙️ ${eq.name}</h3>`;

        html += `<h4 style="margin-top: 15px; color: var(--text);">📦 Material Balance (kmol/h)</h4>
                 <div class="table-responsive">
                 <table class="eq-table">
                    <thead><tr><th style="text-align: left;">Component</th>`;
        
        eq.inStreams.forEach(s => html += `<th>IN: ${s}</th>`);
        eq.outStreams.forEach(s => html += `<th>OUT: ${s}</th>`);
        
        html += `</tr></thead><tbody>`;
        html += `<tr class="total-row"><td style="text-align: left;"><strong>Total Molar Flow</strong></td>`;
        eq.inStreams.forEach(s => html += `<td><strong>${streams[s].flow.toFixed(3)}</strong></td>`);
        eq.outStreams.forEach(s => html += `<td><strong>${streams[s].flow.toFixed(3)}</strong></td>`);
        html += `</tr>`;

        ALL_COMPONENTS.forEach(c => {
            let hasFlow = false;
            eq.inStreams.concat(eq.outStreams).forEach(s => {
                if (streams[s].getMolarFlowOf(c) > 0.0001) hasFlow = true;
            });

            if (hasFlow) {
                html += `<tr><td style="text-align: left;">${c}</td>`;
                eq.inStreams.forEach(s => html += `<td>${formatFlow(streams[s].getMolarFlowOf(c))}</td>`);
                eq.outStreams.forEach(s => html += `<td>${formatFlow(streams[s].getMolarFlowOf(c))}</td>`);
                html += `</tr>`;
            }
        });
        html += `</tbody></table></div>`;

        let dutyColor = eq.duty > 0 ? '#ef4444' : '#3b82f6'; 
        let dutyText = eq.duty > 0 ? `+${eq.duty.toFixed(2)} kW (Heating)` : `${eq.duty.toFixed(2)} kW (Cooling)`;
        if(Math.abs(eq.duty) < 1) { dutyText = `~ 0.00 kW (Adiabatic)`; dutyColor = 'var(--secondary)'; }

        html += `<h4 style="margin-top: 25px; color: #f59e0b;">🔥 Energy Balance</h4>
                 <div class="table-responsive">
                 <table class="eq-table energy-table">
                    <thead><tr><th style="text-align: left;">Stream Name</th><th>Temperature (°C)</th><th>Enthalpy (kW)</th></tr></thead>
                    <tbody>`;
        
        html += `<tr><td colspan="3" style="background:rgba(255,255,255,0.02); text-align: left; color: var(--text-dim);">Input Streams</td></tr>`;
        eq.inStreams.forEach(s => { html += `<tr><td style="text-align: left;">${s}</td><td>${streams[s].T.toFixed(2)}</td><td>${streams[s].getEnthalpy().toFixed(2)}</td></tr>`; });

        html += `<tr><td colspan="3" style="background:rgba(255,255,255,0.02); text-align: left; color: var(--text-dim);">Output Streams</td></tr>`;
        eq.outStreams.forEach(s => { html += `<tr><td style="text-align: left;">${s}</td><td>${streams[s].T.toFixed(2)}</td><td>${streams[s].getEnthalpy().toFixed(2)}</td></tr>`; });

        html += `<tr class="duty-row"><td colspan="2" style="text-align: left;"><strong>Equipment Heat Duty (ΔH)</strong></td><td style="color: ${dutyColor};"><strong>${dutyText}</strong></td></tr>`;
        html += `</tbody></table></div></div>`;
    });

    tableDiv.innerHTML = html;
}

window.downloadExcel = function(event) {
    if (!window.lastSimData) {
        alert("Please run the simulation first.");
        return;
    }

    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "⏳ Generating Report...";
    btn.disabled = true;

    try {
        const sim = window.lastSimData;
        let ws_data = [];

        ws_data.push(["TEG PROCESS ANALYZER PRO - COMPREHENSIVE SIMULATION REPORT"]);
        ws_data.push([]); 
        ws_data.push(["Generated on:", new Date().toLocaleString()]);
        ws_data.push([]); 

        ws_data.push(["📊 Summary for Excel Charting"]);
        ws_data.push(["Stream Name", "Molar Flow (kmol/h)", "Temperature (°C)"]);
        
        const chartStreams = ["Gas Inlet", "Gas+H2O", "Dry Gas", "TEG Feed", "Rich TEG", "Regen Bttms", "Makeup TEG"];
        chartStreams.forEach(name => {
            if (sim.streams[name]) {
                ws_data.push([
                    name, 
                    Number(sim.streams[name].flow.toFixed(4)), 
                    Number(sim.streams[name].T.toFixed(2))
                ]);
            }
        });
        ws_data.push([]); 

        sim.balances.forEach(eq => {
            ws_data.push([`⚙️ Equipment: ${eq.name}`]);
            ws_data.push(["📦 Material Balance (kmol/h)"]);
            
            let headers = ["Component"];
            eq.inStreams.forEach(s => headers.push(`IN: ${s}`));
            eq.outStreams.forEach(s => headers.push(`OUT: ${s}`));
            ws_data.push(headers);

            let totals = ["Total Molar Flow"];
            eq.inStreams.forEach(s => totals.push(Number(sim.streams[s].flow.toFixed(4))));
            eq.outStreams.forEach(s => totals.push(Number(sim.streams[s].flow.toFixed(4))));
            ws_data.push(totals);

            Object.keys(MW_DB).forEach(c => {
                let hasFlow = false;
                eq.inStreams.concat(eq.outStreams).forEach(s => {
                    if (sim.streams[s].getMolarFlowOf(c) > 0.0001) hasFlow = true;
                });

                if (hasFlow) {
                    let row = [c];
                    eq.inStreams.forEach(s => row.push(Number(sim.streams[s].getMolarFlowOf(c).toFixed(4))));
                    eq.outStreams.forEach(s => row.push(Number(sim.streams[s].getMolarFlowOf(c).toFixed(4))));
                    ws_data.push(row);
                }
            });

            ws_data.push([]); 
            ws_data.push(["🔥 Energy Balance (Thermal Analysis)"]);
            ws_data.push(["Stream Name", "Temperature (°C)", "Enthalpy (kW)"]);
            
            eq.inStreams.forEach(s => {
                ws_data.push([`[IN] ${s}`, Number(sim.streams[s].T.toFixed(2)), Number(sim.streams[s].getEnthalpy().toFixed(2))]);
            });
            eq.outStreams.forEach(s => {
                ws_data.push([`[OUT] ${s}`, Number(sim.streams[s].T.toFixed(2)), Number(sim.streams[s].getEnthalpy().toFixed(2))]);
            });

            let dutyVal = Number(eq.duty.toFixed(2));
            ws_data.push(["Equipment Heat Duty (ΔH)", "", dutyVal]);
            ws_data.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TEG Simulation Report");
        XLSX.writeFile(wb, "TEG_Plant_Professional_Report.xlsx");

    } catch (error) {
        console.error("Excel Styling Error:", error);
        alert("An error occurred. Make sure your browser allows downloads.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// ==========================================
// PFD Drawing Logic (Advanced SVG)
// ==========================================
window.drawPipelines = function() {
    const svgLayer = document.getElementById('pfd-svg-layer'); 
    if(!svgLayer) return; 
    
    while (svgLayer.firstChild) {
        svgLayer.removeChild(svgLayer.firstChild);
    }
    
    const c = document.getElementById('pfd-canvas'); 
    if (!c) return;
    const cr = c.getBoundingClientRect();
    
    function getC(className) { 
        const eq = document.querySelector('.' + className); 
        if(!eq) return {x:0, y:0}; 
        const r = eq.getBoundingClientRect(); 
        return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top }; 
    }
    
    const sat = getC('mixer-node');
    const fwko = getC('separator-node');
    const abs = getC('absorber-node');
    const vlv = getC('valve-node');
    const hex = getC('hex-node');
    const reg = getC('regenerator-node');
    const mix = getC('mixteg-node');
    const pump = getC('pump-node');

    function drawSVGPath(points, isGlycol = false, isAnimated = true) {
        if(points.length < 2) return;
        
        let pathString = `M ${points[0].x} ${points[0].y}`; 
        for(let i = 1; i < points.length; i++) {
            pathString += ` L ${points[i].x} ${points[i].y}`; 
        }

        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", pathString);
        
        let classes = "svg-pipe";
        if(isGlycol) classes += " glycol";
        if(isAnimated) classes += " flow-anim";
        
        pathElement.setAttribute("class", classes);
        svgLayer.appendChild(pathElement);

        const lastPt = points[points.length - 1];
        const prevPt = points[points.length - 2];
        drawArrowHead(prevPt, lastPt, isGlycol);
    }

    function drawArrowHead(p1, p2, isGlycol) {
        const arrowSize = 8;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        
        const x1 = p2.x - arrowSize * Math.cos(angle - Math.PI / 6);
        const y1 = p2.y - arrowSize * Math.sin(angle - Math.PI / 6);
        const x2 = p2.x - arrowSize * Math.cos(angle + Math.PI / 6);
        const y2 = p2.y - arrowSize * Math.sin(angle + Math.PI / 6);

        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", `${p2.x},${p2.y} ${x1},${y1} ${x2},${y2}`);
        polygon.setAttribute("fill", isGlycol ? "#10b981" : "#3b82f6");
        svgLayer.appendChild(polygon);
    }

    drawSVGPath([{x: 20, y: sat.y}, {x: sat.x - 25, y: sat.y}], false);
    drawSVGPath([{x: sat.x + 25, y: sat.y}, {x: fwko.x - 28, y: sat.y}], false);
    drawSVGPath([{x: fwko.x, y: fwko.y - 45}, {x: fwko.x, y: abs.y + 35}, {x: abs.x - 30, y: abs.y + 35}], false);
    drawSVGPath([{x: fwko.x, y: fwko.y + 45}, {x: fwko.x, y: fwko.y + 70}, {x: fwko.x + 30, y: fwko.y + 70}], false, false);
    drawSVGPath([{x: abs.x, y: abs.y - 75}, {x: abs.x, y: abs.y - 110}, {x: abs.x + 60, y: abs.y - 110}], false);
    drawSVGPath([{x: abs.x, y: abs.y + 75}, {x: abs.x, y: vlv.y}, {x: vlv.x - 20, y: vlv.y}], true);
    drawSVGPath([{x: vlv.x + 20, y: vlv.y}, {x: hex.x - 28, y: hex.y}], true);
    drawSVGPath([{x: hex.x + 28, y: hex.y}, {x: reg.x - 40, y: hex.y}, {x: reg.x - 40, y: reg.y}, {x: reg.x - 28, y: reg.y}], true);
    drawSVGPath([{x: reg.x, y: reg.y + 60}, {x: reg.x, y: reg.y + 90}, {x: hex.x, y: reg.y + 90}, {x: hex.x, y: hex.y + 28}], true);
    drawSVGPath([{x: reg.x, y: reg.y - 60}, {x: reg.x, y: reg.y - 80}, {x: reg.x + 50, y: reg.y - 80}], false);
    drawSVGPath([{x: hex.x, y: hex.y - 28}, {x: hex.x, y: mix.y}], true);
    drawSVGPath([{x: mix.x + 120, y: mix.y}, {x: mix.x + 18, y: mix.y}], true);
    drawSVGPath([{x: mix.x - 18, y: mix.y}, {x: pump.x + 25, y: mix.y}], true);
    drawSVGPath([{x: pump.x - 25, y: pump.y}, {x: abs.x - 60, y: pump.y}, {x: abs.x - 60, y: abs.y - 40}, {x: abs.x - 30, y: abs.y - 40}], true);
};

// ==========================================
// OPEX & Environmental Calculator
// ==========================================
window.renderOpexDashboard = function(streams, balances) {
    const opexDash = document.getElementById('opex-dashboard');
    if(!opexDash) return;
    opexDash.style.display = 'block';
    
    const regen = balances.find(b => b.name === "5. TEG Regenerator");
    let reboilerDuty_kW = regen ? Math.abs(regen.duty) : 0;
    let fuelEnergy_kW = reboilerDuty_kW / 0.75;
    
    const FUEL_COST_PER_KWH = 0.015; 
    const TEG_COST_PER_KG = 2.5;     
    const CO2_PER_KWH = 0.185;       
    
    let dailyFuelCost = fuelEnergy_kW * 24 * FUEL_COST_PER_KWH;
    let tegMakeup_kg_h = streams["Makeup TEG"] ? streams["Makeup TEG"].getTotalMassFlow() : 0;
    let dailyTegCost = tegMakeup_kg_h * 24 * TEG_COST_PER_KG;
    
    let dailyOpex = dailyFuelCost + dailyTegCost;
    let dailyCO2_kg = fuelEnergy_kW * 24 * CO2_PER_KWH;
    let annualCO2_tons = (dailyCO2_kg * 365) / 1000;
    
    const valOpex = document.getElementById('val-opex');
    const valCo2 = document.getElementById('val-co2');
    const valFuel = document.getElementById('val-fuel');
    const valTegCost = document.getElementById('val-teg-cost');

    if(valOpex) valOpex.innerText = "$" + dailyOpex.toLocaleString('en-US', {maximumFractionDigits: 0});
    if(valCo2) valCo2.innerText = annualCO2_tons.toLocaleString('en-US', {maximumFractionDigits: 1});
    if(valFuel) valFuel.innerText = "$" + dailyFuelCost.toLocaleString('en-US', {maximumFractionDigits: 0});
    if(valTegCost) valTegCost.innerText = "$" + dailyTegCost.toLocaleString('en-US', {maximumFractionDigits: 0});
};