// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function noop() {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Main
function sbf(args) {
    this.version     = 'v1.0.0';
    this.form_id     = args['form_id'];
    this.form        = {};
    this.form_fields = [];

    this.init();
}

sbf.prototype.init = function() {
    this.form = document.getElementById( this.form_id );
    this.form_fields = this.toArray( this.form.getElementsByTagName( 'input' ) );

    for ( var i in this.form_fields ) {
        if ( this.form_fields[i].type === 'submit' ) {
            this.form_fields.splice(i);
        }
    }
}

sbf.prototype.toArray = function(obj) {
    var array = [];
    // iterate backwards ensuring that length is an UInt32
    for (var i = obj.length >>> 0; i--;) { 
        array[i] = obj[i];
    }
    return array;
}
