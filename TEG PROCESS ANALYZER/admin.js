// admin.js
let FullProjectDB = {
    // الثوابت الدقيقة والموحدة بوحدة kJ/kmol.K لحسابات دقيقة
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
        { comp: "H2O", a: 75.40, b: 0, c: 0 }, // Liquid Water
        { comp: "H2O_Vapor", a: 33.46, b: 0.682e-2, c: 0.760e-5 }, // Water Vapor
        { comp: "TEG", a: 315.00, b: 0.54e-1, c: 0 }, 
        { comp: "C8H18", a: 188.00, b: 0, c: 0 },
        { comp: "Ethylbenzene", a: 130.00, b: 0, c: 0 },
        { comp: "m-Xylene", a: 130.00, b: 0, c: 0 },
        { comp: "p-Xylene", a: 130.00, b: 0, c: 0 },
        { comp: "o-Xylene", a: 130.00, b: 0, c: 0 },
        { comp: "C8H10", a: 130.00, b: 0, c: 0 },
        { comp: "C10H22", a: 234.00, b: 0, c: 0 }
    ],
    compositions: {
        gasInlet: { "H2S": 0.0010, "N2": 0.0098, "CO2": 0.0184, "CH4": 0.6702, "C2H6": 0.1607, "C3H8": 0.0837, "i-C4H10": 0.0094, "n-C4H10": 0.0248, "i-C5H12": 0.0058, "n-C5H12": 0.0067, "C6H14": 0.0051, "Benzene": 0.0001, "n-Heptane": 0.0021, "Toluene": 0.0001, "H2O": 0, "C8H18": 0.0010, "Ethylbenzene": 0, "m-Xylene": 0, "p-Xylene": 0, "o-Xylene": 0, "C8H10": 0.0006, "C10H22": 0.0004 }
    }
};

// استخدام نسخة جديدة للذاكرة المحلية لضمان مسح الأرقام القديمة الخاطئة المسببة للانهيار
function initDB() { 
    const saved = localStorage.getItem('teg_cp_db_v15'); 
    if(saved) FullProjectDB.cpConstants = JSON.parse(saved); 
}
initDB();

function loadAdminTable() {
    const container = document.getElementById('table-container');
    if (!container) return;
    let html = `<h3>Thermodynamic Database (Cp Constants)</h3><table><thead><tr><th>Component</th><th>Constant (a)</th><th>Constant (b)</th><th>Constant (c)</th></tr></thead><tbody>`;
    FullProjectDB.cpConstants.forEach((r, idx) => {
        html += `<tr><td><strong>${r.comp}</strong></td>
                    <td><input type="number" id="a_${idx}" value="${r.a}" step="0.00001"></td>
                    <td><input type="number" id="b_${idx}" value="${r.b}" step="0.00001"></td>
                    <td><input type="number" id="c_${idx}" value="${r.c}" step="0.00001"></td></tr>`;
    });
    html += `</tbody></table><button class="btn-run" style="margin-top:20px" onclick="saveAdminData()">💾 Save Configuration</button>`;
    container.innerHTML = html;
}

function saveAdminData() {
    FullProjectDB.cpConstants.forEach((r, idx) => {
        r.a = parseFloat(document.getElementById(`a_${idx}`).value) || 0;
        r.b = parseFloat(document.getElementById(`b_${idx}`).value) || 0;
        r.c = parseFloat(document.getElementById(`c_${idx}`).value) || 0;
    });
    localStorage.setItem('teg_cp_db_v15', JSON.stringify(FullProjectDB.cpConstants));
    alert('Database successfully saved with the correct thermodynamic units!');
}

window.handleAdminAccess = function(btn) { 
    if(typeof switchPage === 'function') switchPage('admin', btn); 
    loadAdminTable(); 
};