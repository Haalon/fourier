import { Igloo } from './igloo.js'

import drawFrag from './glsl/draw.frag'
import copyFrag from './glsl/copy.frag'
import copyVert from './glsl/copy.vert'
import bitReverseFrag from './glsl/bitReverse.frag'
import dftFrag from './glsl/dft.frag'

export class CanvasController {
    constructor(canvas, drawHook) {
        this.canvas = canvas;
        this.drawHook = drawHook;
        this.viewsize = new Float32Array([canvas.width, canvas.height]);

        var gl = canvas.getContext("webgl2");
        if (!gl) {
            throw new Error('no webgl2')
        }

        this.gl = gl
        // const floattext = gl.getExtension('OES_texture_float');
        // if (!floattext) {
        //     alert('no floating textures')
        // }
        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
            alert("need EXT_color_buffer_float");
            return;
        }
        gl.getExtension('WEBGL_color_buffer_float');
        
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this.igloo = new Igloo(gl)
        this.quad = this.igloo.array(Igloo.QUAD2);

        this.program_copy = this.igloo.program(copyVert, copyFrag);
        this.program_draw = this.igloo.program(copyVert, drawFrag);

        this.program_bit_reverse = this.igloo.program(copyVert, bitReverseFrag);
        this.program_dft = this.igloo.program(copyVert, dftFrag);

        this.frameBuffer = this.igloo.framebuffer();
        this.tex_main = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST, gl.FLOAT, gl.RGBA32F)
            .blank(this.viewsize[0], this.viewsize[1]);

        this.tex_temp1 = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST, gl.FLOAT, gl.RGBA32F)
            .blank(this.viewsize[0], this.viewsize[1]);
        this.tex_temp2 = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST, gl.FLOAT, gl.RGBA32F)
            .blank(this.viewsize[0], this.viewsize[1]);


        this.show();
        this._addEvents();
    }

    _swapTextures() {
        var tmp = this.tex_main;
        this.tex_main = this.tex_temp1
        this.tex_temp1 = tmp;
    };

    _getMousePos(event) {
        var rect = this.canvas.getBoundingClientRect();
        return [
            (event.pageX - rect.left),
            (this.canvas.height - (event.pageY - rect.top)),
        ];
    };

    _addEvents() {
        this.start_pos = null
        this.canvas.addEventListener('mousedown', e => {
            e.stopPropagation();
            this.start_pos = this._getMousePos(e)
        })
        this.canvas.addEventListener('mousemove', e => {
            e.stopPropagation();
            if (!this.start_pos) return;
            const end_pos = this._getMousePos(e);
            this.draw(this.start_pos, end_pos);
            this.start_pos = end_pos;
        })
        this.canvas.addEventListener('mouseup', e => {
            e.stopPropagation();
            
            if (this.drawHook && this.start_pos) this.drawHook(this);
            this.start_pos = null;
        })

        this.canvas.addEventListener('mouseleave', e => {
            e.stopPropagation();
           
            if (this.drawHook && this.start_pos) this.drawHook(this);
            this.start_pos = null;
        })
    }

    sync() {
        this.gl.finish();
    }

    getArray(swapTextures=false) {
        const gl = this.gl;
        const texture = swapTextures ? this.tex_temp1 : this.tex_main;
        const [width, height] = this.viewsize;

        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
    
        // Read the contents of the framebuffer
        var data = new Float32Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);

        return data;
    }

    _operation(program, args={}, intUniforms=[], inPlace=true) {
        const gl = this.gl;
        this.frameBuffer.attach(this.tex_temp1);
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        this.tex_main.bind(0);
        program = program.use()
            .attrib('a_position', this.quad, 2)
            .uniformi('u_texture', 0)
            .uniform('screenSize', this.viewsize);

        for (const [key, val] of Object.entries(args)) {
            if (intUniforms.includes(key)) program = program.uniformi(key, val);
            else program = program.uniform(key, val);
        }

        program.draw(gl.TRIANGLE_STRIP, 4);
        if (!inPlace) {
            return this.getArray(true);
        }

        this._swapTextures();
        this.show();
    }

    draw(from, to, col=null, rad=5, mode=2, inPlace=true) {
        from = new Float32Array(from);
        to = new Float32Array(to);
        col = col ? new Float32Array(col) : new Float32Array([1,1,1,1]);

        return this._operation(this.program_draw, {
            u_org: from,
            u_end: to,
            u_col: col,
            u_rad: rad-1,
            u_mode: mode
        }, ['u_mode'], inPlace);
    }

    shift(dx, dy, inPlace=true) {
        const u_offset = new Float32Array([dx, dy]);
        return this._operation(this.program_copy, {u_offset}, [], inPlace);
    }

    bitReverse(inPlace=true) {
        return this._operation(this.program_bit_reverse, {}, [], inPlace);
    }

    show() {
        const gl = this.gl
        this.igloo.defaultFramebuffer.bind();
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        this.tex_main.bind(0);
        this.program_copy.use()
            .attrib('a_position', this.quad, 2)
            .uniform('u_offset', new Float32Array([0, 0]))
            .uniform('screenSize', this.viewsize)
            .uniformi('u_texture', 0)
            .draw(gl.TRIANGLE_STRIP, 4);
    }


    dft() {
        const magnitude = this._operation(this.program_dft, {
            u_direction: -1,
            u_normalise: 0,
            u_mode: 1
        }, ['u_normalise', 'u_mode'], false);

        const phase = this._operation(this.program_dft, {
            u_direction: -1,
            u_normalise: 0,
            u_mode: 0
        }, ['u_normalise', 'u_mode'], false);

        return {magnitude, phase};
    }

    setImage(img, w, h) {
        this.tex_main.set(img, w, h);
        this.show();
    }
}