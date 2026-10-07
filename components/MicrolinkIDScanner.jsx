"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBlinkId } from "@microblink/blinkid";
import { getMicroblinkLicense } from "../services/systemService";

let cachedMicroblinkLicense = "";

const resolveMicroblinkLicense = async (licenseKey) => {
  if (licenseKey) return licenseKey;
  if (cachedMicroblinkLicense) return cachedMicroblinkLicense;

  cachedMicroblinkLicense = await getMicroblinkLicense();
  return cachedMicroblinkLicense;
};

// Hook: useBlinkIdScanner
// Encapsulates BlinkID setup, mounting to a container node via ref,
// result/error callbacks, and cleanup on unmount.
export default function useBlinkIdScanner(options = {}) {
  const containerRef = useRef(null);
  const [blinkid, setBlinkid] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const {
    licenseKey,
    // Serve resources from your app's public folder (vite moves them to /public/resources)
    cameraManagerUiOptions,
    feedbackUiOptions,
    scanningSettings,
    scanningMode,
    microblinkProxyUrl,
    resourcesLocation,
    wasmVariant,
    useLightweightBuild,
    userId,
    onResult,
    onSuccess,
    onError,
  } = options;

  const initialize = useCallback(async () => {
    if (blinkid) return blinkid;

    const resolvedLicenseKey = await resolveMicroblinkLicense(licenseKey);
    if (!resolvedLicenseKey) {
      throw new Error("Microblink license key is not configured");
    }

    const instance = await createBlinkId({
      licenseKey: resolvedLicenseKey,
      cameraManagerUiOptions,
      feedbackUiOptions,
      microblinkProxyUrl,
      resourcesLocation,
      wasmVariant,
      useLightweightBuild,
      userId,
      targetNode: containerRef.current ?? undefined,
      scanningMode,

      scanningSettings: {
        returnInputImages: true,
        scanCroppedDocumentImage: true,
        croppedImageSettings: {
          returnDocumentImage: true,
          returnFaceImage: true,
          returnSignatureImage: true,
        },
        ...scanningSettings,
      },
    });



    if (typeof onResult === "function" || typeof onSuccess === "function") {
      instance.addOnResultCallback((result) => {
        onResult?.(result);
        onSuccess?.(result);
      });
    }

    if (typeof onError === "function") {
      instance.addOnErrorCallback(onError);
    }

    setBlinkid(instance);
    setIsReady(true);
    return instance;
  }, [
    blinkid,
    licenseKey,
    cameraManagerUiOptions,
    feedbackUiOptions,
    scanningSettings,
    scanningMode,
    microblinkProxyUrl,
    resourcesLocation,
    wasmVariant,
    useLightweightBuild,
    userId,
    onResult,
    onSuccess,
    onError,
  ]);

  const destroy = useCallback(async () => {
    if (!blinkid) return;
    try {
      await blinkid.destroy();
    } finally {
      setBlinkid(null);
      setIsReady(false);
    }
  }, [blinkid]);

  const toggle = useCallback(async () => {
    if (isReady) {
      await destroy();
    } else {
      await initialize();
    }
  }, [isReady, initialize, destroy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blinkid) {
        void blinkid.destroy();
      }
    };
  }, [blinkid]);

  return {
    containerRef,
    initialize,
    destroy,
    toggle,
    isReady,
    blinkid,
  };
}
