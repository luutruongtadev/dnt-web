import { LOGIN, LOGOUT, CHANGE_PASSWORD } from './action/authActions';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case LOGOUT:
      return {
       ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case CHANGE_PASSWORD:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    default:
      return state; 
  }
}

export default authReducer;