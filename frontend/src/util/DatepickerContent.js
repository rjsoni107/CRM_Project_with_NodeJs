import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import addDays from "date-fns/addDays";
const DatepickerContent = (props) => {
    const _klass = props.parentClass;

    const [state, setState] = useState({
        startDate: new Date(),
        endDate: new Date(),
        maxDate: 0
    });

    const addZero = digit => digit < 10 ? `0${digit}` : digit;

    const fetchDateHandler = (obj, seprator) => {
        if(obj !== null) {
            const day = addZero(obj.getDate()),
                month = addZero(obj.getMonth() + 1),
                year = obj.getFullYear();
    
            return `${day}${seprator}${month}${seprator}${year}`;
        }

        return obj;
    }

    const daysDifferenceNumber = (_startDate, _endDate) => {
        const _difference = _startDate.getTime() - new Date().getTime();
        const _totalDays = Math.ceil(_difference / (1000 * 3600 * 24));
        return Math.abs(_totalDays);
    }

    const dateChangeHandler = (dates) => {
        const dateCount = daysDifferenceNumber(dates[0], undefined);

        setState(prevState => ({
            startDate: dates[0],
            endDate: dates[1],
            maxDate: dateCount > 30 ? 30 : dateCount
        }));

        if(dates[1] !== null) {
            _klass.setState(prevState => ({
                ...prevState,
                payLoad: {
                    ...prevState.payLoad,
                    dateFrom: fetchDateHandler(dates[0], "-"),
                    dateTo: fetchDateHandler(dates[1], "-")
                },
                datepickerObj: {
                    ...prevState.datepickerObj,
                    activeDate: fetchDateHandler(dates[0], "-")+ " - " +fetchDateHandler(dates[1], "-")
                },
                filterVisible: null
            }));

            setState(prevState => ({
                startDate: dates[0],
                endDate: dates[1],
                maxDate: daysDifferenceNumber(dates[0], undefined)
            }));

            props.dataRenderMethod('dateFilter', fetchDateHandler(dates[0], "-"), fetchDateHandler(dates[1], "-"));
        }

    };

    const dateSelector = (_differenceDate) => {
        const _todayDate = new Date();
        const _requestedDate =  new Date(_todayDate.getFullYear(), _todayDate.getMonth(), _todayDate.getDate()-_differenceDate);
        return _requestedDate;
    }

    const customDateHandler = (_custom) => {
        const _isCustomDate = false;

        _klass.setState(prevState => ({
            datepickerObj: {
                activeDate: _custom
            }
        }));

        let _desiredDate = null;
        let _dateObj = {};

        if(_custom === "Past 7 days") {
            _desiredDate = dateSelector(7);
            _dateObj['dateFrom'] = _desiredDate;
            _dateObj['dateTo'] = new Date()
        } else if(_custom === "Past 15 days") {
            _desiredDate = dateSelector(15);
            _dateObj['dateFrom'] = _desiredDate;
            _dateObj['dateTo'] = new Date()
        } else if(_custom === "Yesterday") {
            _desiredDate = dateSelector(1);
            _dateObj['dateFrom'] = _desiredDate;
            _dateObj['dateTo'] = _desiredDate
        } else if(_custom === "Last 30 days") {
            _desiredDate = dateSelector(30);
            _dateObj['dateFrom'] = _desiredDate;
            _dateObj['dateTo'] = new Date()
        } else if(_custom === "Today") {
            _dateObj['dateFrom'] = new Date();
            _dateObj['dateTo'] = new Date()
        }

        setState({
            startDate: _dateObj['dateFrom'],
            endDate: _dateObj['dateTo']
        });

        _klass.setState(prevState => ({
            payLoad: {
                ...prevState.payLoad,
                dateFrom: fetchDateHandler(_dateObj['dateFrom'], "-"),
                dateTo: fetchDateHandler(_dateObj['dateTo'], "-")
            },
            // dateFrom: _dateObj['dateFrom'],
            // dateTo: _dateObj['dateTo'],
            // datepickerObj: {
            //     activeDate: _custom
            // },
            filterVisible: _isCustomDate ? 'dateFilter' : null
        }));

        props.dataRenderMethod('dateFilter', fetchDateHandler(_dateObj['dateFrom'], "-"), fetchDateHandler(_dateObj['dateTo'], "-"));
    }

    const _datepickerOptions = ['Today', 'Yesterday', 'Past 7 days', 'Past 15 days', 'Last 30 days'];
    const _datepickerOptionsList = _datepickerOptions.map(item => {
        return (
            <span key={item} className={`${props.activeDate === item ? 'activeLink' : ''}`} onClick={(e) => {customDateHandler(item)}}>{ item }</span>
        )
    });

    return (
        <div className="datepicker-container">
            <div className="datepcker-container__link text-center">
                { _datepickerOptionsList }
            </div>
            <DatePicker
                selected={state.startDate}
                onChange={dateChangeHandler}
                startDate={state.startDate}
                monthsShown={2}
                endDate={state.endDate}
                maxDate={addDays(state.startDate, state.maxDate)}
                selectsRange
                inline
            />
        </div>
    )

} 
export default DatepickerContent;