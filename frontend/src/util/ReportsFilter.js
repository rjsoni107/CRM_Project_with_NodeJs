import React, { useState, useEffect } from 'react';
import { BiChevronDown, BiCalendarAlt, BiFilterAlt, BiCloudDownload } from "react-icons/bi";
import { FaSearch } from 'react-icons/fa';
import FadeInContent from './FadeInContent';
import DatepickerContent from './DatepickerContent';
import ReportingFilter from './ReportingFilters';
import ValidationHandler from '../components/utility/ValidationHandler';
import Base from './Base';

const { isValueExist } = ValidationHandler();
const { fetchData, dataDownloadHandler, outsideClick } = Base();

const ReportsFilter = (props) => {
    const _dynamicKey = isValueExist(props.inputSearchFields) ? Object.keys(props.inputSearchFields.filters)[0] : 'orderId';
    const _dynamicValue = isValueExist(props.inputSearchFields) ? Object.values(props.inputSearchFields.filters)[0] : 'Order ID';
    const _selectedPlaceHolder = props.inputSearchFields.filterAccept

    const [state, setState] = useState({
        inputSearchFields: {
            searchKey: _dynamicKey,
            showSelectedFilter: _dynamicValue,
            searchParam: { [_dynamicKey]: '' },
            filterAccept : _selectedPlaceHolder
        },
        fadeContentFilterList: false,
        filterVisible: null,
        dateFilter: false,
        selectableFilters: false,
        searchKey: _dynamicKey,
        showSelectedFilter: _dynamicValue,
        searchValue: { [_dynamicKey]: '' },
        datepickerObj: { activeDate: 'Today' },
        payLoad: { ...props.payLoads },
        start: props.serverSideVar.start,
        length: props.serverSideVar.length
    });

    const handleFadeContent = (_stateName) => {
        setState(prevState => ({ ...prevState, filterVisible: _stateName }));
    };    

    const invokeMethodOnEnter = (evt) => {
        if (evt.code === "Enter" || evt.type === "click") {
            sendRequestedData(evt);
        }
    };

    const handleChange = (evt) => {
        const { name, value } = evt.target; 
        setState(prevState => ({
            ...prevState,
            inputSearchFields: {
                ...prevState.inputSearchFields,
                searchParam: {
                    ...prevState.inputSearchFields.searchParam,
                    [name]: value
                }
            }
        }));
    };

    const sendRequestedData = (evt, _dateFrom, _dateTo) => {        
        const _partialPayLoad = state.payLoad;
        const _severSideParam = { start: props.serverSideVar.start, length: props.serverSideVar.length };

        if (state.inputSearchFields.searchParam.searchKey !== "") {
            if (evt.type === "click" || evt.type === "keydown") {        
                _severSideParam.start = 0;
            }
        }

        let _payLoad = { ..._partialPayLoad, ...state.inputSearchFields.searchParam, ..._severSideParam };        

        if (evt === "dateFilter") {
            _payLoad['dateFrom'] = _dateFrom;
            _payLoad['dateTo'] = _dateTo;
        }

        props.stateUpdater(prevState => ({
            ...prevState,
            showLoader: true,
        }));

        fetchData('POST', props.actions.dataRenderAction, _payLoad).then(responseJson => {
            props.stateUpdater(prevState => ({
                ...prevState,
                showLoader: false,
                row: responseJson.aaData || [],
                countPerPage: responseJson.recordsTotal
            }));

            setState(prevState => ({ ...prevState, filterVisible: null }));
        });
    };

    const requestDownloadMethod = () => {
        const _partialPayLoad = state.payLoad;
        const _payLoad = { ..._partialPayLoad, ...state.inputSearchFields.searchParam, ...props.downloadParam };
        dataDownloadHandler(_payLoad, "#downloadingDataForm");
    };

    useEffect(() => {
        sendRequestedData("load");
        document.addEventListener('click', (e) => { outsideClick(e, setState) }, true);
        return () => document.removeEventListener('click', (e) => { outsideClick(e, setState) }, true);
    }, [props.forceUpdate]);

    const { inputSearchFields, filterVisible, payLoad, datepickerObj } = state;
    
    const _searchName = inputSearchFields.searchKey; 
    const _fieldValue = inputSearchFields.searchParam[_searchName];    

    return (
        <div className="row align-items-end">
            <div className="col-md-4 mb-20">
                {inputSearchFields && (
                    <div className="multiple-search__wrapper flex items-center">
                        <div className="multiple-search__info flex justify-center" onClick={invokeMethodOnEnter}>
                            <div className="multiple-search__text">
                                <span className='ml-20 text-white'><FaSearch /></span>
                            </div>
                        </div>
                        <div className="multiple-search__input">
                            <input
                                value={_fieldValue !== undefined ? _fieldValue : ''} 
                                type="text"
                                name={inputSearchFields.searchKey}
                                onChange={handleChange}
                                onKeyDown={invokeMethodOnEnter}
                                placeholder={inputSearchFields.filterAccept}
                                className='search-input'
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="col-md-8 mb-20 p-0">
                <div className="filters-wrapper flex justify-end ">
                    {payLoad.dateFrom && (
                        <div className="date-filter__div flex items-center filters-common_div">
                            <div onClick={() => handleFadeContent("dateFilter")}> 
                                <BiCalendarAlt className='mb-4' />
                                <span>{datepickerObj.activeDate}</span>
                                <BiChevronDown className='mb-4' />
                            </div>
                            <FadeInContent
                                customClass="date-filter__content"
                                width={550}
                                isFooter={false}
                                isVisible={filterVisible === "dateFilter"}
                                component={
                                    <DatepickerContent
                                        dataRenderMethod={sendRequestedData}
                                        parentClass={{ setState }}
                                        activeDate={datepickerObj.activeDate}
                                    />
                                }
                            />
                        </div>
                    )}

                    {props.actions.dataDownloadAction && (
                        <div className="download-filter filter-button flex items-center justify-center" onClick={requestDownloadMethod}>
                            <div>
                                <BiCloudDownload />
                                <span>Download</span>
                            </div>
                        </div>
                    )}

                    {props.filterToVisible && (
                        <div className="more-filters filter-button flex items-center justify-center filters-common_div">
                            <div onClick={() => handleFadeContent("selectableFilters")}> 
                                <BiFilterAlt />
                                <span>Filters</span>
                            </div>
                            <FadeInContent
                                customClass="more-filter__content"
                                width={550}
                                isVisible={filterVisible === "selectableFilters"}
                                isFooter={true}
                                buttonMethod={{
                                    dataRenderingMethod: sendRequestedData,
                                    closeFadeFilter: () => handleFadeContent(null)
                                }}
                                component={
                                    <ReportingFilter
                                        parentClass={{ state, setState }}
                                        showFilter={props.filterToVisible}
                                        customFilter={props.customFilters}
                                        customVariable={props.customFilterVariable}
                                    />
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
            <form id='downloadingDataForm' method="POST" action={props.actions.dataDownloadAction}></form>
        </div>
    );
};

export default ReportsFilter;