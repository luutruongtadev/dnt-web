"use client";
import React, { useEffect, useState } from "react";
import { Eye as EyeIcon, Forward as ForwardIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import useHorizontalScrollbar from "../custom-hooks/useHorizontalScrollbar";

export default function ProductGridEditable({ products = [], onItemsChange }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(products || []);
  const [isFollowing, setIsFollowing] = useState(false);
  const { containerRef, trackRef, thumbRef } = useHorizontalScrollbar();

  useEffect(() => {
    setItems(products || []);
  }, [products]);


  const handleItemChange = (id, field, value) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  const handleAddItem = () => {
    const newItem = {
      id: items.length + 1,
      name: "",
      model: "",
      size: "",
      color: "",
      image: null,
      qualityInfoFile: null,
      warrantyChangeDays: "",
      warrantyRepairDays: "",
      repairWarrantyRetentionPercent: "",
      maxDeliveryDaysAfterAcceptance: "",
      handoverLocation: "",
      contractDurationMultiplicity: "",
      contractDurationUnit: "",
      directPayment: "",
      depositRequirementDirect: "",
      paymentViaWallet: "",
      depositRequirementWallet: "",
      vat: "",
      quantityMinimum: "",
      unit: "",
      unitMarketPrice: "",
      unitAskingPrice: "",
      amountDesired: "",
      autoAcceptPrice: "",
      autoRejectPrice: "",
    };
    const updated = [...items, newItem];
    setItems(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  return (
    <>
      <div className="overflow-x-auto">
        {/* Header columns with horizontal scroll */}
        <div className="grid grid-flow-col border-gray-300">
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "50px" }}>
            {t("productGrid.sequenceNumber")}
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "150px" }}>
            <div>{t("productGrid.nameOfGoods")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "80px" }}>
            <div>{t("productGrid.model")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "120px" }}>
            <div>{t("productGrid.size")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "100px" }}>
            <div>{t("productGrid.color")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "150px" }}>
            <div>
              {t("productGrid.image")} 
            </div>
          </div>
          {/* New columns */}
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "350px" }}>
            <div>
              {t("productGrid.qualityInfo")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>
              {t("productGrid.warrantyChangeDays")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>
              {t("productGrid.warrantyRepairDays")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>
              {t("productGrid.repairWarrantyPercent")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>
              {t("productGrid.maxDeliveryDays")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "200px" }}>
            <div>
              {t("productGrid.handoverLocation")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          {/* THỜI LƯỢNG THỰC HIỆN split into 2 columns */}
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "250px" }}>
            <div>
              {t("productGrid.contractDuration")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "220px" }}>
            <div>{t("productGrid.timeUnit")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "220px" }}>
            <div>{t("productGrid.directPayment")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>{t("productGrid.depositRequirementDirect")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>{t("productGrid.paymentViaWallet")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "280px" }}>
            <div>{t("productGrid.depositRequirementWallet")}</div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "280px" }}>
            <div>
              {t("productGrid.vat")} <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "200px" }}>
            <div>
              {t("productGrid.quantityMinimum")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "100px" }}>
            <div>
              {t("productGrid.unit")} <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "200px" }}>
            <div>
              {t("productGrid.unitMarketPrice")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>
              {t("productGrid.lowestHighestAskingPrice")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-gray-300 p-2 text-center" style={{ width: "300px" }}>
            <div>{t("productGrid.lowestAmount")}</div>
          </div>
          <div className="p-2 text-center border-r border-gray-300" style={{ width: "250px" }}>
            <div>{t("productGrid.lowestHighestAutoAccept")}</div>
          </div>
          <div className="p-2 text-center border-r border-gray-300" style={{ width: "250px" }}>
            <div>{t("productGrid.autoRejectPrice")}</div>
          </div>
        </div>

        {/* Rows */}
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-flow-col border-t border-gray-300"
          >
            <div className="border-r border-gray-300 p-2 text-center" style={{ width: "50px" }}>
              <div>{item.id}</div>
            </div>
            <div className="border-r border-gray-300 p-2 text-center" style={{ width: "150px" }}>
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  handleItemChange(item.id, "name", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-gray-300 p-2 text-center" style={{ width: "150px" }}>
              <input
                type="text"
                value={item.model}
                onChange={(e) =>
                  handleItemChange(item.id, "model", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.size}
                onChange={(e) =>
                  handleItemChange(item.id, "size", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.color}
                onChange={(e) =>
                  handleItemChange(item.id, "color", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="file"
                onChange={(e) =>
                  handleItemChange(item.id, "image", e.target.files[0])
                }
                className="w-full p-1 mt-1 text-xs border"
              />
            </div>
            {/* New cells */}
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <button
                type="button"
                className="mt-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                {t("productGrid.uploadFile")}
              </button>
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.warrantyChangeDays}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "warrantyChangeDays",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.warrantyRepairDays}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "warrantyRepairDays",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.repairWarrantyRetentionPercent}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "repairWarrantyRetentionPercent",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.maxDeliveryDaysAfterAcceptance}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "maxDeliveryDaysAfterAcceptance",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <select
                value={item.handoverLocation}
                onChange={(e) =>
                  handleItemChange(item.id, "handoverLocation", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="Kho bên bán">
                  {t("productGrid.sellerWarehouse")}
                </option>
                <option value="Kho bên mua">
                  {t("productGrid.buyerWarehouse")}
                </option>
              </select>
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <select
                value={item.contractDurationMultiplicity}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "contractDurationMultiplicity",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="one">{t("productGrid.one")}</option>
                <option value="many">{t("productGrid.many")}</option>
              </select>
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <select
                value={item.contractDurationUnit}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "contractDurationUnit",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="time">{t("productGrid.time")}</option>
                <option value="year">{t("productGrid.year")}</option>
              </select>
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.directPayment}
                onChange={(e) =>
                  handleItemChange(item.id, "directPayment", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.depositRequirementDirect}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "depositRequirementDirect",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
                placeholder=""
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.paymentViaWallet}
                onChange={(e) =>
                  handleItemChange(item.id, "paymentViaWallet", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.depositRequirementWallet}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "depositRequirementWallet",
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 p-1 mt-1"
                placeholder=""
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <select
                value={item.vat}
                onChange={(e) =>
                  handleItemChange(item.id, "vat", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="yes">{t("productGrid.yes")}</option>
                <option value="no">{t("productGrid.no")}</option>
              </select>
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.quantityMinimum}
                onChange={(e) =>
                  handleItemChange(item.id, "quantityMinimum", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.unit}
                onChange={(e) =>
                  handleItemChange(item.id, "unit", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.unitMarketPrice}
                onChange={(e) =>
                  handleItemChange(item.id, "unitMarketPrice", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1 text-right"
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.unitAskingPrice}
                onChange={(e) =>
                  handleItemChange(item.id, "unitAskingPrice", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1 text-right"
                placeholder=""
              />
            </div>
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="text"
                value={item.amountDesired}
                onChange={(e) =>
                  handleItemChange(item.id, "amountDesired", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1 text-right"
                placeholder=""
              />
            </div>
            <div className="p-2 text-center border-r border-t border-b border-gray-300">
              <input
                type="text"
                value={item.autoAcceptPrice}
                onChange={(e) =>
                  handleItemChange(item.id, "autoAcceptPrice", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1 text-right"
                placeholder=""
              />
            </div>
            <div className="p-2 text-center border-r border-t border-b border-gray-300">
              <input
                type="text"
                value={item.autoRejectPrice}
                onChange={(e) =>
                  handleItemChange(item.id, "autoRejectPrice", e.target.value)
                }
                className="w-full border border-gray-300 p-1 mt-1 text-right"
                placeholder=""
              />
            </div>
          </div>
        ))}

        <div className="grid grid-flow-col auto-cols-[220px] border-t border-gray-300">
          <div className="border-r border-gray-300 p-2 text-center">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full text-center font-bold text-blue-500 hover:text-blue-700"
            >
              +
            </button>
          </div>
          <div
            className="border-r border-gray-300 p-2 text-center"
            style={{ gridColumnStart: 15 }}
          >
            <span>{t("productGrid.total")}: 0</span>
          </div>
          <div
            className="border-r border-gray-300 p-2 text-center"
            style={{ gridColumnStart: 17 }}
          >
            <span>{t("productGrid.total")}: 0</span>
          </div>

          <div
            className="border-r border-gray-300 p-2 text-center"
            style={{ gridColumnStart: 23 }}
          >
            <span>{t("productGrid.total")}: 0</span>
          </div>
        </div>
        {/* Always-visible horizontal scrollbar track + moving thumb */}
        {/*<div className="scrollbar-track" aria-hidden="true" ref={trackRef}>*/}
        {/*  <div className="scrollbar-thumb" ref={thumbRef}></div>*/}
        {/*</div>*/}
      </div>
    </>
  );
}
