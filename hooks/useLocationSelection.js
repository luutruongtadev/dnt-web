"use client";
import { useEffect, useState } from "react"
import { getCountries, getCountryByCode, getDistrictByCode } from "../services/countries"

export default function useLocationSelection() {
  const [countries, setCountries] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await getCountries()
        if (!mounted) return
        setCountries(list)
        // Do not prefill from localStorage anymore; leave defaults empty
      } catch {
        // Keep location options empty if the catalog cannot be loaded.
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleCountryChange = async (e) => {
    const name = e.target.value
    setSelectedCountry(name)
    localStorage.setItem("nation", name || "")
    if (!name) {
      localStorage.removeItem("province")
      localStorage.removeItem("district")
      setProvinces([])
      setDistricts([])
      setSelectedProvince("")
      setSelectedDistrict("")
      return
    }
    try {
      const states = await getCountryByCode(name)
      setProvinces(states)
      setSelectedProvince("")
      setDistricts([])
      setSelectedDistrict("")
    } catch {
      setProvinces([])
      setDistricts([])
    }
  }

  const handleProvinceChange = async (e) => {
    const val = e.target.value
    setSelectedProvince(val)
    localStorage.setItem("province", val || "")
    if (val) {
      try {
        const ds = await getDistrictByCode(val)
        setDistricts(ds)
        setSelectedDistrict("")
        localStorage.removeItem("district")
      } catch {
        setDistricts([])
      }
    } else {
      setDistricts([])
      setSelectedDistrict("")
      localStorage.removeItem("district")
    }
  }

  const handleDistrictChange = (e) => {
    const val = e.target.value
    setSelectedDistrict(val)
    localStorage.setItem("district", val || "")
  }

  const setLocationSelection = async ({ country = "", province = "", district = "" } = {}) => {
    setSelectedCountry(country)
    if (!country) {
      setProvinces([])
      setDistricts([])
      setSelectedProvince("")
      setSelectedDistrict("")
      return
    }

    try {
      const states = await getCountryByCode(country)
      setProvinces(states)
    } catch {
      setProvinces([])
    }

    setSelectedProvince(province)
    if (!province) {
      setDistricts([])
      setSelectedDistrict("")
      return
    }

    try {
      const ds = await getDistrictByCode(province)
      setDistricts(ds)
    } catch {
      setDistricts([])
    }
    setSelectedDistrict(district)
  }

  return {
    countries,
    provinces,
    districts,
    selectedCountry,
    selectedProvince,
    selectedDistrict,
    handleCountryChange,
    handleProvinceChange,
    handleDistrictChange,
    setLocationSelection,
  }
}
