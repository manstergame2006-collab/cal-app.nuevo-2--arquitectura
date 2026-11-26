// =========================================================================
// 0. CONEXIÓN CON EL WEB WORKER (calc.worker.js) E HISTORIAL
// =========================================================================
let calcWorker = null;
const historialOperaciones = [];

try {
    if (window.Worker) {
        calcWorker = new Worker("calc.worker.js");
        calcWorker.onmessage = function (e) {
            const { exito, modulo, valor, error } = e.data;
            if (!exito) {
                alert("Error en cálculo: " + error);
                return;
            }

            if (modulo === "matrices") {
                const outMat = document.getElementById("matrix-res");
                if (outMat) outMat.innerText = valor;
                registrarHistorial("Matrices", valor.split("\n")[0]);
            } else {
                mostrarResultadoAlgebra(`\n[Worker] Resultado (${modulo}): ${valor}`, true);
                registrarHistorial(`Cálculo (${modulo})`, valor);
            }
        };
    }
} catch (err) {
    console.warn("Worker no disponible sin servidor local (usando respaldo local):", err);
}

// Helper para escribir tanto en <textarea> como en <div>
function mostrarResultadoAlgebra(texto, anexar = false) {
    const out = document.getElementById("res-txt");
    if (!out) return;
    if ("value" in out) {
        out.value = anexar ? out.value + texto : texto;
    } else {
        out.innerText = anexar ? out.innerText + texto : texto;
    }
}

// =========================================================================
// 1. INICIALIZACIÓN DE EVENTOS Y ESTADO DE RED
// =========================================================================
function actualizarEstadoRed() {
    const pill = document.getElementById("estado-red");
    if (!pill) return;
    if (navigator.onLine) {
        pill.textContent = "● En línea";
        pill.className = "pill online";
    } else {
        pill.textContent = "● Sin conexión";
        pill.className = "pill offline";
    }
}

window.addEventListener("online", actualizarEstadoRed);
window.addEventListener("offline", actualizarEstadoRed);

document.addEventListener("DOMContentLoaded", () => {
    actualizarEstadoRed();

    // 1. Navegación por pestañas
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".workspace").forEach(w => {
                w.classList.remove("active");
                w.classList.add("hidden");
            });

            btn.classList.add("active");
            const target = document.getElementById(btn.dataset.tab);
            if (target) {
                target.classList.remove("hidden");
                target.classList.add("active");
            }
        });
    });

    // 2. Álgebra y Cálculo Visual
    const moduloSelect = document.getElementById("modulo-select");
    if (moduloSelect) {
        moduloSelect.addEventListener("change", actualizarInputs);
        actualizarInputs();
    }

    const btnGenerar = document.getElementById("btnGenerarGrafico");
    if (btnGenerar) btnGenerar.addEventListener("click", ejecutarAlgebra);

    // 3. Matrices
    const btnGrids = document.getElementById("btn-crear-grids");
    if (btnGrids) btnGrids.addEventListener("click", construirGridsMatrices);
    construirGridsMatrices();

    const btnCalcMatriz = document.getElementById("btn-calc-matriz");
    if (btnCalcMatriz) btnCalcMatriz.addEventListener("click", ejecutarMatrices);

    // 4. Calculadora Aritmética
    const btnCalcArit = document.getElementById("btn-calc-arit");
    if (btnCalcArit) btnCalcArit.addEventListener("click", ejecutarAritmetica);

    // 5. Cajón de Historial
    const btnToggleHist = document.getElementById("btn-toggle-historial");
    const btnCerrarDrawer = document.getElementById("btn-cerrar-drawer");
    const drawer = document.getElementById("drawer-historial");

    if (btnToggleHist && drawer) {
        btnToggleHist.addEventListener("click", () => drawer.classList.toggle("hidden"));
    }
    if (btnCerrarDrawer && drawer) {
        btnCerrarDrawer.addEventListener("click", () => drawer.classList.add("hidden"));
    }
});

// =========================================================================
// 2. UTILIDADES MATEMÁTICAS Y DE HISTORIAL
// =========================================================================
function sanitizarExpresion(expr) {
    return expr ? expr.replace(/\*\*/g, "^") : "";
}

function linspace(start, stop, steps) {
    const arr = [];
    const step = (stop - start) / (steps - 1);
    for (let i = 0; i < steps; i++) arr.push(start + step * i);
    return arr;
}

function registrarHistorial(tipo, detalle) {
    historialOperaciones.unshift(`${tipo}: ${detalle}`);
    const btnHist = document.getElementById("btn-toggle-historial");
    if (btnHist) btnHist.innerText = `Historial (${historialOperaciones.length})`;

    ["lista-historial", "lista-historial-global"].forEach(id => {
        const ul = document.getElementById(id);
        if (!ul) return;
        ul.innerHTML = historialOperaciones.map(item => `<li>${item}</li>`).join("");
    });
}


// =========================================================================
// 3. MÓDULO ÁLGEBRA Y GEOMETRÍA: INPUTS DINÁMICOS
// =========================================================================
function actualizarInputs() {
    const selector = document.getElementById("modulo-select");
    const frame = document.getElementById("input-frame");
    if (!selector || !frame) return;

    const herramienta = selector.value;
    frame.innerHTML = "";

    switch (herramienta) {
        case "integral":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Función f(x):</label>
                    <input type="text" id="f" value="sqrt(x)">
                </div>
                <div class="form-group">
                    <label>Límite a:</label>
                    <input type="text" id="a" value="0">
                </div>
                <div class="form-group">
                    <label>Límite b:</label>
                    <input type="text" id="b" value="1">
                </div>
            `;
            break;
       
        case "volumen":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Función f(x):</label>
                    <input type="text" id="f" value="sqrt(x)">
                </div>
                <div class="form-group">
                    <label>Límite a:</label>
                    <input type="text" id="a" value="0">
                </div>
                <div class="form-group">
                    <label>Límite b:</label>
                    <input type="text" id="b" value="1">
                </div>
            `;
            break;

        case "cascarones":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Función f(x):</label>
                    <input type="text" id="f" value="sqrt(x)">
                </div>
                <div class="form-group">
                    <label>Límite a:</label>
                    <input type="text" id="a" value="0">
                </div>
                <div class="form-group">
                    <label>Límite b:</label>
                    <input type="text" id="b" value="1">
                </div>
            `;
            break;

        case "parametrica":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Ecuación x(t):</label>
                    <input type="text" id="param-xt" value="2 * cos(t)">
                </div>
                <div class="form-group">
                    <label>Ecuación y(t):</label>
                    <input type="text" id="param-yt" value="3 * sin(t)">
                </div>
                <div class="form-group">
                    <label>t Mínimo:</label>
                    <input type="number" id="param-tmin" value="0" step="0.1">
                </div>
                <div class="form-group">
                    <label>t Máximo:</label>
                    <input type="number" id="param-tmax" value="6.28" step="0.1">
                </div>
            `;
            break;

        case "area":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Función f(x):</label>
                    <input type="text" id="f" value="sqrt(x)">
                </div>
                <div class="form-group">
                    <label>Función g(x):</label>
                    <input type="text" id="g" value="x^2">
                </div>
                <div class="form-group">
                    <label>Límite a:</label>
                    <input type="text" id="a" value="0">
                </div>
                <div class="form-group">
                    <label>Límite b:</label>
                    <input type="text" id="b" value="1">
                </div>
            `;
            break;

        case "curvas":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Función f(x,y):</label>
                    <input type="text" id="fxy" value="16 - x^2 - y^2">
                </div>
                <div class="form-group">
                    <label>Niveles K (separados por coma):</label>
                    <input type="text" id="k" value="0, 4, 8, 12">
                </div>
                <div class="form-group">
                    <label>Radio de visualización:</label>
                    <input type="text" id="r" value="4">
                </div>
            `;
            break;

        case "campo":
            frame.innerHTML = `
                <div class="form-group">
                    <label>Comp. P(x,y,z) (i):</label>
                    <input type="text" id="px" value="y">
                </div>
                <div class="form-group">
                    <label>Comp. Q(x,y,z) (j):</label>
                    <input type="text" id="qy" value="-x">
                </div>
                <div class="form-group">
                    <label>Comp. R(x,y,z) (k):</label>
                    <input type="text" id="rz" value="0">
                </div>
            `;
            break;
    

        default:
            frame.innerHTML = `<p style="color: #94a3b8;">Selecciona una herramienta válida.</p>`;
            return;
    }

    // CORRECCIÓN INTERFAZ DE BOTONES RADIO: Alineación fluida horizontal y añade la opción Dual de raíz
    frame.innerHTML += `
        <div class="form-group" style="margin-top: 8px;">
            <label>Visualización:</label>
            <div class="radio-group">
                <label><input type="radio" name="vista" value="2D"> 2D</label>
                <label><input type="radio" name="vista" value="3D"> 3D</label>
                <label><input type="radio" name="vista" value="Dual" checked> Dual</label>
            </div>
        </div>
    `;
}

// =========================================================================
// 5. MOTOR DE PROCESAMIENTO MATEMÁTICO Y GRÁFICO (PLOTLY + MATH.JS)
// =========================================================================
function ejecutarAlgebra() {
    if (typeof Plotly === "undefined" || typeof math === "undefined") {
        alert("Faltan las librerías Plotly o Math.js en el index.html.");
        return;
    }

    const modulo = document.getElementById("modulo-select").value;
    const vistaRadio = document.querySelector('input[name="vista"]:checked');
    const vista = vistaRadio ? vistaRadio.value : "Dual";

    const plotId = document.getElementById("plot-div") ? "plot-div" : "grafico-canvas";

    const escribirResultado = (texto, anexar = false) => {
        const resTxt = document.getElementById("res-txt");
        if (!resTxt) return;
        if ("value" in resTxt) {
            resTxt.value = anexar ? resTxt.value + texto : texto;
        } else {
            resTxt.innerText = anexar ? resTxt.innerText + texto : texto;
        }
    };

    // Base de configuración de Layout para subplots mixtos (2D y 3D)
    let layout = {
        showlegend: true,
        paper_bgcolor: "#0f172a",
        plot_bgcolor: "#0f172a",
        font: { color: "#f8fafc" },
        margin: { t: 50, b: 45, l: 50, r: 40 }
    };

    // Configuración dinámica de los dominios visuales según la vista elegida
    if (vista === "Dual") {
        layout.xaxis = { domain: [0, 0.45], title: 'Eje X (2D)' };
        layout.yaxis = { domain: new Array(0, 1), title: 'Eje Y (2D)' };
        layout.scene = {
            domain: { x: [0.55, 1], y: new Array(0, 1) },
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
            zaxis: { title: 'Z' },
            aspectmode: 'data'
        };
    } else if (vista === "2D") {
        layout.xaxis = { domain: new Array(0, 1), title: 'Eje X' };
        layout.yaxis = { domain: new Array(0, 1), title: 'Eje Y' };
    } else if (vista === "3D") {
        layout.scene = {
            domain: { x: new Array(0, 1), y: new Array(0, 1) },
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
            zaxis: { title: 'Z' },
            aspectmode: 'data'
        };
    }


    switch (modulo) {
        case "parametrica":
            try {
                let xExpr = sanitizarExpresion(document.getElementById("param-xt").value);
                let yExpr = sanitizarExpresion(document.getElementById("param-yt").value);
                let tmin = parseFloat(document.getElementById("param-tmin").value);
                let tmax = parseFloat(document.getElementById("param-tmax").value);
                if (isNaN(tmin) || isNaN(tmax)) throw new Error("Los límites de t deben ser números válidos.");

                let xCompiled = math.compile(xExpr);
                let yCompiled = math.compile(yExpr);
                let tVals = linspace(tmin, tmax, 200);
                let xVals = tVals.map(t => xCompiled.evaluate({ t: t }));
                let yVals = tVals.map(t => yCompiled.evaluate({ t: t }));

                let data = [];
                if (vista === "2D" || vista === "Dual") {
                    data.push({ x: xVals, y: yVals, mode: 'lines', name: 'Curva 2D C(t)', line: { color: '#f59e0b', width: 3 } });
                }
                if (vista === "3D" || vista === "Dual") {
                    data.push({ type: 'scatter3d', x: xVals, y: yVals, z: tVals, mode: 'lines', name: 'Trayectoria 3D', line: { color: '#38bdf8', width: 5 } });
                }

                layout.title = "Trayectoria de Ecuación Paramétrica";
                Plotly.newPlot(plotId, data, layout);
                escribirResultado(`=== ECUACIÓN PARAMÉTRICA ===\nx(t) = ${xExpr}\ny(t) = ${yExpr}\nDominio: t ∈ [${tmin}, ${tmax}]`);
                registrarHistorial("Paramétrica", `t=[${tmin}, ${tmax}]`);
            } catch (e) { alert("Error en curvas paramétricas: " + e.message); }
            
            break;

        case "area":
            try {
                let fExpr = sanitizarExpresion(document.getElementById("f").value);
                let gExpr = sanitizarExpresion(document.getElementById("g").value);
                let a = parseFloat(document.getElementById("a").value);
                let b = parseFloat(document.getElementById("b").value);

                if (isNaN(a) || isNaN(b)) throw new Error("Ingresa números válidos en los límites a y b.");

                let fCompiled = math.compile(fExpr);
                let gCompiled = math.compile(gExpr);
                let evaluar = (compiled, xValues) => xValues.map(x => compiled.evaluate({ x: x }));

                // --- CÁLCULO NUMÉRICO DEL ÁREA ENTRE CURVAS ---
                let nSteps = 1000;
                let dx = (b - a) / nSteps;
                let areaTotal = 0;
                for (let i = 0; i < nSteps; i++) {
                    let xMid = a + (i + 0.5) * dx;
                    areaTotal += Math.abs(fCompiled.evaluate({ x: xMid }) - gCompiled.evaluate({ x: xMid })) * dx;
                }

                let data = [];

                // --- VISTA 2D ---
                if (vista === "2D" || vista === "Dual") {
                    let xP = linspace(a - 0.5, b + 0.5, 200);
                    let xFill = linspace(a, b, 100);

                    let yF_p = evaluar(fCompiled, xP);
                    let yG_p = evaluar(gCompiled, xP);
                    let yF_fill = evaluar(fCompiled, xFill);
                    let yG_fill = evaluar(gCompiled, xFill);

                    data.push(
                        { x: xP, y: yF_p, mode: 'lines', name: 'f(x)', line: { color: '#ef4444', width: 2 } },
                        { x: xP, y: yG_p, mode: 'lines', name: 'g(x)', line: { color: '#3b82f6', width: 2 } },
                        {
                            x: xFill.concat(xFill.slice().reverse()),
                            y: yF_fill.concat(yG_fill.slice().reverse()),
                            fill: 'toself',
                            fillcolor: 'rgba(168, 85, 247, 0.35)',
                            line: { color: 'transparent' },
                            name: 'Área entre curvas'
                        }
                    );
                }

                // --- VISTA 3D (Extrusión de la región entre f(x) y g(x)) ---
                if (vista === "3D" || vista === "Dual") {
                    let xVals = linspace(a, b, 50);
                    let tVals = linspace(0, 1, 15);
                    let zVals = new Array(0, 1);

                    for (let z of zVals) {
                        let X_3d = [], Y_3d = [], Z_3d = [];
                        for (let t of tVals) {
                            let rowX = [], rowY = [], rowZ = [];
                            for (let x of xVals) {
                                let yF = fCompiled.evaluate({ x: x });
                                let yG = gCompiled.evaluate({ x: x });
                                rowX.push(x);
                                rowY.push(yG + t * (yF - yG));
                                rowZ.push(z);
                            }
                            X_3d.push(rowX);
                            Y_3d.push(rowY);
                            Z_3d.push(rowZ);
                        }

                        data.push({
                            type: 'surface',
                            x: X_3d,
                            y: Y_3d,
                            z: Z_3d,
                            colorscale: 'Purples',
                            opacity: 0.85,
                            showscale: false,
                            name: z === 0 ? 'Cara Frontal 3D' : 'Cara Trasera 3D'
                        });
                    }
                }

                layout.title = "Área entre Curvas f(x) y g(x)";
                Plotly.newPlot(plotId, data, layout);

                const msgArea = `=== ÁREA ENTRE CURVAS ===\nf(x) = ${fExpr}\ng(x) = ${gExpr}\nIntervalo: [${a}, ${b}]\nÁrea Total: ${areaTotal.toFixed(6)} u²`;
                escribirResultado(msgArea);
                registrarHistorial("Área entre Curvas", `${areaTotal.toFixed(4)} u²`);
            } catch (e) {
                alert("Error en el cálculo de área: " + e.message);
            }
            break;



        case "integral":
            try {
                let fExpr = sanitizarExpresion(document.getElementById("f").value);
                let a = parseFloat(document.getElementById("a").value);
                let b = parseFloat(document.getElementById("b").value);

                if (isNaN(a) || isNaN(b)) throw new Error("Los límites a y b deben ser números válidos.");

                let fCompiled = math.compile(fExpr);
                let evaluar = (compiled, xValues) => xValues.map(x => compiled.evaluate({ x: x }));

                // --- CÁLCULO NUMÉRICO DE LA INTEGRAL (Aproximación por Trapecios o Suma de Riemann) ---
                let nSteps = 1000;
                let dx = (b - a) / nSteps;
                let sumaIntegral = 0;
                for (let i = 0; i < nSteps; i++) {
                    let xMid = a + (i + 0.5) * dx;
                    sumaIntegral += fCompiled.evaluate({ x: xMid }) * dx;
                }

                let data = [];

                // --- GRÁFICO 2D ---
                if (vista === "2D" || vista === "Dual") {
                    let xP = linspace(a - 1, b + 1, 200);
                    let xFill = linspace(a, b, 100);
                    let yP = evaluar(fCompiled, xP);
                    let yFill = evaluar(fCompiled, xFill);

                    data.push(
                        { x: xP, y: yP, mode: 'lines', name: 'f(x)', line: { color: '#ef4444', width: 2 } },
                        {
                            x: xFill.concat(xFill.slice().reverse()),
                            y: yFill.concat(Array(xFill.length).fill(0)),
                            fill: 'toself',
                            fillcolor: 'rgba(37, 99, 235, 0.35)',
                            line: { color: 'transparent' },
                            name: 'Área bajo la curva'
                        }
                    );
                }

                // --- GRÁFICO 3D (Extrusión de la integral en Plotly) ---
                if (vista === "3D" || vista === "Dual") {
                    let xVals = linspace(a, b, 50);
                    let zVals = linspace(0, 1, 10);
                    let X_3d = [], Y_3d = [], Z_3d = [];

                    for (let z of zVals) {
                        let rowX = [], rowY = [], rowZ = [];
                        for (let x of xVals) {
                            rowX.push(x);
                            rowY.push(fCompiled.evaluate({ x: x }));
                            rowZ.push(z);
                        }
                        X_3d.push(rowX);
                        Y_3d.push(rowY);
                        Z_3d.push(rowZ);
                    }

                    data.push({
                        type: 'surface',
                        x: X_3d,
                        y: Y_3d,
                        z: Z_3d,
                        colorscale: 'Viridis',
                        opacity: 0.8,
                        showscale: false,
                        name: 'Extrusión 3D'
                    });
                }

                // Reutilizamos el layout global (NO declaramos un nuevo 'let layout')
                layout.title = "Integral Definida - Área bajo la curva";
                Plotly.newPlot('plot-div', data, layout);

                const msgIntegral = `=== INTEGRAL DEFINIDA ===\nFunción: f(x) = ${fExpr}\nIntervalo: [${a}, ${b}]\nValor Aproximado: ${sumaIntegral.toFixed(6)}`;
                if (resTxt) "value" in resTxt ? (resTxt.value = msgIntegral) : (resTxt.innerText = msgIntegral);
                registrarHistorial("Integral Definida", `${sumaIntegral.toFixed(4)}`);
            } catch (e) {
                alert("Error en el cálculo de la integral: " + e.message);
            }

            break;

        case "volumen":
            try {
                // 1. LECTURA DE VALORES
                let expr = sanitizarExpresion(document.getElementById("f").value);
                let limiteA = parseFloat(document.getElementById("a").value);
                let limiteB = parseFloat(document.getElementById("b").value);
                const resTxt = document.getElementById("res-txt");

                if (isNaN(limiteA) || isNaN(limiteB)) {
                    alert("Por favor introduce límites válidos.");
                    return;
                }

                // 2. CÁLCULO NUMÉRICO DEL VOLUMEN (Método de Discos)
                let pasos = 200;
                let dx = (limiteB - limiteA) / pasos;
                let sumaIntegral = 0;

                let xVals = [];
                let yVals = [];

                for (let i = 0; i <= pasos; i++) {
                    let x = limiteA + i * dx;
                    let y = math.evaluate(expr, { x: x });
                    
                    xVals.push(x);
                    yVals.push(y);

                    let yCuadrado = y * y;
                    if (i === 0 || i === pasos) {
                        sumaIntegral += yCuadrado / 2;
                    } else {
                        sumaIntegral += yCuadrado;
                    }
                }

                let volumenFinal = Math.PI * sumaIntegral * dx;

                // Mostrar el resultado
                if (resTxt) {
                    const textoResultado = `=== SÓLIDO DE REVOLUCIÓN ===\n` +
                                           `Función: f(x) = ${expr}\n` +
                                           `Intervalo: [${limiteA}, ${limiteB}]\n` +
                                           `-----------------------------\n` +
                                           `Volumen Calculado (V = π ∫ [f(x)]² dx):\n` +
                                           `V ≈ ${volumenFinal.toFixed(5)} u³\n` +
                                           `Exacto aprox: ${volumenFinal}`;
                    if ("value" in resTxt) resTxt.value = textoResultado;
                    else resTxt.innerText = textoResultado;
                }
                registrarHistorial("Volumen Discos", `${volumenFinal.toFixed(4)} u³`);

                // 3. PREPARACIÓN DE GRÁFICOS INTERACTIVOS (2D / 3D)
                let datosGrafico = [];

                // --- VISTA 2D ---
                if (vista === "2D" || vista === "Dual") {
                    let x2D = [...xVals, ...xVals.slice().reverse()];
                    let y2D = [...yVals, ...yVals.slice().map(y => -y).reverse()];

                    datosGrafico.push({
                        x: x2D,
                        y: y2D,
                        fill: 'toself',
                        fillcolor: 'rgba(56, 189, 248, 0.25)',
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Sección 2D',
                        line: { color: '#38bdf8', width: 2.5 }
                    });
                }

                // --- VISTA 3D ---
                if (vista === "3D" || vista === "Dual") {
                    let pasosAngulo = 60;
                    let X3D = [];
                    let Y3D = [];
                    let Z3D = [];

                    for (let i = 0; i < xVals.length; i++) {
                        X3D.push([]);
                        Y3D.push([]);
                        Z3D.push([]);
                    }

                    for (let j = 0; j <= pasosAngulo; j++) {
                        let theta = (j / pasosAngulo) * 2 * Math.PI;
                        let cosT = Math.cos(theta);
                        let sinT = Math.sin(theta);

                        for (let i = 0; i < xVals.length; i++) {
                            let r = yVals[i];
                            X3D[i].push(xVals[i]);
                            Y3D[i].push(r * cosT);
                            Z3D[i].push(r * sinT);
                        }
                    }

                    datosGrafico.push({
                        x: X3D,
                        y: Y3D,
                        z: Z3D,
                        type: 'surface',
                        name: 'Sólido 3D',
                        colorscale: 'Viridis',
                        showscale: false
                    });
                }

                // 4. RENDERIZADO EN PLOTLY (Reutiliza layout global para mantener modo Dual y tema oscuro)
                layout.title = vista === "Dual" ? 'Sección 2D & Sólido de Revolución' : 'Sólido de Revolución';
                layout.showlegend = false;
                if (layout.scene) {
                    layout.scene.xaxis = { title: 'Eje X' };
                    layout.scene.yaxis = { title: 'Eje Y' };
                    layout.scene.zaxis = { title: 'Eje Z' };
                    layout.scene.aspectmode = 'data';
                }

                Plotly.newPlot(plotId, datosGrafico, layout);

            } catch (error) {
                alert("Error en el cálculo del sólido: " + error.message);
            }
            break;

        case "cascarones":
            try {
                let fExpr = sanitizarExpresion(document.getElementById("f").value);
                let a = parseFloat(document.getElementById("a").value);
                let b = parseFloat(document.getElementById("b").value);

                if (isNaN(a) || isNaN(b)) throw new Error("Los límites a y b deben ser números válidos.");

                let fCompiled = math.compile(fExpr);
                let evaluar = (compiled, xValues) => xValues.map(x => compiled.evaluate({ x: x }));

                // --- CÁLCULO NUMÉRICO DEL VOLUMEN (Método de Cascarones Cilíndricos: 2 * pi * integral de x * f(x)) ---
                let nSteps = 1000;
                let dx = (b - a) / nSteps;
                let sumaVolumen = 0;
                for (let i = 0; i < nSteps; i++) {
                    let xMid = a + (i + 0.5) * dx;
                    sumaVolumen += 2 * Math.PI * xMid * fCompiled.evaluate({ x: xMid }) * dx;
                }

                let data = [];

                // --- GRÁFICO 2D (Perfil) ---
                if (vista === "2D" || vista === "Dual") {
                    let xVals = linspace(a, b, 100);
                    let yVals = evaluar(fCompiled, xVals);

                    data.push(
                        {
                            x: xVals,
                            y: yVals,
                            mode: 'lines',
                            fill: 'tozeroy',
                            fillcolor: 'rgba(52, 211, 153, 0.2)',
                            name: 'f(x)',
                            line: { color: '#34d399', width: 2.5 }
                        },
                        {
                            x: new Array(0, 0),
                            y: [0, Math.max(...yVals)],
                            mode: 'lines',
                            name: 'Eje de giro (x=0)',
                            line: { color: '#94a3b8', width: 2, dash: 'dash' }
                        }
                    );
                }

                // --- GRÁFICO 3D (Sólido de Revolución por Cascarones) ---
                if (vista === "3D" || vista === "Dual") {
                    let uVals = linspace(a, b, 50);
                    let vVals = linspace(0, 2 * Math.PI, 50);
                    let X_3d = [], Y_3d = [], Z_3d = [];

                    for (let v of vVals) {
                        let rowX = [], rowY = [], rowZ = [];
                        for (let u of uVals) {
                            let fx = fCompiled.evaluate({ x: u });
                            // Ecuaciones paramétricas para la superficie cilíndrica rotada
                            let xCoord = u * Math.cos(v);
                            let zCoord = u * Math.sin(v);
                            let yCoord = fx;

                            rowX.push(xCoord);
                            rowY.push(yCoord);
                            rowZ.push(zCoord);
                        }
                        X_3d.push(rowX);
                        Y_3d.push(rowY);
                        Z_3d.push(rowZ);
                    }

                    data.push({
                        type: 'surface',
                        x: X_3d,
                        y: Y_3d,
                        z: Z_3d,
                        colorscale: 'Magma',
                        opacity: 0.85,
                        showscale: false,
                        name: 'Sólido (Cascarones)'
                    });
                }

                // Reutilizamos el layout global (NO declaramos un nuevo 'let layout')
                layout.title = "Método de Cascarones Cilíndricos";
                Plotly.newPlot('plot-div', data, layout);

                const msgCascarones = `=== CASCARONES CILÍNDRICOS ===\n` +
                                      `Función: f(x) = ${fExpr}\n` +
                                      `Intervalo: [${a}, ${b}]\n` +
                                      `Volumen (V = 2π ∫ x·f(x) dx):\n` +
                                      `V ≈ ${sumaVolumen.toFixed(5)} u³`;
                if (resTxt) {
                    if ("value" in resTxt) resTxt.value = msgCascarones;
                    else resTxt.innerText = msgCascarones;
                }
                registrarHistorial("Cascarones", `${sumaVolumen.toFixed(4)} u³`);
            } catch (e) {
                alert("Error en el cálculo de cascarones: " + e.message);
            }
            break;

        case "curvas":
            try {
                let fExpr = sanitizarExpresion(document.getElementById("fxy").value);
                let kStr = document.getElementById("k").value;
                let kVals = kStr
                    ? kStr.split(',').map(val => parseFloat(val.trim())).filter(n => !isNaN(n))
                    :new Array(0, 4, 8, 12);

                let rInput = document.getElementById("r");
                let r = rInput ? parseFloat(rInput.value) || 4 : 4;

                let compiled = math.compile(fExpr);

                let xVals = linspace(-r, r, 55);
                let yVals = linspace(-r, r, 55);
                let Z_matrix = [];

                for (let y of yVals) {
                    let row = [];
                    for (let x of xVals) {
                        // Restricción circular (dentro del radio r)
                        if ((x * x + y * y) > (r * r)) {
                            row.push(null);
                        } else {
                            try {
                                let val = compiled.evaluate({ x: x, y: y });
                                row.push(Number.isFinite(val) ? val : null);
                            } catch (err) {
                                row.push(null);
                            }
                        }
                    }
                    Z_matrix.push(row);
                }

                let data = [];

                // --- VISTA 2D (Curvas de Nivel / Contour) ---
                if (vista === "2D" || vista === "Dual") {
                    let contourConfig = {
                        coloring: 'lines',
                        showlabels: true,
                        labelfont: { size: 12, color: '#f8fafc' }
                    };

                    // Si el usuario escribió niveles K específicos, ajustamos el rango
                    if (kVals.length > 0) {
                        const kMin = Math.min(...kVals);
                        const kMax = Math.max(...kVals);
                        contourConfig.start = kMin;
                        contourConfig.end = kMax;
                        if (kVals.length > 1) {
                            contourConfig.size = (kMax - kMin) / (kVals.length - 1);
                        }
                    }

                    data.push({
                        z: Z_matrix,
                        x: xVals,
                        y: yVals,
                        type: 'contour',
                        contours: contourConfig,
                        line: { width: 2.5 },
                        colorscale: 'Jet',
                        showscale: false,
                        name: 'Curvas de Nivel'
                    });
                }

                // --- VISTA 3D (Superficie 3D) ---
                if (vista === "3D" || vista === "Dual") {
                    data.push({
                        type: 'surface',
                        z: Z_matrix,
                        x: xVals,
                        y: yVals,
                        colorscale: 'Viridis',
                        opacity: 0.88,
                        showscale: false,
                        name: 'Superficie 3D'
                    });
                }

                // Reutilizamos el layout global (NO declaramos un nuevo 'let layout')
                layout.title = "Curvas de Nivel y Superficie 3D";
                Plotly.newPlot('plot-div', data, layout);

                const msgCurvas = `=== CURVAS DE NIVEL ===\n` +
                                  `Función: f(x,y) = ${fExpr}\n` +
                                  `Niveles K: [${kVals.join(', ')}]\n` +
                                  `Dominio circular: r = ${r}`;
                if (resTxt) {
                    if ("value" in resTxt) resTxt.value = msgCurvas;
                    else resTxt.innerText = msgCurvas;
                }
                registrarHistorial("Curvas de Nivel", `f(x,y)=${fExpr}`);
            } catch (e) {
                alert("Error en el módulo de curvas: " + e.message);
            }
            break;

        case "campo":
            try {
                let pExpr = sanitizarExpresion(document.getElementById("px").value);
                let qExpr = sanitizarExpresion(document.getElementById("qy").value);
                let rInput = document.getElementById("rz");
                let rExpr = rInput ? sanitizarExpresion(rInput.value) : "0";

                let pComp = math.compile(pExpr);
                let qComp = math.compile(qExpr);
                let rComp = math.compile(rExpr);

                let data = [];

                // --- VISUALIZACIÓN 2D (Flechas vectoriales reales sobre el plano XY) ---
                if (vista === "2D" || vista === "Dual") {
                    let xVals = linspace(-2, 2, 11);
                    let yVals = linspace(-2, 2, 11);
                    let xArr = [], yArr = [], annotations = [];

                    for (let y of yVals) {
                        for (let x of xVals) {
                            let u = pComp.evaluate({ x: x, y: y, z: 0 });
                            let v = qComp.evaluate({ x: x, y: y, z: 0 });
                            let mag = Math.hypot(u, v);

                            // Normalizamos levemente la longitud para que las flechas no se crucen demasiado
                            let scale = mag > 0 ? 0.28 / Math.max(1, mag * 0.5) : 0;

                            xArr.push(x);
                            yArr.push(y);

                            if (mag > 0) {
                                annotations.push({
                                    x: x + u * scale,
                                    y: y + v * scale,
                                    ax: x,
                                    ay: y,
                                    xref: 'x',
                                    yref: 'y',
                                    axref: 'x',
                                    ayref: 'y',
                                    showarrow: true,
                                    arrowhead: 2,
                                    arrowsize: 1,
                                    arrowwidth: 1.5,
                                    arrowcolor: '#38bdf8'
                                });
                            }
                        }
                    }

                    layout.annotations = annotations;
                    data.push({
                        x: xArr,
                        y: yArr,
                        mode: 'markers',
                        marker: { size: 3, color: '#94a3b8' },
                        name: 'Malla 2D (z=0)'
                    });
                }

                // --- VISUALIZACIÓN 3D (Conos vectoriales en R³) ---
                if (vista === "3D" || vista === "Dual") {
                    let lin3d = linspace(-2, 2, 5);
                    let xArr3d = [], yArr3d = [], zArr3d = [];
                    let uArr3d = [], vArr3d = [], wArr3d = [];

                    for (let z of lin3d) {
                        for (let y of lin3d) {
                            for (let x of lin3d) {
                                xArr3d.push(x);
                                yArr3d.push(y);
                                zArr3d.push(z);
                                uArr3d.push(pComp.evaluate({ x: x, y: y, z: z }));
                                vArr3d.push(qComp.evaluate({ x: x, y: y, z: z }));
                                wArr3d.push(rComp.evaluate({ x: x, y: y, z: z }));
                            }
                        }
                    }

                    data.push({
                        type: 'cone',
                        x: xArr3d,
                        y: yArr3d,
                        z: zArr3d,
                        u: uArr3d,
                        v: vArr3d,
                        w: wArr3d,
                        colorscale: 'Viridis',
                        sizemode: 'scaled',
                        sizeref: 0.5,
                        showscale: false,
                        name: 'Campo en R³'
                    });
                }

                // Reutilizamos el layout global (NO declaramos un nuevo 'let layout')
                layout.title = "Campo Vectorial F(x, y, z)";
                Plotly.newPlot('plot-div', data, layout);

                const msgCampo = `=== CAMPO VECTORIAL ===\n` +
                                 `F(x,y,z) = (${pExpr})i + (${qExpr})j + (${rExpr})k\n` +
                                 `Dominio evaluado: [-2, 2]³`;
                if (resTxt) {
                    if ("value" in resTxt) resTxt.value = msgCampo;
                    else resTxt.innerText = msgCampo;
                }
                registrarHistorial("Campo Vectorial", `(${pExpr}, ${qExpr}, ${rExpr})`);
            } catch (e) {
                alert("Error en el campo vectorial: " + e.message);
            }
            break;

    }
}

function linspace(start, num, steps) {
    let arr = [];
    let step = (num - start) / (steps - 1);
    for (let i = 0; i < steps; i++) {
        arr.push(start + (step * i));
    }
    return arr;
}

// --- MÓDULO 2: MATRICES ---
function construirGridsMatrices() {
    // Busca todos los inputs numéricos dentro de la pestaña activa o de matrices
    const inputs = Array.from(document.querySelectorAll('.workspace.active input[type="number"], #matrices input[type="number"]'));
    
    let filasA = 2, colsA = 2, filasB = 2, colsB = 2;

    if (inputs.length >= 4) {
        filasA = parseInt(inputs[0].value) || 2;
        colsA  = parseInt(inputs[1].value) || 2;
        filasB = parseInt(inputs[2].value) || 2;
        colsB  = parseInt(inputs[3].value) || 2;
    } else if (document.getElementById("mat-filas")) {
        filasA = filasB = parseInt(document.getElementById("mat-filas").value) || 2;
        colsA  = colsB  = parseInt(document.getElementById("mat-cols").value) || 2;
    }

    const crearGrid = (id, filas, cols) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < filas; i++) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = "6px";
        row.style.marginBottom = "6px";
        for (let j = 0; j < cols; j++) {
            const input = document.createElement("input");
            input.type = "number";
            input.value = (i === j) ? 1 : 0; 
            
            // Estilos para evitar que el padding oculte los números
            input.style.width = "54px";
            input.style.height = "38px";
            input.style.padding = "4px";
            input.style.textAlign = "center";
            input.style.boxSizing = "border-box";
            
            row.appendChild(input);
        }
        container.appendChild(row);
    }
};

    crearGrid("grid-a", filasA, colsA);
    crearGrid("grid-b", filasB, colsB);
}

function leerMatrizDesdeDOM(id) {
    let container = document.getElementById(id);
    let filasDivs = container.children;
    let matriz = [];
    for (let f of filasDivs) {
        let filaValues = [];
        for (let input of f.children) {
            filaValues.push(parseFloat(input.value) || 0);
        }
        matriz.push(filaValues);
    }
    return math.matrix(matriz);
}

function ejecutarMatrices() {
    // Toma el <select> visible en la pestaña actual (Operación Matricial)
    const select = document.querySelector(".workspace.active select") || document.querySelector("#matrices select");
    const opcion = select ? (select.value + " " + select.options[select.selectedIndex].text).toLowerCase() : "";

    if (opcion.includes("suma") || opcion.includes("+")) {
        matrizSuma();
    } else if (opcion.includes("mult") || opcion.includes("×") || opcion.includes("*")) {
        matrizMult();
    } else if (opcion.includes("det")) {
        matrizDet();
    } else {
        alert("Operación no reconocida: " + opcion);
    }
}

function matrizSuma() {
    try {
        let A = leerMatrizDesdeDOM("grid-a");
        let B = leerMatrizDesdeDOM("grid-b");
        let res = math.add(A, B);
        document.getElementById("matrix-res").innerText = "RESULTADO SUMA:\n" + res.toString();
        registrarHistorial("Matrices", "Suma A + B");
    } catch(e) { alert("Error: " + e.message); }
}

function matrizMult() {
    try {
        let A = leerMatrizDesdeDOM("grid-a");
        let B = leerMatrizDesdeDOM("grid-b");
        let res = math.multiply(A, B);
        document.getElementById("matrix-res").innerText = "RESULTADO PRODUCTO (AxB):\n" + res.toString();
        registrarHistorial("Matrices", "Producto AxB");
    } catch(e) { alert("Error: " + e.message); }
}

function matrizDet() {
    try {
        let A = leerMatrizDesdeDOM("grid-a");
        let det = math.det(A);
        document.getElementById("matrix-res").innerText = "DETERMINANTE DE A: " + det.toFixed(4);
        registrarHistorial("Matrices", "Det(A): " + det.toFixed(4));
    } catch(e) { alert("Error: " + e.message); }
}

// --- MÓDULO 3: ARITMÉTICA ---
function ejecutarAritmetica() {
    calcularAritmetica();
}

function calcularAritmetica() {
    const inputs = document.querySelectorAll("#arit-inputs input");
    let nums = [];
    inputs.forEach(i => { if(i.value !== "") nums.push(parseFloat(i.value)); });
    
    const op = document.getElementById("arit-op").value.trim();
    if (nums.length < 2) { alert("Introduce al menos dos números"); return; }

    let res = nums[0];
    for (let i = 1; i < nums.length; i++) {
        if (op === '+') res += nums[i];
        else if (op === '-') res -= nums[i];
        else if (op === '*') res *= nums[i];
        else if (op === '/') {
            if (nums[i] === 0) { alert("División por cero"); return; }
            res /= nums[i];
        }
    }
    document.getElementById("arit-result").innerText = "Resultado: " + res;
    registrarHistorial("Aritmética", `${nums.join(` ${op} `)} = ${res}`);
}

// --- MÓDULO 4: HISTORIAL ---
function limpiarHistorial() {
    historialOperaciones.length = 0;

    // Reinicia el contador del botón superior
    const btnHist = document.getElementById("btn-toggle-historial");
    if (btnHist) btnHist.innerText = "Historial (0)";

    // Vacía tanto la pestaña de Historial como el cajón desplegable
    ["lista-historial", "lista-historial-global"].forEach(id => {
        const ul = document.getElementById(id);
        if (ul) ul.innerHTML = "";
    });
}

