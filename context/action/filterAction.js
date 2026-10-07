
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const CHANGE_USER_COUNTRY = 'CHANGE_USER_COUNTRY';

export const changeUserCountry = (country) => {
  return {
    type: CHANGE_USER_COUNTRY,
    payload: country,
  };
};

