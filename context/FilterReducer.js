import { LOGIN, LOGOUT,  CHANGE_USER_COUNTRY } from './action/filterAction';

// Guard localStorage for SSR: this reducer is evaluated at import time inside the
// server-prerendered Redux Provider, where localStorage does not exist.
const ls = (key) =>
  (typeof window !== "undefined" ? localStorage.getItem(key) : null) || "";

const initialState = {
  nation: ls("nation"),
  category: ls("category"),
  condition: ls("condition"),
  subcategory: ls("subcategory"),
  district: ls("district"),
}

const filterReducer = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_USER_COUNTRY:
      return {
        ...state,
        nation: action.payload
      };
    default:
      return state; 
  }
}

export default filterReducer;
