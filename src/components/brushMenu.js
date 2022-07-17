import { brushSettings } from '../brushSettings.js';

import commonCSS from '../../style.css';

export class BrushMenu extends HTMLElement {
    get css() {
        return commonCSS + /*css*/`
            canvas {
                border: 1px grey solid;
            }

            button {
                width: 32px;
            }

            button[selected] {
                background-color: #999;
            }
        `;
    }
    get html() {
        return  /*html*/`
        <div id="main" class="column flex-grow-1">
            <div class="row justify-center">
                <span>Brush controls</span>
            </div>
            <div class="row justify-center">
                <span>Draw with cursor</span>
            </div>
            <div class="row justify-center">
                <span>1</span>
                <input title="Brush size" type="range" min="1" max="64" value="${brushSettings.size}" class="slider" id="size">
                <span>64</span>
            </div>

            <div class="row justify-center">
                <button title="Brush shape" selected id="mode2">●</button>
                <button title="Brush shape" id="mode1">◆</button>
                <button title="Brush shape" id="mode0">■</button>

                <input title="Brush color" type="color" value="#000" id="color">
            </div>
        </div>
        `;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.html;
    }

    getElementsWithId() {

        const res = {}
        const elems = this.shadowRoot.querySelectorAll('[id]')
    
        for (const el of elems)
            res[el.id] = el
    
    
        return res;
    }

    _selectMode(mode) {
        for (const i of [0,1,2]) {
            this.elems[`mode${i}`].removeAttribute('selected');
        }

        this.elems[`mode${mode}`].setAttribute('selected', true);
        brushSettings.mode = mode;
    }

    connectedCallback() {
        // super.connectedCallback();
        const elems = this.elems = this.getElementsWithId();

        elems.color.addEventListener("input", (e) => {
            const color = e.target.value;
            const r = parseInt(color.substr(1,2), 16) / 255;
            const g = parseInt(color.substr(3,2), 16) / 255;
            const b = parseInt(color.substr(5,2), 16) / 255;

            brushSettings.color = [r,g,b];
        });

        elems.mode0.onclick = (e) => this._selectMode(0);
        elems.mode1.onclick = (e) => this._selectMode(1);
        elems.mode2.onclick = (e) => this._selectMode(2);

        elems.size.onchange = (e) => {
            brushSettings.size = +e.target.value;
        }
    }
}

customElements.define("brush-menu", BrushMenu);