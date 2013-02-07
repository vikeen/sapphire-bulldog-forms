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
    this.validationTypes = [ 'required', 'maxlen', 'minlen', 'num', 'alpha', 'alphanumeric', 'regex', 'email', 'match' ]; // supported validation types
    this.errorData = {
        'location': args['errorLocation'],
        'formErrors': {},
        'messages': {
            'user': args['errorOverrides'],
            'default': undefined
        }
    };

    this.init();
}

sbf.prototype.init = function() {
    this.form = document.getElementById( this.formId );

    if ( this.form === undefined || this.form === null || typeof this.form !== 'object' || this.form.tagName !== 'FORM' ) {
        this.log( 'unable to find form with id >' + this.formId + '<' );
        return false;
    }

    if ( this.validateFields === undefined ) {
        this.log( 'no validation rules found or invalid declaration of validateFields attribute' );
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
    this.log( 'fields found for >' + this.formId + '< form' );
    this.log( this.formFields );
    this.log( 'validation found for >' + this.formId + '< form');
    this.log( this.validateFields );

    // set default error messages
    this.setDefaultErrorMessages();

    window.sbf[this.formId] = this; // hold this form's init data in window for use later in validation
    return window.sbf[this.formId];
    //return this.validateForm();
};

sbf.prototype.addValidation = function( fieldName, validation ) {};

sbf.prototype.validateForm = function() {
    formObj = window.sbf[this.id];
    //formObj = this;

    var success = true;

    for ( var fieldName in formObj.validateFields ) {
        var field = formObj.formFields[fieldName];
        var tagName = field['element'].tagName.toUpperCase();

        formObj.errorData['formErrors'][fieldName] = new Array();
        for ( var validationType in formObj.validateFields[fieldName] ) {
            switch ( validationType ) {
                case 'required':
                    if ( formObj.isTextField( field['element'] ) ) {
                        if ( field['element'].value.length <= 0 ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'maxlen':
                    if ( formObj.isTextField( field['element'] ) ) {
                        if ( field['element'].value.length > formObj.validateFields[fieldName][validationType]['maxlen'] ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'minlen':
                    if ( formObj.isTextField( field['element'] ) ) {
                        if ( field['element'].value.length < formObj.validateFields[fieldName][validationType]['minlen'] ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'num':
                    if ( formObj.isTextField( field['element'] ) ) {
                        var pattern = new RegExp( '^[0-9]*$' );
                        if ( ! pattern.test( field['element'].value ) ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'alpha':
                    if ( formObj.isTextField(field['element']) ) {
                        var pattern = new RegExp( '^[a-zA-Z]*$' );
                        if ( ! pattern.test( field['element'].value ) ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'alphanumeric':
                    if ( formObj.isTextField(field['element']) ) {
                        var pattern = new RegExp( '^[a-zA-Z0-9]*$' );
                        if ( ! pattern.test( field['element'].value ) ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'regex':
                    if ( formObj.isTextField(field['element']) && field['element'].value.length > 0 ) {
                        var pattern = new RegExp( formObj.validateFields[fieldName][validationType]['regex'] );
                        if ( ! pattern.test( field['element'].value ) ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'email':
                    if ( formObj.isTextField(field['element']) && field['element'].value.length > 0 ) {
                        if ( ! formObj.isValidEmail( field['element'].value ) ) {
                            formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                            success = false;
                        }
                    }
                    break;
                case 'match':
                    var matchField = formObj.formFields[formObj.validateFields[fieldName][validationType]['match']];
                    if ( formObj.isTextField(field['element']) && formObj.isTextField(matchField['element']) ) {
                        if ( field['element'].value.length > 0 || matchField['element'].value.length > 0 ) {
                            if ( field['element'].value !== matchField['element'].value ) {
                                formObj.errorData['formErrors'][fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                success = false;
                            }
                        }
                    }
                    break;
                default:
                    formObj.log( 'unknown validation type >' + validationType + '<' );
                    break;
            }
        }
    }

    formObj.displayErrors();

    return success;
};

sbf.prototype.displayErrors = function() {
    this.clearErrors();

    switch ( this.errorData['location'] ) {
        case 'inline':
            for ( var fieldName in this.errorData['formErrors'] ) {
                var error = '';

                for ( var validationType in this.errorData['formErrors'][fieldName] ) {
                    error += this.getErrorMessage( fieldName, validationType ) + '<br/>';
                }

                if ( error !== '' && error !== undefined ) {
                    error = error.replace( /\<br\/\>$/g, '' ); // strip the last break for semantics and better browser support
                    var elementId = this.formFields[fieldName]['element'].id;
                    var div = document.createElement( 'div' );
                    div.className = 'sbf-form-errors sbf-inline';
                    div.id        = 'sbf-error-' + elementId;
                    div.innerHTML = error;
                    this.insertAfter( div, document.getElementById( elementId ) );
                }
            }
            break;
        case 'preform':
            var div = document.createElement( 'div' );
            div.innerHTML = this.displayErrorMessage().replace( /\[\+FS\+\]/g, '<br/>' );
            div.className = 'sbf-form-errors sbf-preform';
            div.id        = 'sbf-form-errors';
            this.form.insertBefore( div, this.form.firstChild );
            window.location.hash = '#' + div.id;
            break;
        case 'postform':
            var div = document.createElement( 'div' );
            div.innerHTML = this.displayErrorMessage().replace( /\[\+FS\+\]/g, '<br/>' );
            div.className = 'sbf-form-errors sbf-postform';
            div.id        = 'sbf-form-errors';
            this.form.insertBefore( div, null );
            window.location.hash = '#' + div.id;
            break;
        default:
            alert( this.displayErrorMessage().replace( /\[\+FS\+\]/g, '\n' ) );
            break;
    }
};

sbf.prototype.clearErrors = function() {
    // clear inline errors on a per forField basis
    if ( this.errorData['location'] === 'inline' ) {
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
    this.errorData['messages']['default'] = {
        'required': '[+field+] is required',
        'num': '[+field+] must be numeric',
        'alphanumeric': '[+field+] must be alphanumeric',
        'alpha': '[+field+] must be alpha characters',
        'regex': 'invalid [+field+]',
        'email': '[+field+] is an invalid email address',
        'maxlen': '[+field+] must contain fewer than [+maxlen+] characters',
        'minlen': '[+field+] must contain more than [+minlen+] characters',
        'match': '[+field+] does not match [+match+]'
    }
};

sbf.prototype.getErrorMessage = function( fieldName, validationType ) {
    var errorMessage = undefined;
    var fieldUniqueError = false;

    if ( this.errorData['formErrors'][fieldName][validationType]['error'] ) {
        fieldUniqueError = this.errorData['formErrors'][fieldName][validationType]['error']
    }

    if ( fieldUniqueError !== false )
        errorMessage = fieldUniqueError;
    else if ( this.errorData['messages']['user'][validationType] )
        errorMessage = this.errorData['messages']['user'][validationType];
    else
        errorMessage = this.errorData['messages']['default'][validationType];

    errorMessage = errorMessage.replace( /\[\+FS\+\]/g, '<br/>' );
    errorMessage = errorMessage.replace( /\[\+FIELD\+\]/ig, fieldName );
    errorMessage = errorMessage.replace( /\[\+MINLEN\+\]/ig, this.errorData['formErrors'][fieldName][validationType]['minlen'] );
    errorMessage = errorMessage.replace( /\[\+MAXLEN\+\]/ig, this.errorData['formErrors'][fieldName][validationType]['maxlen'] );
    errorMessage = errorMessage.replace( /\[\+MATCH\+\]/ig, this.errorData['formErrors'][fieldName][validationType]['match'] );

    return errorMessage;
};

/*####################################
  #
  # Misc / Helper Functions
  #
  ####################################*/
sbf.prototype.isTextField = function( field ) {
    if ( field.type === 'text' || field.type === 'textarea' || field.type === 'password' ) {
        return true;
    } else {
        return false;
    }
};

sbf.prototype.isValidEmail = function( email ) {
    var isValid = true;
    var atIndex = email.indexOf( '@' );

    if ( atIndex === undefined || atIndex === -1) {
        isValid = false;
    }
    else {
        var domain    = email.substring( atIndex + 1 );
        var local     = email.substring( 0, atIndex );
        var localLen  = local.length;
        var domainLen = domain.length;

        var regex = [
            '\\.\\.',
            '^[A-Za-z0-9\\-\\.]+$',
            '^(\\\\.|[A-Za-z0-9!#%&`_=\\/$\'*+?^{}|~.-])+$',
            '^"(\\\\"|[^"])+"$'
        ]

        var twoDotReg = new RegExp( regex[0] );
        var domainReg = new RegExp( regex[1] );
        var local1Reg = new RegExp( regex[2] );
        var local2Reg = new RegExp( regex[3] );

        // local part length exceeded
        if ( localLen < 1 || localLen > 64 ) { isValid = false; }

        // domain part length exceeded
        else if ( domainLen < 1 || domainLen > 255 ) { isValid = false; }

        // local part starts or ends with '.'
        else if ( local[0] === '.' || local[localLen-1] === '.') { isValid = false; }

        // local part has two consecutive dots
        else if ( twoDotReg.test( local ) ) { isValid = false; }

        // character not valid in domain part
        else if ( ! domainReg.test( domain ) ) { isValid = false; }

        // domain part has two consecutive dots
        else if ( twoDotReg.test( domain ) ) { isValid = false; }

        else if ( ! local1Reg.test( local.replace( '\\\\', '' ) ) ) {
            // character not valid in local part unless 
            // local part is quoted
            if ( ! local2Reg.test( local.replace( '\\\\', '' ) ) ) {
                isValid = false;
            }
        }
   }

   return isValid;
}

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
