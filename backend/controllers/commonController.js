const { Country, State, City } = require("country-state-city");

// GET COUNTRY LIST
exports.getCountryList = async (req, res) => {
    try {
        const countries = Country.getAllCountries();
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Countries fetched successfully",
            responseCode: "200",
            countries: countries || [],
        });
    } catch (error) {
        console.error("Error fetching countries:", error);
        res.status(500).json({
            responseStatus: "Error",
            responseMsg: "Error fetching countries: " + error.message,
            responseCode: "500",
        });
    }
}

// GET STATE LIST
exports.getStateList = async (req, res) => {
    try {
        const { countryCode } = req.params; // Extract countryCode from route parameter
        const states = State.getStatesOfCountry(countryCode); // Fetch states for the country
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "States fetched successfully",
            responseCode: "200",
            states: states || [],
        });
    } catch (error) {
        console.error("Error fetching states:", error);
        res.status(500).json({
            responseStatus: "Error",
            responseMsg: "Error fetching states: " + error.message,
            responseCode: "500",
        });
    }
};

// GET CITY LIST
exports.getCityList = async (req, res) => {
    try {
        const { countryCode, stateCode } = req.params;
        // Fetch cities for the given stateCode
        const cities = City.getCitiesOfState(countryCode, stateCode);

        if (!cities || cities.length === 0) {
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "No cities found for the given stateCode",
                responseCode: "404",
                cities: [],
            });
        }

        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Cities fetched successfully",
            responseCode: "200",
            cities,
        });
    } catch (error) {
        console.error("Error fetching cities:", error);
        res.status(500).json({
            responseStatus: "Error",
            responseMsg: "Error fetching cities: " + error.message,
            responseCode: "500",
        });
    }
};