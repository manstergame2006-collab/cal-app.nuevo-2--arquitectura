// =========================================================================
// WORKER DE CÁLCULO PESADO Y SEGURO (calc.worker.js)
// =========================================================================
const PATRON_SEGURO = /([0-9x+\-*/().^\s]|sin|cos|tan|sqrt|log|exp|abs|PI|E)/g;

function compilarFuncionSegura(expresion) {
    if (!expresion || typeof expresion !== 'string') {
        throw new Error('La expresión está vacía.');
    }
    const residuos = expresion.replace(PATRON_SEGURO, '');
    if (residuos.length > 0) {
        throw new Error(`Caracteres no permitidos: "${residuos}"`);
    }

    const jsExpr = expresion
        .replace(/\*\*/g, '^')
        .replace(/\^/g, '**')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bPI\b/g, 'Math.PI')
        .replace(/\bE\b/g, 'Math.E');

    return new Function('x', `"use strict"; return (${jsExpr});`);
}

// Parseador flexible: soporta "1, 2; 3, 4, 5" (asimétricas/rectangulares) o "1, 2, 3, 4" (cuadrada 2x2)
function parsearMatriz(texto) {
    if (!texto || !texto.trim()) throw new Error("La matriz está vacía.");
    
    if (texto.includes(';')) {
        const filas = texto.split(';').map(f => 
            f.trim().split(',').map(n => {
                const val = parseFloat(n.trim());
                if (isNaN(val)) throw new Error("Valores inválidos en la matriz.");
                return val;
            })
        );
        const cols = filas[0].length;
        if (filas.some(f => f.length !== cols)) {
            throw new Error("Todas las filas deben tener la misma cantidad de columnas.");
        }
        return filas;
    } else {
        const nums = texto.split(',').map(n => parseFloat(n.trim()));
        if (nums.some(isNaN)) throw new Error("Asegúrate de ingresar solo números separados por comas.");
        const n = Math.sqrt(nums.length);
        if (!Number.isInteger(n)) {
            throw new Error("Para matrices rectangulares/asimétricas usa ';' para separar filas (ej: 1, 2, 3; 4, 5, 6).");
        }
        const matriz = [];
        for (let i = 0; i < n; i++) {
            matriz.push(nums.slice(i * n, (i + 1) * n));
        }
        return matriz;
    }
}

function determinante(M) {
    const n = M.length;
    if (n !== M[0].length) throw new Error("El determinante solo existe para matrices cuadradas.");
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    let det = 0;
    for (let j = 0; j < n; j++) {
        const sub = M.slice(1).map(fila => fila.filter((_, col) => col !== j));
        det += ((j % 2 === 0 ? 1 : -1) * M[0][j] * determinante(sub));
    }
    return det;
}

self.onmessage = function(e) {
    const { modulo, payload } = e.data;

    try {
        // --- CÁLCULOS DE ÁLGEBRA Y CÁLCULO ---
        if (modulo === 'integral') {
            const { fExpr, a, b } = payload;
            const fn = compilarFuncionSegura(fExpr);
            const nSteps = 2000;
            const dx = (b - a) / nSteps;
            let suma = 0;
            for (let i = 0; i < nSteps; i++) {
                const y = fn(a + (i + 0.5) * dx);
                if (Number.isFinite(y)) suma += y * dx;
            }
            self.postMessage({ exito: true, modulo, valor: suma.toFixed(6) });
        }

        else if (modulo === 'volumen') {
            const { fExpr, a, b } = payload;
            const fn = compilarFuncionSegura(fExpr);
            const pasos = 2000;
            const dx = (b - a) / pasos;
            let suma = 0;
            for (let i = 0; i <= pasos; i++) {
                const y = fn(a + i * dx);
                if (!Number.isFinite(y)) continue;
                const y2 = y * y;
                suma += (i === 0 || i === pasos) ? y2 / 2 : y2;
            }
            self.postMessage({ exito: true, modulo, valor: (Math.PI * suma * dx).toFixed(6) });
        }

        else if (modulo === 'cascarones') {
            const { fExpr, a, b } = payload;
            const fn = compilarFuncionSegura(fExpr);
            const nSteps = 2000;
            const dx = (b - a) / nSteps;
            let suma = 0;
            for (let i = 0; i < nSteps; i++) {
                const xMid = a + (i + 0.5) * dx;
                const y = fn(xMid);
                if (Number.isFinite(y)) suma += 2 * Math.PI * xMid * y * dx;
            }
            self.postMessage({ exito: true, modulo, valor: suma.toFixed(6) });
        }

        else if (modulo === 'area') {
            const { fExpr, gExpr, a, b } = payload;
            const fnF = compilarFuncionSegura(fExpr);
            const fnG = compilarFuncionSegura(gExpr);
            const nSteps = 2000;
            const dx = (b - a) / nSteps;
            let area = 0;
            for (let i = 0; i < nSteps; i++) {
                const xMid = a + (i + 0.5) * dx;
                const yF = fnF(xMid);
                const yG = fnG(xMid);
                if (Number.isFinite(yF) && Number.isFinite(yG)) {
                    area += Math.abs(yF - yG) * dx;
                }
            }
            self.postMessage({ exito: true, modulo, valor: area.toFixed(6) });
        }

        // --- CÁLCULO DE MATRICES (CUADRADAS Y ASIMÉTRICAS) ---
        else if (modulo === 'matrices') {
            const { operacion, textoA, textoB } = payload;
            const A = parsearMatriz(textoA);
            let resultadoTexto = "";

            if (operacion === 'det') {
                const d = determinante(A);
                resultadoTexto = `Determinante de A (${A.length}x${A[0].length}): ${d.toFixed(4)}`;
            } 
            else if (operacion === 'transpuesta' || operacion === 'antisimetrica') {
                const AT = A[0].map((_, col) => A.map(fila => fila[col]));
                const esCuadrada = A.length === A[0].length;
                let esAntisimetrica = esCuadrada;
                if (esCuadrada) {
                    for (let i = 0; i < A.length; i++) {
                        for (let j = 0; j < A[0].length; j++) {
                            if (A[i][j] !== -AT[i][j]) esAntisimetrica = false;
                        }
                    }
                }
                const formato = AT.map(f => `[ ${f.join(', ')} ]`).join('\n');
                resultadoTexto = `Transpuesta Aᵀ (${AT.length}x${AT[0].length}):\n${formato}\n` +
                                 `¿Es antisimétrica (Aᵀ = -A)?: ${esAntisimetrica ? 'SÍ' : 'NO'}`;
            }
            else {
                const B = parsearMatriz(textoB);
                if (operacion === 'suma') {
                    if (A.length !== B.length || A[0].length !== B[0].length) {
                        throw new Error(`Dimensiones incompatibles para suma: A(${A.length}x${A[0].length}) y B(${B.length}x${B[0].length}).`);
                    }
                    const C = A.map((fila, i) => fila.map((val, j) => val + B[i][j]));
                    resultadoTexto = `Suma A + B (${C.length}x${C[0].length}):\n` + C.map(f => `[ ${f.join(', ')} ]`).join('\n');
                } 
                else if (operacion === 'mult') {
                    if (A[0].length !== B.length) {
                        throw new Error(`No se puede multiplicar: columnas de A (${A[0].length}) ≠ filas de B (${B.length}).`);
                    }
                    const C = Array.from({ length: A.length }, (_, i) =>
                        Array.from({ length: B[0].length }, (_, j) =>
                            A[i].reduce((acc, val, k) => acc + val * B[k][j], 0)
                        )
                    );
                    resultadoTexto = `Producto A × B (${C.length}x${C[0].length}):\n` + C.map(f => `[ ${f.join(', ')} ]`).join('\n');
                }
            }
            self.postMessage({ exito: true, modulo, valor: resultadoTexto });
        }
    } catch (err) {
        self.postMessage({ exito: false, error: err.message });
    }
};
