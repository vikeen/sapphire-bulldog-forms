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
    this.formId          = args['formId']; // html id of the form
    this.form            = {}; // the form tied to this sbf instance
    this.formFields      = {}; // form input fields
    this.validateFields  = args['validateFields']; // a associative array of fields and what to validate
    this.validationTypes = [ 'required', 'maxlen', 'minlen', 'num', 'alpha', 'alphanumeric', 'regex' ]; // support validation types
    this.errorLocation   = args['errorLocation']; // where to show validation errors, defaults to alert
    this.errorMessages   = []; // a list of error messages returned from the form validation
    this.errorOverrides  = { 'user': args['errorOverrides'], 'default': undefined }; // store custom error messages

    this.init();
}

sbf.prototype.init = function() {
    this.form = document.getElementById( this.formId );

    if ( this.form === undefined || this.form === null || typeof this.form !== 'object' || this.form.tagName !== 'FORM' ) {
        this.log( 'unable to find form with id >' + this.formId + '<' );
        return false;
    }

    this.form.onsubmit = this.validateForm;

    for ( var i in this.form.elements ) {
        /* ignore submit buttons and fields with no id
         * if field doesn't have an id there is no way to
         * safely give them error validation later
         */
        if ( this.form.elements[i].type !== 'submit' &&
             this.form.elements[i].id   !== undefined ) {
            this.formFields[this.form.elements[i].id] = { 'element': this.form.elements[i] };
        }
    }

    // log current form fields
    this.log( 'form fields belonging to form with id >' + this.formId + '<' );
    this.log( this.formFields );

    // now lets cycle through our validation and add what we need
    if ( this.validateFields !== undefined ) {
        for ( var i in this.validateFields ) {
            if ( this.formFields[i] !== undefined ) { // double check the field is valid in our form
                for ( var j in this.validateFields[i] ) {
                    this.addValidation( i, this.validateFields[i][j] );
                }
            }
        }
    } else {
        this.log( 'no validation rules found or invalid declaration of validateFields attribute' );
        return false;
    }

    // set default error messages
    this.setDefaultErrorMessages();

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
        //this.log( 'added >' + validation + '< validation to the field >' + fieldName + '<' );
    }

    return success;
};

sbf.prototype.validateForm = function() {
    formObj = window.sbf[this.id];

    var success = true;

    for ( var i in formObj.formFields ) {
        if ( formObj.formFields[i]['validation'] ) {
            var field = formObj.formFields[i];
            var tagName = field['element'].tagName.toUpperCase();

            field['errorMessages'] = {}; // reset error message namespace

            for ( var validationType in field['validation'] ) {
                var validationValue = field['validation'][validationType];

                switch ( validationType ) {
                    case 'required':
                        if ( formObj.isTextField(field['element']) ) {
                            if ( field['element'].value.length === 0 ) {
                                field['errorMessages'][validationType] = formObj.getErrorMessage( field, validationType );
                                success = false;
                            }
                        }
                        break;
                    case 'maxlen':
                        if ( formObj.isTextField(field['element']) ) {
                            if ( field['element'].value.length > validationValue ) {
                                field['errorMessages'][validationType] = field['element'].id + ' cannot be more than ' + validationValue + ' characters';
                                success = false;
                            }
                        }
                        break;
                    case 'minlen':
                        if ( formObj.isTextField(field['element']) ) {
                            if ( field['element'].value.length < validationValue ) {
                                field['errorMessages'][validationType] = field['element'].id + ' must be atleast ' + validationValue + ' characters';
                                success = false;
                            }
                        }
                        break;
                    case 'num':
                        if ( formObj.isTextField(field['element']) ) {
                            var pattern = new RegExp( '^[0-9]*$' );
                            if ( ! pattern.test( field['element'].value ) ) {
                                field['errorMessages'][validationType] = formObj.getErrorMessage( field, validationType );
                                success = false;
                            }
                        }
                        break;
                    case 'alpha':
                        if ( formObj.isTextField(field['element']) ) {
                            var pattern = new RegExp( '^[a-zA-Z]*$' );
                            if ( ! pattern.test( field['element'].value ) ) {
                                field['errorMessages'][validationType] = field['element'].id + ' can only contain alpha characters';
                                success = false;
                            }
                        }
                        break;
                    case 'alphanumeric':
                        if ( formObj.isTextField(field['element']) ) {
                            var pattern = new RegExp( '^[a-zA-Z0-9]*$' );
                            if ( ! pattern.test( field['element'].value ) ) {
                                field['errorMessages'][validationType] = field['element'].id + ' can only contain alphanumeric characters';
                                success = false;
                            }
                        }
                        break;
                    case 'regex':
                        if ( formObj.isTextField(field['element']) && field['element'].value.length > 0 ) {
                            var pattern = new RegExp( validationValue );
                            if ( ! pattern.test( field['element'].value ) ) {
                                field['errorMessages'][validationType] = formObj.getErrorMessage( field, validationType );
                                success = false;
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
    this.clearErrors();

    switch ( this.errorLocation ) {
        case 'inline':
            for ( var i in this.formFields ) {
                if ( this.formFields[i]['errorMessages'] !== undefined ) {
                    var error = this.displayErrorMessage( this.formFields[i] ).replace( /\[\+FS\+\]/g, '<br/>' );

                    if ( error !== '' && error !== undefined ) {
                        var elementId = this.formFields[i]['element'].id;
                        var div = document.createElement( 'div' );
                        div.className = 'sbf-form-errors sbf-inline';
                        div.id        = 'sbf-error-' + elementId;
                        div.innerHTML = error;
                        this.insertAfter( div, document.getElementById( elementId ) );
                    }
                }
            }
            break;
        case 'preform':
            var div = document.createElement( 'div' );
            div.innerHTML = this.displayErrorMessage().replace( /\[\+FS\+\]/g, '<br/>' );
            div.className = 'sbf-form-errors sbf-preform';
            div.id        = 'sbf-form-errors';
            this.form.insertBefore( div, this.form.firstChild );
            break;
        case 'postform':
            var div = document.createElement( 'div' );
            div.innerHTML = this.displayErrorMessage().replace( /\[\+FS\+\]/g, '<br/>' );
            div.className = 'sbf-form-errors sbf-postform';
            div.id        = 'sbf-form-errors';
            this.form.insertBefore( div, null );
            break;
        default:
            alert( this.displayErrorMessage().replace( /\[\+FS\+\]/g, '\n' ) );
            break;
    }
};

sbf.prototype.clearErrors = function() {
    // clear inline errors on a per forField basis
    if ( this.errorLocation === 'inline' ) {
        for ( var i in this.formFields ) {
            var field      = this.formFields[i]['element'];
            var fieldError = document.getElementById( 'sbf-error-' + field.id );

            if ( fieldError ) {
                fieldError.parentNode.removeChild( fieldError );
            }
        }
    }
    // clear the default error block for alert, preform, and postform error styling
    else {
        var errorBlock = document.getElementById( 'sbf-form-errors' );
        if ( errorBlock ) {
            errorBlock.parentNode.removeChild( errorBlock );
        }
    }
};

sbf.prototype.setDefaultErrorMessages = function() {
    this.errorOverrides['default'] = {
        'required': '[+field+] is required',
        'num': '[+field+] must be numeric',
        'regex': 'invalid [+field+]'
    }
};

sbf.prototype.getErrorMessage = function( field, validationType ) {
    var errorMessage;

    if ( this.errorOverrides['user'][validationType] ) {
        errorMessage = this.errorOverrides['user'][validationType];
    } else {
        errorMessage = this.errorOverrides['default'][validationType];
    }

    errorMessage = errorMessage.replace( /\[\+field\+\]/, field['element'].id );

    return errorMessage;
};

sbf.prototype.displayErrorMessage = function( field ) {
    if ( field === undefined ) {
        var fullErrorMessage = '';

        for ( var i in this.formFields ) {
            for ( var j in this.formFields[i]['errorMessages'] ) {
                fullErrorMessage += this.formFields[i]['errorMessages'][j] + '[+FS+]';
            }
        }

        // strip the last field seperator we added and return
        return fullErrorMessage.replace( /\[\+FS\+\]$/, '' );
    } else if ( typeof field === 'object' ) {
        var fieldErrorMessage = '';

        for ( var i in field['errorMessages'] ) {
            fieldErrorMessage += field['errorMessages'][i] + '[+FS+]';
        }

        return fieldErrorMessage.replace( /\[\+FS\+\]$/, '' )
    } else {
        return false;
    }
};

/*####################################
  #
  # Misc / Helper Functions
  #
  ####################################*/
sbf.prototype.isTextField = function( field ) {
    //this.log( field.id + ' ' + field.type );
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

sbf.prototype.insertAfter = function( newElement,targetElement ) {
    // target is what you want it to go after. Look for this elements parent.
    var parent = targetElement.parentNode;

    // if the parents lastchild is the targetElement...
    if( parent.lastchild == targetElement ) {
        parent.appendChild( newElement ); // add the newElement after the target element.
    } else {
    // else the target has siblings, insert the new element between the target and it's next sibling.
        parent.insertBefore( newElement, targetElement.nextSibling );
    }
};
