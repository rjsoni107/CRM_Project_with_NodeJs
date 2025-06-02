import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    name: "",
    emailId: "",
    mobile: "",
    userId: "",
    userType: "",
    token: "",
    profile_pic: "",
    onlineUser: [],
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.name = action.payload.name
            state.emailId = action.payload.emailId
            state.mobile = action.payload.mobile
            state.userId = action.payload.userId
            state.userType = action.payload.userType
            state.profile_pic = action.payload.profile_pic
        },
        setToken: (state, action) => {
            state.token = action.payload
        },
        logout: (state, action) => {
            state.name = ""
            state.emailId = ""
            state.mobile = ""
            state.userId = ""
            state.userType = ""
            state.profile_pic = ""
        },
        setOnlineUser: (state, action) => {
            state.onlineUser = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { setUser, setToken, logout, setOnlineUser } = userSlice.actions

export default userSlice.reducer