import React, { useState, useEffect } from 'react';
import SelectBox from '../components/formElements/Select/Select';
import { gateway, statusFlag, statusPayoutFlag, status_list, gender_list_reporting } from '../global';
import ValidationHandler from '../components/utility/ValidationHandler';

const { selectBoxChangeHandler } = ValidationHandler();

const ReportingFilter = ({ parentClass, showFilter }) => {
    return (
        <div className={`row`}>
            {showFilter.includes("gateway") && (
                <div className="col-md-3 mb-20">
                    <div className="lpay_select_group">
                        <SelectBox
                            placeholder={"ALL"}
                            selectWidth="100%"
                            inputLable="Gateway"
                            name="gateway"
                            value={parentClass.state.gateway}
                            options={gateway}
                            changeSelection={(evt, name) => {
                                selectBoxChangeHandler(evt, name, 'payLoad', parentClass.setState);
                            }}
                        />
                    </div>
                </div>
            )}
            {showFilter.includes("reportingStatus") && (
                <div className="col-md-3 mb-20">
                    <div className="lpay_select_group">
                        <SelectBox
                            placeholder={"ALL"}
                            selectWidth="100%"
                            inputLable="Status"
                            name="status"
                            value={parentClass.state.status}
                            options={statusFlag}
                            changeSelection={(evt, name) => {
                                selectBoxChangeHandler(evt, name, 'payLoad', parentClass.setState);
                            }}
                        />
                    </div>
                </div>
            )}
            {showFilter.includes("customerStatus") && (
                <div className="col-md-3 mb-20 ">
                    <div className="lpay_select_group">
                        <SelectBox
                            placeholder={"ALL"}
                            selectWidth="100%"
                            inputLable="Status"
                            name="status"
                            value={parentClass.state.status}
                            options={status_list}
                            changeSelection={(evt, name) => {
                                selectBoxChangeHandler(evt, name, 'payLoad', parentClass.setState);
                            }}
                        />
                    </div>
                </div>
            )}
            {showFilter.includes("payoutStatus") && (
                <div className="col-md-3 mb-20 ">
                    <div className="lpay_select_group">
                        <SelectBox
                            placeholder={"ALL"}
                            selectWidth="100%"
                            inputLable="Status"
                            name="status"
                            value={parentClass.state.status}
                            options={statusPayoutFlag}
                            changeSelection={(evt, name) => {
                                selectBoxChangeHandler(evt, name, 'payLoad', parentClass.setState);
                            }}
                        />
                    </div>
                </div>
            )}

            {showFilter.includes("gender") && (
                <div className="col-md-3 mb-20 ">
                    <div className="lpay_select_group">
                        <SelectBox
                            placeholder={"ALL"}
                            selectWidth="100%"
                            inputLable="Gender"
                            name="gender"
                            value={parentClass.state.gender}
                            options={gender_list_reporting}
                            changeSelection={(evt, name) => {
                                selectBoxChangeHandler(evt, name, 'payLoad', parentClass.setState);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportingFilter;
