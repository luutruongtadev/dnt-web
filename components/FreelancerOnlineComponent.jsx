"use client";
import React, { useState, useEffect } from "react";
import { handleAcceptFreelancer } from "../services/freelancerService";
import { useTranslation } from "react-i18next";

// FilterDropdown component for each column header
function FilterDropdown({ options, selectedValue, onFilterChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (value) => {
    onFilterChange(value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((option) =>
    String(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 text-xs bg-gray-200 hover:bg-gray-300 px-1 py-0.5 rounded border"
      >
        ▼
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded z-10 min-w-max">
          <div 
            className="p-2 border-b border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleSelect("")}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
            >
              {placeholder || "All"}
            </button>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${
                    selectedValue === option ? "bg-blue-100" : ""
                  }`}
                >
                  {option}
                </button>
              ))
            ) : (
                <div className="px-3 py-1 text-sm text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FreelancerOnlineComponent({ freelancers }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    id: "",
    name: "",
    estimate: "",
    requirement: "",
    startTime: "",
    startLocation: "",
    endTime: "",
    endLocation: "",
    deposit: "",
    price: "",
    serviceFee: "",
    status: ""
  });
  const [filteredFreelancers, setFilteredFreelancers] = useState(freelancers);

  // Get unique values for each column for dropdown options
  const getUniqueValues = (key) => {
    const values = freelancers.map(freelancer => freelancer[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Handle filter changes
  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Apply filters
  useEffect(() => {
    let filtered = freelancers.filter(freelancer => {
      return (
        (freelancer.type === "offline" &&
          freelancer.id.toString().includes(searchTerm)) ||
        freelancer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Apply column filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(freelancer => {
          const value = freelancer[key];
          return value && value.toString().toLowerCase().includes(filters[key].toLowerCase());
        });
      }
    });

    setFilteredFreelancers(filtered);
  }, [searchTerm, filters, freelancers]);

  return (
    <div className="pt-1">
      <div className="overflow-x-auto">
        {/* Header columns with horizontal scroll */}
        <div className="grid grid-flow-col border-gray-300 font-bold w-full">
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "50px" }}>
            <div>{t("common.stt", "SỐ THỨ TỰ")}</div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div>
              {t("freelancer.id")}
              <FilterDropdown
                options={getUniqueValues('id')}
                selectedValue={filters.id}
                onFilterChange={(value) => handleFilterChange('id', value)}
                placeholder="All IDs"
              />
            </div>
          </div>

          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div>
              {t("freelancer.jobName")}
              <FilterDropdown
                options={getUniqueValues('name')}
                selectedValue={filters.name}
                onFilterChange={(value) => handleFilterChange('name', value)}
                placeholder="All Jobs"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
            <div className="flex justify-center items-center " style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t('freelancer.estimate') }} />
              <FilterDropdown
                options={getUniqueValues('estimate')}
                selectedValue={filters.estimate}
                onFilterChange={(value) => handleFilterChange('estimate', value)}
                placeholder="All Estimates"
              /></div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "200px" }}>
            <div className="flex justify-center items-center " style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t('freelancer.profilejob') }} />
              <FilterDropdown
                options={getUniqueValues('profilejob')}
                selectedValue={filters.profilejob}
                onFilterChange={(value) => handleFilterChange('profilejob', value)}
                placeholder="All"
              /></div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "160px" }}>
            <div className="flex justify-center items-center " style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t('freelancer.requirements') }} />
              <FilterDropdown
                options={getUniqueValues('requirement')}
                selectedValue={filters.requirement}
                onFilterChange={(value) => handleFilterChange('requirement', value)}
                placeholder="All Requirements"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.startTime") }} />
              <FilterDropdown
                options={getUniqueValues('startTime')}
                selectedValue={filters.startTime}
                onFilterChange={(value) => handleFilterChange('startTime', value)}
                placeholder="All Start Times"
              />
            </div>
          </div>
          {/* <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.startLocation") }} />
              <FilterDropdown
                options={getUniqueValues('startLocation')}
                selectedValue={filters.startLocation}
                onFilterChange={(value) => handleFilterChange('startLocation', value)}
                placeholder="All Start Locations"
              />
            </div>
          </div> */}
          {/* New columns */}
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.finishTime") }} />
              <FilterDropdown
                options={getUniqueValues('endTime')}
                selectedValue={filters.endTime}
                onFilterChange={(value) => handleFilterChange('endTime', value)}
                placeholder="All Finish Times"
              />
            </div>
          </div>
          {/* <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.finishLocation") }} />
              <FilterDropdown
                options={getUniqueValues('endLocation')}
                selectedValue={filters.endLocation}
                onFilterChange={(value) => handleFilterChange('endLocation', value)}
                placeholder="All Finish Locations"
              />
            </div>
          </div> */}
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "130px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.deposit") }} />
              <FilterDropdown
                options={getUniqueValues('deposit')}
                selectedValue={filters.deposit}
                onFilterChange={(value) => handleFilterChange('deposit', value)}
                placeholder="All Deposits"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.cod") }} />
              <FilterDropdown
                options={getUniqueValues('cod')}
                selectedValue={filters.cod}
                onFilterChange={(value) => handleFilterChange('cod', value)}
                placeholder="All"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.vat") }} />
              <FilterDropdown
                options={getUniqueValues('vat')}
                selectedValue={filters.vat}
                onFilterChange={(value) => handleFilterChange('vat', value)}
                placeholder="All"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t('freelancer.priceOffered') }} />
              <FilterDropdown
                options={getUniqueValues('price')}
                selectedValue={filters.price}
                onFilterChange={(value) => handleFilterChange('price', value)}
                placeholder="All Prices"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.payonweb") }} />
              <FilterDropdown
                options={getUniqueValues('payOnWeb')}
                selectedValue={filters.payOnWeb}
                onFilterChange={(value) => handleFilterChange('payOnWeb', value)} 
                placeholder="All"
              />
            </div>
          </div>
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "120px" }}>
            <div className="flex justify-center items-center" style={{ alignItems: "baseline" }}>
              <p dangerouslySetInnerHTML={{ __html: t("freelancer.setPrice") }} />
              <FilterDropdown
                options={getUniqueValues('serviceFee')}
                selectedValue={filters.serviceFee}
                onFilterChange={(value) => handleFilterChange('serviceFee', value)}
                placeholder="All Service Fees"
              />
            </div>
          </div>
          
          <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "120px" }}>
            {t("freelancer.accept")}
          </div>
        </div>


        {filteredFreelancers.map((freelancer, index) => (
          <div
            key={index}
            className="grid grid-flow-col border-b  border-gray-300"
          >
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "50px" }}>
              {index + 1}
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div>
                {freelancer.id}
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div>
                {freelancer.name}
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
              <div>
                {freelancer.estimate}
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "200px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.profilejob }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "160px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.requirement }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.startTime }} />
              </div>
            </div>
            {/* <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.startLocation }} />
              </div>
            </div> */}
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.endTime }} />
              </div>
            </div>
            {/* <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.endLocation }} />
              </div>
            </div> */}
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "130px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.deposit }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.cod }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.vat }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "150px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.price }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "180px" }}>
              <div className="flex justify-center items-center">
                <p dangerouslySetInnerHTML={{ __html: freelancer.payOnWeb }} />
              </div>
            </div>
            <div className="border-r border-t border-gray-300 p-2 text-center" style={{ width: "120px" }}>
              <input
                  type="number"
                  defaultValue={0}
                  className="border-gray-300 rounded w-full text-right"
                />
            </div>
            
            <div className="border-r border-t border-gray-300 p-2 text-center
            flex justify-center items-center
            " style={{ width: "120px" }}>
              <button
                  onClick={() =>
                    handleAcceptFreelancer(freelancer.documentId)
                  }
                  className="bg-green-500 p-1 hover:bg-green-600 text-white rounded"
                >
                  {t("common.accept")}
                </button>
            </div>
          </div>

        ))}

      </div>
    </div>
  );
}