(function () {
    "use strict";

    // Avoid `console` errors in browsers that lack a console.
    (function () {
        var method,
            noop = function noop() { return; },
            methods = [
                'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
                'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
                'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
                'timeStamp', 'trace', 'warn' ],
            length = methods.length,
            console = window.console || {};

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
        this.version         = 'v1.0.0';
        this.debug           = args.debug;
        this.formId          = args.formId; // html id of the form
        this.form            = {}; // the form tied to this sbf instance
        this.formFields      = {}; // form input fields
        this.validateFields  = args.validateFields; // a associative array of fields and what to validate
        this.errorData = {
            'location': args.errorLocation,
            'formErrors': {},
            'messages': {
                'user': args.errorOverrides,
                'default': {}
            }
        };
        this.validFieldTypes = {
            'text': {
                'text': true,
                'textarea': true,
                'password': true
            }
        };

        this.init();
    }

    sbf.prototype.init = function () {
        var i;

        this.form = document.getElementById(this.formId);
        if (this.form === undefined || this.form.tagName !== 'FORM') {
            this.log('init: unable to find form with id >' + this.formId + '<');
            return false;
        }

        if (this.validateFields === undefined) {
            this.log('init: no validation rules found or invalid declaration of validateFields attribute');
            return false;
        }

        this.form.onsubmit = this.validateForm;

        for (i in this.form.elements) {
            /* ignore submit buttons and fields with no id.
             * if field doesn't have an id there is no way to
             * safely give them error validation later. Not
             * to mention it's bad code practice anyways for a form
             */
            if (this.form.elements.hasOwnProperty(i)) {
                if (this.form.elements[i].type !== 'submit' && this.form.elements[i].id !== undefined) {
                    this.formFields[this.form.elements[i].id] = { 'element': this.form.elements[i] };
                }
            }
        }

        // log current form fields
        this.log('init: fields found for >' + this.formId + '< form');
        this.log(this.formFields);
        this.log('init: validation found for >' + this.formId + '< form');
        this.log(this.validateFields);

        // set default error messages
        this.setDefaultErrorMessages();

        window.sbf[this.formId] = this; // hold this form's init data in window for use later in validation
        return window.sbf[this.formId];
        //return this.validateForm(); // used only for special cases of debugging
    };

    sbf.prototype.addValidation = function (args) {
        var fieldName  = args.fieldName,
            validation = args.validation;

        // 1. check valid input to method
        // 2. check that the field is valid for this form
        if (fieldName !== undefined && fieldName !== '' && validation !== undefined && this.formFields[fieldName] !== undefined) {
            // add field if it doesn't exist
            if (this.validateFields[fieldName] === undefined) {
                this.validateFields[fieldName] = {};
            }

            this.validateFields[fieldName] = validation;
            this.log('addValidation: successfully added validation to field >' + fieldName + '<');
        } else {
            this.log('addValidation: failed to add validation to field >' + fieldName + '<');
        }
    };

    sbf.prototype.removeValidation = function (args) {
        var fieldName = args.fieldName;

        if (fieldName !== undefined && fieldName !== '') {
            if (this.validateFields[fieldName] !== undefined) {
                this.validateFields[fieldName] = undefined;
            }
            this.log('removeValidation: successfully removed validation for field >' + fieldName +  '<');
        } else {
            this.log('removeValidation: failed to remove validation for field >' + fieldName +  '<');
        }
    };

    sbf.prototype.isFieldGroup = function (fieldName) {
        var numFields = 0,
            i;

        for (i in this.formFields[fieldName]) {
            if (this.formFields[fieldName].hasOwnProperty(i)) {
                numFields += 1;
            }
        }

        return numFields > 1 ? true : false;
    };

    sbf.prototype.isTextField = function (field) {
        return this.validFieldTypes.text[field.type] === true ? true : false;
    };

    sbf.prototype.validateForm = function () {
        var formObj = window.sbf[this.id],
            formSuccess = true,
            fieldSuccess,
            field,
            fieldName,
            validationType,
            pattern,
            matchField;

        for (fieldName in formObj.validateFields) {
            if (formObj.validateFields.hasOwnProperty(fieldName)) {
                fieldSuccess = true;
                field = formObj.formFields[fieldName];

                formObj.errorData.formErrors[fieldName] = [];
                for (validationType in formObj.validateFields[fieldName]) {
                    if (formObj.validateFields[fieldName].hasOwnProperty(validationType)) {
                        switch (validationType) {
                        case 'required':
                            if (formObj.isTextField(field.element)) {
                                if (field.element.value.length <= 0) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            } else if (field.element.type === 'checkbox') {
                                if (field.element.checked === false) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'maxlen':
                            if (formObj.isTextField(field.element)) {
                                if (field.element.value.length > formObj.validateFields[fieldName][validationType].maxlen) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'minlen':
                            if (formObj.isTextField(field.element)) {
                                if (field.element.value.length < formObj.validateFields[fieldName][validationType].minlen) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'num':
                            if (formObj.isTextField(field.element)) {
                                if (!/^[0-9]*$/.test(field.element.value)) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'alpha':
                            if (formObj.isTextField(field.element)) {
                                if (!/^[0-9]*$/.test(field.element.value)) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'alphanumeric':
                            if (formObj.isTextField(field.element)) {
                                if (!/^[a-zA-Z0-9]*$/.test(field.element.value)) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'regex':
                            if (formObj.isTextField(field.element) && field.element.value.length > 0) {
                                pattern = new RegExp(formObj.validateFields[fieldName][validationType].regex);
                                if (!pattern.test(field.element.value)) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'email':
                            if (formObj.isTextField(field.element) && field.element.value.length > 0) {
                                if (!formObj.isValidEmail(field.element.value)) {
                                    formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                    fieldSuccess = false;
                                }
                            }
                            break;
                        case 'match':
                            matchField = formObj.formFields[formObj.validateFields[fieldName][validationType].match];
                            if (formObj.isTextField(field.element) && formObj.isTextField(matchField.element)) {
                                if (field.element.value.length > 0 || matchField.element.value.length > 0) {
                                    if (field.element.value !== matchField.element.value) {
                                        formObj.errorData.formErrors[fieldName][validationType] = formObj.validateFields[fieldName][validationType];
                                        fieldSuccess = false;
                                    }
                                }
                            }
                            break;
                        default:
                            formObj.log('validateForm: unknown validation type >' + validationType + '<');
                            break;
                        }
                    }
                }
            }

            if (fieldSuccess !== true) {                          // field has failed validation, mark the form as failed
                formSuccess = false;
            } else {                                                // field has validated successfully, remove it from the error queue
                delete formObj.errorData.formErrors[fieldName];
            }

        }

        if (formSuccess === false) {
            formObj.displayErrors();
        }

        return formSuccess;
    };


    sbf.prototype.displayErrors = function () {
        var div,
            element,
            errorLocation = this.errorData.location,
            errorMessage = '',
            fieldName,
            validationType,
            focusField;

        this.clearErrors();

        if (errorLocation === 'inline') {
            for (fieldName in this.errorData.formErrors) {
                if (this.errorData.formErrors.hasOwnProperty(fieldName)) {
                    errorMessage = ''; // reset errorMessage from the last field
                    if (focusField === undefined) { focusField = fieldName; }

                    // foreach field with an error
                    for (validationType in this.errorData.formErrors[fieldName]) {
                        if (this.errorData.formErrors[fieldName].hasOwnProperty(validationType)) {
                            errorMessage += this.getErrorMessage(fieldName, validationType) + '<br/>';
                        }
                    }

                    if (errorMessage !== '' && errorMessage !== undefined) {
                        errorMessage = errorMessage.replace(/\<br\/\>$/g, ''); // strip the last break for semantics and better browser support
                        element = this.formFields[fieldName].element;
                        div = document.createElement('div');
                        div.className = 'sbf-form-errors sbf-inline';
                        div.id        = 'sbf-error-' + element.id;
                        div.innerHTML = errorMessage;
                        this.insertAfter(div, element);
                    }
                }

            }

            document.getElementById(focusField).focus();
        } else {
            for (fieldName in this.errorData.formErrors) {
                if (this.errorData.formErrors.hasOwnProperty(fieldName)) {
                    for (validationType in this.errorData.formErrors[fieldName]) {
                        if (this.errorData.formErrors[fieldName].hasOwnProperty(validationType)) {
                            errorMessage += this.getErrorMessage(fieldName, validationType) + '[+FS+]';
                        }
                    }
                }
            }

            if (errorMessage !== '' && errorMessage !== undefined) {
                errorMessage = errorMessage.replace(/\[\+FS\+\]$/g, ''); // strip the last [+FS+] for semantics and better browser support

                if (errorLocation === 'preform' || errorLocation === 'postform') {
                    errorMessage = errorMessage.replace(/\[\+FS\+\]/g, '<br/>'); // replace the field separators with line breaks

                    div           = document.createElement('div');
                    div.id        = 'sbf-form-errors';
                    div.innerHTML = errorMessage;

                    if (errorLocation === 'preform') {
                        div.className = 'sbf-form-errors sbf-preform';
                        this.form.insertBefore(div, this.form.firstChild);
                        window.scroll(0, this.getYPosition(div.id));
                    } else {
                        div.className = 'sbf-form-errors sbf-postform';
                        this.form.insertBefore(div, null);

                        /* Try to scroll the browser so that the bottom of the error div is on the bottom on of the viewport.
                         * This enhances provides significant UX enhancements over placing the error div inline with the top of the viewport.
                         */
                        window.scroll(0, this.getYPosition(div.id) - (this.getViewport().height - div.offsetHeight));
                    }
                } else { // default fallback of alert message for errors
                    errorMessage = errorMessage.replace(/\[\+FS\+\]/g, '\n'); // replace the field separators with new lines
                    alert(errorMessage);
                }
            } // end (errorMessage !== '' && errorMessage !== undefined)
        }// end (ELSE errorLocation === 'inline')
    };

    sbf.prototype.clearErrors = function () {
        var i,
            field,
            fieldError,
            errorBlock;

        // clear inline errors on a per forField basis
        if (this.errorData.location === 'inline') {
            for (i in this.formFields) {
                if (this.formFields.hasOwnProperty(i)) {
                    field      = this.formFields[i].element;
                    fieldError = document.getElementById('sbf-error-' + field.id);

                    if (fieldError) {
                        fieldError.parentNode.removeChild(fieldError);
                    }
                }
            }
        } else {
            // clear the default error block for alert, preform, and postform error styling
            errorBlock = document.getElementById('sbf-form-errors');
            if (errorBlock) {
                errorBlock.parentNode.removeChild(errorBlock);
            }
        }
    };

    sbf.prototype.setDefaultErrorMessages = function () {
        this.errorData.messages.default = {
            'required': '[+field+] is required',
            'num': '[+field+] must be numeric',
            'alphanumeric': '[+field+] must be alphanumeric',
            'alpha': '[+field+] must be alpha characters',
            'regex': 'invalid [+field+]',
            'email': '[+field+] is an invalid email address',
            'maxlen': '[+field+] has a maximum character limit of [+maxlen+]',
            'minlen': '[+field+] has a minimum character limit of [+minlen+]',
            'match': '[+field+] does not match [+match+]'
        };
    };

    sbf.prototype.getErrorMessage = function (fieldName, validationType) {
        var errorMessage,
            fieldUniqueError = false;

        if (this.errorData.formErrors[fieldName][validationType].error) {
            fieldUniqueError = this.errorData.formErrors[fieldName][validationType].error;
        }

        if (fieldUniqueError !== false) {
            errorMessage = fieldUniqueError;
        } else if (this.errorData.messages.error[validationType]) {
            errorMessage = this.errorData.messages.error[validationType];
        } else {
            errorMessage = this.errorData.messages.default[validationType];
        }

        errorMessage = errorMessage.replace(/\[\+FIELD\+\]/ig, fieldName);
        errorMessage = errorMessage.replace(/\[\+MINLEN\+\]/ig, this.errorData.formErrors[fieldName][validationType].minlen);
        errorMessage = errorMessage.replace(/\[\+MAXLEN\+\]/ig, this.errorData.formErrors[fieldName][validationType].maxlen);
        errorMessage = errorMessage.replace(/\[\+MATCH\+\]/ig, this.errorData.formErrors[fieldName][validationType].match);

        return errorMessage;
    };

    /*####################################
      #
      # Misc / Helper Functions
      #
      ####################################*/

    sbf.prototype.isValidEmail = function (email) {
        var isValid = true,
            atIndex = email.indexOf('@'),
            domain = email.substring(atIndex + 1),
            local = email.substring(0, atIndex),
            localLen = local.length,
            domainLen = domain.length,
            twoDotReg = /\.\./,
            domainReg = /^[A-Za-z0-9\-\.]+$/,
            local1Reg = /^(\.|[A-Za-z0-9!#%&`_=\\\/\$\''*+?\^{}|~.\-])+$/,
            local2Reg = /^"(\\"|[\^"])+"$/;


        if (atIndex === undefined || atIndex === -1) {
            isValid = false;
        } else {
            if (localLen < 1 || localLen > 64) {
                isValid = false;
            } else if (domainLen < 1 || domainLen > 255) {
                isValid = false;
            } else if (local[0] === '.' || local[localLen - 1] === '.') {
                isValid = false;
            } else if (twoDotReg.test(local)) {
                isValid = false;
            } else if (!domainReg.test(domain)) {
                isValid = false;
            } else if (twoDotReg.test(domain)) {
                isValid = false;
            } else if (!local1Reg.test(local.replace('\\\\', ''))) {
                if (!local2Reg.test(local.replace('\\\\', ''))) {
                    isValid = false;
                }
            }
        }

        return isValid;
    };

    sbf.prototype.log = function (message) {
        var currentDate;

        if (this.debug) {
            if (typeof message === 'string') {
                currentDate = new Date();
                console.debug('[SBF_DEBUGGER - ' + currentDate + ']   ' + message);
            } else {
                console.debug(message);
            }
        }
    };

    sbf.prototype.insertAfter = function (newElement, targetElement) {
        // target is what you want it to go after. Look for this elements parent.
        var parent = targetElement.parentNode;

        // if the parents lastchild is the targetElement...
        if (parent.lastchild === targetElement) {
            parent.appendChild(newElement); // add the newElement after the target element.
        } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
            parent.insertBefore(newElement, targetElement.nextSibling);
        }
    };

    // REFERENCE: http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
    sbf.prototype.getViewport = function () {
        var e = window, a = 'inner';

        if (!window.hasOwnProperty('innerWidth')) {
            a = 'client';
            e = document.documentElement || document.body;
        }
        return { width: e[a + 'Width'], height: e[a + 'Height'] };
    };

    // REFERENCE: http://clifgriffin.com/2008/10/14/using-javascript-to-scroll-to-a-specific-elementobject/
    sbf.prototype.getYPosition = function (elementId) {
        var element = document.getElementById(elementId),
            yPosition = 0;

        while (element.offsetParent) {
            yPosition += element.offsetTop;
            element = element.offsetParent;
        }

        return yPosition;
    };
}());
