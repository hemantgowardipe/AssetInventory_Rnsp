(() => {
  "use strict";

  const MASTER_EDIT_FORM = {
    repository: "EAsset_Master",
    objectId: "deea3ada-225e-44de-a785-2d81a45e9851"
  };
  const DEFAULT_CATEGORY_ICON_URL = "/SmartHR/assets/img/no_Record.png";
  const ASSET_DETAILS_PAGE_URL = "/pages/AssetType";
  // RNSP workflow that now supplies the category-wise summary in place of
  // /api/Sroa. Args are the exact 8 filter keys the workflow expects; every
  // call sends all 8, defaulting unset ones to "All" (see buildRnspArgs()).
  const RNSP_WORKFLOW_NAME = "ASSET_INVENTORY_RNSP";
  const RNSP_FILTER_ALL = "All";
  // Fixed status buckets the RNSP query itself groups into (replacing the
  // dynamic per-tenant ItemStatus list /api/Sroa used to return). Order here
  // is the order columns render in, left to right.
  const RNSP_STATUS_FIELDS = ["Allocated", "InStore", "InRepair", "Dispose", "Other"];
  const RNSP_STATUS_LABELS = {
    Allocated: "Allocated",
    InStore: "In Store",
    InRepair: "In Repair",
    Dispose: "Dispose",
    Other: "Other"
  };
  // Drag limits and the remembered-width key handed to library.js's GridTable,
  // which owns this page's sorting, column resizing and resize indicator line.
  const TABLE_COL_MIN_WIDTH = 90;
  const TABLE_COL_MAX_WIDTH = 520;
  const TABLE_RESIZE_STORAGE_KEY = "asset-inventory-summary";
  const PAGE_ACCESS_NEW_LP = ["11", "22-3", "22-1", "22-2"];
  const ADD_ACCESS_NEW_LP = ["11", "22-3"];

  // --- Import Assets (CSV) ---------------------------------------------
  // Workflow invoked via POST {base_url}/api/rnsp with
  //   { "Name": IMPORT_WORKFLOW_NAME, "Args": { "Category": "<category>", "Records": "<json array string>" } }
  // All field-matching (which CSV columns land in EAsset_Master vs. the
  // category's child table), the SerialNumber-based upsert, AssetID
  // auto-unique number generation, and the child table's ParentRecordID
  // linkage are handled entirely by that workflow's SQL - see the
  // accompanying Import_Asset.sql. This page only parses the CSV, groups
  // rows by Category and sends them in batches of IMPORT_BATCH_SIZE.
  //
  // AssetID is never sent from here: it's an auto-unique field the SQL
  // generates itself (from FieldDefinition.AUFieldCurrentNumber) for
  // brand-new rows only, one fresh batch-sized reservation per call - the
  // CSV has no AssetID column and this page doesn't need to know about it.
  const IMPORT_WORKFLOW_NAME = "Import_Asset";
  const IMPORT_BATCH_SIZE = 200;

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
    applyFiltersBtn: null,
    // Import Assets popup.
    importAssetsBtn: null,
    importModalOverlay: null,
    importCloseBtn: null,
    importCancelBtn: null,
    importSubmitBtn: null,
    importDropzone: null,
    importDropzoneText: null,
    importCsvInput: null,
    importFileInfo: null,
    importErrorMsg: null,
    importProgress: null,
    importProgressFill: null,
    importProgressText: null,
    importSummaryList: null,
    // Infinite scroll - created at runtime (see ensureScrollLoader), no
    // existing markup for these before this change.
    scrollLoaderWrap: null,
    scrollLoaderText: null,
    scrollSentinel: null
  };

  const state = {
    types: [],
    typeLookupByNormalizedName: {},
    selectedType: "",
    viewMode: "grid",
    viewModeChosen: false,
    renderedCards: [],
    inventoryRows: [],
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
    assetManagerOptions: [],
    // Import Assets popup state.
    importParsedRows: null,
    importFileName: "",
    importIsRunning: false,
    // Mirrors the infinite-scroll pager's own state (see createInfinitePager/
    // ensureInventoryPager) for render-time decisions like the empty-state
    // text and the "loading more" indicator. The pager is the source of
    // truth; this is just what the last onState callback reported.
    pager: { isLoading: false, hasMore: true, rowCount: 0 }
  };

  let filterOptionsLoadPromise = null;

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

  /** Same auth/error convention as fetchJson, but for endpoints (like /api/rnsp)
   *  that take a JSON request body instead of query-string params. */
  async function postJson(url, body, signal) {
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body || {}),
      ...(signal ? { signal } : {})
    });
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

  function formatLookupPrefillValue(recordId, label) {
    const id = String(recordId || "").trim();
    const name = String(label || "").trim();
    if (id && name) return `${id};#${name}`;
    if (id) return id;
    return name;
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

  /** Workflow that supplies the Asset Type toolbar dropdown's options,
   *  replacing the previous EAsset_Type SDK call. Fetched lazily on first
   *  open of the Type dropdown (see ensureAssetTypeOptionsLoaded/
   *  setTypeFilterOpen) and cached afterward, same pattern as the Funnel
   *  Filter modal's ASSET_INVENTORY_FILTER-backed dropdowns. */
  const TYPE_FILTER_WORKFLOW_NAME = "ASSET_INVENTORY_TYPE_FILTER";

  async function fetchAssetTypeFilterOptionsViaWorkflow() {
    const payload = { Name: TYPE_FILTER_WORKFLOW_NAME, Args: {} };
    const response = await postJson(buildRnspUrl(), payload);
    // Documented as a plain object { AssetType: [...] } (not array-wrapped,
    // and AssetType already an array rather than a JSON string) - handled
    // defensively in case either ever changes, same as the other workflows.
    const row = Array.isArray(response) ? response[0] || {} : response || {};
    const options = buildFilterOptionsFromWorkflowList(row.AssetType);

    const types = [];
    const typeLookupByNormalizedName = {};
    const seen = new Set();
    options.forEach((opt) => {
      const key = normalizeToken(opt.value);
      if (!key || seen.has(key)) return;
      seen.add(key);
      types.push(opt.value);
      // recordId intentionally empty - see comment above.
      typeLookupByNormalizedName[key] = { recordId: "", name: opt.label };
    });
    types.sort((a, b) => a.localeCompare(b));
    return { types, typeLookupByNormalizedName };
  }

  let assetTypeOptionsLoadPromise = null;

  /** Cached so the workflow is only called once per page load unless it
   *  fails - a failure clears the cache so the next dropdown open retries. */
  function ensureAssetTypeOptionsLoaded() {
    if (assetTypeOptionsLoadPromise) return assetTypeOptionsLoadPromise;
    assetTypeOptionsLoadPromise = fetchAssetTypeFilterOptionsViaWorkflow()
      .then(({ types = [], typeLookupByNormalizedName = {} }) => {
        state.types = types;
        state.typeLookupByNormalizedName = typeLookupByNormalizedName;
      })
      .catch((error) => {
        assetTypeOptionsLoadPromise = null;
        throw error;
      });
    return assetTypeOptionsLoadPromise;
  }

  /** Fire-and-forget kickoff of the Type list on initial page load, same
   *  timing as demo.js's fetchTypesViaSdk (which is awaited up front in
   *  loadAndRender there). Here the Type dropdown lazily calls
   *  ensureAssetTypeOptionsLoaded() itself and this just starts that same
   *  cached promise early, so state.types/typeLookupByNormalizedName are
   *  populated before the user can click a category's Add button - without
   *  this, resolveTypeLabelAndIdForPrefill's isKnownTypeLabel check sees an
   *  empty state.types and strips a perfectly valid Type value that RNSP
   *  already returned, so the new-asset form's Type field opened blank. */
  function prefetchAssetTypeOptions() {
    ensureAssetTypeOptionsLoaded().catch(() => {
      // Swallowed: the Type filter dropdown and the Add-button prefill both
      // retry this on their own (assetTypeOptionsLoadPromise is cleared on
      // failure above), so a failed prefetch just means Type won't
      // autopopulate until one of those retries succeeds.
    });
  }

  /** RecordID (or plain choice text for ItemStatus) of a single-select active
   *  filter, or RNSP_FILTER_ALL when that filter isn't set. Mirrors the old
   *  getSelectedLookupRecordId, but for building RNSP Args instead of a
   *  where-clause. */
  function activeFilterArgValue(key) {
    const selected = state.activeFilters[key];
    const value = toText(selected && selected.value);
    return value || RNSP_FILTER_ALL;
  }

  /** "Currently Assigned" is multi-select in the UI but RNSP's documented
   *  AssignedToFilter takes a single value. Until confirmed otherwise, this
   *  sends every selected employee's RecordID as a comma-separated list -
   *  double check the SQL side actually parses a CSV list here. */
  function activeAssignedToArgValue() {
    const selected = state.activeFilters.AssignedTo;
    const values = selected && Array.isArray(selected.values) ? selected.values : [];
    const ids = values.map((emp) => toText(emp && emp.value)).filter(Boolean);
    return ids.length ? ids.join(",") : RNSP_FILTER_ALL;
  }

  /** Selected Type (toolbar dropdown, dynamically populated from
   *  ASSET_INVENTORY_TYPE_FILTER by ensureAssetTypeOptionsLoaded - not the
   *  Funnel Filter modal). Its option value is already the plain Value the
   *  workflow returned (see renderTypeFilter), and that's exactly what
   *  AssetTypeFilter expects - the same plain text/code shape every other
   *  RNSP filter arg uses (see buildRnspArgs), not a RecordID. */
  function activeAssetTypeArgValue() {
    const label = String(state.selectedType || "").trim();
    return label || RNSP_FILTER_ALL;
  }

  /** Builds the exact 8-key Args object ASSET_INVENTORY_RNSP expects, from
   *  whatever combination of the Type dropdown and Funnel Filter modal is
   *  currently active. Every key is always sent, defaulting to "All" - the
   *  workflow is not sent a partial arg set. */
  function buildRnspArgs(pageNumber, pageSize) {
    return {
      CategoryFilter: activeFilterArgValue("Category"),
      AssetTypeFilter: activeAssetTypeArgValue(),
      LocationFilter: activeFilterArgValue("Location"),
      DepartmentFilter: activeFilterArgValue("Department"),
      VendorFilter: activeFilterArgValue("VendorID"),
      AssignedToFilter: activeAssignedToArgValue(),
      AssetManagerFilter: activeFilterArgValue("AssetManager"),
      ItemStatusFilter: activeFilterArgValue("ItemStatus"),
      PageNumber: String(pageNumber),
      PageSize: String(pageSize)
    };
  }

  function buildRnspUrl() {
    return `${API_BASE_URL}/api/rnsp`;
  }

  /** The RNSP response may come back as a bare array, or wrapped in
   *  data/result/Records - inspect and normalize before use. */
  function normalizeAssetInventoryResponse(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && Array.isArray(response.result)) return response.result;
    if (response && Array.isArray(response.Records)) return response.Records;
    return [];
  }

  /** RNSP's paginated response is two result sets: [rows[], [{TotalRecords}]].
   *  Each set is run through normalizeAssetInventoryResponse individually,
   *  in case either ever comes wrapped in data/result/Records rather than as
   *  a bare array - same defensiveness as before, just applied per-set now
   *  that there are two of them instead of one. */
  /** Unwraps a response that might be the result-set data directly, or
   *  wrapped one level in data/result/Records/{Table1,Table2} - the same
   *  wrapper variations normalizeAssetInventoryResponse already tolerates
   *  for a single result set. */
  function unwrapRnspResultSets(response) {
    if (Array.isArray(response)) return response;
    if (response && typeof response === "object") {
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.result)) return response.result;
      if (Array.isArray(response.Records)) return response.Records;
      if (Array.isArray(response.Table1) || Array.isArray(response.Table2)) {
        return [response.Table1 || [], response.Table2 || []];
      }
    }
    return [];
  }

  /** Reads a TotalRecords-style count off a payload or row, tolerant of the
   *  exact casing the backend uses (TotalRecords / TotalRecord / TotalCount /
   *  Total) - matches ASSET_REQUISITION_TABLE's own extractCountValue on
   *  this same platform, since stored procedures here don't all expose it
   *  the same way. */
  function extractTotalRecordsValue(source) {
    if (!source || typeof source !== "object") return null;
    const aliases = ["totalrecords", "totalrecord", "totalcount", "total"];
    const keys = Object.keys(source);
    for (let i = 0; i < aliases.length; i += 1) {
      const matchKey = keys.find((k) => k.toLowerCase() === aliases[i]);
      if (matchKey == null) continue;
      const value = source[matchKey];
      if (value === "" || value == null) continue;
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
    return null;
  }

  /** ASSET_INVENTORY_RNSP's paginated response can arrive as either of two
   *  shapes this platform uses for paginated rnsp workflows:
   *   A) [ rows[], [{TotalRecords}] ]  - two nested result-set arrays, as
   *      originally documented for this workflow.
   *   B) [ {...row}, {...row}, ... ]   - a single flat array of row objects,
   *      each possibly carrying its own TotalRecords-style column (a
   *      COUNT(*) OVER() pattern) - the shape ASSET_REQUISITION_TABLE, a
   *      sibling paginated workflow on this same backend, actually uses.
   *  Telling them apart is unambiguous: in (A) the first element is itself
   *  an array (a table); in (B) it's a row object. */
  function parseRnspPaginatedResponse(response) {
    const resultSets = unwrapRnspResultSets(response);
    const firstElement = resultSets[0];
    const isNestedResultSets = Array.isArray(firstElement);

    const rawRows = isNestedResultSets ? firstElement : resultSets;
    const rawTotals = isNestedResultSets ? resultSets[1] : null;

    const rows = normalizeAssetInventoryResponse(rawRows);
    const totalsSet = normalizeAssetInventoryResponse(rawTotals);

    let totalRecords = extractTotalRecordsValue(totalsSet[0]);
    if (totalRecords == null && response && typeof response === "object" && !Array.isArray(response)) {
      // A top-level field on the response itself, in case it wasn't nested
      // in a result set or attached per-row at all.
      totalRecords = extractTotalRecordsValue(response);
    }
    if (totalRecords == null && rows.length) {
      // Shape (B): attached to each row via COUNT(*) OVER().
      totalRecords = extractTotalRecordsValue(rows[0]);
    }
    // If no explicit total was found anywhere, report 0 rather than
    // guessing rows.length - that would make hasMore's math
    // (page * pageSize < totalRecords) see e.g. 20 < 20 and stop after the
    // very first page even when more records genuinely exist. Returning 0
    // here instead lets createInfinitePager fall back to its own row-count
    // heuristic (a full page came back, so assume there's more) correctly.
    return { rows, totalRecords: totalRecords == null ? 0 : Number(totalRecords) || 0 };
  }

  /** Calls ASSET_INVENTORY_RNSP with the current filter/pagination state and
   *  returns { rows, totalRecords } - rows being the normalized array of
   *  {Category, Icon, Allocated, InStore, InRepair, Dispose, Other,
   *  GrossTotal, CategoryRecordID, TypeRecordID, AssetType} rows for the
   *  current page, totalRecords being the pre-pagination category count.
   *  All filtering (Type included) happens in the SQL behind this workflow,
   *  so no client-side re-filtering is applied to what comes back. */
  /** fetchPage callback for the infinite-scroll pager (see
   *  createInfinitePager/ensureInventoryPager below): calls
   *  ASSET_INVENTORY_RNSP for one page of the current filter combination and
   *  returns { rows, totalRecords }. The pager itself handles aborting a
   *  superseded call and ignoring a late response - this function just makes
   *  the request. */
  async function fetchAssetInventoryPage(page, pageSize, signal) {
    const args = buildRnspArgs(page, pageSize);
    const payload = { Name: RNSP_WORKFLOW_NAME, Args: args };
    const response = await postJson(buildRnspUrl(), payload, signal);
    const result = parseRnspPaginatedResponse(response);
    if (!result.rows.length) {
      // Either RNSP genuinely returned nothing for this page/filter
      // combination, or the response came back in a shape
      // parseRnspPaginatedResponse doesn't recognize yet - logging the raw
      // response here makes it possible to tell those apart from the
      // browser console/Network tab without guessing blind.
      console.warn("[Asset Inventory] ASSET_INVENTORY_RNSP returned zero rows for page", page, "- raw response:", response);
    }
    return result;
  }

  /** Generic infinite-scroll engine, decoupled from this page's data source
   *  via the fetchPage(page, pageSize, signal) => Promise<{rows,
   *  totalRecords?}> callback. Tracks its own page/accumulated-rows/hasMore/
   *  isLoading state; exposes loadNext/reset/connect/disconnect/destroy/
   *  getState. Only one instance is used on this page (ensureInventoryPager),
   *  since there's a single active filter combination at a time here rather
   *  than several simultaneously-cached filter "buckets" sharing one scroll
   *  surface - reset() is called instead of switching between pager
   *  instances whenever the filters change. */
  /**
   * Local fallback implementations of the scroll/pagination helpers this page
   * needs (createScrollableTable, createInfinitePager). Ported from the
   * Asset Requisition page's own proven ReqPagerFallback, adapted for a
   * grid/table dual view rather than a single table. getPagerFn() below
   * prefers window.QafLibrary's implementation when the shared library
   * already provides one, and only falls back to this local copy otherwise -
   * same pattern Asset Requisition uses, so this page benefits from a more
   * tested shared implementation if one is available rather than always
   * re-inventing its own.
   */
  const AssetInventoryPagerFallback = (function () {
    function resolveElementRef(target) {
      if (!target) return null;
      if (typeof target === "string") return document.querySelector(target);
      if (target && target.nodeType === 1) return target;
      return null;
    }

    function getViewportHeight() {
      return window.innerHeight || document.documentElement.clientHeight || 0;
    }

    const SCROLLABLE_DEFAULT_MIN_HEIGHT = 420;
    const SCROLLABLE_DEFAULT_BOTTOM_GAP = 24;
    const SCROLLABLE_CLASS = "table-wrap--scrollable";
    const SCROLLABLE_LEGACY_CLASS = "qaf-scrollable-table-wrap";

    /** Viewport height minus the container's own top offset minus a bottom
     *  gap, floored at minHeight - gives a container a genuine, explicit
     *  scrollable height regardless of how little content has loaded so far
     *  (which window-level scrolling can't guarantee: if the page is
     *  shorter than the viewport there's nothing to scroll at all). */
    function calcViewportAvailableHeight(options) {
      const config = options || {};
      const anchor = resolveElementRef(config.anchor || config.element);
      let top = Number.isFinite(Number(config.offsetTop)) ? Number(config.offsetTop) : 0;
      if (anchor) top = anchor.getBoundingClientRect().top;

      const bottomGap = Number.isFinite(Number(config.bottomGap)) && Number(config.bottomGap) >= 0
        ? Number(config.bottomGap)
        : SCROLLABLE_DEFAULT_BOTTOM_GAP;
      const minHeight = Number.isFinite(Number(config.minHeight)) && Number(config.minHeight) > 0
        ? Number(config.minHeight)
        : SCROLLABLE_DEFAULT_MIN_HEIGHT;
      const maxHeight = Number(config.maxHeight);

      let available = getViewportHeight() - top - bottomGap;
      if (Number.isFinite(maxHeight) && maxHeight > 0) available = Math.min(available, maxHeight);
      return Math.max(minHeight, Math.floor(available));
    }

    function isWindowScrollContainer(container) {
      return !container || container === window || container === document || container === document.documentElement;
    }

    /** Shared "close enough to the bottom to load more" check for both the
     *  window and an element-scrolled container, used by the plain
     *  scroll-event fallback (the IntersectionObserver is the primary
     *  mechanism when available - see createInfinitePager below). */
    function isContainerNearBottom(container, offsetPx) {
      let offset = Number(offsetPx);
      if (!Number.isFinite(offset) || offset < 0) offset = 180;

      if (isWindowScrollContainer(container)) {
        const docEl = document.documentElement;
        if (!docEl) return false;
        const viewportBottom = (window.scrollY || window.pageYOffset || 0) + getViewportHeight();
        return viewportBottom >= docEl.scrollHeight - offset;
      }

      const el = resolveElementRef(container);
      if (!el) return false;
      const scrollTop = el.scrollTop || 0;
      const clientHeight = el.clientHeight || 0;
      const scrollHeight = el.scrollHeight || 0;
      if (scrollHeight <= clientHeight + 1) return false; // nothing to scroll yet
      return scrollTop + clientHeight >= scrollHeight - offset;
    }

    function applyScrollableClasses(container) {
      if (!container) return;
      container.classList.add(SCROLLABLE_CLASS, SCROLLABLE_LEGACY_CLASS);
    }

    function removeScrollableClasses(container) {
      if (!container) return;
      container.classList.remove(SCROLLABLE_CLASS, SCROLLABLE_LEGACY_CLASS);
    }

    /** Gives `container` an explicit, viewport-relative height and
     *  overflow-y so it's a genuine scrollable region regardless of how
     *  much content has loaded, keeps that height in sync on resize, and
     *  (optionally) wires a plain scroll-event fallback via onNearBottom -
     *  the same createScrollableTable Asset Requisition already relies on,
     *  generalized here to not require an actual <table> inside (this page
     *  wraps a grid/table dual view instead of a single table). */
    function createScrollableTable(options) {
      const config = options || {};
      const container = resolveElementRef(config.container || config.wrap || config.element);
      if (!container) throw new Error("createScrollableTable requires a container element or selector.");

      applyScrollableClasses(container);
      // overflow-y is forced inline rather than left to the CSS class alone,
      // since this page's own stylesheet may not define that class - the
      // class names are applied too in case the shared global.css already
      // styles them (same convention Asset Requisition uses), but the
      // scrolling behavior itself must not depend on that.
      container.style.overflowY = "auto";
      container.style.overflowX = container.style.overflowX || "hidden";

      let unbindHeightRefresh = null;

      function applyHeight() {
        const nextHeight = calcViewportAvailableHeight({
          anchor: config.anchor || container,
          offsetTop: config.offsetTop,
          bottomGap: config.bottomGap,
          minHeight: config.minHeight,
          maxHeight: config.maxHeight
        });
        const heightPx = `${nextHeight}px`;
        container.style.height = heightPx;
        container.style.maxHeight = heightPx;
        return nextHeight;
      }

      function bindHeightRefresh() {
        if (unbindHeightRefresh) return;
        const refresh = () => applyHeight();
        window.addEventListener("resize", refresh, { passive: true });
        unbindHeightRefresh = () => window.removeEventListener("resize", refresh);
        if (typeof ResizeObserver === "function") {
          const observer = new ResizeObserver(refresh);
          if (container.parentElement) observer.observe(container.parentElement);
          const previousUnbind = unbindHeightRefresh;
          unbindHeightRefresh = () => {
            previousUnbind();
            observer.disconnect();
          };
        }
      }

      bindHeightRefresh();
      applyHeight();

      let scrollHandler = null;
      if (typeof config.onNearBottom === "function") {
        const offsetPx = config.loadMoreOffsetPx || config.offsetPx;
        const onNearBottom = config.onNearBottom;
        let bound = false;
        const check = () => {
          if (isContainerNearBottom(container, offsetPx)) onNearBottom();
        };
        scrollHandler = {
          connect: () => {
            if (bound) return;
            container.addEventListener("scroll", check, { passive: true });
            bound = true;
          },
          disconnect: () => {
            if (!bound) return;
            container.removeEventListener("scroll", check);
            bound = false;
          },
          check
        };
        scrollHandler.connect();
      }

      return {
        container,
        getScrollContainer: () => container,
        refresh: () => applyHeight(),
        checkScroll: () => {
          if (scrollHandler) scrollHandler.check();
        },
        destroy: () => {
          if (scrollHandler) scrollHandler.disconnect();
          if (unbindHeightRefresh) unbindHeightRefresh();
          removeScrollableClasses(container);
          container.style.height = "";
          container.style.maxHeight = "";
          container.style.overflowY = "";
        }
      };
    }

    /** Generic infinite-scroll engine, decoupled from this page's data
     *  source via the fetchPage(page, pageSize, signal) => Promise<{rows,
     *  totalRecords?}> callback. Tracks its own page/accumulated-rows/
     *  hasMore/isLoading state; exposes loadNext/reset/connect/disconnect/
     *  destroy/getState. */
    function createInfinitePager(options) {
      const opts = options || {};
      const pageSize = Number(opts.pageSize) || 20;
      const loadMoreOffsetPx = Number(opts.loadMoreOffsetPx) || 200;
      const rootMargin = String(opts.rootMargin || `${loadMoreOffsetPx}px 0px`);
      const fetchPage = opts.fetchPage;
      const dedupeBy = typeof opts.dedupeBy === "function" ? opts.dedupeBy : null;
      const onRows = typeof opts.onRows === "function" ? opts.onRows : function () {};
      const onError = typeof opts.onError === "function" ? opts.onError : function () {};
      const onState = typeof opts.onState === "function" ? opts.onState : function () {};

      let page = 1;
      let rows = [];
      let hasMore = true;
      let isLoading = false;
      let totalRecords = 0;
      let requestToken = 0;
      let abortController = null;
      let sentinelObserver = null;
      let scrollContainer = opts.scrollContainer || window;
      let connected = false;

      function emitState() {
        onState({ isLoading, hasMore, page, totalRecords, rowCount: rows.length });
      }

      function appendUnique(existingRows, incomingRows) {
        if (!dedupeBy) return existingRows.concat(incomingRows);
        const seen = new Set(existingRows.map(dedupeBy));
        const merged = existingRows.slice();
        incomingRows.forEach((row) => {
          const key = dedupeBy(row);
          if (key != null && seen.has(key)) return;
          if (key != null) seen.add(key);
          merged.push(row);
        });
        return merged;
      }

      async function loadNext() {
        if (isLoading || !hasMore) return; // guard against overlapping/duplicate fetches
        isLoading = true;
        emitState();
        if (abortController) abortController.abort();
        abortController = new AbortController();
        const token = ++requestToken;
        try {
          const result = await fetchPage(page, pageSize, abortController.signal);
          if (token !== requestToken) return; // a newer reset/loadNext superseded this one
          const newRows = (result && result.rows) || [];
          totalRecords = Number(result && result.totalRecords) || totalRecords;
          rows = appendUnique(rows, newRows);
          // Exact when the workflow returns TotalRecords; falls back to the
          // "got a full page, assume there's more" heuristic otherwise.
          hasMore = totalRecords > 0 ? page * pageSize < totalRecords : newRows.length >= pageSize;
          if (hasMore) page += 1;
          onRows(rows.slice(), { totalRecords, hasMore, page });
        } catch (error) {
          if (error && error.name === "AbortError") return;
          onError(error);
        } finally {
          if (token === requestToken) {
            isLoading = false;
            emitState();
          }
        }
      }

      /** Used whenever the underlying query changes (a filter switch, or a
       *  forced data refresh): clears rows, resets to page 1, sets hasMore
       *  true, and (by default) immediately fetches page 1 again. */
      function reset(resetOptions) {
        const ro = resetOptions || {};
        if (abortController) abortController.abort();
        requestToken += 1; // invalidate any in-flight response so it can't land after this reset
        page = 1;
        rows = [];
        hasMore = true;
        totalRecords = 0;
        isLoading = false;
        onRows(rows.slice(), { totalRecords, hasMore, page });
        emitState();
        if (ro.autoLoad !== false) loadNext();
      }

      function onScrollCheck() {
        if (!hasMore || isLoading) return;
        if (isContainerNearBottom(scrollContainer, loadMoreOffsetPx)) loadNext();
      }

      /** Attaches an IntersectionObserver on opts.sentinel when available
       *  (the primary, more efficient mechanism - fires as soon as the
       *  sentinel is within rootMargin of the container's viewport, which
       *  is what makes the very first page auto-load without requiring an
       *  actual scroll if the sentinel starts out visible), plus a plain
       *  scroll-event listener on the scroll container as a fallback. */
      function connect() {
        disconnect();
        if (opts.sentinel && "IntersectionObserver" in window) {
          const root = isWindowScrollContainer(scrollContainer) ? null : resolveElementRef(scrollContainer);
          sentinelObserver = new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) loadNext();
            },
            { root, rootMargin, threshold: 0 }
          );
          sentinelObserver.observe(opts.sentinel);
        }
        if (scrollContainer && typeof scrollContainer.addEventListener === "function") {
          scrollContainer.addEventListener("scroll", onScrollCheck, { passive: true });
        }
        connected = true;
      }

      function disconnect() {
        if (sentinelObserver) {
          sentinelObserver.disconnect();
          sentinelObserver = null;
        }
        if (scrollContainer && typeof scrollContainer.removeEventListener === "function") {
          scrollContainer.removeEventListener("scroll", onScrollCheck);
        }
        connected = false;
      }

      function destroy() {
        disconnect();
        if (abortController) abortController.abort();
      }

      function getState() {
        return { page, pageSize, rows: rows.slice(), hasMore, isLoading, totalRecords };
      }

      return {
        loadNext,
        reset,
        connect,
        disconnect,
        destroy,
        getState,
        setScrollContainer: (nextContainer) => {
          const shouldReconnect = connected;
          disconnect();
          scrollContainer = nextContainer || window;
          if (shouldReconnect) connect();
        }
      };
    }

    return { createScrollableTable, createInfinitePager };
  })();

  /** Prefers window.QafLibrary's implementation of a given pager helper;
   *  falls back to the local copy above only when the shared library
   *  doesn't expose that function yet - same pattern Asset Requisition
   *  uses, so this page benefits from a shared, more tested implementation
   *  if one becomes available without needing its own code to change. */
  function getPagerFn(name) {
    if (window.QafLibrary && typeof window.QafLibrary[name] === "function") {
      return window.QafLibrary[name];
    }
    return AssetInventoryPagerFallback[name];
  }

  /** The status columns are now fixed (RNSP_STATUS_FIELDS/LABELS) rather than
   *  discovered per-tenant from the data, since the SQL behind RNSP already
   *  groups every ItemStatus value into these 5 buckets and only returns the
   *  bucket totals - see "Do Not Add Client-Side Count Logic" in the RNSP
   *  integration doc. Kept as a function (not a bare constant reference) so
   *  every existing call site (getActiveStatusColumns, table/CSV headers)
   *  keeps working unchanged. */
  function getFixedRnspStatusColumns() {
    return RNSP_STATUS_FIELDS.map((field) => RNSP_STATUS_LABELS[field] || field);
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
    // RNSP folds "Disposed" and "Send for Disposal" into a single "Dispose"
    // bucket - see RNSP_STATUS_FIELDS. Both old labels are still accepted
    // here so nothing regresses if a caller ever passes a pre-RNSP statusMap.
    const disposed = sumStatusMapValuesForTokens(statusMap, ["Dispose", "Disposed", "Send for Disposal", "Send For Disposal"]);
    const totalActive = Math.max(0, Number(total || 0) - disposed);
    if (totalActive <= 0) return 0;
    const pct = (allocated / totalActive) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  /** Builds this page's card objects directly from RNSP's fixed-column rows.
   *  All filtering (Category, Location, Department, Vendor, AssignedTo,
   *  AssetManager, ItemStatus, and Type) already happened server-side via
   *  Args, so - per the integration doc - nothing here re-filters or
   *  re-aggregates; it only reshapes each row into what renderCards/
   *  renderTableView/exportSummaryCsv already expect. */
  function getCardsFromRnspRows(rnspRows) {
    const cards = [];
    const seen = new Set();
    (Array.isArray(rnspRows) ? rnspRows : []).forEach((row) => {
      const flat = row && typeof row === "object" && !Array.isArray(row) ? row : flattenRecord(row);
      const categoryName = String(flat.Category || "").trim();
      if (!categoryName) return;
      const nameKey = normalizeToken(categoryName);
      if (seen.has(nameKey)) return; // RNSP already groups by Category; a repeat would be a duplicate row.
      seen.add(nameKey);

      const statusMap = {};
      RNSP_STATUS_FIELDS.forEach((field) => {
        const label = RNSP_STATUS_LABELS[field] || field;
        statusMap[label] = Number(flat[field] || 0);
      });
      const derivedTotal = RNSP_STATUS_FIELDS.reduce((sum, field) => sum + Number(flat[field] || 0), 0);
      const total = flat.GrossTotal != null && flat.GrossTotal !== "" ? Number(flat.GrossTotal) || 0 : derivedTotal;
      // RNSP returns a row for every category regardless of whether any
      // assets actually match the current filter combination - an all-zero
      // row (every status count and GrossTotal at 0) means there's nothing
      // to show for this category under the active filters, so it's
      // trimmed here rather than rendering an empty "0" card.
      // An all-zero row only means "nothing matches the current filter" -
      // it's not noise in the fully default view (no Type, no Funnel
      // Filter active), where a category genuinely having zero assets right
      // now is real information worth showing. Only trimmed once some
      // filter has actually narrowed the view.
      if (total <= 0 && isAnyInventoryFilterActive()) return;

      // CategoryRecordID/TypeRecordID now come straight from RNSP - no more
      // side lookup against EAsset_Category needed for these.
      const categoryId = String(flat.CategoryRecordID || "").trim();

      // RNSP now returns the Type's RecordID and its display label (AssetType)
      // both - use AssetType exactly as received, never derived from Category.
      const typeRecordId = String(flat.TypeRecordID || "").trim();
      const categoryType = String(flat.AssetType || "").trim();

      // Icon now comes solely from RNSP's own Icon field - no more fallback
      // to a side EAsset_Category lookup.
      const iconUrl = parseIconReference(flat.Icon).directUrl;

      cards.push({
        recordId: categoryId,
        categoryName,
        categoryType,
        typeRecordId,
        iconUrl,
        total,
        statusMap
      });
    });
    return cards.sort((a, b) => {
      const totalDiff = Number(b.total || 0) - Number(a.total || 0);
      if (totalDiff !== 0) return totalDiff;
      return String(a.categoryName || "").localeCompare(String(b.categoryName || ""));
    });
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

  /** URL label segment: spaces â†’ underscores (decoded on asset-details). */
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
   * Funnel Filter - modal markup/interaction, draft/apply/clear, and (below,
   * see loadFilterOptionsFromWorkflow) fetching every dropdown's option list
   * from the ASSET_INVENTORY_FILTER workflow. Originally ported from Asset
   * Search's search.js with its own per-field GetRecordsForFields/
   * permission-chain lookups; those were replaced by the single workflow
   * call once ASSET_INVENTORY_FILTER became available.
   * ---------------------------------------------------------------------
   */

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

  function hasActiveFilters() {
    return Object.keys(state.activeFilters).length > 0;
  }

  /** True once ANY filter has narrowed the view - the Type toolbar dropdown
   *  (state.selectedType, blank = "All Types") or any Funnel Filter modal
   *  field (state.activeFilters). Used to decide whether an all-zero row
   *  from RNSP is real information (nothing selected, category genuinely
   *  empty) or noise (some filter is active and this category just has no
   *  matches under it) - see getCardsFromRnspRows. */
  function isAnyInventoryFilterActive() {
    if (String(state.selectedType || "").trim()) return true;
    return hasActiveFilters();
  }

  /** Name of the workflow that supplies every Funnel Filter dropdown's
   *  option list in one call, replacing the old per-field GetRecordsForFields/
   *  ObjectGet/permission-chain lookups below. Uses the same /api/rnsp
   *  endpoint and Name/Args envelope as ASSET_INVENTORY_RNSP - the two
   *  workflows are never combined into one call, per the integration doc. */
  const FILTER_WORKFLOW_NAME = "ASSET_INVENTORY_FILTER";

  /** Each of the workflow's 8 response properties (Category, AssetType,
   *  Location, Department, Vendor, AssignedTo, AssetManager, ItemStatus) is
   *  itself a JSON string encoding an array of {Value, Label} pairs - parse
   *  per-property, not the whole response as one nested object. Null, empty,
   *  or invalid JSON for any property yields an empty list for that dropdown
   *  rather than failing the whole load. */
  function parseFilterWorkflowOptionListJson(raw) {
    if (raw == null || raw === "") return [];
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (_error) {
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  }

  /** Maps a workflow property's parsed {Value, Label} pairs onto this page's
   *  existing filter-option shape. Value is what gets sent back to RNSP
   *  (already the exact string RNSP expects - a name/code for Category/
   *  Location/Department/Vendor/ItemStatus, a GUID for AssignedTo/
   *  AssetManager), Label is only ever shown in the dropdown. */
  function buildFilterOptionsFromWorkflowList(raw) {
    const rows = parseFilterWorkflowOptionListJson(raw);
    const seen = new Set();
    const options = [];
    rows.forEach((row) => {
      const value = toText(row && (row.Value != null ? row.Value : row.value));
      if (!value) return;
      const label = toText(row && (row.Label != null ? row.Label : row.label)) || value;
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ value, label, queryValue: value, queryCandidates: [value, label] });
    });
    options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    return options;
  }

  /** Calls ASSET_INVENTORY_FILTER and returns its single response row (the
   *  workflow always returns a one-element array), or {} if the response was
   *  empty/unparseable so every buildFilterOptionsFromWorkflowList() call
   *  below still degrades to an empty list instead of throwing. */
  async function fetchFilterWorkflowRow() {
    const payload = { Name: FILTER_WORKFLOW_NAME, Args: {} };
    const response = await postJson(buildRnspUrl(), payload);
    const rows = normalizeAssetInventoryResponse(response);
    return (rows && rows[0]) || {};
  }

  /** One call populates every Funnel Filter dropdown's option list (Type's
   *  own toolbar dropdown is intentionally not sourced from here - see the
   *  scoping note where this was introduced). */
  async function loadFilterOptionsFromWorkflow() {
    const row = await fetchFilterWorkflowRow();
    state.categoryFilterOptions = buildFilterOptionsFromWorkflowList(row.Category);
    state.locationFilterOptions = buildFilterOptionsFromWorkflowList(row.Location);
    state.departmentFilterOptions = buildFilterOptionsFromWorkflowList(row.Department);
    state.vendorFilterOptions = buildFilterOptionsFromWorkflowList(row.Vendor);
    state.itemStatusFilterOptions = buildFilterOptionsFromWorkflowList(row.ItemStatus);
    state.employeeOptions = buildFilterOptionsFromWorkflowList(row.AssignedTo);
    state.assetManagerOptions = buildFilterOptionsFromWorkflowList(row.AssetManager);
  }

  /** Cached so the workflow is only called once per page load unless it
   *  fails - a failure clears the cache so the next modal open retries
   *  rather than being stuck on a permanently-rejected promise. */
  function ensureFilterOptionsLoaded() {
    if (filterOptionsLoadPromise) return filterOptionsLoadPromise;
    filterOptionsLoadPromise = loadFilterOptionsFromWorkflow().catch((error) => {
      filterOptionsLoadPromise = null;
      throw error;
    });
    return filterOptionsLoadPromise;
  }

  /** Re-fetches the inventory summary from RNSP with whatever combination of
   *  the Type dropdown and Funnel Filter modal is currently active (every
   *  Args key always sent, unset ones defaulting to "All" - see
   *  buildRnspArgs), then re-renders. Used for the Type dropdown, Apply
   *  Filters and Clear Filters alike, since RNSP is now the single source of
   *  truth for both the unfiltered and any filtered view - there's no cached
   *  "unfiltered baseline" to instantly restore from anymore, so Clear
   *  Filters costs one more round trip than it used to. */
  /** Clears accumulated rows, goes back to page 1, and refetches - used at
   *  every point that changes which assets should be shown (Clear Filters,
   *  Apply Filters, Type dropdown). Replaces the old click-pagination
   *  applyActiveFiltersAndRefresh - the pager's own onRows/onState/onError
   *  (set up in ensureInventoryPager) now do what that function used to do
   *  by hand. */
  function resetInventoryPager() {
    ensureInventoryPager().reset({ autoLoad: true });
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
    // place once they resolve. setBusy/showError reuse the same loading and
    // error UI the main dashboard fetch uses - no new UI for this.
    setBusy(true);
    ensureFilterOptionsLoaded()
      .then(() => {
        setBusy(false);
        if (ui.filterModalOverlay && !ui.filterModalOverlay.hidden) renderFilterFields();
      })
      .catch((error) => {
        setBusy(false);
        showError(`Unable to load filter options. ${formatFetchError(error)}`);
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
        resetInventoryPager();
      });
    }
    if (ui.applyFiltersBtn && !ui.applyFiltersBtn.__invenFilterBound) {
      ui.applyFiltersBtn.__invenFilterBound = true;
      ui.applyFiltersBtn.addEventListener("click", () => {
        readFilterDraftFromDom();
        applyFilterDraft();
        closeFilterModal();
        resetInventoryPager();
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

    // Import Assets modal
    ui.importAssetsBtn = document.getElementById("importAssetsBtn");
    ui.importModalOverlay = document.getElementById("importModalOverlay");
    ui.importCloseBtn = document.getElementById("importCloseBtn");
    ui.importCancelBtn = document.getElementById("importCancelBtn");
    ui.importSubmitBtn = document.getElementById("importSubmitBtn");
    ui.importDropzone = document.getElementById("importDropzone");
    ui.importDropzoneText = document.getElementById("importDropzoneText");
    ui.importCsvInput = document.getElementById("importCsvInput");
    ui.importFileInfo = document.getElementById("importFileInfo");
    ui.importErrorMsg = document.getElementById("importErrorMsg");
    ui.importProgress = document.getElementById("importProgress");
    ui.importProgressFill = document.getElementById("importProgressFill");
    ui.importProgressText = document.getElementById("importProgressText");
    ui.importSummaryList = document.getElementById("importSummaryList");

    ensureScrollLoader();
  }

  /** Creates the "Loading more records..." indicator + IntersectionObserver
   *  sentinel the first time it's needed - there is no existing markup for
   *  this in the page, so it's built at runtime and appended right after the
   *  grid/table content in normal document flow, reusing no new styling
   *  beyond basic centering so it visually blends in. Idempotent - safe to
   *  call on every bindUiRefs(). */
  function ensureScrollLoader() {
    if (ui.scrollSentinel) return ui.scrollSentinel;
    if (!ui.page) return null;

    const wrap = document.createElement("div");
    wrap.id = "assetInventoryScrollLoader";
    wrap.style.textAlign = "center";
    wrap.style.padding = "12px 0";

    const text = document.createElement("div");
    text.id = "assetInventoryScrollLoaderText";
    text.setAttribute("aria-live", "polite");
    text.style.display = "none";
    text.textContent = "Loading more records...";

    // Marker the IntersectionObserver watches, sitting right after the
    // grid/table content in normal document flow so it enters the browser's
    // actual viewport once the user scrolls down to it. The scroll-event
    // fallback (onScrollCheck, inside createInfinitePager) doesn't need it,
    // but keeping both mechanisms means loading still works even if
    // IntersectionObserver is ever unavailable.
    const sentinel = document.createElement("div");
    sentinel.id = "assetInventoryScrollSentinel";
    sentinel.style.height = "1px";

    wrap.appendChild(text);
    wrap.appendChild(sentinel);
    ui.page.appendChild(wrap);

    ui.scrollLoaderWrap = wrap;
    ui.scrollLoaderText = text;
    ui.scrollSentinel = sentinel;
    return sentinel;
  }

  /** Shows/hides the "Loading more records..." indicator - only while
   *  fetching a page beyond the first (the first page's loading state is the
   *  empty-state text instead, see renderCards/renderTableView). */
  function renderScrollLoader() {
    ensureScrollLoader();
    if (!ui.scrollLoaderText) return;
    const pagerState = state.pager || {};
    const loadingMore = Boolean(pagerState.isLoading) && Number(pagerState.rowCount) > 0;
    ui.scrollLoaderText.style.display = loadingMore ? "block" : "none";
  }

  let inventoryPager = null;

  /** The single infinite-scroll pager instance for this page - there's one
   *  active filter combination at a time here (no multiple simultaneously-
   *  cached filter tabs), so filter changes call reset() on this same
   *  instance rather than creating/switching between several pagers. */
  function ensureInventoryPager() {
    if (inventoryPager) return inventoryPager;
    ensureScrollLoader();
    inventoryPager = getPagerFn("createInfinitePager")({
      pageSize: 20,
      loadMoreOffsetPx: 200,
      scrollContainer: window,
      sentinel: ui.scrollSentinel,
      dedupeBy: (row) => (row && (row.CategoryRecordID || row.Category)) || null,
      fetchPage: fetchAssetInventoryPage,
      onRows: (rows) => {
        state.inventoryRows = rows;
        renderFromState();
      },
      onError: (error) => {
        showError(`Unable to load asset inventory. ${formatFetchError(error)}`);
      },
      onState: (pagerState) => {
        state.pager = pagerState;
        if (pagerState.isLoading && pagerState.rowCount === 0) {
          // First page of a fresh view (initial load, or right after a
          // filter reset) - full loading state, same as before.
          setBusy(true);
          renderFromState(); // lets the empty state show "Loading records..." before any rows exist
        } else if (!pagerState.isLoading) {
          setBusy(false);
          // Loading just finished - re-render regardless of outcome. Without
          // this, a fetch that resolves with zero rows (or rows that don't
          // map to any card) left the screen stuck on "Loading records..."
          // forever, since onRows is only what swaps in real cards and it
          // has nothing to show when there's nothing to render.
          renderFromState();
        }
        renderScrollLoader();
      }
    });
    inventoryPager.connect();
    return inventoryPager;
  }

  function renderTypeFilter() {
    const types = Array.isArray(state.types) ? state.types : [];
    // The empty value is the "no filter" entry, so it doubles as the clear option.
    state.typeFilterOptions = [{ value: "", label: "All Types" }].concat(
      types.map((value) => {
        const entry = state.typeLookupByNormalizedName && state.typeLookupByNormalizedName[normalizeToken(value)];
        return { value, label: (entry && entry.name) || value };
      })
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
    const options = Array.isArray(state.typeFilterOptions) ? state.typeFilterOptions : [];
    const match = options.find((opt) => opt.value === state.selectedType);
    ui.typeFilterInput.value = match ? match.label : state.selectedType;
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
    // ASSET_INVENTORY_TYPE_FILTER is called on open, once, and cached
    // afterward - a later open reuses the cached options instead of
    // re-calling the workflow.
    ensureAssetTypeOptionsLoaded()
      .then(() => {
        if (state.typeFilterOpen) renderTypeFilter();
      })
      .catch((error) => {
        showError(`Unable to load asset types. ${formatFetchError(error)}`);
      });
  }

  function applySelectedType(nextType) {
    state.selectedType = String(nextType || "").trim();
    // Re-render immediately from the currently-cached rows so the Type
    // dropdown itself feels instant (its own label/highlight, not the cards),
    // then refresh from RNSP with AssetTypeFilter set to the new selection.
    renderTypeFilter();
    resetInventoryPager();
  }

  /** "No data found." normally, but "Loading records..." specifically while
   *  the pager's very first fetch for the current filters is still in
   *  flight (rowCount === 0 && isLoading) - avoids a misleading empty-state
   *  flash before any rows have arrived yet. */
  function getEmptyStateMessage() {
    const pagerState = state.pager || {};
    if (pagerState.isLoading && !pagerState.rowCount) return "Loading records...";
    return "No data found.";
  }

  function renderCards(cards) {
    if (!ui.assetGrid) return;
    if (!cards.length) {
      ui.assetGrid.innerHTML = `<div class="empty-state">${escapeHtml(getEmptyStateMessage())}</div>`;
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
      ui.assetTableView.innerHTML = `<div class="empty-state">${escapeHtml(getEmptyStateMessage())}</div>`;
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
    const cards = getCardsFromRnspRows(state.inventoryRows);
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

  /*
   * ---------------------------------------------------------------------
   * Import Assets (CSV) - popup, CSV parsing, batching and the api/rnsp
   * calls that hand each batch off to the Import_Asset workflow. See
   * Import_Asset.sql for the SQL that matches CSV columns against
   * EAsset_Master / the category's child table and does the actual
   * insert/update, keyed on SerialNumber.
   * ---------------------------------------------------------------------
   */

  /** Minimal RFC4180 CSV parser: handles quoted fields (including embedded
   *  commas, newlines and escaped "" quotes) and both \r\n and \n line
   *  endings. Returns { headers, rows } where each row is a plain
   *  { headerName: cellValue } object built from the raw header text - no
   *  column name is assumed here, so the file can carry any EAsset_Master
   *  field name plus any category-specific child-table field name and both
   *  are preserved as-is for the SQL side to match. */
  function parseCsvText(text) {
    const content = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    let i = 0;
    const len = content.length;

    function pushField() {
      row.push(field);
      field = "";
    }
    function pushRow() {
      pushField();
      rows.push(row);
      row = [];
    }

    while (i < len) {
      const ch = content[i];
      if (inQuotes) {
        if (ch === '"') {
          if (content[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i += 1;
          continue;
        }
        field += ch;
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }
      if (ch === ",") {
        pushField();
        i += 1;
        continue;
      }
      if (ch === "\r") {
        i += 1;
        continue;
      }
      if (ch === "\n") {
        pushRow();
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
    }
    // Trailing field/row (files without a final newline).
    if (field.length || row.length) pushRow();

    // Drop fully blank trailing rows a trailing newline can produce.
    while (rows.length && rows[rows.length - 1].every((cell) => toText(cell) === "")) {
      rows.pop();
    }
    if (!rows.length) return { headers: [], rows: [] };

    const headers = rows[0].map((h) => toText(h));
    const dataRows = rows.slice(1).map((cells) => {
      const obj = {};
      headers.forEach((header, idx) => {
        if (!header) return;
        obj[header] = cells[idx] == null ? "" : cells[idx];
      });
      return obj;
    });
    return { headers, rows: dataRows };
  }

  function findCsvCategoryHeader(headers) {
    return (Array.isArray(headers) ? headers : []).find((h) => normalizeToken(h) === "category") || "";
  }

  /** Validates a parsed CSV against what the Import flow needs: at least one
   *  data row. Category is NOT required here - Import_Asset.sql already
   *  handles a missing/blank Category by importing into EAsset_Master only
   *  (no child table), the same graceful path it uses for an unrecognized
   *  category. SerialNumber is not checked client-side either -
   *  Import_Asset.sql rejects any row with a blank/missing Serial Number
   *  (it's the sole unique key for an asset) and reports it back per-row as
   *  Status='failed', which runImport() surfaces in the summary. */
  function validateParsedCsvForImport(parsed) {
    if (!parsed || !Array.isArray(parsed.headers) || !parsed.headers.length) {
      return { valid: false, reason: "The file does not look like a CSV (no header row found)." };
    }
    if (!Array.isArray(parsed.rows) || !parsed.rows.length) {
      return { valid: false, reason: "The CSV has a header row but no data rows." };
    }
    return { valid: true, reason: "" };
  }

  /** Groups parsed CSV rows by their Category value, case-insensitively -
   *  "Desktop", "DESKTOP" and "desktop" all land in the same group and are
   *  batched together, using whichever casing appeared first in the file as
   *  the Category value sent to api/rnsp for that group (Import_Asset.sql
   *  itself also matches Category case-insensitively via UPPER() when
   *  resolving the child table, so any casing works there). Rows with a
   *  blank Category are NOT skipped - they get their own group with an empty
   *  Category, sent through the same way; Import_Asset.sql treats a blank
   *  Category exactly like an unrecognised one (e.g. "CPU") and imports the
   *  row into EAsset_Master only, with no child table to write into. */
  function groupCsvRowsByCategory(parsed) {
    const categoryHeader = findCsvCategoryHeader(parsed.headers);
    const groups = new Map(); // key: UPPERCASE category ("" for blank) -> { display, rows }
    parsed.rows.forEach((row) => {
      const category = toText(row[categoryHeader]);
      const key = category ? category.toUpperCase() : "";
      if (!groups.has(key)) groups.set(key, { display: category, rows: [] });
      groups.get(key).rows.push(row);
    });
    return { groups };
  }

  function chunkArray(list, size) {
    const chunks = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  }

  /** Sends one batch (up to IMPORT_BATCH_SIZE rows, all the same Category)
   *  to the Import_Asset workflow. Records travel as a JSON-encoded string
   *  (Args.Records), matching how this platform passes structured workflow
   *  parameters (see Import_Asset.sql for how it's read back with OPENJSON).
   *  Returns the per-row result set the script's final SELECT produces -
   *  [{RowIdx, SerialNumber, RecordID, Status, Reason}, ...] - normalized the
   *  same tolerant way ASSET_INVENTORY_RNSP's own response is (bare array or
   *  wrapped in data/result/Records), since this is the same /api/rnsp
   *  endpoint. A batch call returning HTTP 200 only means the SQL ran
   *  without a fatal RAISERROR - it does NOT mean every row in the batch was
   *  actually written; some rows can still come back Status='failed' (e.g.
   *  missing a Required column) while the rest of the batch succeeds. The
   *  caller (runImport) is what turns this into an honest per-row count. */
  async function sendImportBatch(category, batchRows) {
    const args = {
      Category: category,
      Records: JSON.stringify(batchRows)
    };
    const response = await postJson(buildRnspUrl(), { Name: IMPORT_WORKFLOW_NAME, Args: args });
    return normalizeAssetInventoryResponse(response);
  }

  function setImportSubmitEnabled(enabled) {
    if (ui.importSubmitBtn) ui.importSubmitBtn.disabled = !enabled;
  }

  function showImportError(message) {
    if (!ui.importErrorMsg) return;
    if (!message) {
      ui.importErrorMsg.hidden = true;
      ui.importErrorMsg.textContent = "";
      return;
    }
    ui.importErrorMsg.hidden = false;
    ui.importErrorMsg.textContent = message;
  }

  function setImportFileInfo(text) {
    if (!ui.importFileInfo) return;
    if (!text) {
      ui.importFileInfo.hidden = true;
      ui.importFileInfo.textContent = "";
      return;
    }
    ui.importFileInfo.hidden = false;
    ui.importFileInfo.textContent = text;
  }

  function setImportProgress(done, total) {
    if (!ui.importProgress || !ui.importProgressFill || !ui.importProgressText) return;
    if (!total) {
      ui.importProgress.hidden = true;
      return;
    }
    ui.importProgress.hidden = false;
    const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    ui.importProgressFill.style.width = `${pct}%`;
    ui.importProgressText.textContent = `Importing batch ${done} of ${total}...`;
  }

  function clearImportSummary() {
    if (!ui.importSummaryList) return;
    ui.importSummaryList.innerHTML = "";
    ui.importSummaryList.hidden = true;
  }

  function appendImportSummaryLine(text, isError) {
    if (!ui.importSummaryList) return;
    ui.importSummaryList.hidden = false;
    const li = document.createElement("li");
    if (isError) li.classList.add("is-error");
    li.textContent = text;
    ui.importSummaryList.appendChild(li);
    ui.importSummaryList.scrollTop = ui.importSummaryList.scrollHeight;
  }

  function resetImportModalState() {
    state.importParsedRows = null;
    state.importFileName = "";
    state.importIsRunning = false;
    if (ui.importCsvInput) ui.importCsvInput.value = "";
    if (ui.importDropzoneText) ui.importDropzoneText.textContent = "Click to choose a CSV file, or drag and drop it here";
    setImportFileInfo("");
    showImportError("");
    setImportProgress(0, 0);
    clearImportSummary();
    setImportSubmitEnabled(false);
  }

  function openImportModal() {
    resetImportModalState();
    if (ui.importModalOverlay) ui.importModalOverlay.hidden = false;
    if (ui.importAssetsBtn) ui.importAssetsBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeImportModal() {
    if (state.importIsRunning) return; // Don't let the popup close mid-import.
    if (ui.importModalOverlay) ui.importModalOverlay.hidden = true;
    if (ui.importAssetsBtn) ui.importAssetsBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  /** Reads + parses the chosen file and updates the popup accordingly. The
   *  Import button (ui.importSubmitBtn) only becomes enabled once this
   *  resolves to a valid CSV, per the requirements doc. */
  function handleImportFileSelected(file) {
    showImportError("");
    setImportSubmitEnabled(false);
    state.importParsedRows = null;
    if (!file) {
      setImportFileInfo("");
      return;
    }
    const isCsv = /\.csv$/i.test(file.name) || /csv/i.test(file.type || "");
    if (!isCsv) {
      setImportFileInfo("");
      showImportError("Please choose a .csv file.");
      return;
    }
    state.importFileName = file.name;
    setImportFileInfo(`Selected: ${file.name}`);
    const reader = new FileReader();
    reader.onerror = () => {
      showImportError("Could not read that file.");
    };
    reader.onload = () => {
      const parsed = parseCsvText(String(reader.result || ""));
      const validation = validateParsedCsvForImport(parsed);
      if (!validation.valid) {
        showImportError(validation.reason);
        return;
      }
      state.importParsedRows = parsed;
      setImportFileInfo(`Selected: ${file.name} (${parsed.rows.length} row${parsed.rows.length === 1 ? "" : "s"})`);
      setImportSubmitEnabled(true);
    };
    reader.readAsText(file);
  }

  /** Groups the parsed CSV by Category, batches each group into
   *  IMPORT_BATCH_SIZE-row chunks and sends them to api/rnsp one batch at a
   *  time (sequential, so the progress bar and summary list reflect exactly
   *  what has actually been sent so far). */
  /** Tallies a batch's per-row failure reasons (e.g. "Serial Number is
   *  required") into a compact "Reason (count)" string for the summary
   *  line, instead of listing every failed row individually. */
  function summarizeImportFailureReasons(rows) {
    const counts = new Map();
    rows.forEach((r) => {
      if (String(r.Status || r.status || "").toLowerCase() === "ok") return;
      const reason = toText(r.Reason || r.reason) || "Unknown reason";
      counts.set(reason, (counts.get(reason) || 0) + 1);
    });
    return [...counts.entries()].map(([reason, count]) => `${reason} (${count})`).join(", ");
  }

  async function runImport() {
    if (state.importIsRunning) return;
    const parsed = state.importParsedRows;
    if (!parsed) return;
    const { groups } = groupCsvRowsByCategory(parsed);
    const batchJobs = [];
    groups.forEach((group) => {
      const categoryChunks = chunkArray(group.rows, IMPORT_BATCH_SIZE);
      categoryChunks.forEach((batch, idx) => {
        batchJobs.push({ category: group.display, batch, batchIndex: idx + 1, batchCount: categoryChunks.length });
      });
    });

    if (!batchJobs.length) {
      showImportError("No data rows were found to import.");
      return;
    }

    state.importIsRunning = true;
    setImportSubmitEnabled(false);
    if (ui.importCancelBtn) ui.importCancelBtn.disabled = true;
    showImportError("");
    clearImportSummary();

    let completed = 0;
    let failedBatches = 0;
    setImportProgress(0, batchJobs.length);

    for (let i = 0; i < batchJobs.length; i += 1) {
      const job = batchJobs[i];
      const label = job.category || "(no category)";
      try {
        const rows = await sendImportBatch(job.category, job.batch);
        completed += 1;
        // rows is the SQL's own per-row [{Status, Reason}, ...] result set -
        // a successful HTTP/SQL call doesn't mean every row in the batch was
        // actually written (e.g. a row rejected for a blank Serial Number).
        // When the shape isn't recognized, fall back to assuming the whole
        // batch imported rather than reporting a misleading 0.
        let okCount = job.batch.length;
        let failCount = 0;
        let reasonNote = "";
        if (Array.isArray(rows) && rows.length) {
          okCount = rows.filter((r) => String(r.Status || r.status || "").toLowerCase() === "ok").length;
          failCount = rows.length - okCount;
          if (failCount) reasonNote = ` - ${summarizeImportFailureReasons(rows)}`;
        }
        appendImportSummaryLine(
          `${label}: imported ${okCount} of ${job.batch.length} record${job.batch.length === 1 ? "" : "s"} (batch ${job.batchIndex} of ${job.batchCount})` +
            `${failCount ? `, ${failCount} skipped${reasonNote}` : ""}.`,
          failCount > 0
        );
      } catch (error) {
        failedBatches += 1;
        appendImportSummaryLine(
          `${label}: batch ${job.batchIndex} of ${job.batchCount} failed - ${formatFetchError(error)}`,
          true
        );
      }
      setImportProgress(i + 1, batchJobs.length);
    }

    appendImportSummaryLine(
      `Done: ${completed} of ${batchJobs.length} batch(es) succeeded${failedBatches ? `, ${failedBatches} failed` : ""}.`
    );

    state.importIsRunning = false;
    if (ui.importCancelBtn) ui.importCancelBtn.disabled = false;
    setImportSubmitEnabled(false); // Re-uploading a file is required to import again.
    state.importParsedRows = null;

    // Refresh the summary/grid so newly imported assets show up without the
    // user having to close the popup and reload the page themselves.
    loadAndRender(true);
  }

  function bindImportModalEvents() {
    if (ui.importAssetsBtn && !ui.importAssetsBtn.__invenImportBound) {
      ui.importAssetsBtn.__invenImportBound = true;
      ui.importAssetsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openImportModal();
      });
    }
    if (ui.importCloseBtn && !ui.importCloseBtn.__invenImportBound) {
      ui.importCloseBtn.__invenImportBound = true;
      ui.importCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeImportModal();
      });
    }
    if (ui.importCancelBtn && !ui.importCancelBtn.__invenImportBound) {
      ui.importCancelBtn.__invenImportBound = true;
      ui.importCancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeImportModal();
      });
    }
    if (ui.importModalOverlay && !ui.importModalOverlay.__invenImportBound) {
      ui.importModalOverlay.__invenImportBound = true;
      ui.importModalOverlay.addEventListener("click", (e) => {
        if (e.target === ui.importModalOverlay) closeImportModal();
      });
    }
    if (ui.importCsvInput && !ui.importCsvInput.__invenImportBound) {
      ui.importCsvInput.__invenImportBound = true;
      ui.importCsvInput.addEventListener("change", () => {
        handleImportFileSelected(ui.importCsvInput.files && ui.importCsvInput.files[0]);
      });
    }
    if (ui.importDropzone && !ui.importDropzone.__invenImportBound) {
      ui.importDropzone.__invenImportBound = true;
      ["dragenter", "dragover"].forEach((evt) => {
        ui.importDropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          ui.importDropzone.classList.add("is-dragover");
        });
      });
      ["dragleave", "drop"].forEach((evt) => {
        ui.importDropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          ui.importDropzone.classList.remove("is-dragover");
        });
      });
      ui.importDropzone.addEventListener("drop", (e) => {
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        if (ui.importCsvInput) {
          try {
            const dt = new DataTransfer();
            dt.items.add(file);
            ui.importCsvInput.files = dt.files;
          } catch (_error) {
            // DataTransfer construction can fail in older browsers; the file
            // is still handled below even if the <input> itself isn't synced.
          }
        }
        handleImportFileSelected(file);
      });
    }
    if (ui.importSubmitBtn && !ui.importSubmitBtn.__invenImportBound) {
      ui.importSubmitBtn.__invenImportBound = true;
      ui.importSubmitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        runImport();
      });
    }
    if (!document.__invenImportEscBound) {
      document.__invenImportEscBound = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && ui.importModalOverlay && !ui.importModalOverlay.hidden) closeImportModal();
      });
    }
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
      lib.applyCsSettingTheme("#importModalOverlay");
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
    clearError();
    // Status columns are fixed (RNSP_STATUS_FIELDS/LABELS), not discovered
    // from data, so this only ever needs setting once.
    state.statusColumns = getFixedRnspStatusColumns();

    const pager = ensureInventoryPager();
    const isFirstLoad = !state.lastLoadedAt;
    state.lastLoadedAt = Date.now();
    state.isLoading = false;

    if (isFirstLoad) {
      // Started here (not awaited) so it's populated by the time the user
      // can click a category's Add button, matching demo.js's eager
      // fetchTypesViaSdk timing - see prefetchAssetTypeOptions().
      prefetchAssetTypeOptions();
      pager.loadNext();
    } else {
      // A forced reload (e.g. after adding a new asset) must never keep
      // showing a stale accumulated list for the current filter combination
      // - clear and refetch from page 1, same as a filter change.
      pager.reset({ autoLoad: true });
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
    bindImportModalEvents();
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