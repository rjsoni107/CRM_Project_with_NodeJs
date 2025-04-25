const DATA_TYPE = {
    ALPHA: /[^A-Za-z]/,
    ALPHA_SPACE: /[^A-Za-z ]/,
    ALPHA_NUMERIC_SPACE: /[^A-Za-z0-9 ]/,
    ALPHA_NUMERIC: /[^A-Za-z0-9]/,
    EMAIL: /[^A-Za-z0-9@._-]/,
    NUMBER: /[^0-9]/,
    AMOUNT: /[^0-9.]/,
};

const DATA_VALIDATION = {
    EMAIL: /(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    MOBILE: /^[0-9]{10}$/,
    PINCODE: /^[0-9]{6}/,
    PIN: /^[0-9]{6}/,
    AMOUNT: /^[0-9]\d{0,14}(\.\d{1,2})?%?$/,
    NUMBER_WITHOUT_ZERO: /^[1-9.][0-9.]*$/,
};

const getRegex = (name, regexType) => {
    return new RegExp((regexType === "DATA_TYPE" ? DATA_TYPE[name] : DATA_VALIDATION[name]), 'g');
};

export { DATA_TYPE, DATA_VALIDATION, getRegex };
