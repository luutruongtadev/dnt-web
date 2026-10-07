"use client";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Home as HomeIcon,
  KeyboardIcon as KeyboardIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
} from "lucide-react";
import Logo from "../assets/d.svg";


export default function AiLiveAccount({ title, onTransfer }) {
  const { t } = useTranslation();
  const [isVisible1, setIsVisible1] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);
  const handleKeyDown = (e) => {
    if (e.key === "-" || e.key === "." || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value && (parseFloat(value) <= 0 || !Number.isInteger(parseFloat(value)))) {
      e.target.value = "1";
    } else {
      const calculatedValue = parseFloat(e.target.value) || 1;
      const el = document.getElementById("calculatedValue");
      if (el) el.value = calculatedValue;
    }
  };

  return (
    <div className="flex border border-gray-300 overflow-auto">
      <div className="acctab border-r border-gray-300 p-2 text-center flex items-center justify-center w-[200px]">
        <div dangerouslySetInnerHTML={{ __html: title }} className="font-bold text-center">
        </div>
      </div>
      <div className="acctab border-r h-20 border-gray-300 text-center flex flex-col items-center justify-center w-[200px]">
        <input
          type="number"
          name="exchangeRate"
          className="w-full border-b border-gray-300 flex-1"
          defaultValue="0"
          disabled
          style={{ textAlign: "right" }}
        />
        <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
          <div className="flex-1"><button
            type="button"
            onClick={() => setIsVisible1(!isVisible1)}
            className="text-gray-600 hover:text-gray-900 flex-1"
          >
            {isVisible1 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button></div>

          <div className="flex-4 text-right pr-4">{isVisible1 ? "0" : "•••"}</div>
        </div>
      </div>

      <div className="acctab border-r border-gray-300 text-center flex flex-col items-center justify-center w-[200px]">
        <input
          type="text"
          name=""
          disabled
          className="w-full border-b border-gray-300 flex-1"
          value={'VND'}
          style={{ textAlign: "center" }}
        />
        <div className="font-bold flex-1 border-gray-300 flex items-center justify-center">
          {/* <span className="mr-2">D|</span> */}
          <img src={Logo?.src || Logo} className="w-4 h-4" alt="logo" />
        </div>
      </div>


      <div className="acctab border-r border-gray-300 text-center flex flex-col items-center justify-center w-[200px]">
        <input
          type="number"
          name="exchangeRate"
          className="w-full border-b border-gray-300 flex-1"
          defaultValue="0"
          disabled
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            const calculatedValue = value * 1; // Tỉ giá mặc định là 1
            document.getElementById("calculatedValue").value =
              calculatedValue;
          }}
          style={{ textAlign: "right" }}
        />
        <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
          <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">

            <div className="flex-1"><button
              type="button"
              onClick={() => setIsVisible2(!isVisible1)}
              className="text-gray-600 hover:text-gray-900 flex-1"
            >
              {isVisible1 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button></div>
            <div className="flex-4 text-right pr-4">{isVisible2 ? "0" : "•••"}</div>
          </div>
        </div>
      </div>
      <div className="acctab border-r h-20 border-gray-300 text-center flex flex-col items-center justify-center w-[200px]">
        <input
          type="number"
          disabled
          name="exchangeRate"
          className="w-full border-b border-gray-300 flex-1"
          defaultValue="0"
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            const calculatedValue = value * 1; // Tỉ giá mặc định là 1
            document.getElementById("calculatedValue").value =
              calculatedValue;
          }}
          style={{ textAlign: "right" }}
        />
        <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
          <div className="flex-1"><button
            type="button"
            onClick={() => setIsVisible1(!isVisible1)}
            className="text-gray-600 hover:text-gray-900 flex-1"
          >
            {isVisible1 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button></div>
          <div className="flex-4 text-right pr-4">{isVisible1 ? "0" : "•••"}</div>


        </div>
      </div>
      <div className="acctab border-r h-20 border-gray-300 text-center flex flex-col items-center justify-center w-[200px]">
        <input
          type="number"
          name="exchangeRate"
          disabled
          className="w-full border-b border-gray-300 flex-1"
          defaultValue="0"
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            const calculatedValue = value * 1; // Tỉ giá mặc định là 1
            document.getElementById("calculatedValue").value =
              calculatedValue;
          }}
          style={{ textAlign: "right" }}
        />
        <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
          <div className="flex-1"><button
            type="button"
            onClick={() => setIsVisible1(!isVisible1)}
            className="text-gray-600 hover:text-gray-900 flex-1"
          >
            {isVisible1 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button></div>
          <div className="flex-4 text-right pr-4">{isVisible1 ? "0" : "•••"}</div>


        </div>
      </div>
      <div className="acctab border-r h-20 border-gray-300 text-center flex flex-col items-center justify-center w-[200px]">
        <input
          type="number"
          name="exchangeRate"
          className="w-full border-b border-gray-300 flex-1"
          defaultValue="0"
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            const calculatedValue = value * 1; // Tỉ giá mặc định là 1
            document.getElementById("calculatedValue").value =
              calculatedValue;
          }}
          style={{ textAlign: "right" }}
        />
        <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
          <div className="flex-1"><button
            type="button"
            onClick={() => setIsVisible1(!isVisible1)}
            className="text-gray-600 hover:text-gray-900 flex-1"
          >
            {isVisible1 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button></div>
          <div className="flex-4 text-right pr-4">{isVisible1 ? "0" : "•••"}</div>


        </div>
      </div>


      <div className="acctab p-2 text-center flex items-center justify-center w-[200px]">
        <button
          type="button"
          className="mt-1 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          {t("aiLive.transferToWallet")}
        </button>
      </div>

    </div>
  );
}
