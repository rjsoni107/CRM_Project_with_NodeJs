import { ENDPOINTS } from "../utility/ApiEndpoints";
import { jwtDecode } from "jwt-decode";

const Base = () => {
    let isAutoLogoutHandled = false
    const authToken = localStorage.getItem('authToken');

    const basePathAction = (action) => {
        const basePathAction = `${window.basePath}/${action}`
        return basePathAction;
    };

    const handleLogout = (setShowLoader) => {
        setShowLoader(true)
        localStorage.removeItem("authToken");
        localStorage.removeItem("globalObj");
        window.location.href = basePathAction(ENDPOINTS.LOGIN);
    };

    const fetchData = async (method, actionName, payload, isContentType = true, isStringify = true) => {
        const requestMetadata = {
            method: method,
            headers: {
                ...(authToken && { "Authorization": `Bearer ${authToken}` }), // Add Authorization header if token exists
                'Accept': 'application/json',
                ...(isContentType && { 'Content-Type': 'application/json' })
            }
        };

        if (payload) {
            requestMetadata.body = isStringify ? JSON.stringify(payload) : payload;
        }

        try {
            const response = await fetch(actionName, requestMetadata);

            const data = await response.json();

            if (data.redirectUrl) window.location.href = basePathAction(data.redirectUrl);

            return data;
        } catch (error) {
            console.error("Error in fetchData:", error);
            window.location.href = basePathAction(ENDPOINTS.ERROR);
            return { error: true, message: error.message };
        }
    };

    // Function to check token expiration
    function isTokenExpired() {
        try {
            const { exp } = jwtDecode(authToken);
            const currentTime = Date.now() / 1000; // Current time in seconds
            return exp < currentTime; // Check if the token is expired
        } catch (error) {
            return true; // If decoding fails, treat the token as expired
        }
    }

    function handleAutoLogout() {
        if (isAutoLogoutHandled) return null;
        if (!authToken) return null;

        if (isTokenExpired(authToken)) {
            console.error("Session expired. Redirecting to login page...");
            isAutoLogoutHandled = true;
            localStorage.removeItem("authToken");
            window.location.href = basePathAction(ENDPOINTS.LOGIN);
        }
    }

    const getCountryList = async (setState, setShowLoader) => {
        const actionName = basePathAction(ENDPOINTS.GET_COUNTRY_LIST);
        setShowLoader(true);
        try {
            const responseJson = await fetchData("GET", actionName);
            const { responseCode, responseStatus, countries } = responseJson;
            if (responseCode === "200" && responseStatus.toUpperCase() === "SUCCESS" && countries !== undefined) {
                const formattedCountries = countries.map((country) => ({
                    value: country.isoCode,
                    label: country.name,
                }));

                formattedCountries.unshift({ value: '', label: 'Select country' });
                setState(prevState => ({
                    ...prevState,
                    countries_list: formattedCountries,
                }));
            }
        } catch (error) {
            console.error("Error fetching country list:", error);
        } finally {
            setShowLoader(false);
        }

    };

    const getStateList = async (setState, selectedCountry, setShowLoader) => {
        if (!selectedCountry) return; // Exit if no country code is selected

        const actionName = basePathAction(ENDPOINTS.GET_STATE_LIST);
        setShowLoader(true);
        try {
            const responseJson = await fetchData("GET", `${actionName}/${selectedCountry}`);
            const { responseCode, responseStatus, states } = responseJson;

            if (responseCode === "200" && responseStatus.toUpperCase() === "SUCCESS" && states !== undefined) {
                const formattedState = states.map((state) => ({
                    value: state.isoCode,
                    label: state.name,
                }));

                // Add default option
                formattedState.unshift({ value: '', label: 'Select state' });

                // Only update state if the data has changed
                setState((prevState) => {
                    if (JSON.stringify(prevState.state_list) === JSON.stringify(formattedState)) {
                        return prevState; // No change, avoid re-render
                    }
                    return {
                        ...prevState,
                        state_list: formattedState,
                    };
                });
            }
        } catch (error) {
            console.error("Error fetching state list:", error);
        } finally {
            setShowLoader(false);
        }
    };

    const getCityList = async (setState, setShowLoader, payload) => {
        const { state, country } = payload;
        if (!state && !country) return; // Exit if no state code and country code is selected

        const actionName = basePathAction(ENDPOINTS.GET_CITY_LIST);
        setShowLoader(true);
        try {
            const responseJson = await fetchData("GET", `${actionName}/${country}/${state}`);
            const { responseCode, responseStatus, cities } = responseJson;

            if (responseCode === "200" && responseStatus.toUpperCase() === "SUCCESS" && cities !== undefined) {
                const formattedCity = cities.map((city) => ({
                    value: city.name,
                    label: city.name,
                }));

                // Add default option
                formattedCity.unshift({ value: '', label: 'Select city' });

                // Only update state if the data has changed
                setState((prevState) => {
                    if (JSON.stringify(prevState.city_list) === JSON.stringify(formattedCity)) {
                        return prevState; // No change, avoid re-render
                    }
                    return {
                        ...prevState,
                        city_list: formattedCity,
                    };
                });
            }
        } catch (error) {
            console.error("Error fetching city list:", error);
        } finally {
            setShowLoader(false);
        }
    }

    const handleCountryChange = (that, setState, setShowLoader) => {
        const $stateOption = [{ value: '', label: 'Select state' }];
        const $cityOption = [{ value: '', label: 'Select city' }];

        setState((prevState) => ({
            ...prevState,
            state: $stateOption,
            city: $cityOption,
            state_list: [],
            city_list: [],
        }));
    };

    const handleStateChange = (that, setState, setShowLoader, payload) => {
        const $cityOption = [{ value: '', label: 'Select city' }];
        const selectedState = that.value;
        const selectedCountry = payload.country;

        setState((prevState) => ({
            ...prevState,
            city: $cityOption,
            city_list: [],
        }));

        if (selectedState) {
            getCityList(selectedCountry, selectedState, setShowLoader);
        }
    };

    const formatDateAndSeconds = (dateStr) => {
        if (!dateStr) return { formattedDate: "", time: "" };

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return { formattedDate: "", time: "" };

        const pad = (num) => String(num).padStart(2, '0');
        return {
            formattedDate: `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`,
            time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
        };
    };

    const invokePaginationMethod = (start, length, event, setState, fetchDataCallback) => {
        if (event === "onChangePage") {
            setState(prevState => {
                const updatedState = {
                    ...prevState,
                    start: start * prevState.length, // Update start based on the current page
                    length: length, // Keep the current length
                };
                fetchDataCallback(updatedState); // Trigger data fetch with the updated state
                return updatedState;
            });
        } else if (event === "onChangeRowsPerPage") {
            setState(prevState => {
                const updatedState = {
                    ...prevState,
                    start: 0, // Reset to the first page
                    length: length, // Update the number of rows per page
                };
                fetchDataCallback(updatedState); // Trigger data fetch with the updated state
                return updatedState;
            });
        }
    };


    return {
        handleAutoLogout,
        fetchData,
        basePathAction,
        formatDateAndSeconds,
        invokePaginationMethod,
        getCountryList,
        getStateList,
        getCityList,
        handleCountryChange,
        handleStateChange,
        handleLogout
    };
};

export default Base;