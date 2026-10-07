"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TwoLineUnitInput from "./atoms/TwoLineUnitInput";

export default function ProductGridReadOnly({ products = [], onItemsChange, extraColumns = [], rowStyle }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(products || []);
  const [isManpower, setIsManpower] = useState(false);

  useEffect(() => {
    setItems(products || []);
    setIsManpower(products.some((item) => item?.categoryType?.includes("manpower")));
  }, [products]);


  const handleItemChange = (id, field, value) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updated);
    if (onItemsChange) onItemsChange(updated);
  };

  return (
    <>
      <div className="overflow-x-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 transparent' }}>
        {/* Header columns with horizontal scroll */}
        <div className="grid grid-flow-col auto-cols-[300px] border-gray-300 items-stretch" style={{ gridTemplateColumns: '50px repeat(auto-fit, 300px)' }}>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            {t("productGrid.sequenceNumber")}
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.nameOfGoods")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.model")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.size")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.color")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.image") }} /> <span className="text-red-500">*</span>
            </div>
          </div>
          {/* New columns */}
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.qualityInfo") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>  
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.warrantyChangeDays") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.warrantyRepairDays") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.repairWarrantyPercent") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.maxDeliveryDays") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              {t("productGrid.handoverLocation")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          {/* THỜI LƯỢNG THỰC HIỆN split into 2 columns */}
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.contractDuration") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.timeUnit")}</div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.invoiceType")} <span className="text-red-500">*</span></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div><span dangerouslySetInnerHTML={{ __html: t("productGrid.paymentViaPlatform") }} /></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div><span dangerouslySetInnerHTML={{ __html: t("productGrid.timeUserMustPayAfterDelivery") }} /></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>{t("productGrid.depositRequirement")} <span className="text-red-500">*</span></div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              {t("productGrid.quantityMinimum")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.quantityMinRequire") }} />
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              {t("productGrid.unit")} <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              {t("productGrid.unitMarketPrice")}{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div>
              <span dangerouslySetInnerHTML={{ __html: t("productGrid.lowestHighestAskingPrice") }} />{" "}
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="border-r border-b border-gray-300 p-2 text-center flex flex-col items-center justify-center">
            <div><span dangerouslySetInnerHTML={{ __html: t("productGrid.lowestAmount") }} /></div>
          </div>
          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div><span dangerouslySetInnerHTML={{ __html: t("productGrid.setQuantity") }} /></div>
          </div>
          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div><span dangerouslySetInnerHTML={{ __html: t("productGrid.setUnitPrice") }} /></div>
          </div>
          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div>{t("productGrid.totalAmount")}</div>
          </div>
          <div className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
            <div>{t("detailOfGoods.confirm")}</div>
          </div>
          {/* Cột phụ gắn thêm ở cuối (VD: HỒ SƠ ĐÁP ỨNG, nút xác nhận) */}
          {extraColumns.map((col, i) => (
            <div key={`xh-${i}`} className="p-2 text-center border-r border-b border-gray-300 flex flex-col items-center justify-center">
              <div>{col.header}</div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {items.map((item, rowIndex) => (
          <div
            key={item.id}
            className={`grid grid-flow-col auto-cols-[300px] border-gray-300 ${rowStyle ? '[&_input]:bg-transparent [&_select]:bg-transparent [&_textarea]:bg-transparent' : ''}`}
            style={{ gridTemplateColumns: '50px repeat(auto-fit, 300px)', ...(rowStyle ? rowStyle(item, rowIndex) : {}) }}
          >
            <div className="border-r border-b border-gray-300 text-center flex items-center justify-center">
              <div>{item.id}</div>
            </div>
            <input
              type="text"
              value={item.name}
              onChange={(e) =>
                handleItemChange(item.id, "name", e.target.value)
              }
              className="w-full border-r border-b border-gray-300"
              disabled
            />
              <input
                type="text"
                value={item.model}
                onChange={(e) =>
                  handleItemChange(item.id, "model", e.target.value)
                }
                className="w-full border-r border-b border-gray-300"
                disabled
              />
              <input
                type="text"
                value={item.size}
                onChange={(e) =>
                  handleItemChange(item.id, "size", e.target.value)
                }
                className="w-full border-r border-b border-gray-300"
                disabled
              />
              <input
                type="text"
                value={item.color}
                onChange={(e) =>
                  handleItemChange(item.id, "color", e.target.value)
                }
                className="w-full border-r border-b border-gray-300"  
                disabled
              />
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <input
                type="file"
                onChange={(e) =>
                  handleItemChange(item.id, "image", e.target.files[0])
                }
                className="w-full p-1 mt-1 text-xs border"
                disabled
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
              <input
                type="number"
                min="0"
                value={item.warrantyChangeDays}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "warrantyChangeDays",
                    e.target.value
                  )
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                disabled
              />
              <input
                type="number"
                min="0"
                value={item.warrantyRepairDays}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "warrantyRepairDays",
                    e.target.value
                  )
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                disabled
              />
              <TwoLineUnitInput
                name="repairWarrantyRetentionPercent"
                type="text"
                value={item.repairWarrantyRetentionPercent}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "repairWarrantyRetentionPercent",
                    e.target.value
                  )
                }
                placeholder={t("goods.enter")}
                disabled
              />
              <input
                type="number"
                min="0"
                value={item.maxDeliveryDaysAfterAcceptance}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "maxDeliveryDaysAfterAcceptance",
                    e.target.value
                  )
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                disabled
              />
            <div className="border-r border-t border-b border-gray-300 p-2 text-center">
              <select
                value={item.handoverLocation}
                onChange={(e) =>
                  handleItemChange(item.id, "handoverLocation", e.target.value)
                }
                className="w-full border-gray-300 p-1 mt-1 text-center"
                disabled
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
              <select
                value={item.contractDurationMultiplicity}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "contractDurationMultiplicity",
                    e.target.value
                  )
                }
                className="w-full border-t border-b border-r border-gray-300 text-center"
                disabled
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="one">{t("productGrid.one")}</option>
                <option value="many">{t("productGrid.many")}</option>
              </select>
              <select
                value={item.contractDurationUnit}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "contractDurationUnit",
                    e.target.value
                  )
                }
                className="w-full border-t border-b border-r border-gray-300 text-center"
                disabled
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="time">{t("productGrid.time")}</option>
                <option value="year">{t("productGrid.year")}</option>
              </select>

              {/* (17) XUẤT HÓA ĐƠN */}
              <select
                value={item.invoiceType}
                onChange={(e) =>
                  handleItemChange(item.id, "invoiceType", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-center"
                disabled
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="vat">{t("productGrid.invoiceVat")}</option>
                <option value="no_vat">{t("productGrid.invoiceNoVat")}</option>
              </select>

              {/* (18) THANH TOÁN QUA NỀN TẢNG */}
              <select
                value={item.paymentViaPlatform}
                onChange={(e) =>
                  handleItemChange(item.id, "paymentViaPlatform", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-center"
                disabled
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="yes">{t("productGrid.yes")}</option>
                <option value="no">{t("productGrid.no")}</option>
              </select>

              {/* (19) THỜI GIAN THANH TOÁN CHÍNH THỨC CHO CHỦ HÀNG SAU KHI NHẬN ĐƯỢC HÀNG */}
              <input
                type="text"
                value={item.timeUserMustPayAfterDelivery}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "timeUserMustPayAfterDelivery",
                    e.target.value
                  )
                }
                className="w-full border-t border-b border-r border-gray-300"
                placeholder=""
                disabled
              />

              {/* (20) YÊU CẦU ĐẶT CỌC, KÝ QUỸ (%) */}
              <input
                type="text"
                value={item.depositRequirement}
                onChange={(e) =>
                  handleItemChange(item.id, "depositRequirement", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300"
                placeholder=""
                disabled
              />
              <input
                type="number"
                min="0"
                value={item.quantityMinimum}
                onChange={(e) =>
                  handleItemChange(item.id, "quantityMinimum", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                disabled
              />
              <input
                type="number"
                min="0"
                value={item.quantityMinRequire}
                onChange={(e) =>
                  handleItemChange(item.id, "quantityMinRequire", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                disabled
              />
              <input
                type="text"
                value={item.unit}
                onChange={(e) =>
                  handleItemChange(item.id, "unit", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300"
                disabled
              />
              <input
                type="currency"
                value={item.unitMarketPrice}
                onChange={(e) =>
                  handleItemChange(item.id, "unitMarketPrice", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                disabled
              />

              <select
                value={item.vat}
                onChange={(e) =>
                  handleItemChange(item.id, "vat", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-center"
                disabled
              >
                <option value="">{t("productGrid.choose")}</option>
                <option value="yes">{t("productGrid.highest")}</option>
                <option value="no">{t("productGrid.lowest")}</option>
              </select>
              
              <input
                type="currency"
                value={item.amountDesired}
                onChange={(e) =>
                  handleItemChange(item.id, "amountDesired", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                placeholder=""
                disabled
              />
              {isManpower ? (
                 <div className="whitespace-nowrap px-1">
                 <button
                   className="w-full cursor-pointer border border-gray-300 text-center bg-gray-100"
                 >{t("detailOfGoods.downloadFile")}</button>
                 </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  value={item.orderQuantity || ""}
                  onChange={(e) =>
                    handleItemChange(item.id, "orderQuantity", e.target.value)
                  }
                  className="w-full border-t border-b border-r border-gray-300 text-right"
                  placeholder=""
                />
              )}
               <input
                type="number"
                min="0"
                value={item.orderUnitPrice || ""}
                onChange={(e) =>
                  handleItemChange(item.id, "orderUnitPrice", e.target.value)
                }
                className="w-full border-t border-b border-r border-gray-300 text-right"
                placeholder=""
                disabled={isManpower}
              />
               <input
                type="text"
                value={((parseFloat(item.orderQuantity || 0) * parseFloat(item.orderUnitPrice || 0)) || 0).toLocaleString()}
                readOnly
                className="w-full border-t border-b border-r border-gray-300 text-right bg-gray-100"
                placeholder=""
              />
              <button
                className="w-full cursor-pointer border border-gray-300 text-center"
              >{t("detailOfGoods.confirm")}</button>
              {/* Ô cột phụ theo từng dòng */}
              {extraColumns.map((col, i) => (
                <div key={`xc-${i}`} className="border-r border-b border-gray-300 p-1 flex items-center justify-center">
                  {col.render ? col.render(item, rowIndex) : null}
                </div>
              ))}
          </div>
        ))}

        <div className="grid grid-flow-col auto-cols-[300px] border-gray-300" style={{ gridTemplateColumns: '50px repeat(auto-fit, 300px)' }}>
          {/* <div className="border-r border-gray-300 p-2 text-center">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full text-center font-bold text-blue-500 hover:text-blue-700"
            >
              +
            </button>
          </div> */}
          

          
        </div>
        {/* Always-visible horizontal scrollbar track + moving thumb */}
        {/*<div className="scrollbar-track" aria-hidden="true" ref={trackRef}>*/}
        {/*  <div className="scrollbar-thumb" ref={thumbRef}></div>*/}
        {/*</div>*/}
      </div>
    </>
  );
}
