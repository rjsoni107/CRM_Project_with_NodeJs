import React from 'react';
import Select, { components } from 'react-select'
import { MultiSelect } from "react-multi-select-component";
const customStyles = {
    control: base => ({
        ...base,
        height: 32,
        minHeight: 32,
        fontSize: '13px',
    }),
    container: (provided, state) => ({
        ...provided,
        width: state.selectProps.width
    }),
    dropdownIndicator: base => ({
        ...base,
        padding: "0px 5px"
    }),
    menu: (provided, state) => ({
        ...provided,
        zIndex: 9,
        maxHeight: '230px',
        overflow: 'hidden'
    }),
    singleValue: (provided) => ({
        ...provided,
        fontSize: '13px',
    })
}

const CustomInput = (props) => (
    <components.Input
        {...props}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck="false"
    />
);

export const generateAttributes = (props) => {
    return {
        name: props.name,
        id: props.selectpickerId,
        onChange: e => props.changeSelection(e, props.name),
        styles: customStyles,
        hideSelectedOptions: false,
        value: props.value,
        required: props.required,
        width: props.selectWidth,
        placeholder: props.placeholder,
        options: props.options,
        isDisabled: props.isDisabled,
        className: props.className,
        menuIsOpen: props.menuIsOpen,
        menuPlacement: 'auto',
        autoComplete: 'off'
    }
}

const SelectErrorMsg = props => {
    return <span className={`text-danger position-absolute left-0 bottom-n-15 fs-11`} id={`error-${props.name}`}>{props.error}</span>
}

const SelectLabel = props => {
    return (
        <>
            {props.inputLable && <label htmlFor={props.selectpickerId} className={props.lableClass}>{props.inputLable} {props.required && <span className="text-danger">*</span>}</label>}
        </>
    )
}

const SelectBox = (props) => {
    return (
        <div className='pc-form_group lpay_input_group'>
            <SelectLabel {...props} />
            <Select {...generateAttributes(props)} components={{ Input: CustomInput }} />
            <SelectErrorMsg {...props} />
        </div>
    )
}

export default SelectBox;

export const MultiSelectBox = (props) => {
    return (
        <div className='pc-form_group lpay_input_group'>
            <SelectLabel {...props} />
            <MultiSelect
                // ClearSelectedIcon={<BiX />}
                ClearSelectedIcon={<React.Fragment />}
                {...generateAttributes(props)}
            />
            <SelectErrorMsg {...props} />
        </div>
    )
}