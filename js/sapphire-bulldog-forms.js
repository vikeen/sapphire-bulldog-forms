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
    //TODO: remove
    //this.validationTypes = [ 'required', 'maxlen', 'minlen', 'num', 'alpha', 'alphanumeric', 'regex', 'email', 'match' ]; // supported validation types
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
        /* ignore submit buttons and fields with no id.
         * if field doesn't have an id there is no way to
         * safely give them error validation later. Not
         * to mention it's bad code practice anyways
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
    //return this.validateForm(); // used only for special cases of debugging
};

//TODO: test this function
sbf.prototype.addValidation = function( args ) {
    var fieldName         = args['fieldName'];
    var validationType    = args['validationType'];
    var validationDetails = args['validationDetails'];

    if ( fieldName !== undefined && validationType !== undefined && validationDetails !== undefined &&
         fieldName !== ''        && validationType !== ''        && validationDetails !== '' ) {
        this.validateFields[fieldName][validationType] = validationDetails;
    } else {
        this.log( 'addValidation: failed to add validation >' + validationType + '< to field >' + fieldName + '<')
    }
};

sbf.prototype.validateForm = function() {
    formObj = window.sbf[this.id];
    //formObj = this; // used only for special cases of debugging

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

    var errorLocation = this.errorData['location'];
    var errorMessage = '';

    if ( errorLocation === 'inline' ) {
        for ( var fieldName in this.errorData['formErrors'] ) {
            var errorMessage = ''; // reset errorMessage from the last field

            for ( var validationType in this.errorData['formErrors'][fieldName] ) {             // foreach field with an error
                errorMessage += this.getErrorMessage( fieldName, validationType ) + '<br/>';
            }

            if ( errorMessage !== '' && errorMessage !== undefined ) {
                errorMessage = errorMessage.replace( /\<br\/\>$/g, '' ); // strip the last break for semantics and better browser support
                var element = this.formFields[fieldName]['element'];
                var div = document.createElement( 'div' );
                div.className = 'sbf-form-errors sbf-inline';
                div.id        = 'sbf-error-' + element.id;
                div.innerHTML = errorMessage;
                this.insertAfter( div, element );
            }
        }
    } // end  ( errorLocation === 'inline' )
    else {
        for ( var fieldName in this.errorData['formErrors'] ) {                                 // foreach field with an error
            for ( var validationType in this.errorData['formErrors'][fieldName] ) {             // foreach failed validationType in that field
                errorMessage += this.getErrorMessage( fieldName, validationType ) + '[+FS+]';
            }
        }

        if ( errorMessage !== '' && errorMessage !== undefined ) {
            errorMessage = errorMessage.replace( /\[\+FS\+\]$/g, '' ); // strip the last [+FS+] for semantics and better browser support

            if ( errorLocation === 'preform' || errorLocation === 'postform' ) {
                errorMessage = errorMessage.replace( /\[\+FS\+\]/g, '<br/>' ); // replace the field separators with line breaks

                var div       = document.createElement( 'div' );
                div.id        = 'sbf-form-errors';
                div.innerHTML = errorMessage;

                if ( errorLocation === 'preform' ) {
                    div.className = 'sbf-form-errors sbf-preform';
                    this.form.insertBefore( div, this.form.firstChild );
                    window.scroll( 0, this.getYPosition( div.id ) );
                } else {
                    div.className = 'sbf-form-errors sbf-postform';
                    this.form.insertBefore( div, null );

                    /* Try to scroll the browser so that the bottom of the error div is on the bottom on of the viewport.
                     * This enhances provides significant UX enhancements over placing the error div inline with the top of the viewport.
                     */
                    var windowOffset = this.getYPosition( div.id ) - ( this.getViewport()['height'] - div.offsetHeight );
                    window.scroll( 0, windowOffset );
                }
            } else { // default fallback of alert message for errors
                errorMessage = errorMessage.replace( /\[\+FS\+\]/g, '\n' ); // replace the field separators with new lines
                alert( errorMessage );
            }
        } // end ( errorMessage !== '' && errorMessage !== undefined )
    }// end ( ELSE errorLocation === 'inline' )
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
        'maxlen': '[+field+] has a maximum character limit of [+maxlen+]',
        'minlen': '[+field+] has a minimum character limit of [+minlen+]',
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

sbf.prototype.insertAfter = function( newElement, targetElement ) {
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

// REFERENCE: http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
sbf.prototype.getViewport = function() {
    var e = window, a = 'inner';

    if ( !( 'innerWidth' in window ) ) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
};

// REFERENCE: http://clifgriffin.com/2008/10/14/using-javascript-to-scroll-to-a-specific-elementobject/
sbf.prototype.getYPosition = function( elementId ) {
    var element = document.getElementById( elementId );
    var yPosition = 0;

    while ( element.offsetParent ) {
        yPosition += element.offsetTop;
        element = element.offsetParent;
    }
    
    return yPosition;
};