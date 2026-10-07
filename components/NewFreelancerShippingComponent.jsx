"use client";
import React, { useState } from "react";
import { createFreelancer } from "../services/freelancerService";
import { useTranslation } from "react-i18next";
import PinLocationButton from "./PinLocationButton";
import TwoLineUnitInput from "./atoms/TwoLineUnitInput";
import TermsAgreementCheckbox from "./atoms/TermsAgreementCheckbox";
import { getUserCountry } from "../utils/user";

const NewFreelancerShippingComponent = ({ freelanceType }) => {
  const { t } = useTranslation();
  const country = getUserCountry();

  const [freelancerData, setFreelancerData] = useState({
    name: "John Doe",
    estimate: "Estimated completion in 2 weeks",
    requirement: "Need expertise in React and Node.js",
    startDate: "2023-12-01T09:00:00.000Z",
    endDate: "2023-12-15T18:00:00.000Z",
    startLocation: "New York",
    endLocation: "Remote",
    price: 2500.0,
    deposit: 500.0,
    serviceFee: 250.0,
    type: "offline",
  });
  const [isAgreed, setIsAgreed] = useState(false);

  const handleSubmit = async (e) => {
    const token = localStorage.getItem("authToken");
    e.preventDefault();
    try {
      const response = await createFreelancer(token, freelancerData);
      console.log("Freelancer created successfully:", response.data);
      // Handle success, e.g., redirect to a success page
    } catch (error) {
      console.error("Error creating freelancer:", error.message);
      // Handle error, e.g., display an error message to the user
    }
  };

  return (
    <div className=" border-orange-100">
      <div className="space-y-4">
        {/* Orange indicator bar at the top */}
        {/* <div className="bg-orange-500 text-white py-2 px-4 text-center mb-4">
          <span className="font-bold">THỰC TẾ</span>
          <span className="italic ml-2">(Actual)</span>
        </div> */}

        {/* Field 1: TÊN CÔNG VIỆC */}
        <div className="grid grid-cols-30 border border-gray-300">
          <div className="col-span-1 border-r border-gray-300 p-2 flex items-center justify-center font-bold">
            1<span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-29">
            <div className="sr-only">{t("newFreelancerDirect.jobName")}</div>
            <div className="flex items-center">
              <input
                type="text"
                className="w-full p-2  border-gray-300 rounded"
                placeholder={t("newFreelancerDirect.jobNamePlaceholder")}
              />

            </div>
          </div>
        </div>

        {/* Rest of the fields remain unchanged */}
        {/* Field 2: ƯỚC LƯỢNG */}
        <div className="grid grid-cols-30 border border-gray-300">
          <div className="col-span-1 border-r border-gray-300 p-2 flex items-center justify-center font-bold">
            2<span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-29">
            <div className="sr-only">{t("newFreelancerDirect.estimate")}</div>
            <div className="flex items-center">
              <input
                type="text"
                className="w-full p-2 border-gray-300 rounded"
                placeholder={t("newFreelancerDirect.estimatePlaceholder")}
              />

            </div>
          </div>
        </div>

        {/* Field 3: ƯỚC LƯỢNG */}
        <div className="grid grid-cols-30 border border-gray-300">
          <div className="col-span-1 border-r border-gray-300 p-2 flex items-center justify-center font-bold">
            3<span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-29 p-2">
            <div className="sr-only">
              {t("newFreelancerDirect.jobProfile")}
            </div>
            <div className="flex items-center w-full">
              <div className="relative w-full ">
                <span className="pointer-events-none absolute inset-y-0 flex items-center text-gray-400">
                  {t("newFreelancerDirect.jobProfile")}
                </span>
                <input
                  type="file"
                  className="w-full border-gray-300 rounded bg-transparent pl-70"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Field 4: YÊU CẦU NHÂN LỰC, PHƯƠNG TIỆN */}
        <div className="grid grid-cols-30 border border-gray-300">
          <div className="col-span-1 border-r border-gray-300 p-2 flex items-center justify-center font-bold">
            4<span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-29 p-2">
            <div className="sr-only">{t("newFreelancerDirect.requirements")}</div>
            <div className="flex items-center">
              <textarea
                className="w-full rounded"
                rows="3"
                placeholder={t("newFreelancerDirect.requirementsPlaceholder")}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Field 5: THỜI GIAN */}
        <div className="grid grid-cols-30 border border-gray-300">
          <div className="col-span-1 border-r border-gray-300 p-2 flex items-center justify-center font-bold">
            5<span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-29  flex justify-between flex-col">
            <div className="border-b border-gray-300 flex">
              <div className="sr-only">
                {t("newFreelancerDirect.startTime")}
              </div>
              <div className="flex items-center">
                <div className="relative w-full ">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    {t("newFreelancerDirect.startTime")}
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full p-2  border-gray-300 rounded bg-transparent pl-70 text-right"
                  />
                </div>
              </div>
            </div>
            <div className="border-b border-gray-300 flex">
              <div className="sr-only">
                {t("newFreelancerDirect.finishTime")}
              </div>
              <div className="flex items-center">
                <div className="relative w-full ">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    {t("newFreelancerDirect.finishTime")}
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full p-2  border-gray-300 rounded bg-transparent pl-70 text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Field 6: ĐỊA ĐIỂM */}
        {true && (
          <div className="grid grid-cols-30 border border-gray-300">
            <div className="col-span-1 border-r border-gray-300 p-2 flex items-center justify-center font-bold">
              6<span className="text-red-500 font-bold">*</span>
            </div>
            <div className="col-span-29">
              <div className="border-b border-gray-300">
                <div className="sr-only">{t("newFreelancerDirect.startLocation")}</div>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 min-w-0 p-2 border-gray-300 rounded"
                    placeholder={t(
                      "newFreelancerDirect.startLocationPlaceholder"
                    )}
                  />
                  <PinLocationButton />
                </div>
              </div>
              <div>
                <div className="sr-only">{t("newFreelancerDirect.finishLocation")}</div>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 min-w-0 p-2 border-gray-300 rounded"
                    placeholder={t(
                      "newFreelancerDirect.finishLocationPlaceholder"
                    )}
                  />
                  <PinLocationButton />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Field 9: THỜI LƯỢNG DUYỆT GIÁ */}
        <div className="grid grid-cols-30 border-gray-300">
          <div className="col-span-1 border  border-gray-300 p-2 flex items-center justify-center font-bold">
            7 <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-6 p-2 border-t border-b  border-gray-300">
            <div className="font-bold">
              {t("newFreelancerDirect.priceReviewTime")}
            </div>
          </div>
          <div className="col-span-3 border border-gray-300 flex items-center">
            <div className="flex items-center gap-1 mx-auto">
              <input
                type="number"
                min="1"
                max="23"
                className="w-full p-2 border-gray-300 rounded text-center"
                placeholder="HH"
                onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (parseInt(value, 10) > 23) {
                    e.target.value = "23";
                  } else if (parseInt(value, 10) < 1 && value.length > 0) {
                    e.target.value = "1";
                  }
                }}
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="w-full p-2 border-gray-300 rounded text-center"
                placeholder="MM"
                onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (parseInt(value, 10) > 59) {
                    e.target.value = "59";
                  } else if (parseInt(value, 10) < 0 && value.length > 0) {
                    e.target.value = "0";
                  }
                }}
              />
            </div>
          </div>
          {/* <div className="col-span-10 p-2 flex items-left">
            <div className="text-center w-full">
              {t("newFreelancerDirect.lessThan24h")}{" "}
            </div>
          </div> */}
        </div>

        {/* Field 8: VAT */}
        <div className="grid grid-cols-30 border-gray-300">
          <div className="col-span-1 border border-gray-300 p-2 flex items-center justify-center font-bold">
            8 <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-6 p-2 border-t border-b  border-gray-300">
            <div className="font-bold">{t("newFreelancerDirect.vat")}</div>
          </div>
          <div className="col-span-3 border border-gray-300 flex items-center">
            <select className="w-full p-2 border-gray-300 rounded bg-transparent text-center">
              <option value="10">{t("common.yes")}</option>
              <option value="0">{t("common.no")}</option>
            </select>
          </div>
          <div className="col-span-4 p-2 flex items-center">
            <div className="text-center w-full">
            </div>
          </div>
        </div>

        <div className="grid grid-cols-30  border-gray-300">
          <div className="col-span-1 border border-gray-300 p-2 flex items-center justify-center font-bold">
            9 <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-6 p-2 border-t border-b  border-gray-300">
            <div className="font-bold">{t("newFreelancerDirect.cod")}</div>
          </div>
          <div className="col-span-3 border border-gray-300 flex items-center">
            <select className="w-full p-2 border-gray-300 rounded bg-transparent text-center">
              <option value="10">{t("common.yes")}</option>
              <option value="0">{t("common.no")}</option>
            </select>
          </div>
          <div className="col-span-4 p-2 flex items-center">
            <div className="text-center w-full">
            </div>
          </div>
        </div>

        <div className="grid grid-cols-30 border-gray-300">
          <div className="col-span-1 border border-gray-300 p-2 flex items-center justify-center font-bold">
            10 <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-6 p-2 border-t border-b  border-gray-300">
            <div className="font-bold">{t("newFreelancerDirect.payonweb")}</div>
          </div>
          <div className="col-span-3 border border-gray-300 flex items-center">
            <select className="w-full p-2 border-gray-300 rounded bg-transparent text-center">
              <option value="10">{t("common.yes")}</option>
              <option value="0">{t("common.no")}</option>
            </select>
          </div>
          <div className="col-span-4 p-2 flex items-center">
            <div className="text-center w-full">
            </div>
          </div>
        </div>


        {/* Field 10: ĐẶT CỌC 02 BÊN */}
        <div className="grid grid-cols-30 border-gray-300">
          <div className="col-span-1 border border-gray-300 p-2 flex items-center justify-center font-bold">
            11 <span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-6 p-2 border-t border-b  border-gray-300">
            <div className="font-bold">{t("newFreelancerDirect.deposit")}</div>
          </div>
          <div className="col-span-11 border pr-2 border-gray-300 flex items-center">
            <input
              type="number"
              min="1"
              step="1"
              className="flex-1 p-2 pr-0 border-gray-300  text-right"
              placeholder={t("newFreelancerDirect.depositPlaceholder")}
              onKeyDown={(e) => {
                // Prevent negative sign, decimal point, and non-numeric characters
                if (
                  e.key === "-" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+"
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                // Ensure only positive integers
                const value = e.target.value;
                if (
                  value &&
                  (parseFloat(value) <= 0 ||
                    !Number.isInteger(parseFloat(value)))
                ) {
                  e.target.value = "";
                }
              }}
            />
            <TwoLineUnitInput
              type="number"
              min="1"
              step="1"
              className="!w-20 border-gray-300 rounded text-right"
              placeholder={t("newFreelancerDirect.depositPlaceholder")}
              isInput={false}
            />

          </div>
          <div className="col-span-1 p-2 flex items-center">

          </div>
        </div>

        <div className="grid grid-cols-30 border-gray-300">
          <div className="col-span-1 border border-gray-300 p-2 flex items-center justify-center font-bold">
            12<span className="text-red-500 font-bold">*</span>
          </div>
          <div className="col-span-6 pl-2 flex justify-left items-center border-t border-b  border-gray-300">
            <div className="font-bold">{t("newFreelancerDirect.price")}</div>
          </div>
          <div className="col-span-11 border border-gray-300 flex items-center pr-2">
            <input
              type="number"
              min="1"
              step="1"
              className="flex-1 p-2 pr-0 border-gray-300 rounded text-right"
              placeholder={t("newFreelancerDirect.pricePlaceholder")}
              onKeyDown={(e) => {
                // Prevent negative sign, decimal point, and non-numeric characters
                if (
                  e.key === "-" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+"
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                // Ensure only positive integers
                const value = e.target.value;
                if (
                  value &&
                  (parseFloat(value) <= 0 ||
                    !Number.isInteger(parseFloat(value)))
                ) {
                  e.target.value = "";
                }
              }}
            />
            <TwoLineUnitInput
              type="number"
              min="1"
              step="1"
              className="!w-20 border-gray-300 rounded text-right"
              placeholder={t("newFreelancerDirect.depositPlaceholder")}
              isInput={false}
            />
          </div>
          <div className="col-span-4 p-2 flex items-center">
            <div className="text-left w-full">

            </div>
          </div>
        </div>

        {/* Field 11: PHÍ KHÁC */}
        <div className="grid grid-cols-30 border-gray-300">
          {/* Cột trái: số thứ tự */}
          <div className="col-span-1 row-span-8 border border-gray-300 p-2 flex items-center justify-center font-bold">
            13<span className="text-red-500 font-bold">*</span>
          </div>

          {/* ==== ROW 1 ==== */}
          <div className="col-span-6 font-bold border-b border-r border-t border-gray-300 bg-gray-50 flex items-center pl-2">
            {t("newFreelancerDirect.successFee")}
          </div>
          <div className="col-span-3 border-b border-r border-t border-gray-300 relative flex items-center">
            <input
              type="number"
              className="flex-1 w-full p-2 pr-11 text-right bg-transparent focus:outline-none border-none"
              min="0"
              step="1"
              defaultValue={0}
              onKeyDown={(e) => {
                if (
                  e.key === "-" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+"
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value &&
                  (parseFloat(value) < 0 || !Number.isInteger(parseFloat(value)))
                ) {
                  e.target.value = "";
                }
              }}
            />
            <span className="pr-2 text-gray-500">%</span>
          </div>
          <div className="col-span-17 border-gray-300"></div>

          {/* ==== ROW 2 ==== */}
          <div className="col-span-6 font-bold border-r border-gray-300 bg-gray-50 flex items-center pl-2">
            {t("newFreelancerDirect.taxOtherFees")}
          </div>
          <div className="col-span-3 border-r border-gray-300 relative flex items-center">
            <input
              type="number"
              className="flex-1 w-full p-2 pr-11 text-right bg-transparent focus:outline-none border-none"
              defaultValue={0}
              disabled
            />
            <span className="pr-2 text-gray-500">%</span>
          </div>
          <div className="col-span-17 border-gray-300"></div>

          {/* ==== ROW 3 ==== */}
          <div className="col-span-6 font-bold border-t border-b border-r border-gray-300 flex items-center pl-2 bg-gray-50">
            {t("newFreelancerDirect.eventFee")}
          </div>
          <div className="col-span-3 border-t border-b border-gray-300 flex items-center">
            <input
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className="w-full p-2 pr-11 border-gray-300 rounded text-right"
              onKeyDown={(e) => {
                if (
                  e.key === "-" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+"
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value &&
                  (parseFloat(value) <= 0 || !Number.isInteger(parseFloat(value)))
                ) {
                  e.target.value = "";
                }
              }}
            />
            <span className=" text-gray-500 pr-2">{t("common.percent")}</span>
          </div>
          <div className="col-span-1 border-t border-b border-gray-300 flex items-center justify-center">
            <span className=" text-gray-500">{t("common.plus")}</span>
          </div>
          <div className="col-span-7 border-t border-b border-r pr-2 border-gray-300 flex items-center">
            <input
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className="flex-1 p-2 pr-0 border-gray-300 rounded text-right"
              onKeyDown={(e) => {
                if (
                  e.key === "-" ||
                  e.key === "." ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+"
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value &&
                  (parseFloat(value) <= 0 || !Number.isInteger(parseFloat(value)))
                ) {
                  e.target.value = "";
                }
              }}
            />
            <TwoLineUnitInput
              type="number"
              min="1"
              step="1"
              className="!w-20 border-gray-300 rounded text-right"
              placeholder={t("newFreelancerDirect.depositPlaceholder")}
              isInput={false}
            />
          </div>
          <div className="col-span-12 flex items-center justify-center border-t border-b border-r border-gray-300">
            {t("newFreelancerDirect.prepay")}
          </div>

          {/* ==== ROW 4 ==== */}
          <div className="col-span-6 font-bold border-b border-r border-gray-300 flex items-center pl-2 bg-gray-50">
            {t("newFreelancerDirect.totalFeesVat")}
          </div>
          <div className="col-span-3 border-b border-gray-300 flex items-center">
            <input
              type="number"
              defaultValue={0}
              className="w-full p-2 pr-11 border-gray-300 text-right"
              disabled
            />
            <span className=" text-gray-500 pr-2">{t("common.percent")}</span>
          </div>
          <div className="col-span-1 border-b border-gray-300 flex items-center justify-center">
            {t("common.plus")}
          </div>
          <div className="col-span-7 border-b border-r pr-2 border-gray-300 flex items-center">
            <input
              type="number"
              defaultValue={0}
              className="flex-1 p-2 pr-0  border-gray-300 rounded text-right"
              disabled
            />
            <TwoLineUnitInput
              type="number"
              min="1"
              step="1"
              className="!w-20 border-gray-300 rounded text-right"
              placeholder={t("newFreelancerDirect.depositPlaceholder")}
              isInput={false}
            />
          </div>
          <div className="col-span-12 flex items-center justify-center border-b border-r border-gray-300">
            {t("newFreelancerDirect.prepay")}
          </div>
        </div>


        {/* Submit Button */}
        <TermsAgreementCheckbox isChecked={isAgreed} setIsChecked={setIsAgreed} />
        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            className={`border border-black px-16 py-2 text-center cursor-pointer ${
              !isAgreed ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            disabled={!isAgreed}
          >
            <div className="font-bold">
              {t("newFreelancerDirect.postButton")}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFreelancerShippingComponent;
