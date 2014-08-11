var beep = function(duration, type, finishedCallback) {

    if (!(window.audioContext || window.webkitAudioContext)) {
        throw Error("Your browser does not support Audio Context.");
    }

    duration = +duration;

    // Only 0-4 are valid types.
    type = (type % 5) || 0;

    if (typeof finishedCallback != "function") {
        finishedCallback = function() {};   
    }

    var ctx = new (window.audioContext || window.webkitAudioContext);
    var osc = ctx.createOscillator();

    osc.type = type;

    osc.connect(ctx.destination);
    osc.noteOn(0);

    setTimeout(function() {
        osc.noteOff(0);
        finishedCallback();
    }, duration);

};
