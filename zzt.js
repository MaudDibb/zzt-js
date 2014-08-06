function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function parseTiles(data) {
    var tileData = [];
    var n = 0;

    while (n < 1500) {
        var count = data.getUint8(),
            code = data.getUint8(),
            color = data.getUint8();

        if (count == 0) count = 256;
        
        for (var x=0; x<count; x++) {
            tileData[n++] = {code:code, color:color};
        }
    }

    return tileData;
}

var ZZTObject = function(data) {
    this.x = data.getUint8();
    this.y = data.getUint8();
    this.xStep = data.getInt16();
    this.yStep = data.getInt16();
    this.cycle = data.getInt16();
    this.p1 = data.getUint8();
    this.p2 = data.getUint8();
    this.p3 = data.getUint8();
    this.follower = data.getInt16();
    this.leader = data.getInt16();
    this.underTile = data.getUint8();
    this.underColor = data.getUint8();
    this.pointer = data.getInt32();
    this.curInstruction = data.getInt16();
    this.length = data.getInt16();
    padding = data.getString(8);
    this.program = this.length > 0 ? data.getString(this.length) 
                 : this.length < 0 ? 'object|' + Math.abs(this.length) 
                 : '';
}

var ZZTBoard = function(data) {
    var position = data.tell();
    var size = data.getInt16();
    
    this.titleLength = data.getUint8();
    this.title = data.getString(50);
    this.tiles = parseTiles(data);
    this.maxPlayerShots = data.getUint8();
    this.isDark = data.getUint8() == 1 ? true : false;
    this.exitNorth = data.getUint8();
    this.exitSouth = data.getUint8();
    this.exitWest = data.getUint8();
    this.exitEast = data.getUint8();
    this.restartOnZap = data.getUint8() == 1 ? true : false;
    this.messageLength = data.getUint8();
    this.message = data.getString(58);
    this.enterX = data.getUint8();
    this.enterY = data.getUint8();
    this.timeLimit = data.getInt16();
    padding = data.getString(16);
    this.numObjects = data.getInt16() + 1; // player object not included in count
    this.objects = [];
    this.objectMap = {};
    
    for (var n=0; n<this.numObjects; n++) {
        var obj = new ZZTObject(data);
        this.objects[n] = obj;
        var pos = obj.x + (obj.y * 60);
        this.objectMap[pos] = obj;
    }
    
    this.getObjectAt = function(ox, oy) {
        var pos = ox + (oy * 60);
        return this.objectMap[pos];
    };
    
    this.update = function() {
        for (var n=0; n<this.numObjects; n++) {
            var obj = this.objects[n];
            var termX = obj.x - 1;
            var termY = obj.y - 1;
            var pos = termX + termY * 60;
            var tile = this.tiles[pos].code;
            
            switch (tile) {
                case 0x1e:  obj.p3++;
                            if (obj.p3 > obj.cycle) {
                                obj.p3 = 0;
                                obj.p1 = (obj.p1 + 1) & 3;
                                var el = terminal.getCharacterAt(termX, termY);
                                if (obj.xStep < 0) {
                                    switch (obj.p1) {
                                        case 0: el.code = 0x3c; break;
                                        case 1: el.code = 0x28; break;
                                        case 2: el.code = 0xb3; break;
                                        case 3: el.code = 0x28; break;
                                    }
                                }
                                if (obj.xStep > 0) {
                                    switch (obj.p1) {
                                        case 0: el.code = 0x3e; break;
                                        case 1: el.code = 0x29; break;
                                        case 2: el.code = 0xb3; break;
                                        case 3: el.code = 0x29; break;
                                    }
                                }
                                if (obj.yStep < 0) {
                                    switch (obj.p1) {
                                        case 0: el.code = 0x5e; break;
                                        case 1: el.code = 0x7e; break;
                                        case 2: el.code = 0x2d; break;
                                        case 3: el.code = 0x7e; break;
                                    }
                                }
                                if (obj.yStep > 0) {
                                    switch (obj.p1) {
                                        case 0: el.code = 0x76; break;
                                        case 1: el.code = 0x7e; break;
                                        case 2: el.code = 0x2d; break;
                                        case 3: el.code = 0x7e; break;
                                    }
                                }
                                terminal.drawCharacter(termX, termY, el.code, el.color);
                            }
                            break;
                                    
                case 0x27:  obj.p3++;
                            if (obj.p3 > obj.cycle) {
                                obj.p3 = 0;
                                var el = terminal.getCharacterAt(termX, termY);
                                switch (el.code) {
                                    case 0x18: el.code = 0x1a; break;
                                    case 0x1a: el.code = 0x19; break;
                                    case 0x19: el.code = 0x1b; break;
                                    case 0x1b: el.code = 0x18; break;
                                }
                                terminal.drawCharacter(termX, termY, el.code, el.color);
                            }
                            break;
            }
        }
    };
}

var keyColors = {
    'Blue': 0,
    'Green': 1,
    'Cyan': 2,
    'Red': 3,
    'Purple': 4,
    'Yellow': 5,
    'White': 6
};
    
var ZZTWorld = function(data) {
    this.gameTimer = null;
    this.numBoards = data.getInt16() + 1; // title screen not included in board count
    this.ammo = data.getInt16();
    this.gems = data.getInt16();
    this.keys = [];
    for (var n=0; n<7; n++) {
        this.keys[n] = data.getUint8() == 1 ? true : false;
    }
    this.health = data.getInt16();
    this.startingBoard = data.getInt16();
    this.torches = data.getInt16();
    this.torchCycles = data.getInt16();
    this.energizerCycles = data.getInt16();
    var padding = data.getInt16();
    this.score = data.getInt16();
    this.titleLength = data.getUint8();
    this.title = data.getString(20);
    this.flags = [];
    for (var n=0; n<10; n++) {
        this.flags[n] = {
            length:data.getUint8(),
            text:data.getString(20)
        };
    }               
    this.timeLeft = data.getInt16();
    this.boards = [];
    
    data.seek(512); // skip to 200h for start of board data
    
    for (var n=0; n<this.numBoards; n++) {
        this.boards[n] = new ZZTBoard(data); 
    }
        
    this.showBoard = function(boardnum) {
        var n = 0;
        for (var y=0; y<25; y++) {
            for (var x=0; x<60; x++, n++) {
                el = zztElement(x,y,this.boards[boardnum]);
                terminal.drawCharacter(x, y, el.code, el.color); 
            }
        }
    }
    
    curBoard = 0;
    maxBoards = this.numBoards;
    
    $('ammo').innerHTML = this.ammo;
    $('gems').innerHTML = this.gems;
    $('health').innerHTML = this.health;
    $('torches').innerHTML = this.torches;
    
    var game = this;
    this.gametimer = setInterval(function() {
        game.update();
    }, 1000/18.2);
    
    this.update = function() {
        this.boards[curBoard].update();
    }
    
    this.stopGame = function() {
        clearInterval(this.gametimer);
    }
}    

function zztElement(x,y,board) {
    var tiles = board.tiles;
    var offset = x + y * 60;
    code = tiles[offset].code;
    color = tiles[offset].color;
    switch (code) {
        case 0x00:  code = 0x00; color = 0; break;
        case 0x01:  code = 0x00; break; // edge of board
        case 0x02:  code = 0x00; break; // messenger
        case 0x03:  code = 0x00; break; // monitor
        case 0x04:  code = 0x02; break; // player
        case 0x05:  code = 0x84; break; // ammo
        case 0x06:  code = 0x9d; break; // torch
        case 0x07:  code = 0x04; break; // gem
        case 0x08:  code = 0x0c; break; // key
        case 0x09:  code = 0x0a; break; // door
        case 0x0a:  code = 0xe8; break; // scroll
        case 0x0b:  code = 0xf0; break; // passage
        case 0x0c:  code = 0xfa; break; // duplicator
        case 0x0d:  code = 0x0b; break; // bomb
        case 0x0e:  code = 0x7f; break; // energizer
        case 0x0f:  code = 0x5c; break; // star
        case 0x10:  code = 0x5c; break; // conveyor
        case 0x11:  code = 0x5c; break; // ccw conveyor
        case 0x12:  code = 0xf8; break; // bullet
        case 0x13:  code = 0xb0; break; // water
        case 0x14:  code = 0xb0; break; // forest
        case 0x15:  code = 0xdb; break; // solid
        case 0x16:  code = 0xb2; break; // normal
        case 0x17:  code = 0xb1; break; // breakable
        case 0x18:  code = 0xfe; break; // boulder
        case 0x19:  code = 0x12; break; // ns slider
        case 0x1a:  code = 0x1d; break; // ew slider
        case 0x1b:  code = 0xb2; break; // fake wall
        case 0x1c:  code = 0x00; break; // invisible
        case 0x1d:  code = 0xce;  break; // blink wall
        case 0x1e:  var obj = board.getObjectAt(x+1, y+1); // transporter
                    if (obj.xStep < 0) code = 0x3c;
                    if (obj.xStep > 0) code = 0x3e;
                    if (obj.yStep < 0) code = 0x5e;
                    if (obj.yStep > 0) code = 0x76;
                    break; 
        case 0x1f:  offset = x + y * 60;
                    lines = 0;
                    
                    // we have logic in here so lines on board edges behave as if they continue on off the edge
                    // otherwise check if they have a neighboring line in an adjacent tile
                    lines += y == 0  ? 1 : board.tiles[offset-60].code == 0x1f ? 1 : 0; // do we have a line to the north?
                    lines += y == 24 ? 2 : board.tiles[offset+60].code == 0x1f ? 2 : 0; // do we have a line to the south?
                    lines += x == 0  ? 4 : board.tiles[offset-1].code  == 0x1f ? 4 : 0; // do we have a line to the west?
                    lines += x == 59 ? 8 : board.tiles[offset+1].code  == 0x1f ? 8 : 0; // do we have a line to the east?
                    
                    switch (lines) {
                        case 0: code = 0x3d; break;     // no neighbors
                        case 1: code = 0xd0; break;     // north
                        case 2: code = 0xd2; break;     // south
                        case 3: code = 0xba; break;     // north + south
                        case 4: code = 0xb5; break;     // west
                        case 5: code = 0xbc; break;     // north + west
                        case 6: code = 0xbb; break;     // south + west
                        case 7: code = 0xb9; break;     // north + south + west
                        case 8: code = 0xc6; break;     // east
                        case 9: code = 0xc8; break;     // north + east
                        case 10: code = 0xc9; break;    // south + east
                        case 11: code = 0xcc; break;    // north + south + east
                        case 12: code = 0xcd; break;    // east + west
                        case 13: code = 0xca; break;    // north + east + west
                        case 14: code = 0xcb; break;    // south + east + west
                        case 15: code = 0xce; break;    // north + south + east + west
                    }
                    break;
                    
        case 0x20: code = 0x2a; break; // ricochet
        case 0x21: code = 0xcd; break; // horizontal blink ray
        case 0x22: code = 0x99; break; // bear
        case 0x23: code = 0x05; break; // ruffian
        case 0x24:                     // object 
                    var obj = board.getObjectAt(x+1,y+1);
                    code = obj.p1;  
                    break;
        case 0x25: code = 0x2a; break; // slime
        case 0x26: code = 0x5e; break; // shark
        case 0x27:  switch (randomIntFromInterval(0,3)) { // spinning gun
                        case 0: code = 0x18; break; 
                        case 1: code = 0x19; break;
                        case 2: code = 0x1a; break;
                        case 3: code = 0x1b; break;
                    }
        case 0x28:  var obj = board.getObjectAt(x+1, y+1);
                    if (obj.xStep < 0) {
                        code = 0x11;
                    } else if (obj.xStep > 0) {
                        code = 0x10;
                    } else if (obj.yStep < 0) {
                        code = 0x1e;
                    } else if (obj.yStep > 0) {
                        code = 0x1f;
                    }
                    break; // pusher
        case 0x29: code = 0xea; break; // lion
        case 0x2a: code = 0xe3; break; // tiger
        case 0x2b: code = 0xba; break; // vertical blink ray
        case 0x2c: code = 0xe9; break; // centipede head
        case 0x2d: code = 0x4f; break; // centipede segment
        case 0x2f: code = color; color = 0x1f; break;   // blue bg text
        case 0x30: code = color; color = 0x2f; break;   // green bg text
        case 0x31: code = color; color = 0x3f; break;   // cyan bg text
        case 0x32: code = color; color = 0x4f; break;   // red bg text
        case 0x33: code = color; color = 0x5f; break;   // purple bg text
        case 0x34: code = color; color = 0x6f; break;   // yellow bg text
        case 0x35: code = color; color = 0x0f; break;   // white text, black bg
    }
    return {code:code,color:color};
}
        