/*
 * First-paint motion guard. Runs as this file parses, before any DOM-ready work,
 * so it is in place for the frames where a page's transitions would otherwise
 * all fire at once - the body's padding sliding as the nav dock settles its
 * width, the dock labels fading in, cards and toolbars easing their opacity -
 * none of which the user asked for, and which together read as the page
 * shuddering into place.
 *
 * The rule itself is `html.qaf-no-motion` in global.css. Removal is
 * unconditional and belt-and-braces: on document-ready plus two frames, and on
 * a hard timeout regardless. Nothing is ever hidden, so the worst case if a
 * release path is missed is that transitions stay off - never a blank page.
 */
(function () {
  "use strict";

  var MOTION_GUARD_CLASS = "qaf-no-motion";
  var MOTION_GUARD_MAX_MS = 1000;
  var root = document.documentElement;
  if (!root) return;

  root.classList.add(MOTION_GUARD_CLASS);

  var released = false;
  function release() {
    if (released) return;
    released = true;
    root.classList.remove(MOTION_GUARD_CLASS);
  }

  // Two frames is the ideal moment - after the ready handlers have written the
  // DOM, before anything animates. But rAF is paused in a background tab, so it
  // is raced against a timer rather than trusted; whichever arrives first wins.
  function releaseAfterTwoFrames() {
    if (typeof window.requestAnimationFrame !== "function") return release();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(release);
    });
    window.setTimeout(release, 120);
  }

  window.setTimeout(release, MOTION_GUARD_MAX_MS);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", releaseAfterTwoFrames, { once: true });
  } else {
    releaseAfterTwoFrames();
  }
})();

(function () {
    "use strict";

    // Shared defaults for sortable/resizable grid tables.
    const DEFAULTS = {
      sortable: true,
      resizable: true,
      minWidth: 90,
      maxWidth: 520,
      // Page-declared layout, all index-aligned with the header cells.
      // columnWidths gives each column its default width; columnMinWidths and
      // columnMaxWidths override minWidth / maxWidth for individual columns.
      // Supplying these is how a page states its layout -- it should never
      // write to <colgroup> itself.
      columnWidths: null,
      columnMinWidths: null,
      columnMaxWidths: null,
      resizeStorageKey: "",
      headerSelector: "thead th",
      bodySelector: "tbody",
      sortableHeaderClass: "gt-sortable",
      activeSortClass: "gt-sorted",
      sortIconClass: "gt-sort-icon",
      resizerClass: "gt-col-resizer",
      noSortClass: "no-sort",
      noResizeClass: "no-resize",
      // Re-apply the active sort after refresh(). Off by default so pages that
      // render their rows already ordered keep doing exactly that; a page whose
      // sort must survive a body re-render opts in.
      reapplySortOnRefresh: false,
      // Ellipsis + hover tooltip for header labels and body cells. On by
      // default: it is the app-wide standard for every grid this engine drives.
      ellipsisTooltips: true
    };

    /*
     * Grid chrome (resizer pipe, sort glyph, header/cell ellipsis) is declared
     * in global.css so it is in effect at first paint - injecting it from here
     * meant the first frame painted an auto-layout table that then snapped to
     * the fixed layout, which is exactly the render flicker. global.css marks
     * itself with `--qaf-grid-runtime: 1`; when that marker is present this is a
     * no-op. The literal fallback below only runs on a page that somehow loads
     * library.js without global.css, so a grid is never left unstyled.
     *
     * Keep the fallback in sync with global.css's "Grid Table Runtime" section.
     */
    function hasGlobalGridRuntime() {
      try {
        var marker = window.getComputedStyle(document.documentElement)
          .getPropertyValue("--qaf-grid-runtime");
        return String(marker || "").trim() === "1";
      } catch (_) {
        return false;
      }
    }

    function ensureGridTableStyles() {
      if (document.getElementById("gt-runtime-styles")) return;
      if (hasGlobalGridRuntime()) return;
      var style = document.createElement("style");
      style.id = "gt-runtime-styles";
      style.textContent =
        "table thead th{position:relative;}" +
        "table[data-gt-resizable]{table-layout:fixed!important;width:max-content;min-width:0!important;}" +
        "table[data-gt-resizable] th,table[data-gt-resizable] td{min-width:0!important;box-sizing:border-box;}" +
        "table[data-gt-resizable]>tbody>tr>td:not(.row-actions):not(.no-ellipsis){white-space:nowrap;overflow:hidden;text-overflow:ellipsis;overflow-wrap:normal;word-break:normal;}" +
        ".gt-col-resizer{position:absolute;top:0;right:-5px;width:10px;height:100%;z-index:2;cursor:col-resize;user-select:none;touch-action:none;pointer-events:auto;}" +
        ".gt-col-resizer::before{display:none!important;}" +
        ".gt-col-resizer::after{content:\"\";position:absolute;top:4px;bottom:4px;left:50%;width:2px;transform:translateX(-50%);border-radius:1px;background:transparent;transition:background .12s ease;}" +
        // Hovering anywhere on the header row reveals the separator on EVERY
        // column, so the whole grid reads as adjustable at once; the column
        // actually under the cursor (or being dragged) gets the stronger tone.
        "table thead:hover th .gt-col-resizer::after{background:var(--color-border-default,#e5e7eb);}" +
        "table thead th .gt-col-resizer:hover::after,table thead th .gt-col-resizer.is-resizing::after{background:var(--color-border-strong,#94a3b8);}" +
        "table th .th-label{display:block;min-width:0;max-width:100%;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}" +
        "table th.gt-sortable .th-label,table th.is-sortable .th-label{padding-right:var(--qaf-th-sort-reserve,24px)!important;}" +
        "table th .gt-sort-icon,table th .th-sort-icon{position:absolute;right:var(--qaf-th-sort-icon-right,10px);top:50%;transform:translateY(-50%);width:var(--qaf-th-sort-icon-size,10px);height:12px;display:inline-block;font-size:12px;line-height:1;color:var(--color-text-muted,#64748b);pointer-events:none;opacity:0;transition:opacity .12s ease;}" +
        "table th:hover .gt-sort-icon,table th:focus-within .gt-sort-icon,table th.is-sorted .gt-sort-icon,table th.gt-sorted .gt-sort-icon,table th:hover .th-sort-icon,table th:focus-within .th-sort-icon,table th.is-sorted .th-sort-icon,table th.gt-sorted .th-sort-icon{opacity:1;}" +
        // Thinner than the 2px separator pipe, but centred on the same column
        // boundary via translateX(-50%) so it stays aligned with it rather
        // than sitting half a pixel to its right.
        ".gt-resize-line{position:fixed;top:0;width:1px;transform:translateX(-50%);z-index:9999;background:var(--color-border-strong,#94a3b8);pointer-events:none;}" +
        "body.is-column-resizing{cursor:col-resize!important;}" +
        "body.is-column-resizing *{cursor:col-resize!important;}";
      (document.head || document.documentElement).appendChild(style);
    }

    // Wrap a header's own content in a .th-label span, which is the element the
    // ellipsis and the sort-glyph reserve are declared against. Both the plain
    // `<th>Name</th>` and the markup form (`<th><i class="fa"></i>Name</th>`)
    // are handled; a page that already ships its own .th-label is left alone.
    // The resize handle and the sort glyph are deliberately excluded - they are
    // absolutely positioned chrome, not part of the label's flow.
    function isHeaderChrome(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
      return (
        node.classList.contains("th-label") ||
        node.classList.contains("gt-col-resizer") ||
        node.classList.contains("gt-sort-icon") ||
        node.classList.contains("th-sort-icon")
      );
    }

    function ensureHeaderLabel(header) {
      if (!header || header.querySelector(".th-label")) return;

      const movable = Array.from(header.childNodes).filter(function (node) {
        if (isHeaderChrome(node)) return false;
        if (node.nodeType === Node.TEXT_NODE) return true;
        return node.nodeType === Node.ELEMENT_NODE;
      });
      const hasText = movable.some(function (node) {
        return String(node.textContent || "").trim();
      });
      if (!hasText) return;

      const label = document.createElement("span");
      label.className = "th-label";
      movable.forEach(function (node) { label.appendChild(node); });
      header.insertBefore(label, header.firstChild);
    }
  
    function resolveResizeStorageKey(table, options) {
      var explicit = String((options && options.resizeStorageKey) || "").trim();
      if (explicit) return "gridtable:widths:" + explicit;
      var tableKey = String((table && table.getAttribute("data-resize-key")) || "").trim();
      if (tableKey) return "gridtable:widths:" + tableKey;
      return "";
    }
  
    // Saved widths are trusted only when they describe exactly this table's
    // column count. A stale entry from a different layout is discarded outright
    // rather than partially applied, which used to leave some columns unpinned.
    function readSavedWidths(storageKey, expectedCount) {
      if (!storageKey || !window.localStorage) return null;
      try {
        var raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        if (Number.isFinite(expectedCount) && parsed.length !== expectedCount) {
          window.localStorage.removeItem(storageKey);
          return null;
        }
        var widths = parsed.map(function (value) {
          var width = Number(value);
          return Number.isFinite(width) && width >= 0 ? Math.round(width) : null;
        });
        return widths.some(function (width) { return width != null; }) ? widths : null;
      } catch (_) {
        return null;
      }
    }

    function saveWidths(table, storageKey) {
      if (!storageKey || !window.localStorage || !table) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(getColumnWidths(table)));
      } catch (_) {}
    }

    // Discard a table's remembered widths so it falls back to its declared
    // defaults on the next create(). Accepts the bare key or the full one.
    function clearSavedWidths(storageKey) {
      var key = String(storageKey || "").trim();
      if (!key || !window.localStorage) return;
      if (key.indexOf("gridtable:widths:") !== 0) key = "gridtable:widths:" + key;
      try {
        window.localStorage.removeItem(key);
      } catch (_) {}
    }
  
    function isNumeric(value) {
      const text = String(value == null ? "" : value).trim().replace(/,/g, "");
      return /^-?\d+(\.\d+)?$/.test(text);
    }
  
    // Compare values as numbers when possible, otherwise natural string compare.
    function compareValues(a, b) {
      const aText = String(a == null ? "" : a).trim();
      const bText = String(b == null ? "" : b).trim();
      if (isNumeric(aText) && isNumeric(bText)) return Number(aText.replace(/,/g, "")) - Number(bText.replace(/,/g, ""));
      return aText.localeCompare(bText, undefined, { numeric: true, sensitivity: "base" });
    }
  
    // Ensure column widths are controlled through a colgroup.
    function ensureColGroup(table, visibleColumns) {
      let colGroup = table.querySelector("colgroup");
      if (!colGroup) {
        colGroup = document.createElement("colgroup");
        table.insertBefore(colGroup, table.firstChild);
      }
  
      const currentCols = Array.from(colGroup.querySelectorAll("col"));
      if (currentCols.length !== visibleColumns) {
        colGroup.innerHTML = "";
        for (let i = 0; i < visibleColumns; i += 1) colGroup.appendChild(document.createElement("col"));
      }
      return colGroup;
    }
  
    // Heuristic width based on visible row text lengths.
    function estimateColumnWidth(table, columnIndex, minWidth, maxWidth) {
      const rows = Array.from(table.querySelectorAll("tr")).slice(0, 40);
      let maxChars = 8;
      rows.forEach((row) => {
        const cell = row.children[columnIndex];
        const text = cell ? String(cell.textContent || "").trim() : "";
        maxChars = Math.max(maxChars, text.length);
      });
      const width = Math.round(maxChars * 8 + 32);
      return Math.max(minWidth, Math.min(maxWidth, width));
    }
  
    /* ==================================================================
     * COLUMN WIDTH ENGINE
     * ------------------------------------------------------------------
     * All column sizing lives here, so every grid behaves identically and no
     * page needs to touch <colgroup> itself.
     *
     * The invariants that make a drag well-behaved:
     *
     *  1. Every column always carries an explicit px width on its <col>, and
     *     the table's own width is the exact sum of them, under
     *     table-layout:fixed. A column can then only change when its own entry
     *     changes -- the browser is never left free to redistribute space into
     *     its neighbours.
     *
     *  2. Dragging column i rewrites widths[i] and nothing else. Columns to its
     *     LEFT keep their width and position. Columns to its RIGHT keep their
     *     width and simply shift, because the table total grew or shrank by the
     *     same delta.
     *
     *  3. min/max clamping applies ONLY to the column being dragged. Widths the
     *     page declares, and no-resize columns, are honoured exactly as given --
     *     so a 36px checkbox column is never inflated to the 90px default
     *     minimum, which is what used to make untouched columns jump on render.
     * ================================================================== */

    function isNoResizeHeader(header, options) {
      return Boolean(header && header.classList.contains(options.noResizeClass));
    }

    function pickPerColumn(list, index) {
      if (!Array.isArray(list)) return NaN;
      const value = Number(list[index]);
      return Number.isFinite(value) ? value : NaN;
    }

    function getColumnMinWidth(index, options, header) {
      // A no-resize column is page-owned; the global minimum must not touch it.
      if (isNoResizeHeader(header, options)) return 0;
      const perColumn = pickPerColumn(options.columnMinWidths, index);
      return Number.isFinite(perColumn) && perColumn >= 0 ? perColumn : options.minWidth;
    }

    function getColumnMaxWidth(index, options, header) {
      if (isNoResizeHeader(header, options)) return Infinity;
      const perColumn = pickPerColumn(options.columnMaxWidths, index);
      return Number.isFinite(perColumn) && perColumn > 0 ? perColumn : options.maxWidth;
    }

    function clampColumnWidth(width, index, options, header) {
      return Math.max(
        getColumnMinWidth(index, options, header),
        Math.min(getColumnMaxWidth(index, options, header), width)
      );
    }

    // Measure one column. The header is consulted before the <col> element
    // because <col>.getBoundingClientRect() is unreliable across engines, and a
    // 0 here used to leave the column with no explicit width at all.
    function measureColumnWidth(table, columnIndex, options) {
      const cols = table.querySelectorAll("colgroup col");
      const col = cols[columnIndex];
      if (col) {
        const styled = parseFloat(col.style.width);
        if (Number.isFinite(styled) && styled > 0) return styled;
      }

      const headers = table.querySelectorAll(options.headerSelector || DEFAULTS.headerSelector);
      const header = headers[columnIndex];
      if (header) {
        const headerWidth = header.getBoundingClientRect().width;
        if (Number.isFinite(headerWidth) && headerWidth > 1) return headerWidth;
      }

      if (col) {
        const rendered = col.getBoundingClientRect().width;
        if (Number.isFinite(rendered) && rendered > 1) return rendered;
      }

      return 0;
    }

    // Current width of every column, as integers.
    function getColumnWidths(table) {
      if (!table) return [];
      return Array.from(table.querySelectorAll("colgroup col")).map(function (col) {
        const styled = parseFloat(col.style.width);
        if (Number.isFinite(styled) && styled >= 0) return Math.round(styled);
        return Math.round(col.getBoundingClientRect().width || 0);
      });
    }

    // Write EVERY column width, then size the table to their exact sum.
    // Nothing is skipped: a <col> left unwritten is precisely what allows a
    // neighbouring column to absorb the dragged column's delta.
    function applyColumnWidths(table, widths) {
      if (!table || !Array.isArray(widths)) return;
      const cols = table.querySelectorAll("colgroup col");
      let total = 0;
      for (let i = 0; i < cols.length; i += 1) {
        let width = Number(widths[i]);
        if (!Number.isFinite(width) || width < 0) width = 0;
        width = Math.round(width);
        cols[i].style.width = `${width}px`;
        total += width;
      }
      if (total > 0) {
        table.style.width = `${total}px`;
        table.style.minWidth = "";
      }
    }

    // Width each column should start at, in priority order:
    // saved (the user's own drag) -> page-declared default -> measured -> estimated.
    function resolveInitialWidths(table, headers, options, storageKey) {
      const saved = readSavedWidths(storageKey, headers.length);
      const declared = Array.isArray(options.columnWidths) ? options.columnWidths : null;

      return headers.map(function (header, index) {
        const declaredWidth = pickPerColumn(declared, index);

        // A no-resize column can never have been dragged, so a saved value must
        // not apply to it -- and neither must the global minimum.
        if (isNoResizeHeader(header, options)) {
          if (Number.isFinite(declaredWidth) && declaredWidth >= 0) return Math.round(declaredWidth);
          return Math.max(0, Math.round(measureColumnWidth(table, index, options)));
        }

        const savedWidth = saved ? Number(saved[index]) : NaN;
        if (Number.isFinite(savedWidth) && savedWidth > 0) {
          return Math.round(clampColumnWidth(savedWidth, index, options, header));
        }

        // A declared default is the page stating its own layout, so it is used
        // verbatim rather than being squeezed into min/max.
        if (Number.isFinite(declaredWidth) && declaredWidth > 0) return Math.round(declaredWidth);

        const measured = measureColumnWidth(table, index, options);
        if (measured > 0) return Math.round(clampColumnWidth(measured, index, options, header));

        return Math.round(
          estimateColumnWidth(
            table,
            index,
            getColumnMinWidth(index, options, header),
            getColumnMaxWidth(index, options, header)
          )
        );
      });
    }
  
    // Date/datetime columns are rendered with a data-sort-value attribute
    // holding the parsed epoch milliseconds (see e.g. getRowDateFieldRaw /
    // parseApiDateValue call sites), specifically so sorting can use the
    // real chronological value instead of the displayed "DD/MM/YYYY hh:mm:ss
    // AM/PM" text - comparing that text lexicographically ("03/08/2026..."
    // vs "19/05/2026...") does not sort by actual date/time. When the
    // attribute is present it is used as-is (compareValues already treats a
    // numeric string as a number); everything else falls back to
    // textContent exactly as before.
    function getCellText(row, index) {
      const cell = row.children[index];
      if (!cell) return "";
      const sortValue = cell.getAttribute("data-sort-value");
      if (sortValue != null && sortValue !== "") return sortValue;
      return String(cell.textContent || "").trim();
    }
  
    // Attach click handlers and maintain tri-state sorting.
    function setupSorting(instance) {
      const { table, options, state } = instance;
      const headers = Array.from(table.querySelectorAll(options.headerSelector));
      headers.forEach((header, index) => {
        ensureHeaderLabel(header);
        if (header.classList.contains(options.noSortClass)) return;
        header.classList.add(options.sortableHeaderClass);
        header.classList.add("is-sortable");
        header.dataset.gtSortIndex = String(index);
        header.setAttribute("aria-sort", "none");
        if (!header.querySelector(`.${options.sortIconClass}`)) {
          // Adopt a glyph the page already rendered (pages ship
          // `<span class="th-sort-icon">`) instead of appending a second one on
          // top of it; only create one when the header has none.
          const existing = header.querySelector(".th-sort-icon");
          const icon = existing || document.createElement("span");
          icon.classList.add(options.sortIconClass);
          icon.classList.add("th-sort-icon");
          icon.textContent = "\u2195";
          icon.setAttribute("aria-hidden", "true");
          if (!existing) header.appendChild(icon);
        }
      });
  
      state.onHeaderClick = function (event) {
        const header = event.target.closest(`${options.headerSelector}.${options.sortableHeaderClass}`);
        if (!header || header.querySelector(`.${options.resizerClass}`)?.contains(event.target)) return;
        const sortIndex = Number(header.dataset.gtSortIndex);
        if (!Number.isFinite(sortIndex)) return;
  
        if (state.sort.column !== sortIndex) state.sort = { column: sortIndex, direction: "asc" };
        else if (state.sort.direction === "asc") state.sort.direction = "desc";
        else if (state.sort.direction === "desc") state.sort = { column: null, direction: null };
        else state.sort = { column: sortIndex, direction: "asc" };
  
        sortTableRows(instance);
        updateSortIndicators(instance);
      };
  
      table.addEventListener("click", state.onHeaderClick);
    }
  
    // Sort tbody rows in place, preserving original order for ties/reset.
    function sortTableRows(instance) {
      const { table, options, state } = instance;
      const body = table.querySelector(options.bodySelector);
      if (!body) return;
      const rows = Array.from(body.querySelectorAll("tr"));
  
      if (state.sort.column == null || !state.sort.direction) {
        rows
          .slice()
          .sort((a, b) => Number(a.dataset.gtOriginalIndex || 0) - Number(b.dataset.gtOriginalIndex || 0))
          .forEach((row) => body.appendChild(row));
        return;
      }
  
      const factor = state.sort.direction === "desc" ? -1 : 1;
      rows
        .slice()
        .sort((a, b) => {
          const compared = compareValues(getCellText(a, state.sort.column), getCellText(b, state.sort.column));
          if (compared !== 0) return compared * factor;
          return Number(a.dataset.gtOriginalIndex || 0) - Number(b.dataset.gtOriginalIndex || 0);
        })
        .forEach((row) => body.appendChild(row));
    }
  
    // Keep sort icons/header state in sync with active sorting.
    function updateSortIndicators(instance) {
      const { table, options, state } = instance;
      const headers = Array.from(table.querySelectorAll(options.headerSelector));
      headers.forEach((header, index) => {
        const icon = header.querySelector(`.${options.sortIconClass}`);
        if (!icon) return;
        if (state.sort.column !== index || !state.sort.direction) {
          header.classList.remove(options.activeSortClass);
          header.classList.remove("is-sorted");
          header.setAttribute("aria-sort", "none");
          icon.textContent = "\u2195";
        } else {
          header.classList.add(options.activeSortClass);
          header.classList.add("is-sorted");
          header.setAttribute("aria-sort", state.sort.direction === "asc" ? "ascending" : "descending");
          icon.textContent = state.sort.direction === "asc" ? "\u2191" : "\u2193";
        }
      });
    }
  
    // Attach drag handles and apply constrained column resizing.
    function setupResizing(instance) {
      const { table, options, state } = instance;
      const headers = Array.from(table.querySelectorAll(options.headerSelector));
      ensureColGroup(table, headers.length);
      const storageKey = resolveResizeStorageKey(table, options);
      state.storageKey = storageKey;
      state.headers = headers;

      headers.forEach((header, index) => {
        ensureHeaderLabel(header);
        if (isNoResizeHeader(header, options)) {
          // Drop a handle left behind if the column became no-resize later.
          const stale = header.querySelector(`.${options.resizerClass}`);
          if (stale) stale.remove();
          return;
        }

        let handle = header.querySelector(`.${options.resizerClass}`);
        if (!handle) {
          handle = document.createElement("div");
          handle.className = options.resizerClass;
          handle.setAttribute("role", "separator");
          // Named from the header's label, not its textContent: by the time
          // resizing is set up the sort glyph is already a child, so the raw
          // textContent announced as "Resize Created Date arrow-up-down column".
          const headerLabel = header.querySelector(".th-label");
          const headerText = String((headerLabel || header).textContent || "").trim();
          handle.setAttribute("aria-label", headerText ? `Resize ${headerText} column` : "Resize column");
          header.appendChild(handle);
        }
        handle.dataset.gtColIndex = String(index);
      });

      applyColumnWidths(table, resolveInitialWidths(table, headers, options, storageKey));

      state.onMouseDown = function (event) {
        const handle = event.target.closest(`.${options.resizerClass}`);
        if (!handle) return;
        event.preventDefault();
        const index = Number(handle.dataset.gtColIndex);
        if (!Number.isFinite(index)) return;

        const targetHeader = headers[index];

        // Snapshot every column once, at drag start. Each mousemove rewrites
        // only entry [index] of THIS snapshot and re-applies the whole set, so
        // the pointer delta is always measured from the original width and no
        // other column can drift - not even by accumulated rounding.
        const lockedWidths = getColumnWidths(table);
        let startWidth = lockedWidths[index];
        if (!Number.isFinite(startWidth) || startWidth <= 0) {
          startWidth =
            Math.round(measureColumnWidth(table, index, options)) ||
            getColumnMinWidth(index, options, targetHeader) ||
            options.minWidth;
          lockedWidths[index] = startWidth;
        }
        const startX = event.clientX;
        const initialTableRect = table.getBoundingClientRect();
        const resizeArea = table.parentElement
          ? table.parentElement.getBoundingClientRect()
          : initialTableRect;
        const lastColumn = index === headers.length - 1;
        const lastColumnMaxWidth = lastColumn
          ? startWidth + Math.max(0, Math.max(initialTableRect.right, resizeArea.right) - initialTableRect.right)
          : Infinity;

        // Minimal active-resize indicator: a thin vertical line that tracks
        // the actual (clamped) column boundary -- not the raw pointer -- so
        // it never drifts past the column's min/max width and always lines
        // up with the header's own edge (reusable across grids).
        handle.classList.add("is-resizing");
        const resizeLine = document.createElement("div");
        resizeLine.className = "gt-resize-line";
        const tableRect = table.getBoundingClientRect();
        const startBoundaryRect = targetHeader
          ? targetHeader.getBoundingClientRect()
          : { right: event.clientX };
        const setResizeLineBounds = (visibleTableRect) => {
          const visibleTop = Math.max(
            visibleTableRect.top,
            resizeArea.top,
            0
          );
          const visibleBottom = Math.min(
            visibleTableRect.bottom,
            resizeArea.bottom,
            window.innerHeight || document.documentElement.clientHeight
          );
          resizeLine.style.top = `${visibleTop}px`;
          resizeLine.style.height = `${Math.max(0, visibleBottom - visibleTop)}px`;
        };
        // Not rounded: the pipe sits at the header's exact (often fractional)
        // right edge, so rounding here would knock the line off it by up to 1px.
        resizeLine.style.left = `${Math.min(startBoundaryRect.right, initialTableRect.right)}px`;
        setResizeLineBounds(tableRect);
        document.body.appendChild(resizeLine);

        const onMouseMove = (moveEvent) => {
          const nextWidths = lockedWidths.slice();
          const requestedWidth = startWidth + (moveEvent.clientX - startX);
          nextWidths[index] = lastColumn
            ? Math.min(lastColumnMaxWidth, Math.max(startWidth, requestedWidth))
            : clampColumnWidth(requestedWidth, index, options, targetHeader);
          applyColumnWidths(table, nextWidths);
          const liveRect = table.getBoundingClientRect();
          const boundaryRect = targetHeader ? targetHeader.getBoundingClientRect() : null;
          const boundary = boundaryRect ? boundaryRect.right : moveEvent.clientX;
          resizeLine.style.left = `${Math.min(liveRect.right, Math.max(liveRect.left, boundary))}px`;
          setResizeLineBounds(liveRect);
        };
        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          document.body.classList.remove("is-column-resizing");
          handle.classList.remove("is-resizing");
          if (resizeLine.parentNode) resizeLine.parentNode.removeChild(resizeLine);
          saveWidths(table, storageKey);
        };

        document.body.classList.add("is-column-resizing");
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };

      table.addEventListener("mousedown", state.onMouseDown);
    }
  
    // Persist initial row order to support reset-to-original sorting.
    function rememberOriginalOrder(table, bodySelector) {
      const rows = Array.from(table.querySelectorAll(`${bodySelector} tr`));
      rows.forEach((row, index) => {
        if (!row.dataset.gtOriginalIndex) row.dataset.gtOriginalIndex = String(index);
      });
    }
  
    // Create one GridTable instance per table element.
    function create(table, userOptions) {
      if (!table) return null;
      if (table.__gridTableInstance) return table.__gridTableInstance;
      ensureGridTableStyles();
      const options = Object.assign({}, DEFAULTS, userOptions || {});
      const state = {
        sort: { column: null, direction: null },
        onHeaderClick: null,
        onMouseDown: null
      };
  
      const instance = {
        table,
        options,
        state,
        refresh: function () {
          rememberOriginalOrder(table, options.bodySelector);
          if (options.sortable) {
            // A body re-render drops the rows back into source order while the
            // header still shows a sort arrow. Pages that want the active sort
            // to survive that opt in rather than re-sorting the data themselves.
            if (options.reapplySortOnRefresh) instance.applySort();
            updateSortIndicators(instance);
          }
          // Re-assert the column widths after a body re-render. Pages rebuild
          // <tbody> constantly; without this the colgroup could be left
          // describing a stale column count.
          if (options.resizable) instance.syncWidths();
          if (options.ellipsisTooltips) markTruncationTargets(table);
        },
        // Re-run the currently active sort against whatever is in <tbody> now.
        // A no-op while no column is sorted.
        applySort: function () {
          if (state.sort.column == null || !state.sort.direction) return;
          sortTableRows(instance);
        },
        // Recompute and re-apply every column width using the same priority
        // order as setup (saved -> declared -> measured). Public so a page can
        // re-assert widths after it swaps the table contents.
        syncWidths: function () {
          const liveHeaders = Array.from(table.querySelectorAll(options.headerSelector));
          if (!liveHeaders.length) return;
          state.headers = liveHeaders;
          ensureColGroup(table, liveHeaders.length);
          applyColumnWidths(
            table,
            resolveInitialWidths(table, liveHeaders, options, state.storageKey)
          );
        },
        destroy: function () {
          if (state.onHeaderClick) table.removeEventListener("click", state.onHeaderClick);
          if (state.onMouseDown) table.removeEventListener("mousedown", state.onMouseDown);
          table.removeAttribute("data-gt-resizable");
          table.__gridTableInstance = null;
        }
      };
  
      rememberOriginalOrder(table, options.bodySelector);
      if (options.sortable) setupSorting(instance);
      if (options.resizable) {
        table.setAttribute("data-gt-resizable", "true");
        setupResizing(instance);
      }
      if (options.ellipsisTooltips) markTruncationTargets(table);
      table.__gridTableInstance = instance;
      return instance;
    }

    /*
     * Ellipsis tooltips.
     *
     * The tooltip itself is the browser default: the full text is written to a
     * plain `title` attribute on hover, so there is no bubble element and no
     * tooltip CSS anywhere.
     *
     * Truncation is not measured up front for every cell: on a grid of a few
     * hundred rows that is a few hundred forced layouts on each render. The
     * table is only flagged as a tooltip host here, and the actual
     * scrollWidth/clientWidth comparison happens for the single element under
     * the pointer, in the one delegated listener installed below.
     */
    function markTruncationTargets(table) {
      if (!table) return;
      table.setAttribute("data-qaf-ellipsis-tooltip", "true");
      ensureEllipsisTooltip();
    }

    var tooltipBound = false;
    var tooltipTarget = null;

    // Elements whose text is expected to ellipsize: a grid's header labels and
    // body cells, plus anything a page opts in with .qaf-ellipsis.
    var TOOLTIP_SELECTOR =
      "[data-qaf-ellipsis-tooltip] th .th-label," +
      "[data-qaf-ellipsis-tooltip] > tbody > tr > td," +
      ".qaf-ellipsis";

    /*
     * True when the element's text really is clipped - which is what decides
     * whether hovering it is worth a tooltip.
     *
     * scrollWidth is the exact test here, padding and all: when the text
     * overflows, the scrollable area is padLeft + textWidth + padRight while
     * clientWidth is padLeft + contentWidth + padRight, so scrollWidth >
     * clientWidth reduces to textWidth > contentWidth with no blind spot - and
     * these elements lean on their padding (a header label reserves 24px for the
     * sort glyph, a body cell pads 10px a side), so that matters.
     *
     * Inline elements report 0 for both and are correctly read as untruncated.
     */
    function isTruncated(el) {
      if (!el || el.nodeType !== 1) return false;
      return el.scrollWidth - el.clientWidth > 1;
    }

    // The clipped element is not always the delegated one: a date cell renders
    // its two halves as blocks that ellipsize on their own while the cell itself
    // does not overflow. Walk from whatever the pointer is actually over up to
    // the delegated container and take the first element that is clipped.
    function findTruncatedTarget(from, container) {
      var node = from;
      var stop = container && container.parentNode;
      while (node && node !== stop) {
        if (isTruncated(node)) return node;
        node = node.parentNode;
      }
      return null;
    }

    // Drop the title this module added, and only that one: an element that
    // carried its own title before we touched it gets it back.
    function hideTooltip() {
      var el = tooltipTarget;
      tooltipTarget = null;
      if (!el) return;
      var original = el.getAttribute("data-qaf-title-original");
      el.removeAttribute("data-qaf-title-original");
      if (original == null) el.removeAttribute("title");
      else el.setAttribute("title", original);
    }

    function showTooltip(el) {
      var text = String(el.textContent || "").trim();
      if (!text) return hideTooltip();

      tooltipTarget = el;
      var existing = el.getAttribute("title");
      if (existing != null) el.setAttribute("data-qaf-title-original", existing);
      el.setAttribute("title", text);
    }

    function ensureEllipsisTooltip() {
      if (tooltipBound) return;
      tooltipBound = true;

      // One delegated pair of listeners for the whole document, however many
      // grids a page renders.
      document.addEventListener("mouseover", function (event) {
        var container = event.target && event.target.closest
          ? event.target.closest(TOOLTIP_SELECTOR)
          : null;
        if (!container) {
          if (tooltipTarget) hideTooltip();
          return;
        }
        var target = findTruncatedTarget(event.target, container);
        if (!target) return hideTooltip();
        if (target === tooltipTarget) return;
        hideTooltip();
        showTooltip(target);
      }, true);

      document.addEventListener("mouseout", function (event) {
        if (!tooltipTarget) return;
        var next = event.relatedTarget;
        if (next && tooltipTarget.contains(next)) return;
        hideTooltip();
      }, true);
    }
  
    // Initialize GridTable for all matched tables.
    function initAll(selector, options) {
      return Array.from(document.querySelectorAll(selector || "table")).map((table) => create(table, options));
    }
  
    window.GridTable = {
      create,
      initAll,
      // Exposed so any page can drive column sizing through this one engine
      // rather than writing to <colgroup> itself (which is what used to let
      // two sizing systems fight over the same table).
      getColumnWidths,
      applyColumnWidths,
      clearSavedWidths,
      // Turn on the shared "ellipsized text shows a tooltip on hover" behavior
      // for a table this engine does not manage. Elements outside a table can
      // opt in with the .qaf-ellipsis class instead.
      enableEllipsisTooltips: markTruncationTargets
    };
  })();
  
  (function () {
    "use strict";
  
    // Normalize nullable values to trimmed strings.
    function toSafeString(value) {
      return String(value == null ? "" : value).trim();
    }
  
    // Access QAF data service from current or parent frame.
    function getQafService() {
      return window.QafService || (window.parent && window.parent.QafService) || null;
    }
  
    // Access QAF page/form service from current or parent frame.
    function getQafPageService() {
      return window.QafPageService || (window.parent && window.parent.QafPageService) || null;
    }
  
    // Build a deduplicated set of repository targets for service calls.
    function asRepositoryTargets(repositoryName, objectID) {
      var out = [];
      var seen = {};
      function add(value) {
        var key = toSafeString(value);
        if (!key) return;
        var check = key.toLowerCase();
        if (seen[check]) return;
        seen[check] = true;
        out.push(key);
      }
      add(repositoryName);
      add(objectID);
      add(toSafeString(repositoryName).replace(/\s+/g, "_"));
      add(toSafeString(repositoryName).replace(/\s+/g, ""));
      return out;
    }
  
    // Try service methods/signatures in sequence until one succeeds.
    function callQafPageServiceMethod(methods, argSets) {
      var service = getQafPageService();
      if (!service) return false;
      for (var i = 0; i < methods.length; i += 1) {
        var methodName = methods[i];
        var fn = service && service[methodName];
        if (typeof fn !== "function") continue;
        for (var a = 0; a < argSets.length; a += 1) {
          try {
            fn.apply(service, argSets[a]);
            return true;
          } catch (_) {}
        }
      }
      return false;
    }
  
    // Normalize different QAF payload shapes into a row array.
    function extractRowsFromQafResponse(payload) {
      if (Array.isArray(payload)) return payload;
      if (!payload || typeof payload !== "object") return [];
      if (Array.isArray(payload.Items)) return payload.Items;
      if (Array.isArray(payload.Data)) return payload.Data;
      if (Array.isArray(payload.Value)) return payload.Value;
      if (payload.value && Array.isArray(payload.value)) return payload.value;
      if (payload.data && Array.isArray(payload.data)) return payload.data;
      if (payload.result && Array.isArray(payload.result)) return payload.result;
      if (payload.rows && Array.isArray(payload.rows)) return payload.rows;
      if (payload.items && Array.isArray(payload.items)) return payload.items;
      return [];
    }
  
    function flattenRecordRow(row) {
      if (!row || typeof row !== "object") return {};
      var out = Object.assign({}, row);
  
      function toTitleWords(text) {
        return String(text || "")
          .split(" ")
          .filter(Boolean)
          .map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join(" ");
      }
  
      function buildKeyAliases(key) {
        var raw = toSafeString(key);
        if (!raw) return [];
        var spaced = raw
          .replace(/_/g, " ")
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replace(/\s+/g, " ")
          .trim();
        var compact = spaced.replace(/\s+/g, "");
        var underscored = spaced.replace(/\s+/g, "_");
        var aliases = [
          raw,
          spaced,
          compact,
          underscored,
          compact.toLowerCase(),
          underscored.toLowerCase(),
          toTitleWords(spaced)
        ];
        var seen = {};
        var outAliases = [];
        for (var i = 0; i < aliases.length; i += 1) {
          var v = toSafeString(aliases[i]);
          if (!v) continue;
          var check = v.toLowerCase();
          if (seen[check]) continue;
          seen[check] = true;
          outAliases.push(v);
        }
        return outAliases;
      }
  
      function assignIfEmpty(targetKey, nextValue) {
        if (!targetKey) return;
        if (!Object.prototype.hasOwnProperty.call(out, targetKey) || out[targetKey] == null || out[targetKey] === "") {
          out[targetKey] = nextValue;
        }
      }
  
      var rfv = Array.isArray(row.RecordFieldValues) ? row.RecordFieldValues : [];
      for (var i = 0; i < rfv.length; i += 1) {
        var item = rfv[i] || {};
        var value = item.UGFieldValue;
        if (value == null) value = item.UGFfieldValue;
        if (value == null) value = item.FieldValue;
        if (value == null) value = item.Value;
        if (value == null) value = item.fieldValue;
        if (value == null) value = item.ugFieldValue;
        if (value == null) value = item.value;
        var finalValue = value == null ? "" : value;
  
        // Keep row access resilient by writing value to all known field key aliases.
        var keyCandidates = [
          item.FieldInternalName,
          item.dsNm,
          item.dn,
          item.FieldName,
          item.DisplayName,
          item.name
        ]
          .map(toSafeString)
          .filter(Boolean);
  
        for (var k = 0; k < keyCandidates.length; k += 1) {
          var aliases = buildKeyAliases(keyCandidates[k]);
          for (var a = 0; a < aliases.length; a += 1) {
            assignIfEmpty(aliases[a], finalValue);
          }
        }
      }
      // Normalize lookup-formatted values so tables don't show "id;#Label".
      Object.keys(out).forEach(function (k) {
        var current = out[k];
        if (typeof current === "string" && current.indexOf(";#") >= 0) {
          out[k] = lookupToText(current, current);
        }
      });
      return out;
    }
  
    function normalizeRowsForTable(payload) {
      var rows = extractRowsFromQafResponse(payload);
      if (!Array.isArray(rows) || !rows.length) return [];
      return rows.map(flattenRecordRow);
    }
  
    function getApiBaseUrl() {
      var envBase = toSafeString(window.APP_ENV && window.APP_ENV.API_BASE_URL);
      if (envBase) return envBase.replace(/\/+$/, "");
      // Match page-level default used in working screens (asset-details/requisition).
      return "https://ndem.quickappflow.com";
    }
  
    function getAuthHeadersFromStorage() {
      function tryParseJson(input) {
        try {
          return JSON.parse(input);
        } catch (_) {
          return null;
        }
      }
      var parsed = tryParseJson((window.localStorage && window.localStorage.getItem("user_key")) || "");
      var parsedValue =
        parsed && typeof parsed.value === "string"
          ? tryParseJson(parsed.value)
          : parsed && parsed.value;
      var payload =
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
  
    function withBaseUrl(path) {
      var base = getApiBaseUrl();
      if (!base) return path;
      return base + path;
    }
  
    // Convert route/path to absolute app URL.
    function toAbsolutePageUrl(path) {
      var raw = toSafeString(path);
      if (!raw) return "";
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.charAt(0) === "/") return window.location.origin + raw;
      return window.location.origin + "/" + raw;
    }
  
    // Build a URL with query params, ignoring null/empty values.
    function buildPageUrl(options) {
      var config = options || {};
      var path = toSafeString(config.path || config.url || config.route || config.pagePath);
      if (!path) throw new Error("buildPageUrl requires path/url/route/pagePath.");
      var finalUrl = new URL(toAbsolutePageUrl(path));
      var params = config.params && typeof config.params === "object" ? config.params : {};
      Object.keys(params).forEach(function (key) {
        var value = params[key];
        if (value == null) return;
        if (typeof value === "string" && value.trim() === "") return;
        finalUrl.searchParams.set(key, String(value));
      });
      return finalUrl.toString();
    }
  
    function createObjectNameCandidates(config) {
      var fromConfig = [];
      if (Array.isArray(config.objectNames)) fromConfig = config.objectNames.slice();
      var first = toSafeString(config.objectName || config.repositoryName || config.repository);
      var candidates = fromConfig.concat([
        first,
        first.replace(/\s+/g, "_"),
        first.replace(/_/g, " "),
        first.replace(/\s+/g, ""),
        "Asset Requisition",
        "AssetRequisition",
        "Asset_Requisition"
      ]);
      var out = [];
      var seen = {};
      for (var i = 0; i < candidates.length; i += 1) {
        var name = toSafeString(candidates[i]);
        if (!name) continue;
        var key = name.toLowerCase();
        if (seen[key]) continue;
        seen[key] = true;
        out.push(name);
      }
      return out;
    }
  
    async function fetchRecordsForFieldsViaApi(config, objectName) {
      var fieldList = toSafeString(config.fieldList || config.fields || "*");
      var pageSize = Number(config.pageSize || 0) || 0;
      var currentPage = Number(config.currentPage || 1) || 1;
      var filterCondition = toSafeString(config.filterCondition || config.filter || "");
      var sortBy = toSafeString(config.sortBy || "");
      var isAscending = typeof config.isAscending === "boolean" ? config.isAscending : true;
      var params = new URLSearchParams({
        objectName: objectName,
        fieldList: fieldList,
        orderBy: sortBy,
        whereClause: filterCondition,
        pageSize: String(pageSize || 10),
        pageNumber: String(currentPage || 1),
        isAscending: isAscending ? "true" : "false"
      });
      var url = withBaseUrl("/api/GetRecordsForFields?" + params.toString());
      var response = await window.fetch(url, {
        method: "POST",
        headers: getAuthHeadersFromStorage(),
        // Some environments reject empty POST bodies on this endpoint.
        body: "{}"
      });
      if (!response || !response.ok) {
        throw new Error("REST fetch failed (" + (response ? response.status : "unknown") + ")");
      }
      var text = await response.text();
      var payload = null;
      try {
        payload = JSON.parse(text);
      } catch (_) {
        payload = text;
      }
      if (payload === false) {
        throw new Error("REST fetch returned boolean false payload");
      }
      return payload;
    }
  
    function normalizeSystemKey(value) {
      return String(value || "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
    }
  
    function hasBusinessFields(rows) {
      var list = Array.isArray(rows) ? rows : [];
      if (!list.length) return false;
      var systemOnlyKeys = {
        id: true,
        objectid: true,
        recordid: true,
        parentrecordid: true,
        createdbyguid: true,
        createdbyname: true,
        createddate: true,
        lastmodifieddate: true,
        modifieddate: true,
        createdby: true,
        modifiedby: true,
        instanceid: true
      };
      for (var i = 0; i < list.length; i += 1) {
        var row = list[i];
        if (!row || typeof row !== "object") continue;
        var keys = Object.keys(row);
        for (var k = 0; k < keys.length; k += 1) {
          var key = normalizeSystemKey(keys[k]);
          if (!key) continue;
          if (!systemOnlyKeys[key]) return true;
        }
      }
      return false;
    }
  
    function extractFirstRow(payload) {
      if (!payload || typeof payload !== "object") return null;
      if (Array.isArray(payload)) return payload[0] || null;
      var rows = extractRowsFromQafResponse(payload);
      if (rows.length) return rows[0];
      var nested = payload.data || payload.Data || payload.result || payload.Result || payload.object || payload.Object;
      if (Array.isArray(nested)) return nested[0] || null;
      if (nested && typeof nested === "object") return nested;
      return payload;
    }
  
    async function resolveViewIdForObjectName(objectName) {
      var candidates = [
        objectName,
        String(objectName || "").replace(/\s+/g, "_"),
        String(objectName || "").replace(/_/g, " "),
        String(objectName || "").replace(/\s+/g, "")
      ]
        .map(toSafeString)
        .filter(Boolean);
      var unique = [];
      var seen = {};
      for (var i = 0; i < candidates.length; i += 1) {
        var c = candidates[i];
        var lower = c.toLowerCase();
        if (seen[lower]) continue;
        seen[lower] = true;
        unique.push(c);
      }
  
      var objectId = "";
      for (var o = 0; o < unique.length; o += 1) {
        var enc = encodeURIComponent(unique[o]);
        var objectUrls = [
          withBaseUrl("/api/ObjectGet?option=object&objectID=" + enc),
          withBaseUrl("/api/ObjectGet?objectID=" + enc)
        ];
        for (var u = 0; u < objectUrls.length; u += 1) {
          try {
            var objectPayload = await fetchApiJson(objectUrls[u]);
            var row = extractFirstRow(objectPayload) || {};
            objectId = toSafeString(row.ObjectID || row.ObjectId || row.objectID || row.objectId);
            if (objectId) break;
          } catch (_) {}
        }
        if (objectId) break;
      }
      if (!objectId) return "";
  
      try {
        var viewPayload = await fetchApiJson(withBaseUrl("/api/ViewGet?objectID=" + encodeURIComponent(objectId)));
        var viewRow = extractFirstRow(viewPayload) || {};
        return toSafeString(viewRow.ViewID || viewRow.viewId || viewRow.ID || viewRow.Id);
      } catch (_) {
        return "";
      }
    }
  
    async function fetchRecordsViaViewApi(config, objectName) {
      var pageSize = Number(config.pageSize || 0) || 0;
      var currentPage = Number(config.currentPage || 1) || 1;
      var viewId = await resolveViewIdForObjectName(objectName);
      if (!viewId) {
        throw new Error("Could not resolve view ID for object: " + objectName);
      }
      var params = new URLSearchParams({
        viewID: viewId,
        pageSize: String(pageSize || 10),
        pageNumber: String(currentPage || 1)
      });
      return fetchApiJson(withBaseUrl("/api/GetRecords?" + params.toString()));
    }
  
    // Convert lookup/raw values to plain display text (e.g. "id;#Label" -> "Label").
    function lookupToText(value, fallback) {
      var defaultValue = fallback == null ? "" : String(fallback);
      if (value == null) return defaultValue;
      if (typeof value === "string") {
        var text = value.trim();
        if (!text) return defaultValue;
        if (text.indexOf(";#") >= 0) {
          var parts = text.split(";#");
          var labels = [];
          for (var i = 1; i < parts.length; i += 2) {
            var labelPart = String(parts[i] || "").trim();
            if (labelPart) labels.push(labelPart);
          }
          if (labels.length) return labels.join(", ");
          var firstLabel = parts.length > 1 ? String(parts[1] || "").trim() : "";
          return firstLabel || text || defaultValue;
        }
        return text;
      }
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (Array.isArray(value)) {
        var mapped = value
          .map(function (item) {
            return lookupToText(item, "");
          })
          .filter(function (item) {
            return String(item).trim() !== "";
          });
        return mapped.length ? mapped.join(", ") : defaultValue;
      }
      if (typeof value === "object") {
        var candidate =
          value.value ||
          value.label ||
          value.DisplayName ||
          value.Name ||
          value.Title ||
          value.text;
        if (candidate != null && String(candidate).trim() !== "") return lookupToText(candidate, defaultValue);
        var idCandidate = value.id || value.ID || value.RecordID;
        if (idCandidate != null && String(idCandidate).trim() !== "") return String(idCandidate).trim();
      }
      return defaultValue;
    }
  
    async function fetchApiJson(url) {
      var finalUrl = /^https?:\/\//i.test(String(url || "")) ? String(url) : withBaseUrl(String(url || ""));
      var response = await window.fetch(finalUrl, {
        method: "POST",
        headers: getAuthHeadersFromStorage(),
        body: "{}"
      });
      if (!response || !response.ok) throw new Error("Lookup request failed");
      var text = await response.text();
      try {
        return JSON.parse(text);
      } catch (_) {
        return text;
      }
    }
  
    // Reusable fetch wrapper for repository data queries.
    async function fetchRepositoryData(options) {
      var config = options || {};
      var objectName = toSafeString(config.objectName || config.repositoryName || config.repository);
      var fieldList = toSafeString(config.fieldList || config.fields || "*");
      var pageSize = Number(config.pageSize || 0) || 0;
      var currentPage = Number(config.currentPage || 1) || 1;
      var filterCondition = toSafeString(config.filterCondition || config.filter || "");
      var sortBy = toSafeString(config.sortBy || "");
      var isAscending = config.isAscending;
      if (typeof isAscending !== "boolean") isAscending = true;
  
      if (!objectName) throw new Error("objectName or repositoryName is required.");
  
      var response = null;
      var candidates = createObjectNameCandidates(config);
      var qafService = getQafService();
      if (qafService && typeof qafService.GetItems === "function") {
        response = await qafService.GetItems(
          objectName,
          fieldList,
          pageSize || undefined,
          currentPage || undefined,
          filterCondition || undefined,
          sortBy || undefined,
          isAscending
        );
  
        // If service payload is empty or only system/meta keys, fall back to REST object/view fetch.
        var serviceRows = extractRowsFromQafResponse(response);
        if (!serviceRows.length || !hasBusinessFields(serviceRows)) {
          var serviceFallbackError = null;
          for (var s = 0; s < candidates.length; s += 1) {
            var serviceCandidate = candidates[s];
            try {
              var viaFields = await fetchRecordsForFieldsViaApi(config, serviceCandidate);
              var viaFieldsRows = extractRowsFromQafResponse(viaFields);
              if (viaFieldsRows.length && hasBusinessFields(viaFieldsRows)) {
                response = viaFields;
                break;
              }
            } catch (error) {
              serviceFallbackError = error;
            }
            try {
              var viaViewFromService = await fetchRecordsViaViewApi(config, serviceCandidate);
              var viaViewRowsFromService = extractRowsFromQafResponse(viaViewFromService);
              if (viaViewRowsFromService.length) {
                response = viaViewFromService;
                break;
              }
            } catch (error) {
              serviceFallbackError = error;
            }
          }
          if (response == null && serviceFallbackError) {
            throw serviceFallbackError;
          }
        }
      } else {
        var lastError = null;
        for (var i = 0; i < candidates.length; i += 1) {
          try {
            var candidate = candidates[i];
            response = await fetchRecordsForFieldsViaApi(config, candidate);
            var candidateRows = extractRowsFromQafResponse(response);
            // If fields endpoint returns only system/meta columns, switch to view-based records.
            if (candidateRows.length && !hasBusinessFields(candidateRows)) {
              try {
                var viaView = await fetchRecordsViaViewApi(config, candidate);
                var viaViewRows = extractRowsFromQafResponse(viaView);
                if (viaViewRows.length) response = viaView;
              } catch (_) {}
            }
            break;
          } catch (error) {
            lastError = error;
          }
        }
        if (response == null) {
          for (var v = 0; v < candidates.length; v += 1) {
            try {
              response = await fetchRecordsViaViewApi(config, candidates[v]);
              var fallbackRows = extractRowsFromQafResponse(response);
              if (fallbackRows.length) break;
              response = null;
            } catch (error) {
              lastError = error;
            }
          }
        }
        if (response == null) {
          throw new Error(
            "QafService.GetItems is not available and REST fallback failed for repository/object candidates: " +
              candidates.join(", ") +
              (lastError ? ". Last error: " + (lastError.message || String(lastError)) : "")
          );
        }
      }
  
      return {
        raw: response,
        rows: normalizeRowsForTable(response)
      };
    }
  
    // Keep newest records on top for default/unsorted views.
    function sortRowsNewestFirst(rows, options) {
      var list = Array.isArray(rows) ? rows.slice() : [];
      var config = options || {};
      var dateKeys = Array.isArray(config.dateKeys) && config.dateKeys.length
        ? config.dateKeys
        : ["CreatedDate", "Created Date", "ModifiedDate", "Modified Date"];
  
      function toTime(value) {
        if (value == null || value === "") return null;
        var ms = new Date(value).getTime();
        return Number.isFinite(ms) ? ms : null;
      }
  
      function readRowTime(row) {
        if (!row || typeof row !== "object") return null;
        for (var i = 0; i < dateKeys.length; i += 1) {
          var key = dateKeys[i];
          if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
          var parsed = toTime(row[key]);
          if (parsed != null) return parsed;
        }
        return null;
      }
  
      return list
        .map(function (row, index) {
          return { row: row, index: index, time: readRowTime(row) };
        })
        .sort(function (a, b) {
          if (a.time != null && b.time != null) {
            if (a.time !== b.time) return b.time - a.time;
            return a.index - b.index;
          }
          if (a.time != null) return -1;
          if (b.time != null) return 1;
          return a.index - b.index;
        })
        .map(function (entry) {
          return entry.row;
        });
    }
  
    // Open OOTB add form through whichever add method is available.
    function openAddForm(options) {
      var config = options || {};
      var targets = asRepositoryTargets(config.repositoryName || config.repository, config.objectID || config.objectId);
      var onDone = typeof config.onDone === "function" ? config.onDone : function () {};
      if (!targets.length) return false;
      var argSets = targets.map(function (target) {
        return [target, onDone];
      });
      return callQafPageServiceMethod(
        ["AddItem", "AddNewItem", "CreateItem", "OpenCreateItem", "OpenNewItem", "NewItem"],
        argSets
      );
    }
  
    // Open OOTB view form for a specific record.
    function openViewForm(options) {
      var config = options || {};
      var recordID = toSafeString(config.recordID || config.recordId || config.id);
      var targets = asRepositoryTargets(config.repositoryName || config.repository, config.objectID || config.objectId);
      var onDone = typeof config.onDone === "function" ? config.onDone : function () {};
      if (!recordID || !targets.length) return false;
      var argSets = [];
      for (var i = 0; i < targets.length; i += 1) {
        argSets.push([targets[i], recordID, onDone]);
        argSets.push([targets[i], recordID]);
      }
      argSets.push([recordID, onDone]);
      argSets.push([recordID]);
      return callQafPageServiceMethod(["ViewItem"], argSets);
    }
  
    // Open OOTB edit form for a specific record.
    function openEditForm(options) {
      var config = options || {};
      var recordID = toSafeString(config.recordID || config.recordId || config.id);
      var targets = asRepositoryTargets(config.repositoryName || config.repository, config.objectID || config.objectId);
      var onDone = typeof config.onDone === "function" ? config.onDone : function () {};
      if (!recordID || !targets.length) return false;
      var argSets = [];
      for (var i = 0; i < targets.length; i += 1) {
        argSets.push([targets[i], recordID, onDone]);
        argSets.push([targets[i], recordID]);
      }
      argSets.push([recordID, onDone]);
      argSets.push([recordID]);
      return callQafPageServiceMethod(["EditItem"], argSets);
    }
  
    // Delete a record through the page service.
    function deleteRecord(options) {
      var config = options || {};
      var recordID = toSafeString(config.recordID || config.recordId || config.id);
      var onDone = typeof config.onDone === "function" ? config.onDone : function () {};
      if (!recordID) return false;
      return callQafPageServiceMethod(
        ["DeleteItem"],
        [
          [recordID, onDone],
          [recordID]
        ]
      );
    }
  
    // Unified OOTB form dispatcher: add/view/edit/delete.
    function openOotbForm(options) {
      var config = options || {};
      var mode = toSafeString(config.mode || "add").toLowerCase();
      if (mode === "view") return openViewForm(config);
      if (mode === "edit") return openEditForm(config);
      if (mode === "delete") return deleteRecord(config);
      return openAddForm(config);
    }
  
    // Display dates as DD/MM/YYYY (functional spec for requisition grids).
    function pad2(n) {
      return String(n).length < 2 ? "0" + n : String(n);
    }
  
    function formatDateDDMMYYYY(value) {
      if (value == null || value === "") return "";
      if (value instanceof Date) {
        var d0 = value;
        if (!Number.isFinite(d0.getTime())) return "";
        return pad2(d0.getDate()) + "/" + pad2(d0.getMonth() + 1) + "/" + d0.getFullYear();
      }
      var s = String(value).trim();
      if (!s) return "";
      var isoDay = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
      if (isoDay) {
        return pad2(Number(isoDay[3])) + "/" + pad2(Number(isoDay[2])) + "/" + Number(isoDay[1]);
      }
      var parsed = new Date(s);
      if (Number.isFinite(parsed.getTime())) {
        return pad2(parsed.getDate()) + "/" + pad2(parsed.getMonth() + 1) + "/" + parsed.getFullYear();
      }
      return s;
    }
  
    // Reusable row action dispatcher for table menus (view/edit/delete).
    function dispatchRowAction(options) {
      var config = options || {};
      var action = toSafeString(config.action || config.mode).toLowerCase();
      if (!action) return false;
      if (action !== "view" && action !== "edit" && action !== "delete") return false;
      return openOotbForm({
        mode: action,
        recordID: config.recordID || config.recordId || config.id,
        repositoryName: config.repositoryName || config.repository,
        objectID: config.objectID || config.objectId,
        onDone: config.onDone
      });
    }
  
    // Reusable CSV exporter for table/grid rows.
    function exportCsv(options) {
      var config = options || {};
      var rows = Array.isArray(config.rows) ? config.rows : [];
      var filename = toSafeString(config.filename) || "export.csv";
      var includeHeaders = config.includeHeaders !== false;
      var delimiter = toSafeString(config.delimiter) || ",";
      var lineBreak = toSafeString(config.lineBreak) || "\n";
      var includeBom = config.includeBom !== false;
      var valueResolver = typeof config.valueResolver === "function" ? config.valueResolver : null;
  
      function normalizeColumn(col) {
        if (col == null) return null;
        if (typeof col === "string") {
          var keyText = toSafeString(col);
          if (!keyText) return null;
          return { key: keyText, label: keyText };
        }
        if (typeof col === "object") {
          var key = toSafeString(col.key || col.field || col.name || col.label);
          if (!key) return null;
          var label = toSafeString(col.label || col.title || key) || key;
          return { key: key, label: label };
        }
        return null;
      }
  
      function inferColumnsFromRows(rowsInput) {
        var seen = {};
        var out = [];
        for (var i = 0; i < rowsInput.length; i += 1) {
          var row = rowsInput[i];
          if (!row || typeof row !== "object") continue;
          var keys = Object.keys(row);
          for (var k = 0; k < keys.length; k += 1) {
            var key = toSafeString(keys[k]);
            if (!key) continue;
            var lower = key.toLowerCase();
            if (seen[lower]) continue;
            seen[lower] = true;
            out.push({ key: key, label: key });
          }
        }
        return out;
      }
  
      var providedColumns = Array.isArray(config.columns) ? config.columns : [];
      var columns = providedColumns.map(normalizeColumn).filter(Boolean);
      if (!columns.length) columns = inferColumnsFromRows(rows);
      if (!columns.length) columns = [{ key: "RecordID", label: "RecordID" }];
  
      function toCellText(value) {
        if (value == null) return "";
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "object") return lookupToText(value, "");
        return String(value);
      }
  
      function quoteCsvCell(value) {
        var text = String(value == null ? "" : value);
        return '"' + text.replace(/"/g, '""') + '"';
      }
  
      var lines = [];
      if (includeHeaders) {
        lines.push(
          columns
            .map(function (c) {
              return quoteCsvCell(c.label);
            })
            .join(delimiter)
        );
      }
  
      for (var r = 0; r < rows.length; r += 1) {
        var rowValue = rows[r];
        var csvRow = columns
          .map(function (col, cIndex) {
            var raw = valueResolver
              ? valueResolver({
                  row: rowValue,
                  column: col,
                  rowIndex: r,
                  columnIndex: cIndex,
                  defaultValue: rowValue && typeof rowValue === "object" ? rowValue[col.key] : ""
                })
              : rowValue && typeof rowValue === "object"
                ? rowValue[col.key]
                : "";
            return quoteCsvCell(toCellText(raw));
          })
          .join(delimiter);
        lines.push(csvRow);
      }
  
      var csvText = (includeBom ? "\uFEFF" : "") + lines.join(lineBreak);
      var blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
  
      return {
        filename: filename,
        rowCount: rows.length,
        columnCount: columns.length,
        csvText: csvText
      };
    }
  
    window.QafLibrary = {
      getQafPageService: getQafPageService,
      buildPageUrl: buildPageUrl,
      lookupToText: lookupToText,
      fetchRepositoryData: fetchRepositoryData,
      sortRowsNewestFirst: sortRowsNewestFirst,
      // openViewForm/openEditForm/deleteRecord are the three routes
      // dispatchRowAction picks between; they stay public because a page with a
      // custom row menu drives them directly.
      openAddForm: openAddForm,
      openViewForm: openViewForm,
      openEditForm: openEditForm,
      deleteRecord: deleteRecord,
      openOotbForm: openOotbForm,
      dispatchRowAction: dispatchRowAction,
      exportCsv: exportCsv,
      formatDateDDMMYYYY: formatDateDDMMYYYY
    };
  })();
  (function () {
    "use strict";

    // =====================================================================
    // Reusable dropdown helpers (styling reference: the toolbar "All Types"
    // dropdown). Any page can use these instead of re-implementing an
    // open/close list, an outside-click-to-close handler, and a
    // viewport-safe floating panel.
    // =====================================================================

    // Positions a floating list against its trigger by portaling it to
    // <body> while open, so it is never clipped by an ancestor's overflow.
    // root/trigger/list are plain elements; call attach() to open,
    // detach() to close, reposition() to re-measure (e.g. on external resize).
    function createDropdownPortal(root, trigger, list) {
      var anchor = document.createComment("qaf-dropdown-portal");
      var isPortaled = false;

      function positionList() {
        if (!isPortaled) return;
        var rect = trigger.getBoundingClientRect();
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

        list.style.right = "auto";
        list.style.bottom = "auto";
        list.style.minWidth = "";
        list.style.maxWidth = "";
        list.style.width = rect.width + "px";

        var listWidth = list.offsetWidth;
        var left = rect.left;
        if (left + listWidth > viewportWidth - 8) {
          left = Math.max(8, viewportWidth - 8 - listWidth);
        }
        list.style.left = left + "px";

        var listHeight = list.offsetHeight;
        var spaceBelow = viewportHeight - rect.bottom - 8;
        if (spaceBelow < listHeight && rect.top - 8 > spaceBelow) {
          list.style.top = Math.max(4, rect.top - 4 - listHeight) + "px";
        } else {
          list.style.top = rect.bottom + 4 + "px";
        }
      }

      function attach() {
        if (!isPortaled) {
          if (list.parentNode) list.parentNode.insertBefore(anchor, list);
          document.body.appendChild(list);
          list.classList.add("qaf-dd-menu--portal");
          isPortaled = true;
          window.addEventListener("scroll", positionList, true);
          window.addEventListener("resize", positionList);
        }
        positionList();
      }

      function detach() {
        if (!isPortaled) return;
        window.removeEventListener("scroll", positionList, true);
        window.removeEventListener("resize", positionList);
        list.classList.remove("qaf-dd-menu--portal");
        list.style.top = "";
        list.style.left = "";
        list.style.right = "";
        list.style.bottom = "";
        list.style.width = "";
        list.style.minWidth = "";
        list.style.maxWidth = "";
        if (anchor.parentNode) {
          anchor.parentNode.insertBefore(list, anchor);
          anchor.parentNode.removeChild(anchor);
        } else if (root) {
          root.appendChild(list);
        }
        isPortaled = false;
      }

      return { attach: attach, detach: detach, reposition: positionList };
    }

    // Shared registry so any number of open dropdowns/menus can be closed
    // together on an outside click or Escape, without each page wiring its
    // own document-level listeners.
    var outsideCloseHandlers = [];
    var outsideCloseBound = false;
    function bindOutsideClose() {
      if (outsideCloseBound) return;
      outsideCloseBound = true;
      document.addEventListener("click", function (event) {
        outsideCloseHandlers.forEach(function (entry) {
          if (!entry.contains(event.target)) entry.close();
        });
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          outsideCloseHandlers.forEach(function (entry) {
            entry.close();
          });
        }
      });
    }

    // contains(target) should return true when target is part of the
    // dropdown (trigger or list) and a click there should NOT close it.
    function registerOutsideClose(contains, close) {
      bindOutsideClose();
      outsideCloseHandlers.push({ contains: contains, close: close });
    }

    // Shows/hides a small inline clear ("x") control based on whether a
    // value is present. Shared by dropdown clear buttons and search bars.
    function toggleClearVisibility(clearBtn, hasValue) {
      if (!clearBtn) return;
      if (hasValue) clearBtn.removeAttribute("hidden");
      else clearBtn.setAttribute("hidden", "");
    }

    // =====================================================================
    // Reusable search bar behavior: wires a text input + optional clear
    // button so both dashboards (and future pages) share one implementation
    // of "show clear button when there's text, clear on click, Enter to
    // submit".
    // =====================================================================
    function bindSearchClear(input, clearBtn, callbacks) {
      if (!input) return null;
      var opts = callbacks || {};

      function syncClearButton() {
        toggleClearVisibility(clearBtn, String(input.value || "").length > 0);
      }

      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        syncClearButton();
        if (typeof opts.onEnter === "function") opts.onEnter(input.value);
      });

      input.addEventListener("input", function () {
        syncClearButton();
        if (typeof opts.onInput === "function") opts.onInput(input.value);
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          input.value = "";
          syncClearButton();
          if (typeof opts.onClear === "function") opts.onClear();
          input.focus();
        });
      }

      syncClearButton();
      return { syncClearButton: syncClearButton };
    }

    // =====================================================================
    // Reusable API date parsing/formatting.
    // parseApiDateValue supports every format the backend is known to send:
    //   - "M/D/YYYY h:mm:ss AM/PM" (month-first, with day/month
    //     disambiguation so a day > 12 is never mistaken for a month)
    //   - "YYYY-MM-DDTHH:mm:ss" (no zone suffix -> treated as UTC)
    //   - ISO strings with "Z" or an explicit +HH:mm / -HH:mm offset
    //   - "/Date(1690000000000)/" (.NET serialised dates)
    //   - "DD/MM/YYYY HH:mm:ss" (this library's own display strings)
    //   - Date objects and epoch numbers
    // Returns { date: Date, hasTime: boolean } or null.
    // =====================================================================
    function parseApiDateValue(input) {
      if (input == null || input === "") return null;

      if (input instanceof Date) {
        return isFinite(input.getTime()) ? { date: input, hasTime: true } : null;
      }
      if (typeof input === "number" && isFinite(input)) {
        var fromEpoch = new Date(input);
        return isFinite(fromEpoch.getTime()) ? { date: fromEpoch, hasTime: true } : null;
      }

      var text = String(input).trim();
      if (!text) return null;

      // .NET: /Date(1690000000000)/ or /Date(1690000000000+0530)/
      var dotNet = /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/.exec(text);
      if (dotNet) {
        var fromTicks = new Date(Number(dotNet[1]));
        return isFinite(fromTicks.getTime()) ? { date: fromTicks, hasTime: true } : null;
      }

      // ISO-8601: 2026-07-28T05:24:37 (bare = UTC), optionally with Z or an offset.
      var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,7}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(
        text
      );
      if (iso) {
        var isoHasTime = iso[4] != null;
        var zone = iso[8] || "";
        if (zone) {
          var zoned = new Date(text.replace(" ", "T"));
          return isFinite(zoned.getTime()) ? { date: zoned, hasTime: isoHasTime } : null;
        }
        var millisText = iso[7] != null ? String(iso[7]).slice(0, 3) : "";
        while (millisText.length && millisText.length < 3) millisText += "0";
        var isoUtc = new Date(
          Date.UTC(
            Number(iso[1]),
            Number(iso[2]) - 1,
            Number(iso[3]),
            isoHasTime ? Number(iso[4]) : 0,
            iso[5] != null ? Number(iso[5]) : 0,
            iso[6] != null ? Number(iso[6]) : 0,
            millisText ? Number(millisText) : 0
          )
        );
        return isFinite(isoUtc.getTime()) ? { date: isoUtc, hasTime: isoHasTime } : null;
      }

      // Slash format, with or without a time part and AM/PM suffix.
      var slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(?:([AaPp])\.?[Mm]\.?)?)?$/.exec(
        text
      );
      if (slash) {
        var first = Number(slash[1]);
        var second = Number(slash[2]);
        var year = Number(slash[3]);

        // The API sends month-first (MM/DD/YYYY). A first component above 12
        // can only be a day, which also lets DD/MM/YYYY display strings
        // (as produced by this library) round-trip correctly if re-parsed.
        var monthFirst = !(first > 12 && second <= 12);
        var month = monthFirst ? first : second;
        var day = monthFirst ? second : first;
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;

        var slashHasTime = slash[4] != null;
        var hours = slashHasTime ? Number(slash[4]) : 0;
        var minutes = slash[5] != null ? Number(slash[5]) : 0;
        var seconds = slash[6] != null ? Number(slash[6]) : 0;
        var meridiem = slash[7] ? slash[7].toLowerCase() : "";
        if (meridiem === "p" && hours < 12) hours += 12;
        if (meridiem === "a" && hours === 12) hours = 0;

        var slashUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
        if (!isFinite(slashUtc.getTime())) return null;
        if (slashUtc.getUTCMonth() !== month - 1 || slashUtc.getUTCDate() !== day) return null;
        return { date: slashUtc, hasTime: slashHasTime };
      }

      var fallback = new Date(text);
      return isFinite(fallback.getTime()) ? { date: fallback, hasTime: true } : null;
    }

    // True when the value carries no time component (a calendar date only).
    function isApiDateValueDateOnly(value) {
      var parsed = parseApiDateValue(value);
      return parsed ? !parsed.hasTime : false;
    }

    /* =====================================================================
     * CS_SETTING theme.
     *
     * The tenant stores its button colors in the CS_SETTING entry of
     * localStorage; global.css's .qaf-cs-theme-btn and .qaf-btn--square-inverse
     * components are both written in terms of the two custom properties this
     * publishes:
     *
     *   --ButtonBackGroundColor   the tenant's button background
     *   --ButtonTextColor         the tenant's button text/glyph color
     *
     * Every page was carrying its own copy of the reader, and CS_SETTING is
     * stored in more than one shape, so the parsing is the part worth having in
     * one place. All the shapes seen in the wild are handled:
     *
     *   [{ QAFTHEME: [{ ButtonBackGroundColor, ButtonTextColor }] }]
     *   { QAFTHEME: { ... } }
     *   { value: "<the JSON above, as a string>" }
     *   { ButtonBackGroundColor, ButtonTextColor }          (flat)
     *
     * With no theme stored nothing is written and the components' own fallbacks
     * apply, so an untenanted page looks exactly as it did.
     * ===================================================================== */
    var CS_SETTING_KEY = "CS_SETTING";

    function csTrim(value) {
      return typeof value === "string" ? value.trim() : "";
    }

    function csParseJson(raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    }

    // Flatten every object worth inspecting out of the stored value, whatever
    // shape it arrived in: array entries, a nested `value` (which may itself be
    // a JSON string), and any QAFTHEME payload.
    function csCollectCandidates(node, out, depth) {
      var list = out || [];
      var level = depth || 0;
      if (node == null || level > 6) return list;

      if (typeof node === "string") {
        var reparsed = csParseJson(node);
        if (reparsed != null) csCollectCandidates(reparsed, list, level + 1);
        return list;
      }
      if (typeof node !== "object") return list;

      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i += 1) csCollectCandidates(node[i], list, level + 1);
        return list;
      }

      list.push(node);
      if (node.value != null) csCollectCandidates(node.value, list, level + 1);
      if (node.QAFTHEME != null) csCollectCandidates(node.QAFTHEME, list, level + 1);
      if (node.Theme != null) csCollectCandidates(node.Theme, list, level + 1);
      return list;
    }

    function csFirstNonEmpty(source, keys) {
      for (var i = 0; i < keys.length; i += 1) {
        var value = csTrim(source[keys[i]]);
        if (value) return value;
      }
      return "";
    }

    // Reads the tenant's button colors. Both the page's own storage and the
    // parent frame's are consulted, since a page mounted in the portal's iframe
    // does not always own the entry.
    function readCsSettingButtonTheme() {
      var raws = [];
      try { if (window.localStorage) raws.push(window.localStorage.getItem(CS_SETTING_KEY)); } catch (_) {}
      try {
        if (window.parent && window.parent !== window && window.parent.localStorage) {
          raws.push(window.parent.localStorage.getItem(CS_SETTING_KEY));
        }
      } catch (_) {}

      var backgroundColor = "";
      var textColor = "";
      for (var r = 0; r < raws.length; r += 1) {
        if (!raws[r]) continue;
        var candidates = csCollectCandidates(csParseJson(raws[r]) || raws[r], [], 0);
        for (var c = 0; c < candidates.length; c += 1) {
          backgroundColor = backgroundColor || csFirstNonEmpty(candidates[c], [
            "ButtonBackGroundColor", "ButtonBackgroundColor",
            "buttonBackGroundColor", "buttonBackgroundColor"
          ]);
          textColor = textColor || csFirstNonEmpty(candidates[c], ["ButtonTextColor", "buttonTextColor"]);
        }
        if (backgroundColor || textColor) break;
      }
      return { backgroundColor: backgroundColor, textColor: textColor };
    }

    function resolveThemeHost(host) {
      if (typeof host === "string") return document.querySelector(host);
      if (host && host.style) return host;
      return document.body || document.documentElement;
    }

    // Publishes the pair onto `host` (element or selector) and marks it as the
    // theme scope, which is what global.css's .qaf-cs-theme-host rules key off.
    // Returns true when a stored theme was found.
    function applyCsSettingTheme(host) {
      var hostEl = resolveThemeHost(host);
      if (!hostEl || !hostEl.style) return false;

      var theme = readCsSettingButtonTheme();
      if (theme.backgroundColor) hostEl.style.setProperty("--ButtonBackGroundColor", theme.backgroundColor);
      else hostEl.style.removeProperty("--ButtonBackGroundColor");

      if (theme.textColor) hostEl.style.setProperty("--ButtonTextColor", theme.textColor);
      else hostEl.style.removeProperty("--ButtonTextColor");

      hostEl.classList.add("qaf-cs-theme-host");
      return Boolean(theme.backgroundColor || theme.textColor);
    }

    /*
     * The inverse pairing, for the square icon buttons: the tenant's TEXT color
     * fills the button and its BACKGROUND color paints the border and glyph.
     * global.css's .qaf-btn--square-inverse reads the same two properties, so
     * publishing them is all this does beyond applyCsSettingTheme - plus
     * tagging the square buttons inside the host with the modifier, which is
     * what opts them into that pairing.
     *
     * Pass { markButtons: false } when the page's square buttons are rendered
     * after boot (or re-rendered): they then carry the modifier in their own
     * markup instead of being tagged once here.
     */
    function applySquareButtonInverseTheme(host, options) {
      var config = options || {};
      var hostEl = resolveThemeHost(host);
      if (!hostEl || !hostEl.style) return false;

      var applied = applyCsSettingTheme(hostEl);
      if (config.markButtons !== false) {
        hostEl.querySelectorAll(".qaf-btn--square").forEach(function (button) {
          button.classList.add("qaf-btn--square-inverse");
        });
      }
      return applied;
    }

    /* =====================================================================
     * First-paint hold (render-flicker guard).
     *
     * Pages whose markup ships a placeholder table that the loader immediately
     * replaces used to flash "table appears, vanishes, comes back with data".
     * holdFirstPaint() hides the given selectors until release() is called, and
     * - critically - always reveals them on its own after `timeout` ms, so a
     * slow or failed API can delay the page but never hide it. Every consumer
     * shares one implementation instead of hand-rolling the veil.
     *
     *   var veil = QafLibrary.holdFirstPaint({ selectors: [".my-page"] });
     *   ... after the first render ...
     *   veil.release();
     *
     * Options:
     *   selectors     what to hide. Defaults to the nav dock + page shell.
     *   timeout       ms after which the page is revealed no matter what.
     *   waitForFonts  also wait on document.fonts.ready before revealing, for
     *                 pages where late webfonts re-rendered every label just
     *                 after the page became visible. Still bounded by timeout.
     * ===================================================================== */
    var PRELOAD_CLASS = "qaf-preload";
    var PRELOAD_STYLE_ID = "qaf-preload-style";

    function holdFirstPaint(options) {
      var config = options || {};
      var selectors = Array.isArray(config.selectors) && config.selectors.length
        ? config.selectors
        : [".qaf-navdock", ".page-shell"];
      var timeout = Number(config.timeout);
      if (!Number.isFinite(timeout) || timeout <= 0) timeout = 2000;
      var waitForFonts = Boolean(config.waitForFonts);

      var root = document.documentElement;
      var released = false;
      var timer = null;

      // The rule is injected here rather than trusted to the page's <head>: when
      // the portal mounts only the body markup, a <style> in that file never
      // ships and the veil silently does nothing.
      if (!document.getElementById(PRELOAD_STYLE_ID)) {
        var style = document.createElement("style");
        style.id = PRELOAD_STYLE_ID;
        style.textContent = selectors
          .map(function (selector) {
            return "html." + PRELOAD_CLASS + " " + selector + "{visibility:hidden!important;}";
          })
          .join("");
        (document.head || document.documentElement).appendChild(style);
      }
      root.classList.add(PRELOAD_CLASS);

      function reveal() {
        if (timer) window.clearTimeout(timer);
        timer = null;

        function show() {
          root.classList.remove(PRELOAD_CLASS);
        }

        // Two frames: the first lets the just-written DOM lay out, the second
        // paints it. Revealing inside the same frame is what let a half-built
        // table show for one frame. rAF is paused in a background tab, so it is
        // raced against a short timer - a hidden page must never be waiting on a
        // frame that will not come until the tab is focused.
        if (typeof window.requestAnimationFrame !== "function") return show();
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(show);
        });
        window.setTimeout(show, 120);
      }

      function release() {
        if (released) return;
        released = true;

        var fontsReady = waitForFonts && document.fonts && document.fonts.ready;
        if (fontsReady && typeof fontsReady.then === "function") {
          // The timeout below is deliberately left running: a slow font host may
          // delay the reveal, never prevent it.
          fontsReady.then(reveal, reveal);
          return;
        }
        reveal();
      }

      // The safety net. It reveals directly rather than through release(), so it
      // still fires even once the page has asked to wait on something slow.
      timer = window.setTimeout(function () {
        timer = null;
        released = true;
        reveal();
      }, timeout);

      return { release: release, isReleased: function () { return released; } };
    }

    window.QafLibrary = Object.assign({}, window.QafLibrary || {}, {
      Dropdown: {
        createPortal: createDropdownPortal,
        registerOutsideClose: registerOutsideClose,
        toggleClearVisibility: toggleClearVisibility
      },
      bindSearchClear: bindSearchClear,
      parseApiDateValue: parseApiDateValue,
      isApiDateValueDateOnly: isApiDateValueDateOnly,
      readCsSettingButtonTheme: readCsSettingButtonTheme,
      applyCsSettingTheme: applyCsSettingTheme,
      applySquareButtonInverseTheme: applySquareButtonInverseTheme,
      holdFirstPaint: holdFirstPaint
    });
  })();