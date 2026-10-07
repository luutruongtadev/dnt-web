"use client";
import { useEffect, useState } from "react";
import { useNavigate } from '@/lib/router-compat';
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { filterProducts } from "../services/productService";

export default function EventComponent() {
  const { t } = useTranslation();

  // Trang hiện tại cho desktop và mobile (mỗi swipe -> sang trang mới)
  const [pageDesktop, setPageDesktop] = useState(0);
  const [pageMobile, setPageMobile] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragLastX, setDragLastX] = useState(null);
  const [homeProducts, setHomeProducts] = useState([]);
  const [isDesktopHovered, setIsDesktopHovered] = useState(false);
  const [isMobileHovered, setIsMobileHovered] = useState(false);
  const navigate = useNavigate();

  // Desktop: hiển thị 6 cột x 2 dòng = 12 events
  // Mobile: hiển thị 2 cột x 2 dòng = 4 events
  // Thứ tự: dòng 1 (1,2,3,4,5,6), dòng 2 (7,8,9,10,11,12)
  const columnsDesktop = 6;
  const columnsMobile = 2;

  // Mock data cho events với translation keys
  const mockEvents = [
    { id: 1, titleKey: "events.event1", descriptionKey: "events.description1" },
    { id: 2, titleKey: "events.event2", descriptionKey: "events.description2" },
    { id: 3, titleKey: "events.event3", descriptionKey: "events.description3" },
    { id: 4, titleKey: "events.event4", descriptionKey: "events.description4" },
    { id: 5, titleKey: "events.event5", descriptionKey: "events.description5" },
    { id: 6, titleKey: "events.event6", descriptionKey: "events.description6" },
    { id: 7, titleKey: "events.event7", descriptionKey: "events.description7" },
    { id: 8, titleKey: "events.event8", descriptionKey: "events.description8" },
    { id: 9, titleKey: "events.event9", descriptionKey: "events.description9" },
    {
      id: 10,
      titleKey: "events.event10",
      descriptionKey: "events.description10",
    },
    {
      id: 11,
      titleKey: "events.event11",
      descriptionKey: "events.description11",
    },
    {
      id: 12,
      titleKey: "events.event12",
      descriptionKey: "events.description12",
    },
    {
      id: 13,
      titleKey: "events.event13",
      descriptionKey: "events.description13",
    },
    {
      id: 14,
      titleKey: "events.event14",
      descriptionKey: "events.description14",
    },
    {
      id: 15,
      titleKey: "events.event15",
      descriptionKey: "events.description15",
    },
    {
      id: 16,
      titleKey: "events.event16",
      descriptionKey: "events.description16",
    },
    {
      id: 17,
      titleKey: "events.event17",
      descriptionKey: "events.description17",
    },
    {
      id: 18,
      titleKey: "events.event18",
      descriptionKey: "events.description18",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const fetchHomeProducts = async () => {
      try {
        const response = await filterProducts({}, 1, 36, null, false);
        if (!mounted) return;
        setHomeProducts(response.data?.data || []);
        setPageDesktop(0);
        setPageMobile(0);
      } catch (error) {
        console.error("Cannot load home products:", error);
        if (mounted) setHomeProducts([]);
      }
    };

    fetchHomeProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const homeEvents = homeProducts.length ? homeProducts : mockEvents;

  const getCurrentEvents = (isMobile = false) => {
    const columns = isMobile ? columnsMobile : columnsDesktop;
    const page = isMobile ? pageMobile : pageDesktop;
    const eventsPerPage = columns * 2; // 2 rows per page

    // Sequential row-major order: row 1 = 1..columns, row 2 = columns+1..columns*2
    const startIndex = page * eventsPerPage;
    return homeEvents.slice(startIndex, startIndex + eventsPerPage);
  };

  const getMaxPages = (isMobile = false) => {
    const columns = isMobile ? columnsMobile : columnsDesktop;
    const eventsPerPage = columns * 2;
    return Math.max(1, Math.ceil(homeEvents.length / eventsPerPage));
  };

  const handlePrevious = (isMobile = false) => {
    if (isMobile) {
      setPageMobile((prev) => Math.max(0, prev - 1));
    } else {
      setPageDesktop((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = (isMobile = false) => {
    const maxPages = getMaxPages(isMobile);
    if (isMobile) {
      setPageMobile((prev) => Math.min(maxPages - 1, prev + 1));
    } else {
      setPageDesktop((prev) => Math.min(maxPages - 1, prev + 1));
    }
  };

  const canGoPreviousDesktop = pageDesktop > 0;
  const canGoNextDesktop = pageDesktop < getMaxPages(false) - 1;
  const canGoPreviousMobile = pageMobile > 0;
  const canGoNextMobile = pageMobile < getMaxPages(true) - 1;

  const swipeThreshold = 50; // px

  const onPointerDown = (clientX) => {
    setIsDragging(true);
    setDragStartX(clientX);
    setDragLastX(clientX);
  };

  const onPointerMove = (clientX) => {
    if (!isDragging || dragStartX === null) return;
    setDragLastX(clientX);
  };

  const onPointerUp = (isMobile = false) => {
    if (!isDragging || dragStartX === null || dragLastX === null) {
      setIsDragging(false);
      setDragStartX(null);
      setDragLastX(null);
      return;
    }
    const deltaX = dragLastX - dragStartX;
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX < 0) {
        const canGoNext = isMobile ? canGoNextMobile : canGoNextDesktop;
        if (canGoNext) handleNext(isMobile);
      } else if (deltaX > 0) {
        const canGoPrevious = isMobile
          ? canGoPreviousMobile
          : canGoPreviousDesktop;
        if (canGoPrevious) handlePrevious(isMobile);
      }
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragLastX(null);
  };

  const getProductTitle = (event) => {
    const firstItem = event.productItems?.[0] || {};
    return firstItem.name || event.name || event.custom_id || event.id;
  };

  const getProductQuantity = (event) => {
    const firstItem = event.productItems?.[0] || {};
    const qty = firstItem.quantityMinimum || firstItem.quantityMinRequire || "";
    const unit = firstItem.unit || firstItem.unitType || "";
    if (!qty) return "";
    return unit ? `${qty} ${unit}` : `${qty}`;
  };

  const getProductPrice = (event) => {
    const firstItem = event.productItems?.[0] || {};
    return firstItem.unitAskingPrice || firstItem.autoAcceptPrice || firstItem.unitMarketPrice || "";
  };

  const getProductDetailId = (event) => event.documentId || event.id;

  const EventCard = ({ event }) => {
    const isRealProduct = Boolean(event.productItems || event.documentId || event.custom_id);
    const title = isRealProduct ? getProductTitle(event) : `${t("events.displayOnHome")} ${event.id}`;
    const detailId = getProductDetailId(event);

    return (
      <div
        onClick={() => detailId && navigate(`/list-of-goods/${detailId}`)}
        style={{
          backgroundColor: "white",
          minHeight: "clamp(138px, 18vw, 230px)",
          padding: "clamp(6px, 1vw, 10px)",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "stretch",
          textAlign: "center",
          border: "1px solid black",
          boxSizing: "border-box",
          cursor: "pointer",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <h3 style={{
          margin: "4px 0 8px 0",
          fontSize: "clamp(11px, 1.15vw, 14px)",
          lineHeight: 1.25,
          fontWeight: "bold",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflowWrap: "anywhere",
        }}>
          {title}
        </h3>
        <div style={{
          minWidth: 0,
          textAlign: "left",
          fontSize: "clamp(10px, 1vw, 12px)",
          lineHeight: 1.25,
          fontWeight: "bold",
        }}>
          {event.listingType ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t(`listingType.${event.listingType.toUpperCase()}`, event.listingType.toUpperCase())}</p> : null}
          {event.categoryType ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t(`categoryType.${event.categoryType.toUpperCase()}`, event.categoryType)}</p> : null}
          {(event.conditionType || event.status) ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t(`conditionType.${(event.conditionType || event.status).toUpperCase()}`, event.conditionType || event.status)}</p> : null}
          {(event.address || event.goodsAddress || event.province) ? <p style={{ margin: "2px 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}>{event.address || event.goodsAddress || event.province}</p> : null}
          {getProductQuantity(event) ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getProductQuantity(event)}</p> : null}
        </div>
      </div>
    );
  };

  const NavigationButton = ({
    direction,
    onClick,
    disabled,
    isMobile = false,
    visible = true,
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [direction === "prev" ? "left" : "right"]: isMobile ? "5px" : "10px",
        background: disabled ? "rgba(204,204,204,0.85)" : "rgba(0,123,255,0.9)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        width: isMobile ? "40px" : "50px",
        height: isMobile ? "40px" : "50px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: visible ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        fontSize: isMobile ? "16px" : "20px",
        zIndex: 20,
        transition: "opacity 0.2s",
      }}
    >
      {direction === "prev" ? <ChevronRight size={isMobile ? 20 : 26} /> : <ChevronLeft size={isMobile ? 20 : 26} />}
    </button>
  );

  return (
    <section className="action-section " style={{ marginTop: "5px" }}>
      {/* Desktop Layout */}
      <div
        className="action-section-1"
        style={{ position: "relative" }}
        onMouseEnter={() => setIsDesktopHovered(true)}
        onMouseLeave={() => setIsDesktopHovered(false)}
      >
        <NavigationButton
          direction="prev"
          onClick={() => handlePrevious(false)}
          disabled={!canGoPreviousDesktop}
          visible={isDesktopHovered}
        />

        {/* Grid items, full width */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: "clamp(6px, 0.8vw, 10px)",
            width: "100%",
            boxSizing: "border-box",
            alignItems: "stretch",
            userSelect: "none",
          }}
          onMouseDown={(e) => onPointerDown(e.clientX)}
          onMouseMove={(e) => onPointerMove(e.clientX)}
          onMouseUp={() => onPointerUp(false)}
          onMouseLeave={() => onPointerUp(false)}
          onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
          onTouchEnd={() => onPointerUp(false)}
        >
          {getCurrentEvents(false).map((event, index) => (
            <EventCard key={`${event.id}-${index}`} event={event} />
          ))}
        </div>

        <NavigationButton
          direction="next"
          onClick={() => handleNext(false)}
          disabled={!canGoNextDesktop}
          visible={isDesktopHovered}
        />
      </div>

      {/* Mobile Layout */}
      <div
        className="action-section-1-mobile"
        style={{ position: "relative" }}
        onMouseEnter={() => setIsMobileHovered(true)}
        onMouseLeave={() => setIsMobileHovered(false)}
      >
        <NavigationButton
          direction="prev"
          onClick={() => handlePrevious(true)}
          disabled={!canGoPreviousMobile}
          isMobile={true}
          visible={isMobileHovered}
        />

        {/* Grid items, full width */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: "8px",
            width: "100%",
            boxSizing: "border-box",
            alignItems: "stretch",
            userSelect: "none",
          }}
          onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
          onTouchEnd={() => onPointerUp(true)}
        >
          {getCurrentEvents(true).map((event, index) => (
            <EventCard key={`${event.id}-${index}`} event={event} />
          ))}
        </div>

        <NavigationButton
          direction="next"
          onClick={() => handleNext(true)}
          disabled={!canGoNextMobile}
          isMobile={true}
          visible={isMobileHovered}
        />
      </div>
    </section>
  );
}
