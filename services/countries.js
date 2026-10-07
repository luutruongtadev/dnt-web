

export const getCountries = async () => {
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/flag/images");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const result = await response.json();
    const countries = result.data || [];
    const all = { vi: "Tất cả", en: "All", cca2: "" }

    const priorityCodes = ["VN", "US"];

    const reordered = countries.sort((a, b) => {
      const aPriority = priorityCodes.indexOf(a.iso2);
      const bPriority = priorityCodes.indexOf(b.iso2);

      // 🔹 1. Prioritize VN, US
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;

      // 🔹 2. Then sort alphabetically by name
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });
    const countriesWithAll = [all, ...reordered.map(country => ({
      vi: country.name,
      en: country.name,
      flag: country.flag,
      cca2: country.iso2
    }))];

    return countriesWithAll;

  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}



export const getCountryByCode = async (name) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ country: name });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", requestOptions);
    const country = await response.json();

    const all = { vi: "Tất cả", en: "All" };
    const provices = [all, ...country.data.states.map(state => ({
      vi: state.name,
      en: state.name,
    }))];
    return provices;
  } catch (error) {
    console.error("Error fetching country by code:", error);
    return [];
  }
};

export const getDistrictByCode = async (province) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ state: province });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", requestOptions);
    const result = await response.json();
    const all = { vi: "Tất cả", en: "All" };
    const districts = result.data.map(district => ({
      vi: district,
      en: district,
    }));
    return [all, ...districts];
  } catch (error) {
    console.error("Error fetching districts by province code:", error);
    return [];
  }
};
