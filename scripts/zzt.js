var tileRef = {
    empty:              0x00,
    board_edge:         0x01,
    messenger:          0x02,
    monitor:            0x03,
    player:             0x04,
    ammo:               0x05,
    torch:              0x06,
    gem:                0x07,
    key:                0x08,
    door:               0x09,
    scroll:             0x0a,
    passage:            0x0b,
    duplicator:         0x0c,
    bomb:               0x0d,
    energizer:          0x0e,
    star:               0x0f,
    conveyor:           0x10,
    ccw_conveyor:       0x11,
    bullet:             0x12,
    water:              0x13,
    forest:             0x14,
    solid:              0x15,
    normal:             0x16,
    breakable:          0x17,
    boulder:            0x18,
    ns_slider:          0x19,
    ew_slider:          0x1a,
    fake_wall:          0x1b,
    invisible:          0x1c,
    blink_wall:         0x1d,
    transporter:        0x1e,
    lines:              0x1f,
    ricochet:           0x20,
    h_blink_ray:        0x21,
    bear:               0x22,
    ruffian:            0x23,
    object:             0x24,
    slime:              0x25,
    shark:              0x26,
    spinning_gun:       0x27,
    pusher:             0x28,
    lion:               0x29,
    tiger:              0x2a,
    v_blink_ray:        0x2b,
    centipede_head:     0x2c,
    centipede_seg:      0x2d,
    blue_text:          0x2f,
    green_text:         0x30,
    cyan_text:          0x31,
    red_text:           0x32,
    purple_text:        0x33,
    yellow_text:        0x34,
    white_text:         0x35,
    blink_white_text:   0x36,
    blink_blue_text:    0x37,
    blink_green_text:   0x38,
    blink_cyan_text:    0x39,
    blink_red_text:     0x3a,
    blink_purple_text:  0x3b,
    blink_yellow_text:  0x3c,
    blink_gray_text:    0x3d
}
    
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

var Vector = new Class({
    initialize: function(x, y, xStep, yStep) {
        this.x = x;
        this.y = y;
        this.xStep = xStep;
        this.yStep = yStep;
    },
    step: function() {
        this.x += this.xStep;
        this.y += this.yStep;
    }
});

// ============================================================================

var zztBaseController = new Class({
    initialize: function() {
        this.x = 0;
        this.y = 0;
        this.xStep = 0;
        this.yStep = 0;
        this.cycle = 1;
        this.p1 = 0;
        this.p2 = 0;
        this.p3 = 0;
        this.follower = -1;
        this.leader = -1;
        this.underTile = 0;
        this.underColor = 0;
        this.pointer = 0;
        this.curInstruction = 0;
        this.length = 0;
        this.program = '';
    },
    parseStats: function(data) {
        if (data) {
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
            var padding = data.getString(8);
            this.program = this.length > 0 ? data.getString(this.length) 
                         : this.length < 0 ? 'object|' + Math.abs(this.length) 
                         : '';
        } 
    },
    update: function() {}
});

// ============================================================================

var zztScroll = new Class({
    Implements: zztBaseController,
    update: function() {
        var termX = this.x - 1,
            termY = this.y - 1;
    
        var el = terminal.getCharacterAt(termX, termY);
        var fg = el.color & 15;
        fg++; 
        if (fg > 15) fg = 9;
        
        el.color = (el.color & 0xf0) | fg;
        terminal.drawCharacter(termX, termY, el.code, el.color);
    }
});

// ============================================================================

var zztConveyor = new Class({
    Implements: zztBaseController,
    update: function() {
        var termX = this.x - 1,
            termY = this.y - 1;
        
        if (this.p3 >= this.cycle) {
            this.p3 = 0;
            var el = terminal.getCharacterAt(termX, termY);
            switch (this.p1) {
                case 0: el.code = 0xb3; break;
                case 1: el.code = 0x2f; break;
                case 2: el.code = 0x2d; break;
                case 3: el.code = 0x5c; break;
            }
            
            terminal.drawCharacter(termX, termY, el.code, el.color);
            this.p1 = (this.p1 + 1) & 3;
        }
        this.p3++;
    }
});

// ============================================================================

var zztConveyorCCW = new Class({
    Implements: zztBaseController,
    update: function() {
        var termX = this.x - 1,
            termY = this.y - 1;
        
        if (this.p3 >= this.cycle) {
            this.p3 = 0;
            this.p1 = (this.p1 + 1) & 3;
            var el = terminal.getCharacterAt(termX, termY);
            switch (this.p1) {
                case 0: el.code = 0x2d; break;
                case 1: el.code = 0x2f; break;
                case 2: el.code = 0xb3; break;
                case 3: el.code = 0x5c; break;
            }
            terminal.drawCharacter(termX, termY, el.code, el.color);
        }
        this.p3++;
    }
});

// ============================================================================

var zztTransporter = new Class({
    Implements: zztBaseController,
    update: function() {
        var termX = this.x - 1,
            termY = this.y - 1;
            
        if (this.p3 >= this.cycle) {
            this.p3 = 0;
            this.p1 = (this.p1 + 1) & 3;
            var el = terminal.getCharacterAt(termX, termY);
            if (this.xStep < 0) {
                switch (this.p1) {
                    case 0: el.code = 0x3c; break;
                    case 1: el.code = 0x28; break;
                    case 2: el.code = 0xb3; break;
                    case 3: el.code = 0x28; break;
                }
            }
            if (this.xStep > 0) {
                switch (this.p1) {
                    case 0: el.code = 0x3e; break;
                    case 1: el.code = 0x29; break;
                    case 2: el.code = 0xb3; break;
                    case 3: el.code = 0x29; break;
                }
            }
            if (this.yStep < 0) {
                switch (this.p1) {
                    case 0: el.code = 0x5e; break;
                    case 1: el.code = 0x2d; break;
                    case 2: el.code = 0x5f; break;
                    case 3: el.code = 0x2d; break;
                }
            }
            if (this.yStep > 0) {
                switch (this.p1) {
                    case 0: el.code = 0x76; break;
                    case 1: el.code = 0x2d; break;
                    case 2: el.code = 0x7e; break;
                    case 3: el.code = 0x2d; break;
                }
            }
            terminal.drawCharacter(termX, termY, el.code, el.color);
        }
        this.p3++;
    }
});

// ============================================================================

var zztSpinningGun = new Class({
    Implements: zztBaseController,
    update: function() {
        var termX = this.x - 1,
            termY = this.y - 1;

        this.p3++;
        if (this.p3 >= this.cycle) {
            this.p3 = 0;
            var el = terminal.getCharacterAt(termX, termY);
            switch (el.code) {
                case 0x18: el.code = 0x1a; break;
                case 0x1a: el.code = 0x19; break;
                case 0x19: el.code = 0x1b; break;
                case 0x1b: el.code = 0x18; break;
            }
            terminal.drawCharacter(termX, termY, el.code, el.color);
        }
    }
});

// ============================================================================

var zztBlinkWall = new Class({
    Implements: zztBaseController,
    update: function() {
        var termX = this.x - 1,
            termY = this.y - 1;

        //console.log(this.p3);
        if (this.p3 == 0) {
            this.p3 = this.p1 + 1;
        }
        
        if (this.p3 == this.cycle) {
            this.p3 = (this.p2 * 2) + 1;
            
            var target = new Vector(this.x - 1, this.y - 1, this.xStep, this.yStep);
            // need to get walls color
            var wall = terminal.getCharacterAt(target.x, target.y);
            target.step();
            
            // now check the space next to the wall in its firing direction, see if we need to clear the ray, or build a new one
            var el = terminal.getCharacterAt(target.x, target.y);
            var erase = false;
            var rayTile = 0;
            
            switch (el.code) {
                case 0x00:
                    if (this.xStep != 0) rayTile = 0xcd; 
                    if (this.yStep != 0) rayTile = 0xba;
                    break;
                case 0xcd:
                case 0xba:
                    erase = true;
                    rayTile = 0;
                    break;
            }
            
            var blocked = false;
            do {
                var tile = terminal.getCharacterAt(target.x, target.y);
                if (erase) {
                    if (tile.code == el.code) {
                        terminal.drawCharacter(target.x, target.y, 0, 0);
                    } else {
                        blocked = true;
                    }
                } else {
                    if (tile.code == 0) {
                        terminal.drawCharacter(target.x, target.y, rayTile, wall.color);
                    } else {
                        blocked = true;
                    }
                }
                target.step();
            } while (!blocked);
        }
        this.p3--;
    }
});

// ============================================================================

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
        // to give each stats record a proper controller object, we first need to read its position and direction on the board
        var position = data.tell();
        var objX = data.getUint8()-1;
        var objY = data.getUint8()-1;
        var tile = 0;
        
        // some objects dont have valid positions (off edge somewhere)
        if (objX >= 0 && objY >= 0 && objX <= 59 && objY <= 24) {
            // only get the tile code if its on the map
            tile = this.tiles[objX + objY * 60].code;
        }
        // now put the data pointer back where it was
        data.seek(position);
        var obj = null;
        
        // and create a proper controller object for the tile/stat record
        switch (tile) {
            case tileRef.conveyor:          obj = new zztConveyor(); break;
            case tileRef.ccw_conveyor:      obj = new zztConveyorCCW(); break;
            case tileRef.transporter:       obj = new zztTransporter(); break;
            case tileRef.spinning_gun:      obj = new zztSpinningGun(); break;
            case tileRef.scroll:            obj = new zztScroll(); break;
            case tileRef.blink_wall:        obj = new zztBlinkWall(); break;
            default:                        obj = new zztBaseController();
        }
        
        obj.parseStats(data);                
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
            obj.update();
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
        var board = this.boards[boardnum];
        terminal.clear();
        var n = 0;
        for (var y=0; y<25; y++) {
            for (var x=0; x<60; x++, n++) {
                el = zztElement(x,y,board);
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
    }, 116);
    
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
        case tileRef.empty:             code = 0x00; color = 0; break;
        case tileRef.board_edge:        code = 0x00; break;
        case tileRef.messenger:         code = 0x00; break;
        case tileRef.monitor:           code = 0x00; break;
        case tileRef.player:            code = 0x02; break;
        case tileRef.ammo:              code = 0x84; break;
        case tileRef.torch:             code = 0x9d; break;
        case tileRef.gem:               code = 0x04; break;
        case tileRef.key:               code = 0x0c; break;
        case tileRef.door:              code = 0x0a; break;
        case tileRef.scroll:            code = 0xe8; break;
        case tileRef.passage:           code = 0xf0; break;
        case tileRef.duplicator:        code = 0xfa; break;
        case tileRef.bomb:              code = 0x0b; break;
        case tileRef.energizer:         code = 0x7f; break;
        case tileRef.star:              code = 0x5c; break;
        case tileRef.conveyor:          code = 0x5c; break;
        case tileRef.ccw_conveyor:      code = 0x5c; break;
        case tileRef.bullet:            code = 0xf8; break;
        case tileRef.water:             code = 0xb0; break;
        case tileRef.forest:            code = 0xb0; break;
        case tileRef.solid:             code = 0xdb; break;
        case tileRef.normal:            code = 0xb2; break;
        case tileRef.breakable:         code = 0xb1; break;
        case tileRef.boulder:           code = 0xfe; break;
        case tileRef.ns_slider:         code = 0x12; break;
        case tileRef.ew_slider:         code = 0x1d; break;
        case tileRef.fake_wall:         code = 0xb2; break;
        case tileRef.invisible:         code = 0x00; break;
        case tileRef.blink_wall:        code = 0xce; break;
        case tileRef.transporter:   
            var obj = board.getObjectAt(x+1, y+1);
            if (obj.xStep < 0) code = 0x3c;
            if (obj.xStep > 0) code = 0x3e;
            if (obj.yStep < 0) code = 0x5e;
            if (obj.yStep > 0) code = 0x76;
            break; 
        case tileRef.lines:  
            offset = x + y * 60;
            neighbors = 0;
            
            // we have logic in here so lines on board edges behave as if they continue on off the edge
            // otherwise check if they have a neighboring line in an adjacent tile
            neighbors += y == 0  || board.tiles[offset-60].code == 0x1f ? 1 : 0; // do we have a line to the north?
            neighbors += y == 24 || board.tiles[offset+60].code == 0x1f ? 2 : 0; // do we have a line to the south?
            neighbors += x == 0  || board.tiles[offset-1].code  == 0x1f ? 4 : 0; // do we have a line to the west?
            neighbors += x == 59 || board.tiles[offset+1].code  == 0x1f ? 8 : 0; // do we have a line to the east?
            
            switch (neighbors) {
                case 0: code = 0xfa; break;     // no neighbors
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
                    
        case tileRef.ricochet:          code = 0x2a; break;
        case tileRef.h_blink_ray:       code = 0xcd; break;
        case tileRef.bear:              code = 0x99; break;
        case tileRef.ruffian:           code = 0x05; break;
        case tileRef.object: 
            var obj = board.getObjectAt(x+1,y+1);
            code = obj.p1;  
            break;
        case tileRef.slime:             code = 0x2a; break;
        case tileRef.shark:             code = 0x5e; break;
        case tileRef.spinning_gun:  
            switch (randomIntFromInterval(0,3)) {
                case 0: code = 0x18; break; 
                case 1: code = 0x19; break;
                case 2: code = 0x1a; break;
                case 3: code = 0x1b; break;
            }
            break;
        case tileRef.pusher:  
            var obj = board.getObjectAt(x+1, y+1);
            if (obj.xStep < 0) {
                code = 0x11;
            } else if (obj.xStep > 0) {
                code = 0x10;
            } else if (obj.yStep < 0) {
                code = 0x1e;
            } else if (obj.yStep > 0) {
                code = 0x1f;
            }
            break;
        case tileRef.lion:              code = 0xea; break;
        case tileRef.tiger:             code = 0xe3; break;
        case tileRef.v_blink_ray:       code = 0xba; break;
        case tileRef.centipede_head:    code = 0xe9; break;
        case tileRef.centipede_seg:     code = 0x4f; break;
        case tileRef.blue_text:         code = color; color = 0x1f; break;
        case tileRef.green_text:        code = color; color = 0x2f; break;
        case tileRef.cyan_text:         code = color; color = 0x3f; break;
        case tileRef.red_text:          code = color; color = 0x4f; break;
        case tileRef.purple_text:       code = color; color = 0x5f; break;
        case tileRef.yellow_text:       code = color; color = 0x6f; break;
        case tileRef.white_text:        code = color; color = 0x0f; break;
    }
    
    return {code:code,color:color};
}
        