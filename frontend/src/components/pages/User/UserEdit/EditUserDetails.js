import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import ValidationHandler from '../../../../utility/ValidationHandler';
import Base from '../../../../util/Base';
import { SelectBox, TextInput } from '../../../formElements/FormElementsImport';

const EditUserDetails = forwardRef((props, ref) => {
    const [userState, setState] = useState({
        payload: {
            status: '',
            name: '',
            emailId: '',
            mobile: '',
            company: '',
            website: '',
            address: '',
            city: '',
            country: '',
            state: '',
            zip: '',
        },
        status_list: [
            { value: 'Active', label: 'Active' },
            { value: 'InActive', label: 'InActive' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Blocked', label: 'Blocked' },
            { value: 'Suspended', label: 'Suspended' },
            { value: 'Blacklisted', label: 'Blacklisted' },
        ],
        city: [{ value: '', label: 'Select city' }],
        state: [{ value: '', label: 'Select state' }],
        country: [{ value: '', label: 'Select country' }],
        city_list: [],
        state_list: [],
        countries_list: [],

    });
    const {
        validateInputHandler,
        inputChangeHandler,
        inputMessageHandler,
        allowOnlyOnce,
        selectBoxChangeHandler,
        removeLeadingDot,
        decimalLimit,
        removeLeadingEmailChar,
        isValueExist
    } = ValidationHandler();
    const { getCountryList, getStateList, getCityList, handleCountryChange, handleStateChange } = Base();

    const { status_list, payload, status, state, country, city, city_list, countries_list, state_list } = userState;
    const { name, emailId, mobile, company, website, address, zip } = payload;

    useImperativeHandle(ref, () => ({
        getPayload: () => payload
    }));

    const { data, setShowLoader } = props;

    // Fetch the country list on component mount
    useEffect(() => {
        getCountryList(setState, setShowLoader);
    }, []);


    useEffect(() => {
        if (payload.country) {
            getStateList(setState, payload.country, setShowLoader);
        }
    }, [payload.country]);

    useEffect(() => {
        if (payload.state) {
            getCityList(setState, setShowLoader, payload);
        }
    }, [payload.state]);

    useEffect(() => {
        // Run this logic only when countries_list or props.data is updated
        if (data && countries_list.length > 0) {
            const updatedPayload = {};
            const listPayload = {
                status: status,
                country: country,
                state: state,
                city: city,
            };

            Object.entries(data).forEach(([key, value]) => {
                const isExistValue = isValueExist(value) ? value : ''
                if (payload[key] !== undefined) {
                    updatedPayload[key] = isExistValue;
                }

                if (key === 'status') {
                    status_list.forEach((option) => {
                        if (option.value.toLowerCase() === isExistValue.toLowerCase()) {
                            listPayload.status = [option];
                        }
                    });
                } else if (key === 'country') {
                    countries_list.forEach((option) => {
                        if (option.value.toLowerCase() === isExistValue.toLowerCase()) {
                            listPayload.country = [option];
                        }
                    });
                }
            });

            setState((prev) => ({
                ...prev,
                ...listPayload,
                payload: {
                    ...prev.payload,
                    ...updatedPayload,
                },
            }));
        }
    }, [props.data, countries_list]); // Removed state_list from this dependency array

    // Separate useEffect for state_list
    useEffect(() => {
        if (state_list.length > 0) {
            const listPayload = { state: state };

            state_list.forEach((option) => {
                if (option.value.toLowerCase() === payload.state?.toLowerCase()) {
                    listPayload.state = [option];
                }
            });

            setState((prev) => ({
                ...prev,
                ...listPayload,
            }));
        }
    }, [state_list, payload.state]); // Trigger only when state_list or payload.state changes

    useEffect(() => {
        if (city_list.length > 0) {
            const listPayload = { city: city };

            city_list.forEach((option) => {
                if (option.value.toLowerCase() === payload.city?.toLowerCase()) {
                    listPayload.city = [option];
                }
            });

            setState((prev) => ({
                ...prev,
                ...listPayload,
            }));
        }
    }, [city_list, payload.city]); // Trigger only when city_list or payload.city changes


    const handleBlur = (evt) => {
        validateInputHandler(evt);
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <SelectBox
                    inputLable="Status"
                    selectpickerId="status"
                    name="status"
                    required={true}
                    placeholder="Select Status"
                    value={status || ''}
                    options={status_list}
                    className="input-field is-required"
                    changeSelection={(that, name) => {
                        selectBoxChangeHandler(that, name, 'payload', setState);
                        inputMessageHandler(document.getElementById(name), 'HIDE', 'error');
                    }}
                />
                <TextInput
                    label="Name"
                    name="name"
                    id="name"
                    placeholder="Enter Your Name"
                    value={name || ''}
                    className="form-control input-field"
                    isRequired={true}
                    maxLength={100}
                    onChange={evt => {
                        inputChangeHandler(evt, setState);
                        inputMessageHandler(evt, 'HIDE', 'error');
                    }}
                    onBlur={handleBlur}
                    dataType="ALPHA_SPACE"
                />
                <TextInput
                    label="Email"
                    name="emailId"
                    id="emailId"
                    placeholder="Enter Email ID"
                    value={emailId || ''}
                    className="form-control input-field"
                    maxLength={100}
                    onInput={e => {
                        inputChangeHandler(e, setState);
                        removeLeadingEmailChar(e);
                        inputMessageHandler(e, 'HIDE', 'error');
                    }}
                    onKeyDown={e => allowOnlyOnce({ event: e, allowedChar: '@', keyCode: 50 })}
                    onBlur={handleBlur}
                    dataType="EMAIL"
                    dataValidation="EMAIL"
                />
                <TextInput
                    label="Mobile"
                    name="mobile"
                    id="mobile"
                    placeholder="Enter Mobile Number"
                    value={mobile || ''}
                    className="form-control input-field"
                    isRequired={true}
                    maxLength={10}
                    onChange={evt => {
                        inputChangeHandler(evt, setState);
                        inputMessageHandler(evt, 'HIDE', 'error');
                    }}
                    onBlur={handleBlur}
                    dataType="MOBILE"
                    dataValidation="MOBILE"
                />
                <TextInput
                    label="Company"
                    name="company"
                    id="company"
                    placeholder="Enter Company Name"
                    value={company || ''}
                    className="form-control input-field"
                    maxLength={100}
                    onChange={evt => {
                        inputChangeHandler(evt, setState);
                        inputMessageHandler(evt, 'HIDE', 'error');
                    }}
                    onBlur={handleBlur}
                    dataType="ALPHA_SPACE"
                />
                <TextInput
                    label="Website"
                    name="website"
                    id="website"
                    placeholder="Enter Website URL"
                    value={website || ''}
                    className="form-control input-field"
                    maxLength={100}
                    onChange={evt => {
                        inputChangeHandler(evt, setState);
                        inputMessageHandler(evt, 'HIDE', 'error');
                    }}
                    onBlur={handleBlur}
                    dataType="URL"
                />
                <TextInput
                    label="Address"
                    name="address"
                    id="address"
                    placeholder="Enter Address"
                    value={address || ''}
                    className="form-control input-field"
                    maxLength={100}
                    onChange={evt => {
                        inputChangeHandler(evt, setState);
                        inputMessageHandler(evt, 'HIDE', 'error');
                    }}
                    onBlur={handleBlur}
                    dataType="ALPHA_NUMERIC_SPACE"
                />
                <SelectBox
                    inputLable="Country"
                    selectpickerId="country"
                    name="country"
                    placeholder="Select Country"
                    value={country || ''}
                    options={countries_list || []}
                    className="input-field"
                    changeSelection={(that, name) => {
                        handleCountryChange(that, setState, setShowLoader);
                        selectBoxChangeHandler(that, name, 'payload', setState);
                        inputMessageHandler(document.getElementById(name), 'HIDE', 'error');
                    }}
                />
                <SelectBox
                    inputLable="State"
                    selectpickerId="state"
                    name="state"
                    placeholder="Select State"
                    value={state || ''}
                    options={state_list || []}
                    className="input-field"
                    changeSelection={(that, name) => {
                        handleStateChange(that, setState, setShowLoader, payload);
                        selectBoxChangeHandler(that, name, 'payload', setState);
                        inputMessageHandler(document.getElementById(name), 'HIDE', 'error');
                    }}
                />
                <SelectBox
                    inputLable="City"
                    selectpickerId="city"
                    name="city"
                    placeholder="Select city"
                    value={city || ''}
                    options={city_list || []}
                    className="input-field"
                    changeSelection={(that, name) => {
                        selectBoxChangeHandler(that, name, 'payload', setState);
                        inputMessageHandler(document.getElementById(name), 'HIDE', 'error');
                    }}
                />
                <TextInput
                    label="Zip Code"
                    name="zip"
                    id="zip"
                    placeholder="Enter Zip Code"
                    value={zip || ''}
                    className="form-control input-field"
                    maxLength={6}
                    onChange={evt => {
                        removeLeadingDot(evt)
                        decimalLimit(evt, 2);
                        inputChangeHandler(evt, setState);
                        inputMessageHandler(evt, 'HIDE', 'error');
                    }}
                    onBlur={handleBlur}
                    dataType="NUMERIC"
                    dataValidation="PINCODE"
                />
            </div>
        </>
    );
});

export default EditUserDetails;