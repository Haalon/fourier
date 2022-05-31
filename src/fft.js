
export function CAdd(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}

export function CSub(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
}

export function CMul(a, b) {
    return [(a[0] * b[0] - a[1] * b[1]),
    (a[0] * b[1] + a[1] * b[0])];
}

export function CMagn(c) {
    return Math.sqrt(c[0] * c[0] + c[1] * c[1]);
}

export function CPhase(c) {
    return Math.atan2(c[1], c[0]);
}

export function CExp(c) {
    const coef = Math.exp(c[0]);
    return [coef * Math.cos(c[1]), coef * Math.sin(c[1])]
}



export function dft(arr, dir=-1) {
    const length = arr.length;
    const res = [];

    for (let i = 0; i < length; i++) {
        res[i] = [0, 0];
        for (let k = 0; k < length; k++) {
            const pow = dir * Math.PI * 2 / length * k * i;
            const term = arr[k]?.length ? arr[k] : [arr[k], 0];

            const temp = CMul(term, CExp([0, pow]))
            res[i] = CAdd(res[i], temp);
        }
    }

    return res;
}

export function fft(arr, dir=-1, norm=false) {
    function even(__, ix) {
        return ix % 2 == 0;
    }

    function odd(__, ix) {
        return ix % 2 == 1;
    }

    const length = arr.length;
    const mult = norm ? [1/length, 0] : [1,0];
    const res = [];

    if (length == 1) {
        return arr[0]?.length ? [arr[0]] : [[arr[0], 0]];
    }

    // recursion
    const res_evens = fft(arr.filter(even));
    const res_odds = fft(arr.filter(odd));

    // Now, perform N/2 operations!
    for (var k = 0; k < length / 2; k++) {
        const pow = dir * Math.PI * 2 / length * k;

        // t is a complex number!
        const t = res_evens[k];
        const e = CMul(CExp([0,pow]), res_odds[k]);

        res[k] = CMul(CAdd(t, e), mult);
        res[k + (length / 2)] = CMul(CSub(t, e), mult);
    }

    return res;
}

export function fftPixelData(data,w,h, dir=-1, norm=false) {
    const chan = 4;
    function getElem(i,j,c) {
        return data[i*w*chan + j*chan + c]
    }

    function setElem(arr, i,j,c, val) {
        arr[i*w*chan + j*chan + c] = val;
    }

    function getChanRow(i, c) {
        const res = []
        for (let j = 0; j < w; j++) {
            res[j] = getElem(i,j,c)
        }

        return res;
    }

    function logMap(x, max=1) {
        return Math.log(1+x)/Math.log(1+max)
    }
    
    const magnitude = new Float32Array(data);
    const phase = new Float32Array(data);
    const res = [];

    let maxMagn = 0;
    for(let c = 0; c < 3; c++)
    {
        const temp = [];
        for (let i = 0; i < h; i++) {
            const line = getChanRow(i,c);
            const f_line = fft(line, dir, norm);
            temp.push(f_line);
        }

        const getCol = j => {
            const res = [];
            for (let i = 0; i < h; i++) {
                res[i] = temp[i][j]
            }

            return res;
        }

        const temp2 = []
        for (let j = 0; j < w; j++) {
            const col = getCol(j);
            const f_col = fft(col, dir, norm);
            temp2.push(f_col);

            const colMagnMax = Math.max(...col.map(CMagn));
            if (colMagnMax > maxMagn) maxMagn = colMagnMax;
        }
        res.push(temp2)
    }

    for(let c = 0; c < 3; c++)
        for (let j = 0; j < w; j++)
            for (let i = 0; i < h; i++) {
                const item = res[c][j][i];
                const phaseVal = CPhase(item);
                const magnVal = CMagn(item)
                // correct phase so it can be an image
                const phaseCorrected = (phaseVal + Math.PI) / Math.PI / 2;
                setElem(magnitude, i,j,c, logMap(magnVal, maxMagn))
                setElem(phase, i,j,c, phaseCorrected)
            }


    return {magnitude, phase};
}


