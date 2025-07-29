// project imports
import config from '../config';

// action - state management
import * as actionTypes from './actions';

export const initialState = {
  isOpen: [], // for active default menu
  defaultId: 'default',
  fontFamily: config.fontFamily,
  borderRadius: config.borderRadius,
  opened: true
};

// ==============================|| CUSTOMIZATION REDUCER ||============================== //


// ==============================|| CUSTOMIZATION REDUCER ||============================== //

const customizationReducer = (state = initialState, action: any) => {
    let id;
    switch (action.type) {
        case actionTypes.MENU_OPEN:
            id = action.id;
            return {
                ...state,
                isOpen: [id]
            };
        case actionTypes.SET_MENU:
            return {
                ...state,
                opened: action.opened
            };
        case actionTypes.SET_FONT_FAMILY:
            return {
                ...state,
                fontFamily: action.fontFamily
            };
        case actionTypes.SET_BORDER_RADIUS:
            return {
                ...state,
                borderRadius: action.borderRadius
            };
        default:
            return state;
    }
};

const authInitialState = {
    isAuthenticated: false,
    user: null,
};

const authReducer = (state = authInitialState, action: any) => {
    switch (action.type) {
        case 'LOGIN':
            if (!action.payload) return state;
            window.localStorage.setItem('userData', JSON.stringify(action.payload));
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
            };
        case 'LOGOUT':
            window.localStorage.removeItem('userData');
            return {
                ...state,
                isAuthenticated: false,
                user: null,
            };
        default:
            return state;
    }
};

const meterInitialReading = {
    meterConnected: false,
    meterData: null
}

const meterReducer = (state = meterInitialReading, action: any) => {
    switch (action.type){
        case 'setMeter':
            return {
                ...state,
                meterConnected: true,
                meterData: action.payload
            };
        case 'resetMeter':
            return {
                ...state,
                meterConnected: false,
                meterData: null
            };
        default:
            return state;
    }
}
export { customizationReducer, authReducer, meterReducer };