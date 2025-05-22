// import { FaRegCopy } from "react-icons/fa";

const TextInput = (props) => {

    const editEmailMobileHandler = (e) => {
        e.preventDefault();

        const that = e.target;
        const parentElement = that.closest(".relative");
        const inputField = parentElement.querySelector("#" + props.id);

        parentElement.classList.remove('verify-success');

        inputField.removeAttribute("readOnly");
        inputField.focus();
    }

    const handleClick = (e) => {
        if (typeof props.editEmailMobileHandler === 'function') {
            props.editEmailMobileHandler(e, props.name);
        } else {
            editEmailMobileHandler(e, props.name);
        }
    };

    const copyTextHandler = id => {
        document.getElementById(id).select();
        document.execCommand("copy");
    }

    const errorMsg = <span className={`text-danger absolute left-0 -bottom-4 fs-sm-10 fs-md-11 fs-11`} id={`error-${props.name}`}>{props.errorMessage}</span>

    let statusImg = null;
    if (props.isStatusImg) {
        statusImg = (
            <div className="absolute top-50 end-0 translate-middle-y mr-5 z-index-1">
                <img src={`${window.basePath}/img/right-tick.png`} alt="/" className="right-tick status-img" />
                <img src={`${window.basePath}/img/wrong.png`} alt="/" className="wrong-tick status-img" />
            </div>
        )
    }

    let textLabel = null;
    if (props.label !== '' && props.label !== null && props.label !== undefined) {
        textLabel = <label className={`fw-medium fs-12 fs-md-14 ${props.labelclass !== undefined ? props.labelclass : ''}`} htmlFor={props.id}>
            {props.label}
            {props.isRequired && <span className="text-danger">*</span>} 
            {props.sublable && <span className="text-light-gray fs-10"> (Optional)</span>}
        </label>
    }

    let fieldType = <input
        ref={props.ref}
        sublable={props.sublable}
        type={props.type !== undefined ? props.type : 'text'}
        id={props.id}
        data-regex={props.dataRegex}
        name={props.name}
        maxLength={props.maxLength}
        className={`lpay_input bg-white fs-11 fs-md-13 ${props.className !== undefined ? props.className : ''}`}
        autoComplete={props.autoComplete}
        onBlur={props.onBlur}
        onInput={props.onInput}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        value={props.value}
        readOnly={props.readOnly}
        min={props.min}
        max={props.max}
        required={props.isRequired}
        placeholder={props.placeholder}
        disabled={props.disabled}
        data-remove={props.dataRemove}
        data-type={props.dataType}
        data-validation={props.dataValidation}

    />
    if (props.type === "textarea") {
        fieldType = <textarea className={`lpay_input bg-white fs-11 ${props.className !== undefined ? props.className : ''}`} {...props} rows={props.rows !== undefined ? props.rows : 3} />
    };

    let verificationStatus = '';
    if (props.status === 'success') {
        verificationStatus = 'verify-success';
    } else if (props.status === 'error') {
        verificationStatus = 'verify-denied'
    }

    return (
        <>
            <div className={props.wrapper}>
                {/* <div className="">
                </div> */}
                    {textLabel}
                    <div className={`relative input-container ${verificationStatus}`} ref={props.wrapperRef}>
                        {props.isEditBtn && <span onClick={handleClick} className="edit-mobile-email-btn">Edit</span>}

                        {fieldType}

                        {statusImg}

                        {props.additionalBtn && <span className={`${props.additionalBtn.className} vrfy-btn`} onClick={props.additionalBtn.method}>{props.additionalBtn.name}</span>}

                        {errorMsg}
                    </div>
            </div>
        </>
    )
}

export default TextInput;