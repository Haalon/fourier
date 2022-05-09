
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