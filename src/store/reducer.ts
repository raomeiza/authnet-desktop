import { combineReducers } from 'redux';

// reducer import
import {customizationReducer, authReducer, meterReducer} from './customizationReducer';

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
  customization: customizationReducer,
  auth: authReducer,
  meter: meterReducer,
});

export default reducer;
