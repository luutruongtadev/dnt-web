"use client";
import React from "react";
import ReactDOM from "react-dom";
import { renderAsync } from "docx-preview";
import { useTranslation } from "react-i18next";

export default function ContractModal({
  isOpen,
  isLoading,
  contractFiles,
  contractActiveIndex,
  setContractActiveIndex,
  contractError,
  onClose,
}) {
  const { t } = useTranslation();
  const docxContainerRef = React.useRef(null);
  const activeFile = contractFiles?.[contractActiveIndex];

  React.useEffect(() => {
    if (!isOpen || isLoading) return;
    if (!activeFile || activeFile.kind !== "docx" || !activeFile.blob) return;
    const container = docxContainerRef.current;
    if (!container) return;
    container.innerHTML = "";
    renderAsync(activeFile.blob, container, null, { inWrapper: true }).catch((err) => {
      console.error("docx-preview render error:", err);
    });
  }, [isOpen, isLoading, activeFile]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200000] flex items-center justify-center bg-black/60">
      <div className="bg-white w-screen h-screen flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="font-semibold text-lg">
            {t("register.contractPreviewTitle", "Xem hợp đồng và tài liệu liên quan")}
          </h2>
          <button className="text-gray-600 hover:text-black" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <span>{t("common.loading", "Đang tải...")}</span>
            </div>
          ) : contractFiles && contractFiles.length > 0 ? (
            <>
              <div className="flex-1 overflow-auto bg-gray-100 min-h-0">
                {activeFile?.kind === "docx" ? (
                  <div ref={docxContainerRef} className="w-full min-h-full overflow-visible p-4" />
                ) : (
                  <iframe
                    key={activeFile?.url}
                    src={activeFile?.url}
                    className="w-full"
                    style={{ height: "calc(100vh - 110px)" }}
                    title={activeFile?.label || "contract-file"}
                  />
                )}
              </div>
              <div className="border-t px-4 py-2 flex items-center justify-between">
                <button
                  type="button"
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  disabled={contractFiles.length <= 1}
                  onClick={() => {
                    const nextIndex = (contractActiveIndex - 1 + contractFiles.length) % contractFiles.length;
                    setContractActiveIndex(nextIndex);
                  }}
                >
                  {t("common.previous", "Trước")}
                </button>
                <div className="text-sm">
                  {contractFiles[contractActiveIndex]?.label || ""} ({contractActiveIndex + 1}/{contractFiles.length})
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={contractFiles[contractActiveIndex]?.url}
                    download={contractFiles[contractActiveIndex]?.downloadName || true}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded border bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    {t("detailOfGoods.downloadFile", "DOWNLOAD FILE")}
                  </a>
                  <button
                    type="button"
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                    disabled={contractFiles.length <= 1}
                    onClick={() => {
                      const nextIndex = (contractActiveIndex + 1) % contractFiles.length;
                      setContractActiveIndex(nextIndex);
                    }}
                  >
                    {t("common.next", "Sau")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span>{t("register.noContractFiles", "Không có file để hiển thị")}</span>
            </div>
          )}
          {contractError ? (
            <div className="px-4 py-2 text-red-600 text-sm border-t">{contractError}</div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
