
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const CHANGE_PASSWORD = 'CHANGE_PASSWORD';

export const loginAction = (user) => {
  return {
    type: LOGIN,
    payload: user,
  };
};

export const logoutAction = () => {
  return {
    type: LOGOUT,
  };
};

export const changePasswordAction = (user) => {
  return {
    type: CHANGE_PASSWORD,
    payload: user,
  };
};