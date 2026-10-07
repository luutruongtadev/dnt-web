import { combineReducers } from 'redux';
import authReducer from './AuthReducer';

import filterReducer from './FilterReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  filter: filterReducer,
});

export default rootReducer;