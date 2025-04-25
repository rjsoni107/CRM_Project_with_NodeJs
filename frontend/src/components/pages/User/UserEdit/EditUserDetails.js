import React, { useState, useEffect, useImperativeHandle, forwardRef, use } from 'react';
import ValidationHandler from '../../../../utility/ValidationHandler';
import Base from '../../../../util/Base';
import { SelectBox, TextInput } from '../../../formElements/FormElementsImport';
import Heading from '../../../heading/Heading';

const EditUserDetails = forwardRef((props, ref) => {
    const [userState, setState] = useState({
        payload: {
            status: '',
            firstName: '',
            lastName: '',
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
            { value: 'Inactive', label: 'Inactive' },
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
    } = ValidationHandler();
    const { getCountryList, getStateList, getCityList, handleCountryChange, handleStateChange } = Base();

    const { status_list, payload, status, state, country, city, city_list, countries_list, state_list } = userState;
    const { firstName, lastName, emailId, mobile, company, website, address, zip } = payload;

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
                if (payload[key] !== undefined) {
                    const isValueExist = value !== undefined && value !== null && value !== 'NA';
                    updatedPayload[key] = isValueExist ? value : '';
                }

                if (key === 'status') {
                    status_list.forEach((option) => {
                        if (option.value.toLowerCase() === value.toLowerCase()) {
                            listPayload.status = [option];
                        }
                    });
                } else if (key === 'country') {
                    countries_list.forEach((option) => {
                        if (option.value.toLowerCase() === value.toLowerCase()) {
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
            <Heading title="User Details" customClass="col-md-12" headingWrapper="my-10" headingClass="ml-0 fs-15 text-black fw-medium" />
            <div className="row">
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
                    <TextInput
                        label="First Name"
                        name="firstName"
                        id="firstName"
                        placeholder="Enter First Name"
                        value={firstName || ''}
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
                    <TextInput
                        label="Last Name"
                        name="lastName"
                        id="lastName"
                        placeholder="Enter Last Name"
                        value={lastName || ''}
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
                    <TextInput
                        label="Email"
                        name="emailId"
                        id="emailId"
                        placeholder="Enter Email ID"
                        value={emailId || ''}
                        className="form-control input-field"
                        isRequired={true}
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-20">
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

            </div>
        </>
    );
});

export default EditUserDetails;