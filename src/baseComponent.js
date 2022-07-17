

export class BaseComponent extends HTMLElement {
    #getElementsWithId() {

        const res = {}
        const elems = this.shadowRoot.querySelectorAll('[id]')
    
        for (const el of elems)
            res[el.id] = el
    
    
        return res;
    }

    get css() {
        return /*css*/``;
    }

    get html() {
        return  /*html*/``;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.html;
        this.elems = this.#getElementsWithId();
    }
}