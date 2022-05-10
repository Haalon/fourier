
import Pica from 'pica' 

export function loadImageByUrl(url) {
    return new Promise(resolve => {
        let i = new Image();
        i.onload = (() => resolve(i));
        i.src = url;
    });
}

export function loadImageByFile(file) {
    return new Promise(resolve => {
        let reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = async () => {
            const res = await loadImageByUrl(reader.result)
            resolve(res)
        };
    })
}

export async function loadImageFromCanvas(canvas) {
    const url = canvas.toDataURL();
    return await loadImageByUrl(url);
}

export async function resizeImage(img, w, h) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const p = new Pica();
    await p.resize(img, canvas);

    return await loadImageFromCanvas(canvas)
}