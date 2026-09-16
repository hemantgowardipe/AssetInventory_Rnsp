(() => {
  "use strict";

  const OBJECT_NAME_TYPE_PRIMARY = "EAsset_Type";
  const OBJECT_NAME_CATEGORY_PRIMARY = "EAsset_Category";
  const MASTER_EDIT_FORM = {
    repository: "EAsset_Master",
    objectId: "deea3ada-225e-44de-a785-2d81a45e9851"
  };
  const DEFAULT_CATEGORY_ICON_URL = "/SmartHR/assets/img/no_Record.png";
  const ASSET_DETAILS_PAGE_URL = "/pages/AssetType";
  // Drag limits and the remembered-width key handed to library.js's GridTable,
  // which owns this page's sorting, column resizing and resize indicator line.
  const TABLE_COL_MIN_WIDTH = 90;
  const TABLE_COL_MAX_WIDTH = 520;
  const TABLE_RESIZE_STORAGE_KEY = "asset-inventory-summary";
  const PAGE_ACCESS_NEW_LP = ["11", "22-3", "22-1", "22-2"];
  const ADD_ACCESS_NEW_LP = ["11", "22-3"];

  const ui = {
    page: null,
    assetGrid: null,
    assetTableView: null,
    typeFilterWrap: null,
    typeFilterInput: null,
    typeFilterList: null,
    errorBox: null,
    tableViewBtn: null,
    gridViewBtn: null,
    exportSummaryBtn: null,
    // Funnel Filter (ported from Asset Search - see search.js/search.css).
    filterToggleBtn: null,
    filterModalOverlay: null,
    filterCloseBtn: null,
    filterFields: null,
    clearFiltersBtn: null,
    applyFiltersBtn: null
  };

  const state = {
    types: [],
    typeLookupByNormalizedName: {},
    selectedType: "",
    viewMode: "grid",
    viewModeChosen: false,
    renderedCards: [],
    sroaRows: [],
    baseSroaRows: [],
    iconUrlByCategoryRecordId: {},
    iconUrlByCategoryName: {},
    isLoading: false,
    lastLoadedAt: 0,
    statusColumns: [],
    tableHeaderLabels: { type: "Type", category: "Category", grossTotal: "GrossTotal" },
    typeFilterOptions: [],
    typeFilterOpen: false,
    typeFilterPortal: null,
    // Funnel Filter state - mirrors Asset Search's state.activeFilters/filterDraft
    // and per-field option lists (see search.js FILTER_FIELDS/state).
    activeFilters: {},
    filterDraft: {},
    openMultiSelectKey: "",
    categoryFilterOptions: [],
    locationFilterOptions: [],
    departmentFilterOptions: [],
    vendorFilterOptions: [],
    itemStatusFilterOptions: [],
    employeeOptions: [],
    assetManagerOptions: []
  };

  let statusCanonicalMap = {};
  let filterOptionsLoadPromise = null;
  const filterOptionsApiCache = {};

  // Funnel Filter field definitions, mirroring Asset Search's FILTER_FIELDS.
  // "Type" already has its own dedicated, always-visible dropdown on this page
  // (the existing #typeFilter control), playing the same role Asset Search's
  // Category quick filter plays outside its modal, so it is intentionally left
  // out of this list and out of the modal - adding it again here would just
  // duplicate an already-working control.
  const FILTER_FIELDS = [
    { key: "Category", label: "Category" },
    { key: "AssignedTo", label: "Currently Assigned", employeeSource: "assigned", multi: true },
    { key: "ItemStatus", label: "Status" },
    { key: "Location", label: "Location" },
    { key: "Department", label: "Department" },
    { key: "VendorID", label: "Vendor" },
    { key: "AssetManager", label: "Asset Manager", employeeSource: "manager" }
  ];
  const FILTER_PLACEHOLDER = "Select to apply";
  // Same permission-scoped App record used by Asset Search to resolve the
  // Asset Manager filter's option list from User_Permission/Teams/Employees.
  const ASSETS_APP_CONFIG_RECORD_ID = "80ec44a8-a288-4dea-afaf-f2ccb9f7a952";

  function resolveApiBaseUrl() {
    try {
      const raw = (window.localStorage && window.localStorage.getItem("env")) || "";
      const trimmed = String(raw || "").trim().replace(/^['"]+|['"]+$/g, "");
      if (trimmed) return trimmed.replace(/\/+$/, "");
    } catch (_error) {
      // Fall through.
    }
    if (window.APP_ENV && window.APP_ENV.API_BASE_URL) {
      return String(window.APP_ENV.API_BASE_URL).replace(/\/+$/, "");
    }
    return "https://ndem.quickappflow.com";
  }

  const API_BASE_URL = resolveApiBaseUrl();

  function tryParseJson(input) {
    try {
      return JSON.parse(input);
    } catch (_error) {
      return null;
    }
  }

  function toText(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeNewLpEntry(value) {
    return String(value == null ? "" : value)
      .trim()
      .replace(/^["']+|["']+$/g, "");
  }

  function readNewLpEntries() {
    if (window.QafNavDock && typeof window.QafNavDock.parseNewLpEntries === "function") {
      return window.QafNavDock.parseNewLpEntries();
    }

    let raw = "";
    try {
      raw = localStorage.getItem("NewLP") || "";
    } catch (_error) {
      raw = "";
    }

    if (!raw) {
      try {
        const userKeyRaw = localStorage.getItem("user_key");
        if (userKeyRaw) {
          const userKey = tryParseJson(userKeyRaw);
          if (userKey && userKey.NewLP != null) raw = userKey.NewLP;
        }
      } catch (_error2) {
        // Fall through.
      }
    }

    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw.map(normalizeNewLpEntry).filter(Boolean);
    }

    const asString = String(raw).trim();
    if (!asString) return [];

    const parsedJson = tryParseJson(asString);
    if (Array.isArray(parsedJson)) {
      return parsedJson.map(normalizeNewLpEntry).filter(Boolean);
    }

    return asString
      .split(",")
      .map(normalizeNewLpEntry)
      .filter(Boolean);
  }

  function hasAnyNewLp(entries, allowedList) {
    const list = Array.isArray(entries) ? entries : [];
    const allowed = Array.isArray(allowedList) ? allowedList : [];
    for (let i = 0; i < allowed.length; i += 1) {
      const needle = normalizeNewLpEntry(allowed[i]);
      if (!needle) continue;
      for (let j = 0; j < list.length; j += 1) {
        if (normalizeNewLpEntry(list[j]) === needle) return true;
      }
    }
    return false;
  }

  function buildUnauthorizedRedirectUrl() {
    let ma = "";
    try {
      ma = String(localStorage.getItem("ma") || "").trim();
    } catch (_error) {
      ma = "";
    }

    if (!ma) return "/not-found?unauthorized=un";

    if (!/^https?:\/\//i.test(ma)) {
      const protocol = (window.location && window.location.protocol) || "https:";
      ma = protocol + "//" + ma.replace(/^\/+/, "");
    }

    try {
      return new URL(ma).origin + "/not-found?unauthorized=un";
    } catch (_error2) {
      return "https://" + String(localStorage.getItem("ma") || "").replace(/^\/+/, "") + "/not-found?unauthorized=un";
    }
  }

  function isPageAuthorized() {
    return hasAnyNewLp(readNewLpEntries(), PAGE_ACCESS_NEW_LP);
  }

  function canAddNewAsset() {
    return hasAnyNewLp(readNewLpEntries(), ADD_ACCESS_NEW_LP);
  }

  if (!isPageAuthorized()) {
    window.location.replace(buildUnauthorizedRedirectUrl());
    return;
  }

  function getAuthHeaders() {
    const parsed = tryParseJson(localStorage.getItem("user_key") || "");
    const parsedValue =
      parsed && typeof parsed.value === "string" ? tryParseJson(parsed.value) : parsed && parsed.value;
    const payload =
      (parsedValue && typeof parsedValue === "object" && parsedValue) ||
      (parsed && typeof parsed === "object" && parsed) ||
      {};
    return {
      "Content-Type": "application/json",
      employeeguid: payload.employeeguid || payload.EmployeeGUID || "",
      hrzemail: payload.hrzemail || payload.Email || "",
      hrzempid: payload.hrzempid || payload.EmployeeID || "",
      lngs: payload.lngs || "Asia/Kolkata"
    };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { method: "POST", headers: getAuthHeaders() });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  function formatFetchError(error) {
    const msg = String(error && error.message ? error.message : error);
    if (msg === "Failed to fetch" || (error && error.name === "TypeError")) {
      return `${msg}. Host this page on the same origin as QuickAppFlow, or open it inside the app.`;
    }
    return msg;
  }

  function getBundleQafService() {
    return window.QafService || (window.parent && window.parent.QafService) || null;
  }

  function findHostQafPageService() {
    try {
      if (window.QafPageService) return window.QafPageService;
      if (window.parent && window.parent.QafPageService) return window.parent.QafPageService;
      if (window.top && window.top.QafPageService) return window.top.QafPageService;
    } catch (_e) {
      // Cross-origin.
    }
    return null;
  }

  function normalizeToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function normalizeFieldKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function normalizeStatusToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function parseLookupLabel(value) {
    if (value == null) return "";
    const text = String(value);
    const parts = text.split(";#");
    return parts.length > 1 ? parts[1] : text;
  }

  function parseLookupId(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const parts = text.split(";#");
    return String(parts[0] || "").trim();
  }

  function formatLookupPrefillValue(recordId, label) {
    const id = String(recordId || "").trim();
    const name = String(label || "").trim();
    if (id && name) return `${id};#${name}`;
    if (id) return id;
    return name;
  }

  /** GetItems returns a flat array, or { data | records | value: [...] }. */
  function normalizeRecords(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const list =
      payload.data ||
      payload.Data ||
      payload.records ||
      payload.Records ||
      payload.value ||
      payload.Value ||
      payload.items ||
      payload.Items;
    return Array.isArray(list) ? list : [];
  }

  function flattenRecord(row) {
    if (!row || typeof row !== "object") return {};
    const out = { ...row };
    const rfv = Array.isArray(row.RecordFieldValues) ? row.RecordFieldValues : [];
    for (let i = 0; i < rfv.length; i += 1) {
      const entry = rfv[i] || {};
      const internal = String(
        entry.FieldInternalName || entry.InternalName || entry.FieldName || entry.Name || ""
      ).trim();
      if (!internal) continue;
      const raw = entry.UGFieldValue ?? entry.UGFfieldValue ?? entry.FieldValue ?? "";
      if (raw == null) continue;
      const text = String(raw).trim();
      if (!text) continue;
      if (out[internal] == null || String(out[internal]).trim() === "") {
        out[internal] = raw;
      }
    }
    return out;
  }

  function cleanStatusLabel(value) {
    let text = parseLookupLabel(value);
    text = String(text || "").trim();
    if (!text) return "";
    return text.replace(/^#+\s*/, "").trim();
  }

  function dedupeStatuses(statuses) {
    const out = [];
    const seen = new Set();
    (Array.isArray(statuses) ? statuses : []).forEach((status) => {
      const label = cleanStatusLabel(status);
      const key = normalizeStatusToken(label);
      if (!label || !key || seen.has(key)) return;
      seen.add(key);
      out.push(label);
    });
    return out;
  }

  function rebuildStatusCanonicalMap(statuses) {
    const next = {};
    (Array.isArray(statuses) ? statuses : []).forEach((status) => {
      const label = cleanStatusLabel(status);
      const token = normalizeStatusToken(label);
      if (!label || !token || Object.prototype.hasOwnProperty.call(next, token)) return;
      next[token] = label;
    });
    statusCanonicalMap = next;
  }

  function toCanonicalStatus(value) {
    const trimmed = String(value || "").trim();
    const normalized = normalizeStatusToken(trimmed);
    if (normalized && Object.prototype.hasOwnProperty.call(statusCanonicalMap, normalized)) {
      return statusCanonicalMap[normalized];
    }
    return trimmed;
  }

  function isKnownTypeLabel(label) {
    const key = normalizeToken(label);
    if (!key) return false;
    if (
      state.typeLookupByNormalizedName &&
      Object.prototype.hasOwnProperty.call(state.typeLookupByNormalizedName, key)
    ) {
      return true;
    }
    return (Array.isArray(state.types) ? state.types : []).some(
      (name) => normalizeToken(name) === key
    );
  }

  function resolveTypeLabelAndIdForPrefill(_categoryId, categoryName, typeName, typeId) {
    let label = String(typeName || "").trim();
    let id = String(typeId || "").trim();
    const nameKey = normalizeToken(categoryName);

    if (label && nameKey && normalizeToken(label) === nameKey) {
      label = "";
      id = "";
    }
    if (label && !isKnownTypeLabel(label)) {
      label = "";
      id = "";
    }
    if (!label && state.selectedType) {
      label = String(state.selectedType || "").trim();
      id = "";
    }
    if (label && state.typeLookupByNormalizedName) {
      const entry = state.typeLookupByNormalizedName[normalizeToken(label)];
      if (entry) {
        if (entry.recordId) id = String(entry.recordId || "").trim();
        if (entry.name) label = String(entry.name || "").trim();
      }
    }
    return { typeId: id, typeName: label };
  }

  function enrichCardTypeForPrefill(card) {
    if (!card || typeof card !== "object") return card;
    const resolved = resolveTypeLabelAndIdForPrefill(
      card.recordId,
      card.categoryName,
      card.categoryType,
      card.typeRecordId
    );
    card.categoryType = resolved.typeName;
    card.typeRecordId = resolved.typeId;
    return card;
  }

  async function fetchTypesViaSdk() {
    const qafService = getBundleQafService();
    if (!qafService || typeof qafService.GetItems !== "function") {
      throw new Error("QafService.GetItems is not available (bundle.js).");
    }
    const payload = await qafService.GetItems(
      OBJECT_NAME_TYPE_PRIMARY,
      ["RecordID", "Name"],
      100000,
      1,
      "",
      "",
      true
    );
    const seen = new Set();
    const types = [];
    const typeLookupByNormalizedName = {};
    normalizeRecords(payload).forEach((row) => {
      const recordId = String(row.RecordID || "").trim();
      const name = String(row.Name || "").trim();
      if (!name) return;
      const key = normalizeToken(name);
      if (seen.has(key)) return;
      seen.add(key);
      types.push(name);
      typeLookupByNormalizedName[key] = { recordId, name };
    });
    types.sort((a, b) => a.localeCompare(b));
    return { types, typeLookupByNormalizedName };
  }

  function buildSroaUrl(typeValue) {
    const params = new URLSearchParams({
      type: String(typeValue || "").trim(),
      Category: "",
      amtype: "2"
    });
    return `${API_BASE_URL}/api/Sroa?${params.toString()}`;
  }

  async function fetchInventorySummaryBySroa(typeValue) {
    return normalizeSroaRows(await fetchJson(buildSroaUrl(typeValue)));
  }

  function normalizeSroaRows(payload) {
    const out = [];
    const seenInner = new Set();

    function pushCategoryRow(item) {
      if (!item || typeof item !== "object") return;
      const flat = flattenRecord(item);
      const hasCategory = Boolean(String(flat.Category || flat.CategoryName || "").trim());
      const hasStatuses =
        Array.isArray(flat.StatusWithNumber) || Array.isArray(flat.statusWithNumber);
      if (!hasCategory && !hasStatuses) return;
      out.push(flat);
    }

    function walk(node, depth) {
      if (node == null || depth > 6) return;
      if (Array.isArray(node)) {
        node.forEach((entry) => walk(entry, depth + 1));
        return;
      }
      if (typeof node !== "object") return;
      if (seenInner.has(node)) return;
      seenInner.add(node);
      const isCategoryRow =
        Boolean(String(node.Category || node.CategoryName || "").trim()) ||
        Array.isArray(node.StatusWithNumber) ||
        Array.isArray(node.statusWithNumber);
      if (isCategoryRow) {
        pushCategoryRow(node);
        return;
      }
      const nested = node.Type || node.type || node.Types || node.types;
      if (Array.isArray(nested)) {
        nested.forEach((entry) => walk(entry, depth + 1));
        return;
      }
      Object.keys(node).forEach((key) => walk(node[key], depth + 1));
    }

    walk(payload, 0);
    return out;
  }

  function collectItemStatusesInSroaOrder(sroaRows) {
    const ordered = [];
    const seen = new Set();
    (Array.isArray(sroaRows) ? sroaRows : []).forEach((row) => {
      const flat = row && typeof row === "object" && !Array.isArray(row) ? row : flattenRecord(row);
      const statusList = Array.isArray(flat.StatusWithNumber)
        ? flat.StatusWithNumber
        : Array.isArray(flat.statusWithNumber)
          ? flat.statusWithNumber
          : [];
      statusList.forEach((entry) => {
        const rawLabel = String((entry && (entry.ItemStatus || entry.itemStatus)) || "").trim();
        if (!rawLabel) return;
        const parsed = parseLookupLabel(rawLabel).trim();
        if (!parsed) return;
        if (normalizeStatusToken(parsed) === normalizeStatusToken("GrossTotal")) return;
        const label = cleanStatusLabel(parsed);
        if (!label) return;
        const token = normalizeStatusToken(label);
        if (!token || seen.has(token)) return;
        seen.add(token);
        ordered.push(label);
      });
    });
    return ordered;
  }

  function buildStatusMapFromSroa(statusList) {
    const map = {};
    if (!Array.isArray(statusList)) return map;
    statusList.forEach((entry) => {
      const rawLabel = String((entry && (entry.ItemStatus || entry.itemStatus)) || "").trim();
      if (!rawLabel) return;
      const canonical = toCanonicalStatus(parseLookupLabel(rawLabel).trim());
      if (!canonical) return;
      if (normalizeStatusToken(canonical) === normalizeStatusToken("GrossTotal")) return;
      const num = Number((entry && (entry.TotalNumber != null ? entry.TotalNumber : entry.totalNumber)) || 0);
      map[canonical] = (map[canonical] || 0) + (Number.isFinite(num) ? num : 0);
    });
    return map;
  }

  function pickGrossTotal(statusList) {
    if (!Array.isArray(statusList)) return 0;
    for (let i = 0; i < statusList.length; i += 1) {
      const entry = statusList[i] || {};
      const label = String(entry.ItemStatus || entry.itemStatus || "").trim();
      if (normalizeStatusToken(label) === normalizeStatusToken("GrossTotal")) {
        const value = Number(entry.TotalNumber != null ? entry.TotalNumber : entry.totalNumber);
        return Number.isFinite(value) ? value : 0;
      }
    }
    return 0;
  }

  function sumStatusMapValuesForTokens(statusMap, labelCandidates) {
    if (!statusMap || typeof statusMap !== "object") return 0;
    const want = new Set(
      (Array.isArray(labelCandidates) ? labelCandidates : [])
        .map((item) => normalizeStatusToken(item))
        .filter(Boolean)
    );
    if (!want.size) return 0;
    let sum = 0;
    Object.keys(statusMap).forEach((key) => {
      if (!want.has(normalizeStatusToken(key))) return;
      sum += Number(statusMap[key] || 0);
    });
    return Number.isFinite(sum) ? sum : 0;
  }

  function computeUtilizationPercent(statusMap, total) {
    const allocated = sumStatusMapValuesForTokens(statusMap, ["Allocated"]);
    const disposed = sumStatusMapValuesForTokens(statusMap, ["Disposed"]);
    const sendForDisposal = sumStatusMapValuesForTokens(statusMap, ["Send for Disposal", "Send For Disposal"]);
    const totalActive = Math.max(0, Number(total || 0) - disposed - sendForDisposal);
    if (totalActive <= 0) return 0;
    const pct = (allocated / totalActive) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  function getCardsFromSroaRows(sroaRows, selectedType) {
    const selectedTypeKey = normalizeToken(selectedType);
    const cards = [];
    const seen = new Map();
    (Array.isArray(sroaRows) ? sroaRows : []).forEach((row) => {
      const flat = row && typeof row === "object" && !Array.isArray(row) ? row : flattenRecord(row);
      const rawCategory = String(flat.Category || flat.CategoryName || "").trim();
      if (!rawCategory) return;
      const categoryName = parseLookupLabel(rawCategory).trim();
      const categoryId = parseLookupId(rawCategory);
      if (!categoryName) return;
      const rawType = String(flat.Type || flat.AssetType || flat.TypeName || "").trim();
      const categoryType = parseLookupLabel(rawType).trim();
      const typeRecordId = parseLookupId(rawType);
      if (selectedTypeKey && normalizeToken(categoryType) !== selectedTypeKey) return;

      const statusList = Array.isArray(flat.StatusWithNumber)
        ? flat.StatusWithNumber
        : Array.isArray(flat.statusWithNumber)
          ? flat.statusWithNumber
          : [];
      const statusMap = buildStatusMapFromSroa(statusList);
      const grossTotal = pickGrossTotal(statusList);
      const derivedTotal = Object.keys(statusMap).reduce(
        (sum, key) => sum + Number(statusMap[key] || 0),
        0
      );
      const total = grossTotal || derivedTotal;
      const dedupeKey = `${normalizeToken(categoryId)}|${normalizeToken(categoryName)}|${normalizeToken(categoryType)}`;
      const existing = seen.get(dedupeKey);
      if (existing) {
        Object.keys(statusMap).forEach((key) => {
          existing.statusMap[key] = (existing.statusMap[key] || 0) + statusMap[key];
        });
        existing.total = Number(existing.total || 0) + total;
        enrichCardTypeForPrefill(existing);
        return;
      }
      const iconByIdMap = state.iconUrlByCategoryRecordId || {};
      const iconByNameMap = state.iconUrlByCategoryName || {};
      const iconUrl =
        (categoryId && iconByIdMap[categoryId]) ||
        iconByNameMap[normalizeToken(categoryName)] ||
        "";
      const card = enrichCardTypeForPrefill({
        recordId: categoryId,
        categoryName,
        categoryType,
        typeRecordId,
        iconUrl,
        total,
        statusMap
      });
      seen.set(dedupeKey, card);
      cards.push(card);
    });
    return cards.sort((a, b) => {
      const totalDiff = Number(b.total || 0) - Number(a.total || 0);
      if (totalDiff !== 0) return totalDiff;
      return String(a.categoryName || "").localeCompare(String(b.categoryName || ""));
    });
  }

  async function fetchCategoryIconsViaSdk() {
    const qafService = getBundleQafService();
    if (!qafService || typeof qafService.GetItems !== "function") {
      throw new Error("QafService.GetItems is not available (bundle.js).");
    }
    const payload = await qafService.GetItems(
      OBJECT_NAME_CATEGORY_PRIMARY,
      ["RecordID", "CategoryName", "Icon"],
      100000,
      1,
      "",
      "",
      true
    );
    const byId = {};
    const byName = {};
    normalizeRecords(payload).forEach((row) => {
      const recordId = String(row.RecordID || "").trim();
      const categoryName = String(row.CategoryName || "").trim();
      if (!categoryName) return;
      const key = normalizeToken(categoryName);
      const iconRef = parseIconReference(row.Icon);
      const iconUrl = iconRef.directUrl;
      if (iconUrl && recordId) byId[recordId] = iconUrl;
      if (iconUrl) byName[key] = iconUrl;
    });
    return { byId, byName };
  }

  function parseIconReference(raw) {
    const text = String(raw || "").trim();
    if (!text) return { directUrl: "", iconRecordId: "" };
    const asJson = tryParseJson(text);
    if (Array.isArray(asJson) && asJson.length) {
      const first = asJson[0] || {};
      const urlCandidate =
        first.Url || first.URL || first.url || first.FileUrl || first.FileURL || first.ServerRelativeUrl || first.Path || first.link || first.Link || "";
      const idCandidate = first.RecordID || first.recordId || first.ID || first.id || "";
      return { directUrl: resolveMediaUrl(urlCandidate), iconRecordId: String(idCandidate || "").trim() };
    }
    if (asJson && typeof asJson === "object") {
      const urlCandidate =
        asJson.Url || asJson.URL || asJson.url || asJson.FileUrl || asJson.FileURL || asJson.ServerRelativeUrl || asJson.Path || asJson.link || asJson.Link || "";
      const idCandidate = asJson.RecordID || asJson.recordId || asJson.ID || asJson.id || "";
      return { directUrl: resolveMediaUrl(urlCandidate), iconRecordId: String(idCandidate || "").trim() };
    }
    const lookupParts = text.split(";#");
    if (lookupParts.length > 1) {
      const lookupId = String(lookupParts[0] || "").trim();
      const lookupLabel = String(lookupParts[1] || "").trim();
      return {
        directUrl: /^https?:\/\//i.test(lookupLabel) ? lookupLabel : resolveMediaUrl(lookupLabel),
        iconRecordId: lookupId
      };
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
      return { directUrl: "", iconRecordId: text };
    }
    return { directUrl: resolveMediaUrl(text), iconRecordId: "" };
  }

  function normalizeUrlText(raw) {
    let text = String(raw || "").trim().replace(/^['"]+|['"]+$/g, "").trim();
    text = text.replace(/\\+/g, "/");
    const httpIndex = text.toLowerCase().indexOf("http");
    if (httpIndex > 0) text = text.slice(httpIndex).trim();
    text = text.replace(/^(https?:\/\/)(https?:\/\/)/i, "$2");
    return text.replace(/[)\]}>,"']+$/g, "").trim();
  }

  function resolveMediaUrl(raw) {
    const s = normalizeUrlText(raw);
    if (!s) return "";
    if (s.startsWith("/Attachment/downloadfile?")) return s;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("//")) return `https:${s}`;
    if (!s.startsWith("/") && /^[^?]+\.[a-z0-9]+$/i.test(s)) {
      return `/Attachment/downloadfile?fileUrl=${encodeURIComponent(s)}`;
    }
    if (s.startsWith("/")) {
      const origin = (window.APP_ENV && window.APP_ENV.FILES_ORIGIN) || "";
      if (origin) return `${String(origin).replace(/\/$/, "")}${s}`;
      return `${window.location.origin}${s}`;
    }
    const base =
      (window.APP_ENV && window.APP_ENV.FILES_BASE_URL) ||
      `${String(API_BASE_URL || "").replace(/\/$/, "")}/`;
    return `${base.replace(/\/$/, "")}/${s.replace(/^\//, "")}`;
  }

  function getActiveStatusColumns(cards) {
    const base = dedupeStatuses(state.statusColumns && state.statusColumns.length ? state.statusColumns : []);
    const known = new Set(base.map((item) => normalizeStatusToken(item)));
    const extras = [];
    (Array.isArray(cards) ? cards : []).forEach((card) => {
      const map = card && card.statusMap && typeof card.statusMap === "object" ? card.statusMap : {};
      Object.keys(map).forEach((key) => {
        const cleanKey = cleanStatusLabel(key);
        const normalized = normalizeStatusToken(cleanKey);
        if (!normalized || known.has(normalized)) return;
        known.add(normalized);
        extras.push(cleanKey);
      });
    });
    return base.concat(extras.sort((a, b) => String(a || "").localeCompare(String(b || ""))));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** URL label segment: spaces → underscores (decoded on asset-details). */
  function normalizeRouteLabelForUrl(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, "_");
  }

  /** Route param value: `{recordId};{normalizedLabel}` */
  function encodeRouteLookupParam(recordId, displayName) {
    const id = String(recordId || "").trim();
    const label = normalizeRouteLabelForUrl(displayName);
    if (id && label) return `${id};${label}`;
    if (id) return id;
    return label;
  }

  function buildAssetDetailsUrl(card) {
    const params = new URLSearchParams();
    const category = encodeRouteLookupParam(card && card.recordId, card && card.categoryName);
    const type = encodeRouteLookupParam(card && card.typeRecordId, card && card.categoryType);
    const total = Number((card && card.total) || 0);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    params.set("count", String(Number.isFinite(total) ? total : 0));
    const query = params.toString();
    return query ? `${ASSET_DETAILS_PAGE_URL}?${query}` : ASSET_DETAILS_PAGE_URL;
  }

  function buildFormDefaultsFromCategoryContext(ctx) {
    const defaults = {};
    if (!ctx) return defaults;
    const resolved = resolveTypeLabelAndIdForPrefill(
      ctx.categoryId,
      ctx.categoryName,
      ctx.typeName,
      ctx.typeId
    );
    const typeVal = formatLookupPrefillValue(resolved.typeId, resolved.typeName);
    const categoryVal = formatLookupPrefillValue(ctx.categoryId, ctx.categoryName);
    if (typeVal) defaults.Type = typeVal;
    if (categoryVal) defaults.Category = categoryVal;
    return defaults;
  }

  function getCategoryAddContextFromButton(addBtn) {
    if (!addBtn) return null;
    const categoryName = String(addBtn.getAttribute("data-category-name") || "").trim();
    const categoryId = String(addBtn.getAttribute("data-category-id") || "").trim();
    const typeName = String(addBtn.getAttribute("data-type-name") || "").trim();
    const typeId = String(addBtn.getAttribute("data-type-id") || "").trim();
    if (categoryName || categoryId || typeName || typeId) {
      return { categoryName, categoryId, typeName, typeId };
    }
    const cards = Array.isArray(state.renderedCards) ? state.renderedCards : [];
    const article = addBtn.closest("article.asset-card");
    if (article) {
      const titleLink = article.querySelector(".asset-card__title a, .asset-category-link");
      const titleText = titleLink ? String(titleLink.textContent || "").trim() : "";
      const matchName = titleText.replace(/\s*\(\d+\)\s*$/, "").trim();
      const card = cards.find((item) => normalizeToken(item.categoryName) === normalizeToken(matchName));
      if (card) {
        return {
          categoryName: String(card.categoryName || "").trim(),
          categoryId: String(card.recordId || "").trim(),
          typeName: String(card.categoryType || "").trim(),
          typeId: String(card.typeRecordId || "").trim()
        };
      }
    }
    return null;
  }

  function categoryAddButtonDataAttrs(card) {
    const enriched = enrichCardTypeForPrefill(card && typeof card === "object" ? { ...card } : {});
    const categoryName = String(enriched.categoryName || "").trim();
    const categoryId = String(enriched.recordId || "").trim();
    const typeName = String(enriched.categoryType || "").trim();
    const typeId = String(enriched.typeRecordId || "").trim();
    return (
      `data-category-add="true" data-category-name="${escapeHtml(categoryName)}"` +
      ` data-category-id="${escapeHtml(categoryId)}" data-type-name="${escapeHtml(typeName)}"` +
      ` data-type-id="${escapeHtml(typeId)}"`
    );
  }

  function renderCategoryAddButtonMarkup(card, buttonClass) {
    if (!canAddNewAsset()) return "";
    const categoryName = String(card && card.categoryName ? card.categoryName : "").trim();
    const btnClass = String(buttonClass || "asset-card__add-btn").trim();
    return (
      `<button type="button" class="btn btn-primary qaf-cs-theme-btn qaf-cs-theme-btn--primary ${btnClass}"` +
      ` ${categoryAddButtonDataAttrs(card)} aria-label="Add new asset in ${escapeHtml(categoryName)}"` +
      ` title="Add new asset"><i class="fa fa-plus" aria-hidden="true"></i></button>`
    );
  }

  async function openNewAssetFormWithPrefill(defaults) {
    const qafPage = findHostQafPageService();
    if (!qafPage || typeof qafPage.AddItem !== "function") {
      throw new Error("QafPageService.AddItem is not available.");
    }
    const url =
      `${API_BASE_URL}/api/ObjectGet?option=object&objectID=` +
      encodeURIComponent(MASTER_EDIT_FORM.repository);
    const schema = await fetchJson(url);
    const fields = (Array.isArray(schema) && schema[0] ? schema[0] : {}).Fields || [];
    const typeVal = String((defaults && defaults.Type) || "").trim();
    const categoryVal = String((defaults && defaults.Category) || "").trim();
    const showFieldsWithValue = fields
      .filter((field) => field && field.InternalName)
      .map((field) => ({
        fieldName: field.InternalName,
        fieldValue:
          field.InternalName === "Type" && typeVal
            ? typeVal
            : field.InternalName === "Category" && categoryVal
              ? categoryVal
              : undefined
      }));
      
    qafPage.AddItem(MASTER_EDIT_FORM.repository, () => loadAndRender(true), undefined, showFieldsWithValue);
  }

  function openOutOfBoxNewAssetForm() {
    const qafPageService = findHostQafPageService();
    if (!qafPageService || typeof qafPageService.AddItem !== "function") {
      throw new Error("QafPageService.AddItem is not available.");
    }
    qafPageService.AddItem(MASTER_EDIT_FORM.repository, function () {
      loadAndRender(true);
    });
  }

  async function handleCategoryAddClick(event) {
    if (!canAddNewAsset()) return;
    const addBtn = event.target.closest("button[data-category-add='true']");
    if (!addBtn) return;
    event.preventDefault();
    try {
      const ctx = getCategoryAddContextFromButton(addBtn);
      const defaults = buildFormDefaultsFromCategoryContext(ctx);
      const hasPrefill = Object.keys(defaults).some(
        (key) => defaults[key] != null && String(defaults[key]).trim() !== ""
      );
      if (hasPrefill) {
        await openNewAssetFormWithPrefill(defaults);
        return;
      }
      openOutOfBoxNewAssetForm();
    } catch (error) {
      showError(`Unable to open new asset form. ${error && error.message ? error.message : ""}`.trim());
    }
  }

  function getCategoryIconUrl(iconUrl, forceDefault) {
    if (forceDefault) return DEFAULT_CATEGORY_ICON_URL;
    const resolved = String(iconUrl || "").trim();
    if (!resolved) return DEFAULT_CATEGORY_ICON_URL;
    return resolveMediaUrl(resolved) || DEFAULT_CATEGORY_ICON_URL;
  }

  /*
   * ---------------------------------------------------------------------
   * Funnel Filter - data sources, API calls and where-clause construction.
   * Ported from Asset Search's search.js (buildActiveFiltersWhereClause,
   * fetchFilterOptionsFromApi, loadTypeFilterOptions/loadLocationFilter
   * Options/loadDepartmentFilterOptions/loadVendorFilterOptions/
   * loadItemStatusFilterOptions/loadAssetManagerFilterOptions/loadEmployeeData)
   * so this page fetches dropdown values, builds its where clause and applies
   * filters using the exact same APIs, payload shapes and value-mapping rules.
   * ---------------------------------------------------------------------
   */

  function buildGetRecordsForFieldsUrl(objectName, fieldList, whereClause) {
    const qs = new URLSearchParams({
      objectName: toText(objectName),
      fieldList: toText(fieldList),
      orderBy: "",
      whereClause: toText(whereClause),
      pageSize: "100000",
      pageNumber: "1",
      isAscending: "true"
    });
    return `${API_BASE_URL}/api/GetRecordsForFields?${qs.toString()}`;
  }

  function isValidWhereFieldName(fieldName) {
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(toText(fieldName));
  }

  function escapeWhereLiteral(value) {
    return String(value == null ? "" : value).replace(/'/g, "''");
  }

  function buildWhereEquality(fieldName, rawValue) {
    if (!isValidWhereFieldName(fieldName)) return "";
    const val = toText(rawValue);
    if (!val) return "";
    return `${fieldName}='${escapeWhereLiteral(val)}'`;
  }

  function wrapWhereClauseGroup(clause) {
    const text = toText(clause);
    if (!text) return "";
    if (text.charAt(0) === "(" && text.charAt(text.length - 1) === ")") return text;
    if (text.indexOf("<AND>") >= 0 || text.indexOf("<OR>") >= 0) return `(${text})`;
    return text;
  }

  function combineWhereClauseParts(parts) {
    const valid = (Array.isArray(parts) ? parts : []).map(toText).filter(Boolean);
    if (!valid.length) return "";
    if (valid.length === 1) return valid[0];
    return valid.map(wrapWhereClauseGroup).join("<AND>");
  }

  function combineWhereClauseOrParts(parts) {
    const valid = (Array.isArray(parts) ? parts : []).map(toText).filter(Boolean);
    if (!valid.length) return "";
    if (valid.length === 1) return valid[0];
    return valid.map(wrapWhereClauseGroup).join("<OR>");
  }

  function getFilterFieldByKey(key) {
    return FILTER_FIELDS.find((field) => field.key === key) || null;
  }

  function isValidItemStatusValue(value) {
    const text = toText(value);
    if (!text) return false;
    const opts = state.itemStatusFilterOptions;
    if (!opts || !opts.length) return true;
    return opts.some((opt) => opt.value === text);
  }

  function isValidFilterWhereValue(key, value) {
    const text = toText(value);
    if (!text) return false;
    if (key === "ItemStatus") return isValidItemStatusValue(text);
    return true;
  }

  function resolveFilterWhereValue(key, selected) {
    if (!selected) return "";
    const qv = toText(selected.queryValue);
    if (qv) return qv;
    const value = toText(selected.value);
    const label = toText(selected.label);
    if (value && label && value.indexOf(";#") < 0 && /^[0-9a-f-]{36}$/i.test(value)) {
      return `${value};#${label}`;
    }
    return value || label;
  }

  /**
   * EAsset_Master.AssignedTo is not a plain lookup ("id;#label") field like
   * Category/Type/Location - it stores a JSON array of assignee objects, e.g.
   *   [{"usertype":1,"RecordID":"4cacf55a-724f-4040-8f6d-e94b45272da0"}]
   * or is null for an unassigned asset. Neither an equality where-clause nor
   * a <contains> where-clause against this field is honored by the API (both
   * were tried; the API silently ignores the clause and returns every
   * record), so this filter has to be applied on the client, against the
   * actual parsed AssignedTo value, instead of via the server where-clause.
   */
  function parseAssignedToRecordIds(rawValue) {
    if (rawValue == null || rawValue === "") return [];
    let value = rawValue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        value = JSON.parse(trimmed);
      } catch (_error) {
        return [];
      }
    }
    const list = Array.isArray(value) ? value : [value];
    const ids = [];
    list.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = toText(item.RecordID != null ? item.RecordID : item.recordId != null ? item.recordId : item.recordID);
      if (id) ids.push(id.toLowerCase());
    });
    return ids;
  }

  /** True when `flat.AssignedTo` (raw EAsset_Master row) names at least one
   *  of the currently-selected "Currently Assigned" employees. Records with
   *  a null/empty AssignedTo (unassigned) never match a specific person. */
  function rowMatchesAssignedToFilter(flat, selectedEmployeeIdSet) {
    if (!selectedEmployeeIdSet || !selectedEmployeeIdSet.size) return true;
    const ids = parseAssignedToRecordIds(flat.AssignedTo);
    if (!ids.length) return false;
    return ids.some((id) => selectedEmployeeIdSet.has(id));
  }

  /** Builds the Set of selected employee RecordIDs for the active
   *  "Currently Assigned" filter, or null when that filter isn't active. */
  function getSelectedAssignedToIdSet() {
    const selected = state.activeFilters.AssignedTo;
    const values = selected && Array.isArray(selected.values) ? selected.values : null;
    if (!values || !values.length) return null;
    const ids = values.map((emp) => toText(emp && emp.value).toLowerCase()).filter(Boolean);
    return ids.length ? new Set(ids) : null;
  }

  /** True when `flat.VendorID` (raw EAsset_Master row) resolves to the
   *  currently-selected vendor's RecordID. Matches on the ID embedded in the
   *  lookup value rather than any label, since the label half of that lookup
   *  is a vendor code (e.g. "VD005"), not the CompanyName the dropdown shows. */
  function rowMatchesVendorFilter(flat, selectedVendorRecordId) {
    if (!selectedVendorRecordId) return true;
    const rowVendorId = parseLookupId(toText(flat.VendorID)).toLowerCase();
    if (!rowVendorId) return false;
    return rowVendorId === selectedVendorRecordId;
  }

  /** RecordID of the currently-selected Vendor filter value, or null when
   *  that filter isn't active. */
  function getSelectedVendorRecordId() {
    const selected = state.activeFilters.VendorID;
    const id = toText(selected && selected.value).toLowerCase();
    return id || null;
  }

  /** Generic client-side matcher for the plain lookup fields (Category,
   *  Location, Department) whose equality where-clause this API doesn't
   *  reliably honor - see buildSingleFilterWhereClause's CLIENT_SIDE_LOOKUP_
   *  FIELDS notes. Compares the RecordID embedded in the row's raw lookup
   *  value against the selected option's RecordID. */
  function rowMatchesLookupIdFilter(rawFieldValue, selectedRecordId) {
    if (!selectedRecordId) return true;
    const rowId = parseLookupId(toText(rawFieldValue)).toLowerCase();
    if (!rowId) return false;
    return rowId === selectedRecordId;
  }

  /** RecordID of the currently-selected single-select value for `filterKey`,
   *  or null when that filter isn't active. */
  function getSelectedLookupRecordId(filterKey) {
    const selected = state.activeFilters[filterKey];
    const id = toText(selected && selected.value).toLowerCase();
    return id || null;
  }

  function buildSingleFilterWhereClause(key, selected) {
    if (!getFilterFieldByKey(key) || !selected) return "";
    if (key === "AssignedTo") {
      // Confirmed against the live API: EAsset_Master's AssignedTo column
      // does not honor a <contains> (or equality) where-clause at all - the
      // server just ignores it and returns every record regardless. Rather
      // than send a where-clause fragment that silently does nothing (which
      // is what was producing MORE records than the unfiltered total), this
      // filter is applied on the client instead - see
      // rowMatchesAssignedToFilter() / the filtering step inside
      // aggregateFilteredAssetsToSroaRows(). Returning "" here just keeps
      // AssignedTo out of the server-side where clause; it is still fully
      // enforced, just after the fetch instead of during it.
      return "";
    }
    if (key === "VendorID") {
      // EAsset_Master.VendorID is a lookup stored as "RecordID;#<vendor code>"
      // (e.g. "95fa9659-...;#VD005") - the label half is a vendor code, not
      // the CompanyName the dropdown shows, so matching against CompanyName
      // (the asset's own separate, denormalized text field) never lines up
      // with what's actually selected, and - like AssignedTo - a mismatched
      // where-clause here comes back as an unfiltered fetch of everything
      // rather than zero rows. This is filtered on the client instead, by
      // the vendor RecordID embedded in VendorID's lookup value - see
      // rowMatchesVendorFilter() / the filtering step inside
      // aggregateFilteredAssetsToSroaRows().
      return "";
    }
    const CLIENT_SIDE_LOOKUP_FIELDS = ["Category", "Location", "Department"];
    if (CLIENT_SIDE_LOOKUP_FIELDS.indexOf(key) >= 0) {
      // Department was confirmed against the live API to fail even with the
      // exact "RecordID;#Label" value it actually stores
      // (Department='dbb692bf-...;#Corporate' came back as every record,
      // not a filtered set) - so an equality where-clause on these composite
      // lookup fields can't be trusted at all here, not just for the fields
      // (AssignedTo, VendorID) that are structurally different. Category and
      // Location use the identical lookup shape on the same object, so they
      // are filtered the same defensive way: fetched raw and matched on the
      // client by the RecordID embedded in the lookup value - see
      // rowMatchesLookupIdFilter() / the filtering step inside
      // aggregateFilteredAssetsToSroaRows().
      return "";
    }
    const resolved = resolveFilterWhereValue(key, selected);
    if (!isValidFilterWhereValue(key, resolved)) return "";
    return buildWhereEquality(key, resolved);
  }

  function buildActiveFiltersWhereClause() {
    const parts = [];
    Object.keys(state.activeFilters).forEach((key) => {
      if (!getFilterFieldByKey(key)) return;
      const clause = buildSingleFilterWhereClause(key, state.activeFilters[key]);
      if (clause) parts.push(clause);
    });
    return combineWhereClauseParts(parts);
  }

  function hasActiveFilters() {
    return Object.keys(state.activeFilters).length > 0;
  }

  /** Generic "fetch RecordID+label pairs from GetRecordsForFields" loader for
   *  fields that (like Category) are plain lookups on EAsset_Master, stored
   *  as "RecordID;#Label" - e.g. Location, Department. `extractRow` returns
   *  { recordId, label } for each fetched row. */
  function fetchFilterOptionsFromApi(url, extractRow) {
    if (filterOptionsApiCache[url]) return filterOptionsApiCache[url];
    const requestPromise = fetchJson(url)
      .then((payload) => {
        const rows = normalizeRecords(payload).map((row) => flattenRecord(row));
        const seen = new Set();
        const options = [];
        rows.forEach((row) => {
          const extracted = extractRow(row) || {};
          const recordId = toText(extracted.recordId);
          const label = toText(extracted.label);
          if (!recordId || !label) return;
          const key = recordId.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          const queryValue = `${recordId};#${label}`;
          options.push({ value: recordId, label, queryValue, queryCandidates: [queryValue, recordId, label] });
        });
        options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
        return options;
      })
      .catch(() => []);
    filterOptionsApiCache[url] = requestPromise;
    return requestPromise;
  }

  async function loadCategoryFilterOptions() {
    if (Array.isArray(state.categoryFilterOptions) && state.categoryFilterOptions.length) return;
    try {
      const url = buildGetRecordsForFieldsUrl("EAsset_Category", "RecordID,CategoryName,Name", "");
      const payload = await fetchJson(url);
      const rows = normalizeRecords(payload).map((row) => flattenRecord(row));
      const seen = new Set();
      const options = [];
      rows.forEach((row) => {
        const recordId = toText(row.RecordID);
        const label = toText(row.CategoryName || row.Name);
        if (!recordId || !label) return;
        const key = recordId.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const queryValue = `${recordId};#${label}`;
        options.push({ value: recordId, label, queryValue, queryCandidates: [queryValue, recordId, label] });
      });
      options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
      state.categoryFilterOptions = options;
    } catch (_error) {
      state.categoryFilterOptions = [];
    }
  }

  async function loadLocationFilterOptions() {
    if (Array.isArray(state.locationFilterOptions) && state.locationFilterOptions.length) return;
    state.locationFilterOptions = await fetchFilterOptionsFromApi(
      buildGetRecordsForFieldsUrl("Location", "RecordID,Name", ""),
      (row) => ({ recordId: row.RecordID, label: row.Name })
    );
  }

  async function loadDepartmentFilterOptions() {
    if (Array.isArray(state.departmentFilterOptions) && state.departmentFilterOptions.length) return;
    state.departmentFilterOptions = await fetchFilterOptionsFromApi(
      buildGetRecordsForFieldsUrl("Department", "RecordID,Name", ""),
      (row) => ({ recordId: row.RecordID, label: row.Name })
    );
  }

  async function loadVendorFilterOptions() {
    if (Array.isArray(state.vendorFilterOptions) && state.vendorFilterOptions.length) return;
    const url = buildGetRecordsForFieldsUrl("Vendor", "RecordID,CompanyName", "");
    if (filterOptionsApiCache[url]) {
      state.vendorFilterOptions = await filterOptionsApiCache[url];
      return;
    }
    const requestPromise = fetchJson(url)
      .then((payload) => {
        const rows = normalizeRecords(payload).map((row) => flattenRecord(row));
        const seen = new Set();
        const options = [];
        rows.forEach((row) => {
          const recordId = toText(row.RecordID);
          const companyName = toText(row.CompanyName);
          if (!recordId || !companyName) return;
          const key = recordId.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          options.push({
            value: recordId,
            label: companyName,
            queryValue: companyName,
            queryCandidates: [companyName, `${recordId};#${companyName}`, recordId]
          });
        });
        options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
        return options;
      })
      .catch(() => []);
    filterOptionsApiCache[url] = requestPromise;
    state.vendorFilterOptions = await requestPromise;
  }

  async function loadItemStatusFilterOptions() {
    if (Array.isArray(state.itemStatusFilterOptions) && state.itemStatusFilterOptions.length) return;
    try {
      const url = `${API_BASE_URL}/api/ObjectGet?option=object&objectID=${encodeURIComponent("EAsset_Master")}`;
      const payload = await fetchJson(url);
      const obj = Array.isArray(payload) ? payload[0] : payload;
      if (!obj || !Array.isArray(obj.Fields)) return;
      const itemStatusField = obj.Fields.find((field) => field && field.InternalName === "ItemStatus");
      if (!itemStatusField || !itemStatusField.Choices) return;
      const seen = new Set();
      const options = [];
      String(itemStatusField.Choices)
        .split(";#")
        .forEach((part) => {
          const val = toText(part);
          if (!val) return;
          const key = val.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          options.push({ value: val, label: val, queryValue: val, queryCandidates: [val] });
        });
      if (options.length) state.itemStatusFilterOptions = options;
    } catch (_error) {
      // Leave state.itemStatusFilterOptions empty; getFilterOptions() and
      // isValidItemStatusValue() both fall back gracefully when it's empty.
    }
  }

  async function loadEmployeeFilterOptions() {
    if (Array.isArray(state.employeeOptions) && state.employeeOptions.length) return;
    try {
      const url = buildGetRecordsForFieldsUrl("Employees", "RecordID,FirstName,LastName,IsOffboarded", "");
      const payload = await fetchJson(url);
      const rows = normalizeRecords(payload)
        .map((row) => flattenRecord(row))
        .filter((row) => toText(row.IsOffboarded).toLowerCase() !== "true");
      const seen = new Set();
      const options = [];
      rows.forEach((row) => {
        const recordId = toText(row.RecordID);
        const label = `${toText(row.FirstName)} ${toText(row.LastName)}`.trim();
        if (!recordId || !label) return;
        const key = recordId.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const queryValue = `${recordId};#${label}`;
        options.push({ value: recordId, label, queryValue, queryCandidates: [queryValue, recordId, label] });
      });
      options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
      state.employeeOptions = options;
    } catch (_error) {
      state.employeeOptions = [];
    }
  }

  function isGuidValue(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(toText(value));
  }

  function isAssetManagerEligibleRole(roleValue) {
    const label = parseLookupLabel(roleValue).trim();
    if (!label) return false;
    return /^(admin|edit)(\s|$)/i.test(label);
  }

  function parseProfileOrTeamItems(raw) {
    if (raw == null || raw === "") return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = typeof raw === "object" ? raw : JSON.parse(toText(raw) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  async function fetchRepositoryRecordsForFilter(objectName, fieldList, whereClause) {
    const url = buildGetRecordsForFieldsUrl(objectName, fieldList, whereClause);
    if (filterOptionsApiCache[url]) return filterOptionsApiCache[url];
    const requestPromise = fetchJson(url)
      .then((payload) => normalizeRecords(payload).map((row) => flattenRecord(row)))
      .catch(() => []);
    filterOptionsApiCache[url] = requestPromise;
    return requestPromise;
  }

  /** Same permission -> teams -> employees resolution chain as Asset Search's
   *  fetchAssetManagerOptionsFromPermissions, scoped to this Assets app. */
  async function fetchAssetManagerOptionsFromPermissions() {
    const cacheKey = "asset-manager-permissions";
    if (filterOptionsApiCache[cacheKey]) return filterOptionsApiCache[cacheKey];
    const requestPromise = (async () => {
      const permRows = await fetchRepositoryRecordsForFilter(
        "User_Permission",
        "RecordID,ProfileorTeam,AppName,Role",
        `AppName='${escapeWhereLiteral(ASSETS_APP_CONFIG_RECORD_ID)}'`
      );
      const userIds = [];
      const teamIds = [];
      const seenUser = new Set();
      const seenTeam = new Set();
      permRows.forEach((row) => {
        if (!isAssetManagerEligibleRole(row.Role)) return;
        parseProfileOrTeamItems(row.ProfileorTeam).forEach((item) => {
          if (!item) return;
          const id = toText(item.RecordID);
          if (!isGuidValue(id)) return;
          const userType = Number(item.UserType);
          const key = id.toLowerCase();
          if (userType === 2) {
            if (seenTeam.has(key)) return;
            seenTeam.add(key);
            teamIds.push(id);
          } else {
            if (seenUser.has(key)) return;
            seenUser.add(key);
            userIds.push(id);
          }
        });
      });
      if (teamIds.length) {
        const teamClause = teamIds.map((id) => `RecordID='${escapeWhereLiteral(id)}'`).join("<OR>");
        const teamRows = await fetchRepositoryRecordsForFilter("Teams", "RecordID,TeamMembers", teamClause);
        teamRows.forEach((teamRow) => {
          const parts = toText(teamRow.TeamMembers).split(";#");
          for (let i = 0; i < parts.length; i += 2) {
            const memberId = toText(parts[i]);
            if (!isGuidValue(memberId)) continue;
            const key = memberId.toLowerCase();
            if (seenUser.has(key)) continue;
            seenUser.add(key);
            userIds.push(memberId);
          }
        });
      }
      if (!userIds.length) return [];
      const userClause = userIds.map((id) => `RecordID='${escapeWhereLiteral(id)}'`).join("<OR>");
      const employeeRows = await fetchRepositoryRecordsForFilter(
        "Employees",
        "RecordID,EmployeeID,FirstName,LastName,EmployeeName",
        userClause
      );
      const seen = new Set();
      const options = [];
      employeeRows.forEach((row) => {
        const recordId = toText(row.RecordID);
        let label = `${toText(row.FirstName)} ${toText(row.LastName)}`.trim();
        if (!label) label = toText(row.EmployeeName);
        if (!recordId || !label) return;
        const key = recordId.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const queryValue = `${recordId};#${label}`;
        options.push({ value: recordId, label, queryValue, queryCandidates: [queryValue, recordId, label] });
      });
      options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
      return options;
    })().catch(() => []);
    filterOptionsApiCache[cacheKey] = requestPromise;
    return requestPromise;
  }

  async function loadAssetManagerFilterOptions() {
    state.assetManagerOptions = await fetchAssetManagerOptionsFromPermissions();
  }

  function ensureFilterOptionsLoaded() {
    if (filterOptionsLoadPromise) return filterOptionsLoadPromise;
    filterOptionsLoadPromise = Promise.all([
      loadCategoryFilterOptions(),
      loadLocationFilterOptions(),
      loadDepartmentFilterOptions(),
      loadVendorFilterOptions(),
      loadItemStatusFilterOptions(),
      loadEmployeeFilterOptions(),
      loadAssetManagerFilterOptions()
    ]).catch(() => {});
    return filterOptionsLoadPromise;
  }

  /** Aggregates raw EAsset_Master rows (fetched with the active filters' where
   *  clause) into the same {Category, Type, StatusWithNumber:[...]} shape the
   *  /api/Sroa endpoint returns, so the existing getCardsFromSroaRows/
   *  collectItemStatusesInSroaOrder/renderCards/renderTableView pipeline can
   *  consume filtered results without any changes of its own.
   *
   *  Both the category identity and the status label are resolved against the
   *  unfiltered baseline (state.baseSroaRows / statusCanonicalMap) rather than
   *  trusted at face value from the raw fetch: a filtered request is always a
   *  subset of the same assets Sroa already summarized, so every category and
   *  status it can legitimately produce already exists in that baseline. Any
   *  row that can't be matched back to a known category, or whose status text
   *  doesn't canonicalize to a known status (e.g. a slightly different raw
   *  format, blank value, or field-name mismatch), is left out of the counts
   *  instead of being bucketed under an invented category/status - which is
   *  what was causing extra status badges to appear on cards after filtering
   *  (most visibly with the multi-value "Currently Assigned" filter). */
  function aggregateFilteredAssetsToSroaRows(rows) {
    const knownCategoryByToken = new Map();
    (Array.isArray(state.baseSroaRows) ? state.baseSroaRows : []).forEach((base) => {
      const flat = base && typeof base === "object" && !Array.isArray(base) ? base : flattenRecord(base);
      const rawCategory = toText(flat.Category || flat.CategoryName);
      if (!rawCategory) return;
      const categoryName = parseLookupLabel(rawCategory).trim();
      const categoryId = parseLookupId(rawCategory);
      const rawType = toText(flat.Type || flat.AssetType || flat.TypeName);
      const known = { rawCategory, rawType };
      const idToken = normalizeToken(categoryId);
      const nameToken = normalizeToken(categoryName);
      if (idToken) knownCategoryByToken.set(`id:${idToken}`, known);
      if (nameToken) knownCategoryByToken.set(`name:${nameToken}`, known);
    });

    // The API doesn't honor a server-side where-clause on AssignedTo or
    // VendorID (see their docs above), so those filters - if active - are
    // enforced here, per row, against the actual parsed field values.
    const assignedToIdSet = getSelectedAssignedToIdSet();
    const selectedVendorRecordId = getSelectedVendorRecordId();
    const selectedCategoryRecordId = getSelectedLookupRecordId("Category");
    const selectedLocationRecordId = getSelectedLookupRecordId("Location");
    const selectedDepartmentRecordId = getSelectedLookupRecordId("Department");

    const map = new Map();
    const seenRecordIds = new Set();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const flat = flattenRecord(row);

      // Guard against the same asset being counted twice if the API ever
      // returns a row more than once (e.g. a join fan-out) - each RecordID
      // should only ever contribute one unit to one status bucket.
      const recordId = toText(flat.RecordID);
      if (recordId) {
        const recordKey = recordId.toLowerCase();
        if (seenRecordIds.has(recordKey)) return;
        seenRecordIds.add(recordKey);
      }

      if (!rowMatchesAssignedToFilter(flat, assignedToIdSet)) return;
      if (!rowMatchesVendorFilter(flat, selectedVendorRecordId)) return;
      if (!rowMatchesLookupIdFilter(flat.Location, selectedLocationRecordId)) return;
      if (!rowMatchesLookupIdFilter(flat.Department, selectedDepartmentRecordId)) return;

      const rawCategoryField = toText(flat.Category || flat.ItemCategory);
      if (!rawCategoryField) return;
      if (selectedCategoryRecordId && !rowMatchesLookupIdFilter(rawCategoryField, selectedCategoryRecordId)) return;
      const fieldCategoryName = parseLookupLabel(rawCategoryField).trim();
      const fieldCategoryId = parseLookupId(rawCategoryField);
      const known =
        (fieldCategoryId && knownCategoryByToken.get(`id:${normalizeToken(fieldCategoryId)}`)) ||
        (fieldCategoryName && knownCategoryByToken.get(`name:${normalizeToken(fieldCategoryName)}`));
      if (!known) return; // Category not part of the unfiltered summary - skip rather than inventing a new card.

      const rawStatus = toText(flat.ItemStatus || flat.Status);
      const statusToken = normalizeStatusToken(cleanStatusLabel(rawStatus));
      if (!statusToken || !Object.prototype.hasOwnProperty.call(statusCanonicalMap, statusToken)) return; // Not a known status - skip rather than adding a new status column.
      const canonicalStatus = statusCanonicalMap[statusToken];

      const key = normalizeToken(fieldCategoryId) || normalizeToken(fieldCategoryName);
      let entry = map.get(key);
      if (!entry) {
        entry = { Category: known.rawCategory, Type: known.rawType, StatusWithNumber: [], __statusIndex: {} };
        map.set(key, entry);
      }
      if (!entry.__statusIndex[statusToken]) {
        const item = { ItemStatus: canonicalStatus, TotalNumber: 0 };
        entry.__statusIndex[statusToken] = item;
        entry.StatusWithNumber.push(item);
      }
      entry.__statusIndex[statusToken].TotalNumber += 1;
    });
    const out = [];
    map.forEach((entry) => {
      const total = entry.StatusWithNumber.reduce((sum, s) => sum + Number(s.TotalNumber || 0), 0);
      entry.StatusWithNumber.push({ ItemStatus: "GrossTotal", TotalNumber: total });
      delete entry.__statusIndex;
      out.push(entry);
    });
    return out;
  }

  async function fetchFilteredAssetRowsForAggregation(whereClause) {
    const url = buildGetRecordsForFieldsUrl(
      "EAsset_Master",
      "RecordID,Category,ItemCategory,Type,ItemType,ItemStatus,Status,AssignedTo,VendorID,Location,Department",
      whereClause
    );
    const payload = await fetchJson(url);
    return normalizeRecords(payload);
  }

  /** Re-fetches (when filters are active) or restores (when cleared) the
   *  inventory summary, then re-renders through the existing pipeline. */
  async function applyActiveFiltersAndRefresh() {
    setBusy(true);
    clearError();
    try {
      if (hasActiveFilters()) {
        const whereClause = buildActiveFiltersWhereClause();
        const rawRows = await fetchFilteredAssetRowsForAggregation(whereClause);
        state.sroaRows = aggregateFilteredAssetsToSroaRows(rawRows);
      } else {
        state.sroaRows = Array.isArray(state.baseSroaRows) ? state.baseSroaRows.slice() : [];
      }
    } catch (error) {
      showError(`Unable to apply filters. ${formatFetchError(error)}`);
      state.sroaRows = Array.isArray(state.baseSroaRows) ? state.baseSroaRows.slice() : [];
    }
    renderFromState();
    setBusy(false);
  }

  /*
   * ---------------------------------------------------------------------
   * Funnel Filter - modal markup, dropdown behavior and draft/apply/clear.
   * Ported from Asset Search's search.js (renderSingleSelectDropdown,
   * renderCheckboxMultiSelect, bindMultiSelectUi, readFilterDraftFromDom,
   * applyFilterDraft, openFilterModal/closeFilterModal) with identical
   * markup/classes so the UI and interaction match exactly.
   * ---------------------------------------------------------------------
   */

  function getFilterTriggerInput(wrap) {
    return wrap ? wrap.querySelector(".as-filter-select-input") : null;
  }

  function multiSelectLabel(selected) {
    if (!selected || !selected.length) return "";
    if (selected.length === 1) return selected[0].label;
    return `${selected.length} selected`;
  }

  function filterTriggerLabel(selected, isMulti) {
    if (isMulti) return multiSelectLabel(selected) || FILTER_PLACEHOLDER;
    if (!selected || !selected.value) return FILTER_PLACEHOLDER;
    return selected.label || FILTER_PLACEHOLDER;
  }

  function syncFilterInputDisplay(wrap, field) {
    const input = getFilterTriggerInput(wrap);
    if (!input || !field) return;
    const draft = state.filterDraft[field.key];
    if (field.multi) {
      const summary = filterTriggerLabel(Array.isArray(draft) ? draft : [], true);
      input.value = summary === FILTER_PLACEHOLDER ? "" : summary;
      return;
    }
    input.value = draft && draft.label ? draft.label : "";
  }

  function normalizeFilterSearchText(text) {
    return toText(text).toLowerCase();
  }

  function filterOptionMatchesQuery(label, query) {
    if (!query) return true;
    return normalizeFilterSearchText(label).indexOf(normalizeFilterSearchText(query)) >= 0;
  }

  function getFilterOptionSearchLabel(optionEl) {
    const labelNode = optionEl.querySelector(".as-filter-select-option__label");
    return toText(labelNode ? labelNode.textContent : optionEl.textContent);
  }

  function applyFilterPanelSearch(wrap, query) {
    const panel = wrap.querySelector(".as-filter-select-panel");
    if (!panel) return;
    const normalizedQuery = normalizeFilterSearchText(query);
    let visibleCount = 0;
    panel.querySelectorAll(".as-filter-select-option").forEach((optionEl) => {
      if (optionEl.getAttribute("data-value") === "") return;
      const label = getFilterOptionSearchLabel(optionEl);
      const matches = filterOptionMatchesQuery(label, normalizedQuery);
      if (matches) visibleCount += 1;
      optionEl.classList.toggle("is-filter-hidden", !matches);
    });
    const emptyEl = panel.querySelector(".as-filter-select-empty");
    if (emptyEl) emptyEl.hidden = visibleCount > 0;
  }

  function resetFilterPanelSearch(wrap) {
    applyFilterPanelSearch(wrap, "");
  }

  function openFilterSelectPanel(input) {
    const wrap = input.closest(".as-filter-select-wrap");
    const panel = wrap && wrap.querySelector(".as-filter-select-panel");
    if (!wrap || !panel) return;
    const key = input.getAttribute("data-ms-toggle");
    const field = getFilterFieldByKey(key);
    closeAllMultiSelectPanels();
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
    wrap.classList.add("is-open");
    state.openMultiSelectKey = key || "";
    if (field && field.multi) {
      input.dataset.savedDisplay = input.value;
      input.value = "";
    }
    resetFilterPanelSearch(wrap);
  }

  function closeAllMultiSelectPanels() {
    document.querySelectorAll(".as-filter-select-wrap.is-open").forEach((wrap) => {
      const key = wrap.getAttribute("data-filter-key");
      const field = getFilterFieldByKey(key);
      const input = getFilterTriggerInput(wrap);
      if (input && input.dataset.savedDisplay != null) delete input.dataset.savedDisplay;
      resetFilterPanelSearch(wrap);
      if (field) syncFilterInputDisplay(wrap, field);
    });
    document.querySelectorAll(".as-filter-select-panel").forEach((panel) => {
      panel.hidden = true;
    });
    document.querySelectorAll(".as-filter-select-input").forEach((input) => {
      input.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".as-filter-select-wrap").forEach((wrap) => {
      wrap.classList.remove("is-open");
    });
    state.openMultiSelectKey = "";
  }

  function renderSingleSelectDropdown(field, options, selected) {
    const current = selected && selected.value ? selected : null;
    const inputValue = current ? current.label : "";
    const panelId = `filter-panel-${field.key}`;
    const placeholderSelected = !current;
    return (
      `<section class="as-filter-item">` +
      `<label for="filter-trigger-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>` +
      `<div class="as-filter-select-wrap" data-filter-key="${escapeHtml(field.key)}">` +
      `<input type="text" id="filter-trigger-${escapeHtml(field.key)}" class="as-filter-select as-filter-select-trigger as-filter-select-input" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-controls="${escapeHtml(panelId)}" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(FILTER_PLACEHOLDER)}" value="${escapeHtml(inputValue)}" data-ms-toggle="${escapeHtml(field.key)}" />` +
      `<i class="fa fa-angle-down qaf-arrow-icon qaf-arrow-icon--overlay" aria-hidden="true"></i>` +
      `<div id="${escapeHtml(panelId)}" class="as-filter-select-panel" role="listbox" hidden>` +
      `<button type="button" class="as-filter-select-option${placeholderSelected ? " is-selected" : ""}" role="option" data-filter-key="${escapeHtml(field.key)}" data-value="" data-query="" data-label="${escapeHtml(FILTER_PLACEHOLDER)}">${escapeHtml(FILTER_PLACEHOLDER)}</button>` +
      options
        .map((opt) => {
          const isSelected = current && current.value === opt.value;
          return `<button type="button" class="as-filter-select-option${isSelected ? " is-selected" : ""}" role="option" data-filter-key="${escapeHtml(field.key)}" data-value="${escapeHtml(opt.value)}" data-query="${escapeHtml(opt.queryValue || opt.value)}" data-label="${escapeHtml(opt.label)}">${escapeHtml(opt.label)}</button>`;
        })
        .join("") +
      `<p class="as-filter-select-empty" hidden>No matching options</p>` +
      `</div></div></section>`
    );
  }

  function renderCheckboxMultiSelect(field, options, selected) {
    const selectedList = Array.isArray(selected) ? selected : [];
    let inputValue = filterTriggerLabel(selectedList, true);
    if (inputValue === FILTER_PLACEHOLDER) inputValue = "";
    const panelId = `filter-panel-${field.key}`;
    return (
      `<section class="as-filter-item">` +
      `<label for="filter-trigger-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>` +
      `<div class="as-filter-select-wrap" data-filter-key="${escapeHtml(field.key)}">` +
      `<input type="text" id="filter-trigger-${escapeHtml(field.key)}" class="as-filter-select as-filter-select-trigger as-filter-select-input" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-controls="${escapeHtml(panelId)}" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(FILTER_PLACEHOLDER)}" value="${escapeHtml(inputValue)}" data-ms-toggle="${escapeHtml(field.key)}" />` +
      `<i class="fa fa-angle-down qaf-arrow-icon qaf-arrow-icon--overlay" aria-hidden="true"></i>` +
      `<div id="${escapeHtml(panelId)}" class="as-filter-select-panel" role="listbox" aria-multiselectable="true" hidden>` +
      options
        .map((opt) => {
          const isChecked = selectedList.some((s) => s.value === opt.value);
          return (
            `<label class="as-filter-select-option as-filter-select-option--checkbox">` +
            `<input type="checkbox" class="as-filter-select-checkbox" data-filter-key="${escapeHtml(field.key)}" value="${escapeHtml(opt.value)}" data-query="${escapeHtml(opt.queryValue)}" data-label="${escapeHtml(opt.label)}"${isChecked ? " checked" : ""} />` +
            `<span class="as-filter-select-option__label">${escapeHtml(opt.label)}</span></label>`
          );
        })
        .join("") +
      `<p class="as-filter-select-empty" hidden>No matching options</p>` +
      `</div></div></section>`
    );
  }

  function getFilterOptions(field) {
    if (field.employeeSource === "assigned") return state.employeeOptions;
    if (field.employeeSource === "manager") return state.assetManagerOptions;
    if (field.key === "ItemStatus") return state.itemStatusFilterOptions;
    if (field.key === "Category") return state.categoryFilterOptions;
    if (field.key === "Location") return state.locationFilterOptions;
    if (field.key === "Department") return state.departmentFilterOptions;
    if (field.key === "VendorID") return state.vendorFilterOptions;
    return [];
  }

  function renderFilterFields() {
    if (!ui.filterFields) return;
    const html = [];
    FILTER_FIELDS.forEach((field) => {
      const options = getFilterOptions(field);
      const draft = state.filterDraft[field.key];
      if (field.multi) {
        html.push(renderCheckboxMultiSelect(field, options, draft));
        return;
      }
      html.push(renderSingleSelectDropdown(field, options, draft));
    });
    ui.filterFields.innerHTML = html.join("");
    bindMultiSelectUi();
  }

  function bindMultiSelectUi() {
    document.querySelectorAll(".as-filter-select-input[data-ms-toggle]").forEach((input) => {
      if (input.__invenMsBound) return;
      input.__invenMsBound = true;

      input.addEventListener("click", (e) => {
        e.stopPropagation();
        const wrap = input.closest(".as-filter-select-wrap");
        const panel = wrap && wrap.querySelector(".as-filter-select-panel");
        if (panel && panel.hidden) openFilterSelectPanel(input);
      });

      input.addEventListener("focus", () => {
        openFilterSelectPanel(input);
      });

      input.addEventListener("input", () => {
        const wrap = input.closest(".as-filter-select-wrap");
        if (!wrap) return;
        const panel = wrap.querySelector(".as-filter-select-panel");
        if (panel && panel.hidden) openFilterSelectPanel(input);
        applyFilterPanelSearch(wrap, input.value);
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeAllMultiSelectPanels();
          input.blur();
        }
      });
    });

    document.querySelectorAll(".as-filter-select-checkbox").forEach((cb) => {
      if (cb.__invenCbBound) return;
      cb.__invenCbBound = true;
      cb.addEventListener("change", () => {
        const key = cb.getAttribute("data-filter-key");
        if (!key) return;
        const selected = [];
        document
          .querySelectorAll(`.as-filter-select-checkbox[data-filter-key="${key}"]:checked`)
          .forEach((checked) => {
            selected.push({
              value: checked.value,
              label: checked.getAttribute("data-label") || checked.value,
              queryValue: checked.getAttribute("data-query") || checked.value
            });
          });
        state.filterDraft[key] = selected;
        const wrap = cb.closest(".as-filter-select-wrap");
        const field = getFilterFieldByKey(key);
        if (wrap && field && !wrap.classList.contains("is-open")) syncFilterInputDisplay(wrap, field);
      });
    });

    document.querySelectorAll('.as-filter-select-option[role="option"]').forEach((btn) => {
      if (btn.__invenSingleBound) return;
      btn.__invenSingleBound = true;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = btn.getAttribute("data-filter-key");
        if (!key) return;
        const wrap = btn.closest(".as-filter-select-wrap");
        if (!wrap || wrap.querySelector(".as-filter-select-checkbox")) return;
        const value = btn.getAttribute("data-value") || "";
        wrap.querySelectorAll('.as-filter-select-option[role="option"]').forEach((opt) => {
          opt.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        const input = getFilterTriggerInput(wrap);
        if (!value) {
          delete state.filterDraft[key];
          if (input) input.value = "";
        } else {
          state.filterDraft[key] = {
            value,
            label: btn.getAttribute("data-label") || value,
            queryValue: btn.getAttribute("data-query") || value,
            queryCandidates: [btn.getAttribute("data-query") || value, value, btn.getAttribute("data-label") || value].filter(Boolean)
          };
          if (input) input.value = state.filterDraft[key].label;
        }
        closeAllMultiSelectPanels();
      });
    });
  }

  function readFilterDraftFromDom() {
    const draft = {};
    FILTER_FIELDS.forEach((field) => {
      if (field.multi) {
        const selected = [];
        document
          .querySelectorAll(`.as-filter-select-checkbox[data-filter-key="${field.key}"]:checked`)
          .forEach((cb) => {
            selected.push({
              value: cb.value,
              label: cb.getAttribute("data-label") || cb.value,
              queryValue: cb.getAttribute("data-query") || cb.value
            });
          });
        draft[field.key] = selected;
        return;
      }
      const wrap = document.querySelector(`.as-filter-select-wrap[data-filter-key="${field.key}"]`);
      const selectedOpt = wrap && wrap.querySelector('.as-filter-select-option[role="option"].is-selected');
      if (!selectedOpt) return;
      const value = selectedOpt.getAttribute("data-value") || "";
      if (!value) return;
      draft[field.key] = {
        value,
        label: selectedOpt.getAttribute("data-label") || value,
        queryValue: selectedOpt.getAttribute("data-query") || value,
        queryCandidates: [
          selectedOpt.getAttribute("data-query") || value,
          value,
          selectedOpt.getAttribute("data-label") || value
        ].filter(Boolean)
      };
    });
    state.filterDraft = draft;
  }

  function applyFilterDraft() {
    state.activeFilters = {};
    Object.keys(state.filterDraft).forEach((key) => {
      if (!getFilterFieldByKey(key)) return;
      const entry = state.filterDraft[key];
      if (Array.isArray(entry)) {
        const validValues = entry.filter((emp) =>
          isValidFilterWhereValue("AssignedTo", resolveFilterWhereValue("AssignedTo", emp))
        );
        if (validValues.length) state.activeFilters[key] = { values: validValues, targetField: "AssignedTo" };
        return;
      }
      if (entry && entry.value) {
        const resolved = resolveFilterWhereValue(key, entry);
        if (isValidFilterWhereValue(key, resolved)) state.activeFilters[key] = entry;
      }
    });
  }

  function copyActiveFiltersToDraft() {
    state.filterDraft = {};
    Object.keys(state.activeFilters).forEach((key) => {
      const selected = state.activeFilters[key];
      if (key === "AssignedTo" && selected && Array.isArray(selected.values)) {
        state.filterDraft[key] = selected.values.slice();
        return;
      }
      if (selected) state.filterDraft[key] = Object.assign({}, selected);
    });
  }

  function openFilterModal() {
    copyActiveFiltersToDraft();
    if (ui.filterModalOverlay) ui.filterModalOverlay.hidden = false;
    if (ui.filterToggleBtn) ui.filterToggleBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    renderFilterFields();
    // Dropdown values are fetched lazily on first open (rather than blocking
    // the page's initial summary load) and the fields are re-rendered in
    // place once they resolve, same set of APIs/values Asset Search uses.
    ensureFilterOptionsLoaded().then(() => {
      if (ui.filterModalOverlay && !ui.filterModalOverlay.hidden) renderFilterFields();
    });
  }

  function closeFilterModal() {
    closeAllMultiSelectPanels();
    if (ui.filterModalOverlay) ui.filterModalOverlay.hidden = true;
    if (ui.filterToggleBtn) ui.filterToggleBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function bindFilterModalEvents() {
    if (ui.filterToggleBtn && !ui.filterToggleBtn.__invenFilterBound) {
      ui.filterToggleBtn.__invenFilterBound = true;
      ui.filterToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openFilterModal();
      });
    }
    if (ui.filterCloseBtn && !ui.filterCloseBtn.__invenFilterBound) {
      ui.filterCloseBtn.__invenFilterBound = true;
      ui.filterCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeFilterModal();
      });
    }
    if (ui.filterModalOverlay && !ui.filterModalOverlay.__invenFilterBound) {
      ui.filterModalOverlay.__invenFilterBound = true;
      ui.filterModalOverlay.addEventListener("click", (e) => {
        if (e.target === ui.filterModalOverlay) closeFilterModal();
      });
    }
    if (ui.clearFiltersBtn && !ui.clearFiltersBtn.__invenFilterBound) {
      ui.clearFiltersBtn.__invenFilterBound = true;
      ui.clearFiltersBtn.addEventListener("click", () => {
        state.filterDraft = {};
        state.activeFilters = {};
        renderFilterFields();
        closeFilterModal();
        applyActiveFiltersAndRefresh();
      });
    }
    if (ui.applyFiltersBtn && !ui.applyFiltersBtn.__invenFilterBound) {
      ui.applyFiltersBtn.__invenFilterBound = true;
      ui.applyFiltersBtn.addEventListener("click", () => {
        readFilterDraftFromDom();
        applyFilterDraft();
        closeFilterModal();
        applyActiveFiltersAndRefresh();
      });
    }
    if (!document.__invenFilterOutsideClickBound) {
      document.__invenFilterOutsideClickBound = true;
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".as-filter-select-wrap")) closeAllMultiSelectPanels();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && ui.filterModalOverlay && !ui.filterModalOverlay.hidden) closeFilterModal();
      });
    }
  }

  function bindUiRefs() {
    ui.page = document.querySelector(".inventory-page");
    ui.assetGrid = document.getElementById("assetGrid");
    ui.assetTableView = document.getElementById("assetTableView");
    ui.typeFilterInput = document.getElementById("typeFilter");
    ui.typeFilterList = document.getElementById("typeFilterList");
    ui.typeFilterWrap = ui.typeFilterInput ? ui.typeFilterInput.closest(".qaf-app-picker") : null;
    ui.errorBox = document.getElementById("errorBox");
    ui.tableViewBtn = document.getElementById("tableViewBtn");
    ui.gridViewBtn = document.getElementById("gridViewBtn");
    ui.exportSummaryBtn = document.getElementById("exportSummaryBtn");
    ui.filterToggleBtn = document.getElementById("filterToggleBtn");
    ui.filterModalOverlay = document.getElementById("filterModalOverlay");
    ui.filterCloseBtn = document.getElementById("filterCloseBtn");
    ui.filterFields = document.getElementById("filterFields");
    ui.clearFiltersBtn = document.getElementById("clearFiltersBtn");
    ui.applyFiltersBtn = document.getElementById("applyFiltersBtn");
  }

  function renderTypeFilter() {
    const types = Array.isArray(state.types) ? state.types : [];
    // The empty value is the "no filter" entry, so it doubles as the clear option.
    state.typeFilterOptions = [{ value: "", label: "All Types" }].concat(
      types.map((type) => ({ value: type, label: type }))
    );
    renderTypeFilterOptions("");
    syncTypeFilterInput();
  }

  // Type-to-filter list body. Empty query renders every type.
  function renderTypeFilterOptions(query) {
    if (!ui.typeFilterList) return;
    const needle = String(query || "").trim().toLowerCase();
    const matches = state.typeFilterOptions.filter(
      (option) => !needle || option.label.toLowerCase().includes(needle)
    );
    ui.typeFilterList.innerHTML = matches.length
      ? matches
          .map((option) => {
            const isSelected = option.value === state.selectedType;
            return `<li class="qaf-app-picker__option" role="option" aria-selected="${isSelected}" data-type-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</li>`;
          })
          .join("")
      : '<li class="qaf-app-picker__empty" role="presentation">No types found.</li>';
  }

  // The input mirrors the committed selection; an empty value falls back to the
  // "All Types" placeholder rather than showing a filled-in label.
  function syncTypeFilterInput() {
    if (!ui.typeFilterInput) return;
    ui.typeFilterInput.value = state.selectedType;
  }

  function setTypeFilterOpen(isOpen) {
    if (!ui.typeFilterInput || !ui.typeFilterList) return;
    state.typeFilterOpen = Boolean(isOpen);
    ui.typeFilterInput.setAttribute("aria-expanded", String(state.typeFilterOpen));
    ui.typeFilterList.hidden = !state.typeFilterOpen;
    if (!state.typeFilterOpen) {
      if (state.typeFilterPortal) state.typeFilterPortal.detach();
      // Drop any half-typed filter text so the field always reads as the selection.
      syncTypeFilterInput();
      return;
    }
    renderTypeFilterOptions("");
    if (state.typeFilterPortal) state.typeFilterPortal.attach();
  }

  function applySelectedType(nextType) {
    state.selectedType = String(nextType || "").trim();
    renderFromState();
  }

  function renderCards(cards) {
    if (!ui.assetGrid) return;
    if (!cards.length) {
      ui.assetGrid.innerHTML = '<div class="empty-state">No data found.</div>';
      return;
    }
    const statusColumns = getActiveStatusColumns(cards);
    ui.assetGrid.innerHTML = cards
      .map((card) => {
        const useDefaultIcon = !String(card.iconUrl || "").trim() || Number(card.total || 0) <= 0;
        const iconUrl = getCategoryIconUrl(card.iconUrl, useDefaultIcon);
        const categoryHref = buildAssetDetailsUrl(card);
        const utilPct = computeUtilizationPercent(card.statusMap, card.total);
        const rows = statusColumns
          .map(
            (status) =>
              `<div class="asset-card__row"><span class="asset-card__row-label">${escapeHtml(status)}</span><span class="asset-card__count">${Number(card.statusMap[status] || 0)}</span></div>`
          )
          .join("");
        const iconMarkup = `<img class="asset-card__icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(card.categoryName)} icon" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(DEFAULT_CATEGORY_ICON_URL)}';" />`;
        return `
          <article class="asset-card" data-utilization="${utilPct}" aria-label="${escapeHtml(card.categoryName)} card, utilization ${utilPct}%">
            ${renderCategoryAddButtonMarkup(card, "asset-card__add-btn")}
            <h2 class="asset-card__title"><a class="asset-category-link" href="${escapeHtml(categoryHref)}">${escapeHtml(card.categoryName)} (${card.total})</a></h2>
            <div class="asset-card__body"><div class="asset-card__icon-slot">${iconMarkup}</div><div class="asset-card__stats"><div class="asset-card__stats-inner">${rows}</div></div></div>
            <div class="inven-util" aria-hidden="true"><div class="inven-util__header"><span class="inven-util__title">Utilization</span><span class="inven-util__pct">${utilPct}%</span></div><div class="inven-util-bar"><span class="inven-util-bar__fill" style="width:${utilPct}%;"></span></div></div>
          </article>`;
      })
      .join("");
  }

  function estimateTextWidth(text) {
    return Math.round(String(text || "").length * 8 + 24);
  }

  function estimateTableColumnWidth(column, cards) {
    const key = String(column && column.key ? column.key : "").trim();
    let minWidth = 90;
    if (key === "category") minWidth = 180;
    if (key === "type") minWidth = 110;
    if (key === "grossTotal") minWidth = 100;
    if (key.startsWith("status:")) minWidth = 95;
    const sampleRows = (Array.isArray(cards) ? cards : []).slice(0, 80);
    const widthSamples = [estimateTextWidth(column && column.label ? column.label : "") + 20];
    sampleRows.forEach((card) => {
      const rawText = column && typeof column.getText === "function" ? column.getText(card) : "";
      widthSamples.push(estimateTextWidth(rawText) + 20);
    });
    widthSamples.sort((a, b) => a - b);
    const p90Index = Math.min(widthSamples.length - 1, Math.floor(widthSamples.length * 0.9));
    return Math.max(minWidth, Math.min(key === "category" ? 420 : key === "type" ? 240 : 180, widthSamples[p90Index] || minWidth));
  }

  // Column definitions for the table view. getText is the plain-text form used to
  // size the column; renderCell is its markup. No sort accessor is needed -
  // GridTable sorts on the rendered cell text and compares numbers as numbers.
  function getTableColumns(cards) {
    const statusColumns = getActiveStatusColumns(cards);
    const columns = [
      {
        key: "category",
        label: state.tableHeaderLabels.category || "Category",
        getText: (card) => `${String((card && card.categoryName) || "")} (${Number((card && card.total) || 0)})`,
        renderCell: (card) => {
          const categoryHref = buildAssetDetailsUrl(card);
          const categoryName = String(card && card.categoryName ? card.categoryName : "").trim();
          // "link" is global.css's shared hyperlink style; asset-category-link
          // stays on as this page's own hook.
          return `<span class="asset-table-category-cell">${renderCategoryAddButtonMarkup(card, "asset-table__add-btn")}<a class="asset-category-link link" href="${escapeHtml(categoryHref)}">${escapeHtml(categoryName)} (${Number(card.total || 0)})</a></span>`;
        }
      },
      {
        key: "type",
        label: state.tableHeaderLabels.type || "Type",
        getText: (card) => String((card && card.categoryType) || "-"),
        renderCell: (card) => escapeHtml(card.categoryType || "-")
      }
    ];
    statusColumns.forEach((status) => {
      const key = `status:${normalizeFieldKey(status) || status}`;
      columns.push({
        key,
        label: status,
        getText: (card) => String(Number((card && card.statusMap && card.statusMap[status]) || 0)),
        renderCell: (card) => String(Number((card && card.statusMap && card.statusMap[status]) || 0))
      });
    });
    columns.push({
      key: "grossTotal",
      label: state.tableHeaderLabels.grossTotal || "GrossTotal",
      getText: (card) => String(Number((card && card.total) || 0)),
      renderCell: (card) => String(Number((card && card.total) || 0))
    });
    return columns;
  }

  // If the columns' natural widths don't fill the visible table area (e.g. on first
  // render, or after switching from grid to table view), distribute the leftover
  // space proportionally instead of leaving a blank gap on the right.
  // Returns the widths untouched if the table view is hidden (clientWidth is 0)
  // or the columns already fill/overflow the area.
  function spreadWidthsToFillWidth(widths) {
    if (!ui.assetTableView || !Array.isArray(widths) || !widths.length) return widths;
    // Small safety buffer: rounding pixel widths across many columns can otherwise
    // land 1-2px over the available width and trigger an unwanted scrollbar even
    // though there was "enough space". The extra 2px covers the wrap's borders.
    const availableWidth = ui.assetTableView.clientWidth - 4;
    if (availableWidth <= 0) return widths;
    const totalWidth = widths.reduce((sum, w) => sum + w, 0);
    if (totalWidth >= availableWidth) return widths;
    const extra = availableWidth - totalWidth;
    // Distribute `extra` as whole pixels that always sum to exactly `extra` (never
    // more), instead of rounding each column's share independently.
    const rawShares = widths.map((w) => (w / totalWidth) * extra);
    const finalShares = rawShares.map((share) => Math.floor(share));
    const remainder = extra - finalShares.reduce((sum, share) => sum + share, 0);
    const byFractionDesc = rawShares
      .map((share, index) => ({ index, frac: share - Math.floor(share) }))
      .sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < remainder; i += 1) {
      finalShares[byFractionDesc[i % byFractionDesc.length].index] += 1;
    }
    return widths.map((width, index) => width + finalShares[index]);
  }

  // Sorting, column resizing, the remembered widths and the vertical indicator
  // line drawn while dragging all come from library.js's GridTable, so this page
  // behaves identically to the other grids instead of running its own engine.
  // The estimated widths are handed over as the page's declared layout; GridTable
  // still prefers a width the user has dragged before over the estimate.
  function createTableGridInstance(columns, cards) {
    const table = ui.assetTableView && ui.assetTableView.querySelector(".asset-table");
    if (!table || !window.GridTable || typeof window.GridTable.create !== "function") return null;
    return window.GridTable.create(table, {
      sortable: true,
      resizable: true,
      minWidth: TABLE_COL_MIN_WIDTH,
      maxWidth: TABLE_COL_MAX_WIDTH,
      columnWidths: spreadWidthsToFillWidth(columns.map((column) => estimateTableColumnWidth(column, cards))),
      resizeStorageKey: TABLE_RESIZE_STORAGE_KEY
    });
  }

  // Re-run the fill-the-width pass against the widths currently in the colgroup.
  // Idempotent, so showing the table view repeatedly never keeps growing columns.
  function refreshTableColumnWidths() {
    const table = ui.assetTableView && ui.assetTableView.querySelector(".asset-table");
    if (!table || !window.GridTable) return;
    window.GridTable.applyColumnWidths(table, spreadWidthsToFillWidth(window.GridTable.getColumnWidths(table)));
  }

  function renderTableView(cards) {
    if (!ui.assetTableView) return;
    if (!cards.length) {
      ui.assetTableView.innerHTML = '<div class="empty-state">No data found.</div>';
      return;
    }
    const columns = getTableColumns(cards);
    // GridTable owns the <col> widths, the sort icons and the resize handles, so
    // the markup below only declares the columns and their content.
    const colGroupHtml = columns.map(() => "<col>").join("");
    const headerHtml = columns
      .map((column) => `<th><span class="th-label">${escapeHtml(column.label)}</span></th>`)
      .join("");
    const bodyHtml = cards
      .map((card) => `<tr>${columns.map((column) => `<td>${column.renderCell(card)}</td>`).join("")}</tr>`)
      .join("");
    ui.assetTableView.innerHTML = `<div class="asset-table-wrap qaf-scrollbar-10"><table class="asset-table" aria-label="Asset inventory summary"><colgroup>${colGroupHtml}</colgroup><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
    createTableGridInstance(columns, cards);
  }

  function syncViewModeUi() {
    const isTable = state.viewMode === "table";
    if (ui.assetGrid) {
      ui.assetGrid.hidden = isTable;
      ui.assetGrid.classList.toggle("is-view-hidden", isTable);
    }
    if (ui.assetTableView) {
      ui.assetTableView.hidden = !isTable;
      ui.assetTableView.classList.toggle("is-view-hidden", !isTable);
    }
    if (ui.tableViewBtn) {
      ui.tableViewBtn.classList.toggle("is-active", isTable);
      ui.tableViewBtn.setAttribute("aria-pressed", String(isTable));
    }
    if (ui.gridViewBtn) {
      ui.gridViewBtn.classList.toggle("is-active", !isTable);
      ui.gridViewBtn.setAttribute("aria-pressed", String(!isTable));
    }
  }

  function setViewMode(nextMode) {
    state.viewModeChosen = true;
    state.viewMode = nextMode === "table" ? "table" : "grid";
    syncViewModeUi();
    // The table view is hidden by default (grid loads first), so its first render
    // ran with clientWidth === 0 and couldn't spread columns to fill the width.
    // Re-apply the widths now that it is actually visible - re-rendering instead
    // would throw away the user's current sort.
    if (state.viewMode === "table") refreshTableColumnWidths();
  }

  function renderFromState() {
    renderTypeFilter();
    const cards = getCardsFromSroaRows(state.sroaRows, state.selectedType);
    state.renderedCards = cards;
    renderCards(cards);
    renderTableView(cards);
    syncViewModeUi();
  }

  function toCsvCell(value) {
    return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
  }

  function exportSummaryCsv() {
    const rows = Array.isArray(state.renderedCards) ? state.renderedCards : [];
    const statusColumns = getActiveStatusColumns(rows);
    const headers = [
      state.tableHeaderLabels.category || "Category",
      state.tableHeaderLabels.type || "Type",
      ...statusColumns,
      state.tableHeaderLabels.grossTotal || "GrossTotal"
    ];
    const csvRows = [headers.map(toCsvCell).join(",")];
    rows.forEach((card) => {
      csvRows.push(
        [
          `${card.categoryName || ""} (${Number(card.total || 0)})`,
          card.categoryType || "-",
          ...statusColumns.map((status) => Number(card.statusMap && card.statusMap[status] ? card.statusMap[status] : 0)),
          Number(card.total || 0)
        ]
          .map(toCsvCell)
          .join(",")
      );
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-inventory-summary-${String(state.selectedType || "all-types")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "all-types"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function setBusy(isBusy) {
    if (ui.page) ui.page.setAttribute("aria-busy", String(isBusy));
  }

  function showError(message) {
    if (!ui.errorBox) return;
    ui.errorBox.hidden = false;
    ui.errorBox.textContent = message;
  }

  function clearError() {
    if (!ui.errorBox) return;
    ui.errorBox.hidden = true;
    ui.errorBox.textContent = "";
  }

  // Publishes --ButtonTextColor / --ButtonBackGroundColor from CS_SETTING onto the
  // app host, which is where every themed button on this page reads them from.
  // applySquareButtonInverseTheme also tags the .qaf-btn--square buttons (the
  // toolbar trio) with the inverse modifier, so they render border-and-glyph in
  // the tenant background color on a fill of the tenant text color. The round
  // category add buttons are unaffected by the tagging and keep the normal
  // pairing. applyCsSettingTheme is still tried as the general path for pages
  // where that helper exists; the inverse call is what actually colors the trio.
  //
  // #filterModalOverlay is themed separately, exactly as Asset Search's
  // applyCsSettingButtonTheme() does for its own filter modal: the overlay is
  // a sibling of the app host in the DOM (see AssetInventory.html), not a
  // descendant of it, so the CS_SETTING variables and the .qaf-cs-theme-host
  // class applyCsSettingTheme("#assetInventoryAppHost") stamps would never
  // reach the Clear/Apply Filters buttons inside it otherwise - global.css's
  // .qaf-cs-theme-host .qaf-cs-theme-btn--primary/--secondary rules only match
  // when a .qaf-cs-theme-host ancestor is actually present. Applying it again
  // on the overlay itself is what makes those two buttons pick up the same
  // cs_settings-driven colors (and every other .qaf-cs-theme-btn styling -
  // size, font, padding, radius - already comes from that shared global.css
  // rule, unchanged).
  //
  // window.QafLibrary itself comes from library.js. Asset Search's own
  // <script> order loads library.js before search.js so QafLibrary already
  // exists the moment this runs; this page's script order now matches that.
  // The short retry below is only a safety net in case QafLibrary ever
  // attaches a beat later than the script tag order implies (e.g. a future
  // reordering, or library.js itself deferring its own setup) - without it,
  // a single early miss would silently skip CS_SETTING theming for the whole
  // page, which is exactly the symptom of the background color not coming
  // through.
  let applyCsSettingButtonThemeAttempts = 0;
  function applyCsSettingButtonTheme() {
    const lib = window.QafLibrary;
    if (!lib) {
      if (applyCsSettingButtonThemeAttempts < 50) {
        applyCsSettingButtonThemeAttempts += 1;
        setTimeout(applyCsSettingButtonTheme, 100);
      }
      return;
    }
    if (typeof lib.applyCsSettingTheme === "function") {
      lib.applyCsSettingTheme("#assetInventoryAppHost");
      lib.applyCsSettingTheme("#filterModalOverlay");
    }
    if (typeof lib.applySquareButtonInverseTheme === "function") {
      lib.applySquareButtonInverseTheme("#assetInventoryAppHost");
    }
  }

  function syncPortalLayoutOffsets() {
    const docEl = document.documentElement;
    if (!docEl) return;
    const candidates = ["header", ".topbar", ".app-header", ".navbar", ".mat-toolbar", ".qaf-topbar"];
    let topOffset = 0;
    candidates.forEach((selector) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect && rect.height > 0 && rect.height < 220) topOffset = Math.max(topOffset, Math.round(rect.height));
    });
    docEl.style.setProperty("--portal-topbar-offset", `${topOffset > 0 ? topOffset : 64}px`);
  }

  async function loadAndRender(force) {
    bindUiRefs();
    if (!ui.assetGrid || !ui.assetTableView || !ui.typeFilterInput) return;
    if (state.isLoading) return;
    if (!force && state.lastLoadedAt) return;
    state.isLoading = true;
    setBusy(true);
    clearError();
    const errors = [];

    const [typesResult, sroaResult, iconsResult] = await Promise.allSettled([
      fetchTypesViaSdk(),
      fetchInventorySummaryBySroa(""),
      fetchCategoryIconsViaSdk()
    ]);

    if (typesResult.status === "fulfilled") {
      const { types = [], typeLookupByNormalizedName = {} } = typesResult.value || {};
      state.types = types;
      state.typeLookupByNormalizedName = typeLookupByNormalizedName;
    } else {
      errors.push(`Types: ${formatFetchError(typesResult.reason)}`);
      state.types = [];
      state.typeLookupByNormalizedName = {};
    }

    if (sroaResult.status === "fulfilled") {
      state.sroaRows = Array.isArray(sroaResult.value) ? sroaResult.value : [];
      // Kept aside so "Clear Filters" can restore the complete, unfiltered
      // inventory instantly without another round trip to /api/Sroa.
      state.baseSroaRows = state.sroaRows.slice();
      state.statusColumns = dedupeStatuses(collectItemStatusesInSroaOrder(state.sroaRows));
      rebuildStatusCanonicalMap(state.statusColumns);
    } else {
      errors.push(`Sroa summary: ${formatFetchError(sroaResult.reason)}`);
      state.sroaRows = [];
      state.baseSroaRows = [];
      state.statusColumns = [];
      rebuildStatusCanonicalMap([]);
    }

    if (iconsResult.status === "fulfilled") {
      const { byId = {}, byName = {} } = iconsResult.value || {};
      state.iconUrlByCategoryRecordId = byId;
      state.iconUrlByCategoryName = byName;
    } else {
      state.iconUrlByCategoryRecordId = {};
      state.iconUrlByCategoryName = {};
    }

    if (errors.length) showError(errors.join(" | "));
    state.isLoading = false;
    setBusy(false);
    state.lastLoadedAt = Date.now();
    // A full reload (e.g. after adding a new asset) refetches the unfiltered
    // summary above; if a Funnel Filter is still active, re-apply it now so
    // the on-screen cards keep reflecting the filtered set rather than
    // silently reverting to the full inventory.
    if (hasActiveFilters()) {
      await applyActiveFiltersAndRefresh();
    } else {
      renderFromState();
    }
  }

  // Type filter behavior: open/close, type-to-filter and commit. The floating
  // list is portaled to <body> and closed on outside click/Escape by
  // QafLibrary.Dropdown, so no page-level document listeners are needed.
  function bindTypeFilterEvents() {
    if (!ui.typeFilterInput || !ui.typeFilterList || ui.typeFilterInput.__invenTypeBound) return;
    ui.typeFilterInput.__invenTypeBound = true;

    const dropdown = window.QafLibrary && window.QafLibrary.Dropdown;
    if (dropdown) {
      state.typeFilterPortal = dropdown.createPortal(ui.typeFilterWrap, ui.typeFilterInput, ui.typeFilterList);
      // Once portaled the list is no longer inside the wrap, so both are checked.
      dropdown.registerOutsideClose(
        (target) =>
          Boolean(ui.typeFilterWrap && ui.typeFilterWrap.contains(target)) || ui.typeFilterList.contains(target),
        () => setTypeFilterOpen(false)
      );
    }

    ui.typeFilterInput.addEventListener("pointerdown", () => setTypeFilterOpen(!state.typeFilterOpen));
    ui.typeFilterInput.addEventListener("input", () => {
      if (!state.typeFilterOpen) setTypeFilterOpen(true);
      renderTypeFilterOptions(ui.typeFilterInput.value);
      if (state.typeFilterPortal) state.typeFilterPortal.reposition();
    });
    ui.typeFilterInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setTypeFilterOpen(false);
    });
    ui.typeFilterList.addEventListener("click", (event) => {
      const option = event.target.closest("[data-type-value]");
      if (!option) return;
      setTypeFilterOpen(false);
      applySelectedType(option.getAttribute("data-type-value"));
    });
  }

  function bindEvents() {
    bindUiRefs();
    bindTypeFilterEvents();
    bindFilterModalEvents();
    ui.tableViewBtn?.addEventListener("click", () => setViewMode("table"));
    ui.gridViewBtn?.addEventListener("click", () => setViewMode("grid"));
    ui.exportSummaryBtn?.addEventListener("click", exportSummaryCsv);
    ui.assetGrid?.addEventListener("click", handleCategoryAddClick);
    // Sorting and resizing are GridTable's; only the row-level add button is ours.
    ui.assetTableView?.addEventListener("click", handleCategoryAddClick);
    window.addEventListener("resize", syncPortalLayoutOffsets);
  }

  function boot() {
    bindUiRefs();
    syncPortalLayoutOffsets();
    applyCsSettingButtonTheme();
    bindEvents();
    loadAndRender(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();