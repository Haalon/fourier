import { Igloo } from '../igloo.js'

import { brushSettings } from '../brushSettings.js'

import drawFrag from '../glsl/draw.frag'
import copyFrag from '../glsl/copy.frag'
import copyVert from '../glsl/copy.vert'
import bitReverseFrag from '../glsl/bitReverse.frag'

import dftAxisFrag from '../glsl/dftAxis.frag'

import logmapFrag from '../glsl/logmap.frag'
import unpolarmapFrag from '../glsl/unpolarmap.frag'
import polarmapFrag from '../glsl/polarmap.frag'

import matrixFrag from '../glsl/matrix.frag'
import negateFrag from '../glsl/negate.frag'

export class CanvasController {
    constructor(canvas, isMain=false) {
        this.canvas = canvas;
        // set canvas size
        // currently size does not change
        // and does not depend on the screen size 
        this.dimension = 512;
        this.canvas.width = this.dimension;
        this.canvas.height = this.dimension;

        this.viewsize = new Float32Array([this.canvas.width, this.canvas.height]);

        // preserveDrawingBuffer allows us to take screenshots
        const gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
        if (!gl) {
            alert('Your device does not support webgl2')
            throw new Error('no webgl2');
        }

        this.gl = gl

        let ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
            alert("need EXT_color_buffer_float");
            return;
        }

        ext = gl.getExtension('OES_texture_float_linear');
        if (!ext) {
            alert("need WEBGL_color_buffer_float extension");
            return;
        }
        
        // do not flips images when used as input data for setImage
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this.igloo = new Igloo(gl)
        this.quad = this.igloo.array(Igloo.QUAD2);

        this.program_copy = this.igloo.program(copyVert, copyFrag);
        this.program_draw = this.igloo.program(copyVert, drawFrag);

        this.program_matrix = this.igloo.program(copyVert, matrixFrag);
        this.program_negate = this.igloo.program(copyVert, negateFrag);

        this.program_bit_reverse = this.igloo.program(copyVert, bitReverseFrag);
        this.program_logmap = this.igloo.program(copyVert, logmapFrag);
        this.program_polarmap = this.igloo.program(copyVert, polarmapFrag);
        this.program_unpolarmap = this.igloo.program(copyVert, unpolarmapFrag);

        this.program_dft_axis = this.igloo.program(copyVert, dftAxisFrag);

        this.frameBuffer = this.igloo.framebuffer();
        this.tex_main = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.LINEAR, gl.FLOAT, gl.RGBA32F)
            .blank(this.viewsize[0], this.viewsize[1]);

        this.tex_temp1 = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.LINEAR, gl.FLOAT, gl.RGBA32F)
            .blank(this.viewsize[0], this.viewsize[1]);

        if (isMain) {
            this.tex_temp2 = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.LINEAR, gl.FLOAT, gl.RGBA32F)
                .blank(this.viewsize[0], this.viewsize[1]);
            this.tex_temp3 = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.LINEAR, gl.FLOAT, gl.RGBA32F)
                .blank(this.viewsize[0], this.viewsize[1]);
            this.tex_temp4 = this.igloo.texture(null, gl.RGBA, gl.REPEAT, gl.LINEAR, gl.FLOAT, gl.RGBA32F)
                .blank(this.viewsize[0], this.viewsize[1]);
        }
        


        this.show();
        this._addEvents();
    }

    _swapTextures() {
        this.sync();
        let tmp = this.tex_main;
        this.tex_main = this.tex_temp1
        this.tex_temp1 = tmp;
    };

    _getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();

        const currentY = e.touches ?  e.touches[0].pageY : e.pageY;
        const currentX = e.touches ?  e.touches[0].pageX : e.pageX;

        const height = rect.bottom - rect.top;
        const resolutionCoeff = this.canvas.height / height;
        return [
            (currentX - rect.left) * resolutionCoeff,
            (height - (currentY - rect.top)) * resolutionCoeff,
        ];
    };

    _addEvents() {
        this.start_pos = null
        const startHandler = e => {
            e.stopPropagation();

            // in case we want pointerleave have same behaviour with mouse and touch
            // otherwise it is not fired when touch leaves the canvas
            // if (e.target.hasPointerCapture(e.pointerId)) {
            //     e.target.releasePointerCapture(e.pointerId);
            // }

            this.start_pos = this._getMousePos(e);
            this.draw(this.start_pos, this.start_pos, brushSettings.color, brushSettings.size, brushSettings.mode);
        }
        this.canvas.addEventListener('pointerdown', startHandler)

        const moveHandler = e => {
            e.stopPropagation();
            if (!this.start_pos) return;
            const end_pos = this._getMousePos(e);
            this.draw(this.start_pos, end_pos, brushSettings.color, brushSettings.size, brushSettings.mode);
            this.start_pos = end_pos;
        }
        this.canvas.addEventListener('pointermove', moveHandler)

        const endHandler = e => {
            e.stopPropagation();
            if (!this.start_pos) return;
            
            if (this.drawHook && this.start_pos) {
                this.sync();
                this.drawHook(this);
            }
            this.start_pos = null;
        }
        
        this.canvas.addEventListener('pointerup', endHandler)
        this.canvas.addEventListener('pointerleave', endHandler)
    }

    sync() {
        this.gl.finish();
    }

    getArray(texture, width, height, format) {
        this.sync();
        const gl = this.gl;
        width = width ?? this.viewsize[0];
        height = height ?? this.viewsize[1];
        format = format ?? gl.RGBA;
        
        texture = texture ? texture : this.tex_main;

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
    
        // Read the contents of the framebuffer
        const data = new Float32Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);

        return data;
    }

    _operation(program, f_args={}, i_args={}, m_args={}, inPlace=true) {
        this.sync();
        const gl = this.gl;
        this.frameBuffer.attach(this.tex_temp1);
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        this.tex_main.bind(0);
        program = program.use()
            .attrib('a_position', this.quad, 2)
            .uniformi('u_texture', 0)
            .uniform('screenSize', this.viewsize);

        for (const [key, val] of Object.entries(f_args)) 
            program = program.uniform(key, val);

        for (const [key, val] of Object.entries(i_args)) 
            program = program.uniformi(key, val);

        for (const [key, val] of Object.entries(m_args)) 
            program = program.matrix(key, val);

        program.draw(gl.TRIANGLE_STRIP, 4);
        
        if (!inPlace) {
            return this.getArray(this.tex_temp1);
        }

        this._swapTextures();
        this.show();
    }

    draw(from, to, col=null, rad=5, mode=2, inPlace=true) {
        from = new Float32Array(from);
        to = new Float32Array(to);

        col = col ? new Float32Array(col) : new Float32Array([0,0,0,1]);
        col = col.length == 3 ? new Float32Array([...col ,1]) : col;

        return this._operation(this.program_draw, {
            u_org: from,
            u_end: to,
            u_col: col,
            u_rad: rad-1,
        }, {u_mode: mode}, {}, inPlace);
    }

    shift(dx, dy, inPlace=true) {
        const u_offset = new Float32Array([dx, dy]);
        return this._operation(this.program_copy, {u_offset}, {}, {}, inPlace);
    }

    bitReverse(inPlace=true) {
        return this._operation(this.program_bit_reverse, {}, {}, {}, inPlace);
    }

    flipY(inPlace=true) {
        const u_matrix = [
            1, 0,
            0, -1
        ];
        return this._operation(this.program_matrix, {}, {}, {u_matrix}, inPlace);
    }

    flipX(inPlace=true) {
        const u_matrix = [
            -1, 0,
            0, 1
        ];
        return this._operation(this.program_matrix, {}, {}, {u_matrix}, inPlace);
    }

    rotateLeft(inPlace=true) {
        const u_matrix = [
            0, -1,
            1, 0
        ];
        return this._operation(this.program_matrix, {}, {}, {u_matrix}, inPlace);
    }

    rotateRight(inPlace=true) {
        const u_matrix = [
            0, 1,
            -1, 0
        ];
        return this._operation(this.program_matrix, {}, {}, {u_matrix}, inPlace);
    }

    zoom(scale, inPlace=true) {
        const u_matrix = [
            scale, 0,
            0, scale
        ];
        return this._operation(this.program_matrix, {}, {}, {u_matrix}, inPlace);
    }

    negate(inPlace=true) {
        return this._operation(this.program_negate, {}, {}, {}, inPlace);
    }

    show() {
        this.sync();
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
        function arrayMax(arr) {
            let len = arr.length, max = -Infinity;
            while (len--) {
              if (arr[len] > max) {
                max = arr[len];
              }
            }
            return max;
        };
        const gl = this.gl;
        this.tex_temp3.blank(this.dimension, this.dimension);
        // run dft on one axis
        this.frameBuffer.attach(this.tex_temp1);    // out x
        this.frameBuffer.attach(this.tex_temp2, 1); // out y

        this.tex_main.bind(0); // in x
        this.tex_temp3.bind(1);  // no y yet
       
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1, 
          ]);

        this.program_dft_axis.use()
          .attrib('a_position', this.quad, 2)
          .uniform('screenSize', this.viewsize)
          .uniformi('u_x', 0)
          .uniformi('u_y', 1)
          .uniform('u_direction', -1)
          .uniformi('u_axis', 1)
          .uniformi('u_normalise', 0)
          .draw(gl.TRIANGLE_STRIP, 4);
        
        // run dft on other axis
        this.frameBuffer.attach(this.tex_temp3);    // out x
        this.frameBuffer.attach(this.tex_temp4, 1); // out y

        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1, 
        ]);
        this.tex_temp1.bind(0); // in x 
        this.tex_temp2.bind(1); // in y

        this.program_dft_axis.use()
          .attrib('a_position', this.quad, 2)
          .uniform('screenSize', this.viewsize)
          .uniformi('u_x', 0)
          .uniformi('u_y', 1)
          .uniform('u_direction', -1)
          .uniformi('u_axis', 0)
          .uniformi('u_normalise', 0)
          .draw(gl.TRIANGLE_STRIP, 4);

        // x y to polar
        this.frameBuffer.attach(this.tex_temp1);    // out magn
        this.frameBuffer.attach(this.tex_temp2, 1); // out phase

        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1, 
        ]);
        this.tex_temp3.bind(0); // in x 
        this.tex_temp4.bind(1); // in y

        this.program_polarmap.use()
          .attrib('a_position', this.quad, 2)
          .uniform('screenSize', this.viewsize)
          .uniformi('u_x', 0)
          .uniformi('u_y', 1)
          .draw(gl.TRIANGLE_STRIP, 4);

        // find maixmum
        // only a 1/64th of the whole texture, because maximum is usually in the center (0,0) anyway
        const magnSample = this.getArray(this.tex_temp1, Math.floor(this.dimension/8), Math.floor(this.dimension/8), gl.RGB);
        this.maxval = arrayMax(magnSample);
        const phase = this.getArray(this.tex_temp2);

        gl.deleteFramebuffer(this.frameBuffer.framebuffer);
        this.frameBuffer = this.igloo.framebuffer();
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        this.frameBuffer.attach(this.tex_temp2);
        this.tex_temp1.bind(0);
        this.program_logmap.use()
            .attrib('a_position', this.quad, 2)
            .uniform('screenSize', this.viewsize)
            .uniform('u_maxval', this.maxval)
            .uniformi('u_texture', 0)
            .draw(gl.TRIANGLE_STRIP, 4);

        const magnitude = this.getArray(this.tex_temp2);

        return {magnitude, phase};
    }

    idft(magn, phase) {
        const gl = this.gl;
        this.tex_temp1.set(magn, this.viewsize[0], this.viewsize[1]);
        this.tex_temp2.set(phase, this.viewsize[0], this.viewsize[1]);

        // from magnitude and phase to x and y     
        this.frameBuffer.attach(this.tex_temp3);
        this.frameBuffer.attach(this.tex_temp4, 1);
  
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1, 
          ]);
        this.tex_temp1.bind(0);
        this.tex_temp2.bind(1);
        this.program_unpolarmap.use()
            .attrib('a_position', this.quad, 2)
            .uniform('screenSize', this.viewsize)
            .uniformi('u_magn', 0)
            .uniformi('u_phase', 1)
            .uniform('u_maxval', this.maxval)
            .draw(gl.TRIANGLE_STRIP, 4);
        

        // run dft on one axis
        this.frameBuffer.attach(this.tex_temp1);
        this.frameBuffer.attach(this.tex_temp2, 1);

        this.tex_temp3.bind(0); // x
        this.tex_temp4.bind(1); // y
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1, 
          ]);

        this.program_dft_axis.use()
          .attrib('a_position', this.quad, 2)
          .uniform('screenSize', this.viewsize)
          .uniformi('u_x', 0)
          .uniformi('u_y', 1)
          .uniform('u_direction', 1)
          .uniformi('u_axis', 1)
          .uniformi('u_normalise', 1)
          .draw(gl.TRIANGLE_STRIP, 4);

        // run dft on other axis
        this.frameBuffer.attach(this.tex_main);
        this.frameBuffer.attach(this.tex_temp4, 1);

        this.tex_temp1.bind(0); // x
        this.tex_temp2.bind(1); // y
        gl.viewport(0, 0, this.viewsize[0], this.viewsize[1]);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1, 
          ]);

        this.program_dft_axis.use()
          .attrib('a_position', this.quad, 2)
          .uniform('screenSize', this.viewsize)
          .uniformi('u_x', 0)
          .uniformi('u_y', 1)
          .uniform('u_direction', 1)
          .uniformi('u_axis', 0)
          .uniformi('u_normalise', 1)
          .draw(gl.TRIANGLE_STRIP, 4);

        gl.deleteFramebuffer(this.frameBuffer.framebuffer);
        this.frameBuffer = this.igloo.framebuffer();
        this.show();

    }

    setImage(img) {
        this.sync();
        this.tex_main.set(img, this.dimension, this.dimension);
        this.show();
    }

    getImage() {
        const img = new Image();
        const url = this.canvas.toDataURL("image/png");
        img.src = url;
        return img;
    }
}