var Terminal = function() {
    var termdata = [];
    var fontimg;
    var ctx;
    var fontloaded = false;
    var yLut = [];
    var colorLutX = [];
    var colorLutY = [];
    var glyphLutX = [];
    var glyphLutY = [];
    var termWidth = 60;
    var termHeight = 25;
    var term = this;
    
    this.setupTerminal = function() {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        fontimg = new Image();
        fontimg.src = 'font.png';
        fontimg.onload = function() {
            fontloaded = true;
        }
        
        for (var y=0; y<termHeight; y++) yLut[y] = y*termWidth;
        
        for (var y=0; y<termHeight; y++) {
            for (var x=0; x<termWidth; x++) {
                termdata[x + yLut[y]] = { ch:0, fg:0, bg:0 };
            }
        }
        
        for (var fg=0; fg<16; fg++) {
            fgX = (fg & 3) * 288;
            fgY = (fg >> 2) * 128;
            colorLutX[fg] = fgX;
            colorLutY[fg] = fgY;
        }
        
        for (var ch=0; ch<256; ch++) {
            var px = (ch & 31) * 9;
            var py = (ch >> 5) * 16;
            glyphLutX[ch] = px;
            glyphLutY[ch] = py;
        }
            
    }
    
    this.clear = function() {
        var n=0;
        for (var y=0; y<termHeight; y++) {
            for (var x=0; x<termWidth; x++,n++) {
                this.drawCharacter(x,y,0,0);
            }
        }
    }
    
    this.drawCharacter = function(x,y,ch,color) {
        var fg = color & 15;
        var bg = (color >> 4) & 15;
        var offset = x + yLut[y];
        termdata[offset].ch = ch;
        termdata[offset].fg = fg;
        termdata[offset].bg = bg;
        
        var px = x * 9;
        var py = y << 4;
        
        ctx.drawImage(fontimg, colorLutX[bg] + glyphLutX[219], colorLutY[bg] + glyphLutY[219], 9, 16, px, py, 9, 16);
        ctx.drawImage(fontimg, colorLutX[fg] + glyphLutX[ch],  colorLutY[fg] + glyphLutY[ch],  9, 16, px, py, 9, 16);
    }
}   