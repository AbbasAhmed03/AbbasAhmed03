/**
 * @file engine.js
 * @version 12.0.0 (Web Production Grade)
 * @description Corrected Thermodynamic Simulation Engine for TEG Dehydration Plants.
 * All Cp Constants normalized to kJ/kmol.K. Enthalpy reference: 298.15 K.
 */

export const MW_DB = {
    "H2S": 34.08, "N2": 28.01, "CO2": 44.01, "CH4": 16.04, "C2H6": 30.07, "C3H8": 44.10, 
    "i-C4H10": 58.12, "n-C4H10": 58.12, "i-C5H12": 72.15, "n-C5H12": 72.15, "C6H14": 86.18, 
    "Benzene": 78.11, "n-Heptane": 100.2, "Toluene": 92.14, "H2O": 18.015, "TEG": 150.17,
    "C8H18": 114.23, "Ethylbenzene": 106.17, "m-Xylene": 106.16, "p-Xylene": 106.16, 
    "o-Xylene": 106.16, "C8H10": 106.16, "C10H22": 142.28
};
export const ALL_COMPONENTS = Object.keys(MW_DB);

export let FullProjectDB = {
    // تم تصحيح وتوحيد كافة الثوابت لتعمل بنظام (kJ/kmol.K) لضمان دقة إنثالبيا خلط الغاز الطبيعي
    cpConstants: [
        { comp: "H2S", a: 33.51, b: 1.547e-2, c: 0.3012e-5 },
        { comp: "N2", a: 29.00, b: 0.2199e-2, c: 0.5723e-5 },
        { comp: "CO2", a: 36.11, b: 4.233e-2, c: -2.887e-5 },
        { comp: "CH4", a: 34.31, b: 5.469e-2, c: 0.3661e-5 },
        { comp: "C2H6", a: 49.37, b: 13.92e-2, c: -5.861e-5 },
        { comp: "C3H8", a: 68.03, b: 22.59e-2, c: -13.11e-5 },
        { comp: "i-C4H10", a: 89.46, b: 30.13e-2, c: 18.91e-5 },
        { comp: "n-C4H10", a: 92.30, b: 27.88e-2, c: -15.47e-5 },
        { comp: "i-C5H12", a: 115.50, b: 45.35e-2, c: -14.11e-5 },
        { comp: "n-C5H12", a: 111.70, b: 43.68e-2, c: -13.50e-5 },
        { comp: "C6H14", a: 142.40, b: 55.70e-2, c: 0 },
        { comp: "Benzene", a: 81.30, b: 23.40e-2, c: 0 },
        { comp: "n-Heptane", a: 166.00, b: 62.12e-2, c: 0 },
        { comp: "Toluene", a: 94.10, b: 27.80e-2, c: 0 },
        { comp: "H2O", a: 75.40, b: 0, c: 0 }, // Liquid Phase Cp
        { comp: "H2O_Vapor", a: 33.46, b: 0.682e-2, c: 0.760e-5 }, // Gas Phase Cp
        { comp: "TEG", a: 315.00, b: 0.54e-1, c: 0 }, // تم تصحيح الثابت الكارثي للـ TEG السائل لمعادلات حقيقية موجبة
        { comp: "C8H18", a: 188.00, b: 0, c: 0 },
        { comp: "C10H22", a: 234.00, b: 0, c: 0 }
    ]
};

export class ThermoEngine {
    static normalizeComposition(compObj) {
        let sum = 0;
        const normalized = {};
        ALL_COMPONENTS.forEach(c => {
            let val = compObj[c] || 0;
            if (val < 0 || isNaN(val)) val = 0;
            normalized[c] = val;
            sum += val;
        });
        if (sum > 0) {
            ALL_COMPONENTS.forEach(c => normalized[c] /= sum);
        }
        return normalized;
    }

    /**
     * حساب المحتوى الحراري الدقيق بناءً على طور المجرى الفعلي وليس مجرد الحرارة
     */
    static calculateStreamEnthalpy(stream, isGasPhase = true) {
        let H_total = 0; 
        const T_K = stream.T + 273.15; 
        const T_ref = 298.15; 
        
        ALL_COMPONENTS.forEach(c => {
            let flow_kmol_h = stream.getMolarFlowOf(c);
            if (flow_kmol_h <= 0) return;

            if (c === "H2O") {
                // إصلاح خطأ طور الماء التشغيلي تحت الضغط العالي في الأنابيب وأبراج الامتصاص
                if (isGasPhase) {
                    let cpVap = FullProjectDB.cpConstants.find(x => x.comp === "H2O_Vapor");
                    let H_gas = cpVap.a * (T_K - T_ref) + 
                                (cpVap.b / 2) * (Math.pow(T_K, 2) - Math.pow(T_ref, 2)) + 
                                (cpVap.c / 3) * (Math.pow(T_K, 3) - Math.pow(T_ref, 3));
                    H_total += flow_kmol_h * H_gas; 
                } else {
                    let cpLiq = FullProjectDB.cpConstants.find(x => x.comp === "H2O");
                    let H_liq = cpLiq.a * (T_K - T_ref);
                    H_total += flow_kmol_h * H_liq;
                }
            } else {
                let cpData = FullProjectDB.cpConstants.find(x => x.comp === c) || {a:0, b:0, c:0};
                let H_molar = cpData.a * (T_K - T_ref) + 
                              (cpData.b / 2) * (Math.pow(T_K, 2) - Math.pow(T_ref, 2)) + 
                              (cpData.c / 3) * (Math.pow(T_K, 3) - Math.pow(T_ref, 3));
                H_total += flow_kmol_h * H_molar;
            }
        });
        return H_total / 3600; // الإخراج الصافي بوحدة الكيلوواط المستقرة (kW)
    }
}

export class Stream {
    constructor(name, temp, flow, composition, isGasPhase = true) {
        this.name = name; 
        this.T = temp; 
        this.flow = flow; 
        this.isGasPhase = isGasPhase; // تم إدخال الطور كمعامل فيزيائي أساسي داخل المجرى
        this.comp = ThermoEngine.normalizeComposition({ ...composition });
    }
    getMolarFlowOf(component) { return (this.comp[component] || 0) * this.flow; }
    getEnthalpy() { return ThermoEngine.calculateStreamEnthalpy(this, this.isGasPhase); }
}