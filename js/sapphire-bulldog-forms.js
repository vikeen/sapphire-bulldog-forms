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
function sbf( args ) {
    this.version         = 'v1.0.0';
    this.debug           = args['debug'];
    this.formId          = args['formId'];
    this.form            = {};
    this.formFields      = {}; // form input fields 
    this.validationTypes = [ 'required', 'maxlen' ];
    this.errorMessages   = [];
    this.errorLocation   = args['errorLocation'];

    this.init();
}

sbf.prototype.init = function() {
    this.form = document.getElementById( this.formId );
    this.form.onsubmit = this.validate;

    for ( var i in this.form.elements ) {
        if ( this.form.elements[i].type !== 'submit' &&
             this.form.elements[i].id   !== undefined ) {
            this.formFields[this.form.elements[i].id] = { 'element': this.form.elements[i] };
        }
    }

    //log current form fields
    this.log( 'form fields for >' + this.formId + '< form' );
    this.log( this.formFields );

    window.sbf[this.formId] = this; // hold this form's init data in window for use later in validation
};

sbf.prototype.addValidation = function( fieldName, validation ) {
    var field = this.formFields[fieldName];

    if ( field === undefined || field === null ) {
        this.log( 'unable to find the field >' + fieldName + '<' );
        return false;
    }

    if ( typeof validation !== 'string' )  {
        this.log( 'validation must be a string, found >' + typeof validation + '<' );
        return false;
    }

    var valArray = validation.split( '=' );
    var length   = this.validationTypes.length;

    var success = false;
    while ( length-- ) {
        if ( this.validationTypes[length] === valArray[0] ) {
            // validation type confirmed, lets see if we need to add the validation section now
            if ( field['validation'] === undefined ) {
                field['validation'] = {};
            }

            if ( valArray.length === 2 ) {
                field['validation'][valArray[0]] = valArray[1];
                success = true;
            } else if ( valArray.length === 1 ) {
                field['validation'][valArray[0]] = true;
                success = true;
            } else {
                return false;
            }
        }
    }

    if ( success ) {
        this.log( 'added >' + validation + '< validation to the field >' + fieldName + '<' );
    }

    return success;
};

sbf.prototype.validate = function() {
    formObj = window.sbf[this.id];

    formObj.errorMessages = []; // reset error messages that may be left from previous submit atempts

    var success = true;

    for ( var i in formObj.formFields ) {
        if ( formObj.formFields[i]['validation'] ) {
            var field = formObj.formFields[i];
            var tagName = field['element'].tagName.toUpperCase();

            for ( var validationType in field['validation'] ) {
                var validationValue = field['validation'][validationType];

                switch ( validationType ) {
                    case 'required':
                        if ( tagName === 'INPUT' && formObj.isTextField(field['element']) ) {
                            if ( field['element'].value.length === 0 ) {
                                formObj.errorMessages.push( field['element'].id + ' is required' );
                                success = false;
                            }
                        }
                        break;
                    case 'maxlen':
                        if ( tagName === 'INPUT' && formObj.isTextField(field['element']) ) {
                            if ( field['element'].value.length > validationValue ) {
                                formObj.errorMessages.push( field['element'].id + ' is required' );
                            }
                        }
                        break;
                    default:
                        formObj.log( 'unknown valition type >' + validationType + '<' );
                        break;
                }
            }
        }
    }

    formObj.displayErrors();

    return success;
};

sbf.prototype.displayErrors = function() {
    var fullErrorMessage = '';

    for ( var i in this.errorMessages ) {
        fullErrorMessage = fullErrorMessage + this.errorMessages[i] + '\n';
    }

    switch ( this.errorLocation ) {
        case 'inline':
            break;
        case 'preform':
            break;
        case 'postform':
            break;
        default:
            alert( fullErrorMessage );
            break;
    }
};

sbf.prototype.isTextField = function( field ) {
    if ( field.type === 'text' || field.type === 'textarea' || field.type === 'password' ) {
        return true;
    } else {
        return false;
    }
};

sbf.prototype.log = function( message ) {
    if ( this.debug ) {
        console.debug( message );
    }
};

sbf.prototype.toArray = function( obj ) {
    var array = [];
    // iterate backwards ensuring that length is an UInt32
    for ( var i = obj.length >>> 0; i--; ) { 
        array[i] = obj[i];
    }
    return array;
};