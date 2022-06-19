import {CanvasController} from './canvasController.js'
import { loadImageByFile, resizeImage } from './imageUtils.js'
import commonCSS from '../style.css';

export class CanvasContainer extends HTMLElement {
    get css() {
        return commonCSS + /*css*/`
        `;
    }
    get html() {
        return  /*html*/`
        <div class="column flex-grow-1">
            <div class="flex-grow-1">
                <canvas width="512" height="512"></canvas>
            </div>

            <div class="row">
                <button id="save-btn">Save</button>
                <input type="file" id="file-input" accept="image/*">  
            </div>
        </div>
        `;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${this.css}</style>` + this.html;
    }

    notifyImageChange() {
        const event = new CustomEvent('image-change', {detail: {main: this.isMain}});

        document.dispatchEvent(event);
    }

    _saveImage() {
        const img = this.controller.getImage();

        const link = document.createElement("a");
        link.href = img.src;
        link.download = "image" + ".png";
        link.style.display = "none";
        const evt = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": true
        });

        document.body.appendChild(link);
        link.dispatchEvent(evt);
        document.body.removeChild(link);
    }

    async _setImage() {
        const file = this.fileInput.files[0];
        let img = await loadImageByFile(file);
        img = await resizeImage(img, 512, 512);
    
        this.controller.setImage(img);
        this.notifyImageChange();
    }

    connectedCallback() {
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.fileInput = this.shadowRoot.querySelector('#file-input');
        this.saveBtn = this.shadowRoot.querySelector('#save-btn');
        this.isMain = this.hasAttribute('is-main');

        this.controller = new CanvasController(this.canvas, this.isMain);
        
        this.controller.drawHook = () => this.notifyImageChange();
        this.fileInput.onchange = () => this._setImage();
        this.saveBtn.onclick = () => this._saveImage();
    }
}

customElements.define("canvas-container", CanvasContainer);