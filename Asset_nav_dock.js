(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Menu data                                                          */
  /* ------------------------------------------------------------------ */

  var NAV_MENU_ITEMS = [
    { MenuId: 1, DisplayName: "Asset Dashboard", Url: "/pages/AssetDashboard", Sequence: 1, Icon: "fa fa-tachometer", IconColor: "rgb(236, 80, 110)" },

    { MenuId: 2, DisplayName: "Asset Inventory", Url: "/pages/AssetInventory", Sequence: 2, PageTitle: "Asset Inventory", Icon: "fa fa-minus-circle", IconColor: "rgb(78, 204, 253)" },

    { MenuId: 3, DisplayName: "Asset Requisition", Url: "/pages/AssetRequisition", Sequence: 3, Icon: "fa fa-podcast", IconColor: "rgb(58, 134, 255)" },

    { MenuId: 6, DisplayName: "Asset Search", Url: "/pages/AssetSearch", Sequence: 6, PageTitle: "Asset Search", Icon: "fa fa-search", IconColor: "rgb(136, 60, 208)" },

    { MenuId: 7, DisplayName: "Contracts & Vendors", Url: "/pages/Contracts&Vendors", Sequence: 7, PageTitle: "Contracts & Vendors", Icon: "fa fa-file-text-o", IconColor: "rgb(34, 197, 94)" },

    { MenuId: 8, DisplayName: "Software Licenses", Url: "/pages/SoftwareLicenses", Sequence: 8, PageTitle: "Software Licenses", Icon: "fa fa-key", IconColor: "rgb(79, 70, 229)" },

    /* "Analytics" dropdown — groups the aging/lifecycle and asset value
       pages under one collapsible parent instead of two top-level items. */
    {
      MenuId: 100,
      DisplayName: "Analytics",
      Sequence: 9,
      PageTitle: "Analytics",
      Icon: "fa fa-bar-chart",
      IconColor: "rgb(245, 158, 11)",

      Children: [
        { MenuId: 9, DisplayName: "Aging & Lifecycle", Url: "/pages/AgingLifecycle", Sequence: 1, PageTitle: "Aging & Lifecycle", Icon: "fa fa-hourglass-half", IconColor: "rgb(245, 158, 11)" },

        { MenuId: 10, DisplayName: "Asset Value Dashboard", Url: "/pages/AssetValueDashboard", Sequence: 2, PageTitle: "Asset Value Dashboard", Icon: "fa fa-line-chart", IconColor: "rgb(37, 99, 235)" },

        /* New — Lease Asset Dashboard, placed directly after Asset Value
           Dashboard per request. MenuId 13 is the next free id (12 was the
           highest already in use); Sequence 3 keeps it last within
           Analytics. Adjust Url below if the real deployed route differs —
           isNavItemActive() highlights this entry by checking whether
           window.location.pathname contains this Url (case-insensitive),
           so the two need to match once this page is actually deployed. */
        { MenuId: 13, DisplayName: "Lease Asset Dashboard", Url: "/pages/LeaseAssetDashboard", Sequence: 3, PageTitle: "Lease Asset Dashboard", Icon: "fa fa-building", IconColor: "rgb(139, 124, 246)" },
      ],
    },

    { MenuId: 11, DisplayName: "Permission", Url: "/pages/AssetPermission", Sequence: 11, Icon: "fa fa-lock", IconColor: "rgb(255, 146, 16)" },

    { MenuId: 12, DisplayName: "Setting", Url: "/pages/Setting", Sequence: 12, Icon: "fa fa-cog", IconColor: "rgb(236, 80, 110)" },
  ];

  /* ------------------------------------------------------------------ */
  /* Permission constants                                               */
  /* ------------------------------------------------------------------ */

  var NEW_LP_STORAGE_KEY = "NewLP";
  var SUPER_ADMIN_NEW_LP = "11";
  var ASSET_ADMIN_NEW_LP = "22-3";
  var ASSET_EDIT_NEW_LP = "22-2";
  var ASSET_READ_ONLY_NEW_LP = "22-1";

  var FULL_ACCESS_MENU_IDS = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13];
  var LIMITED_ACCESS_MENU_IDS = [2, 3, 6];

  /* ------------------------------------------------------------------ */
  /* Permission helpers                                                 */
  /* ------------------------------------------------------------------ */

  function tryParseJson(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  function normalizeNewLpEntry(value) {
    return String(value == null ? "" : value)
      .trim()
      .replace(/^["']+|["']+$/g, "");
  }

  function readNewLpRawValue() {
    if (!window.localStorage) return "";
    var direct = window.localStorage.getItem(NEW_LP_STORAGE_KEY);
    if (direct != null && String(direct).trim()) return direct;

    var userKeyRaw = window.localStorage.getItem("user_key");
    if (!userKeyRaw) return "";

    var parsed = tryParseJson(userKeyRaw);
    if (!parsed || typeof parsed !== "object") return "";
    if (parsed.NewLP == null) return "";

    return parsed.NewLP;
  }

  function parseNewLpEntries() {
    var raw = readNewLpRawValue();
    if (raw == null || raw === "") return [];

    if (Array.isArray(raw)) {
      return raw.map(normalizeNewLpEntry).filter(Boolean);
    }

    if (typeof raw === "object") {
      return Object.keys(raw)
        .map(function (key) {
          return normalizeNewLpEntry(key);
        })
        .filter(Boolean);
    }

    var asString = String(raw).trim();
    if (!asString) return [];

    var parsedJson = tryParseJson(asString);
    if (Array.isArray(parsedJson)) {
      return parsedJson.map(normalizeNewLpEntry).filter(Boolean);
    }

    return asString
      .split(",")
      .map(normalizeNewLpEntry)
      .filter(Boolean);
  }

  function hasNewLpEntry(entries, target) {
    var needle = normalizeNewLpEntry(target);
    if (!needle) return false;

    for (var i = 0; i < entries.length; i += 1) {
      if (normalizeNewLpEntry(entries[i]) === needle) return true;
    }

    return false;
  }

  function getAllowedMenuIdsFromNewLp(entries) {
    var allowed = {};
    var hasSuperAdmin = hasNewLpEntry(entries, SUPER_ADMIN_NEW_LP);
    var hasAssetAdmin = hasNewLpEntry(entries, ASSET_ADMIN_NEW_LP);
    var hasAssetEdit = hasNewLpEntry(entries, ASSET_EDIT_NEW_LP);
    var hasAssetReadOnly = hasNewLpEntry(entries, ASSET_READ_ONLY_NEW_LP);
    var menuIds = [];

    if (hasSuperAdmin || hasAssetAdmin) {
      menuIds = FULL_ACCESS_MENU_IDS;
    } else if (hasAssetEdit || hasAssetReadOnly) {
      menuIds = LIMITED_ACCESS_MENU_IDS;
    }

    for (var i = 0; i < menuIds.length; i += 1) {
      allowed[menuIds[i]] = true;
    }

    return allowed;
  }

  /* ------------------------------------------------------------------ */
  /* Menu filtering                                                     */
  /* ------------------------------------------------------------------ */

  /* Shallow-clones a menu item so filtering never mutates NAV_MENU_ITEMS. */
  function cloneMenuItem(item) {
    var clone = {};
    for (var key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) clone[key] = item[key];
    }
    return clone;
  }

  /* Items with a Children array are dropdown parents (e.g. "Analytics").
     A parent is kept only if at least one of its children is allowed,
     and its Children list is filtered down to just the allowed children —
     the same rule applied to any other item. */
  function filterMenuItemsByNewLp(items) {
    var candidateItems = Array.isArray(items) ? items : NAV_MENU_ITEMS;
    var entries = parseNewLpEntries();
    var allowedMenuIds = getAllowedMenuIdsFromNewLp(entries);

    return candidateItems
      .map(function (item) {
        if (Array.isArray(item.Children) && item.Children.length) {
          var allowedChildren = item.Children.filter(function (child) {
            return Boolean(allowedMenuIds[Number(child.MenuId)]);
          });

          if (!allowedChildren.length) return null;

          var clonedParent = cloneMenuItem(item);
          clonedParent.Children = allowedChildren;
          return clonedParent;
        }

        return Boolean(allowedMenuIds[Number(item.MenuId)]) ? item : null;
      })
      .filter(Boolean);
  }

  function sortBySequence(items) {
    return items.slice().sort(function (a, b) {
      return Number(a.Sequence || 0) - Number(b.Sequence || 0);
    });
  }

  function getMenuItems(items) {
    var candidateItems = Array.isArray(items) && items.length ? items : NAV_MENU_ITEMS;

    var visibleItems = filterMenuItemsByNewLp(candidateItems)
      .filter(function (item) {
        return !item.Disabled;
      })
      .map(function (item) {
        if (Array.isArray(item.Children) && item.Children.length) {
          var clonedParent = cloneMenuItem(item);
          clonedParent.Children = sortBySequence(
            item.Children.filter(function (child) {
              return !child.Disabled;
            })
          );
          return clonedParent;
        }

        return item;
      });

    return sortBySequence(visibleItems);
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                          */
  /* ------------------------------------------------------------------ */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toRelativeNavigateUrl(navigateTo) {
    var raw = String(navigateTo || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.charAt(0) === "/") return raw;
    return "/" + raw;
  }

  function isNavItemActive(item) {
    if (Array.isArray(item && item.Children) && item.Children.length) {
      return item.Children.some(function (child) {
        return isNavItemActive(child);
      });
    }

    var path = String((window.location && window.location.pathname) || "").toLowerCase();
    var url = String(item && item.Url ? item.Url : "")
      .toLowerCase()
      .replace(/^\//, "");

    return Boolean(url && path.indexOf(url) >= 0);
  }

  /* Renders the collapsible submenu for a dropdown parent (e.g. Analytics).
     Uses the same classes/markup pattern as top-level items so the existing
     stylesheet's colors and spacing apply unchanged — no styling added here. */
  function renderSubMenu(children) {
    if (!Array.isArray(children) || !children.length) return "";

    var items = children
      .map(function (child) {
        var label = escapeHtml(child.DisplayName || child.PageTitle || "Unnamed");
        var iconClass = escapeHtml(child.Icon || "fa fa-circle");
        var iconColor = "#000000";
        var href = escapeHtml(toRelativeNavigateUrl(child.Url));
        var activeClass = isNavItemActive(child) ? " is-active" : "";

        return (
          '<div class="qaf-navdock__item qaf-navdock__subitem">' +
            '<a class="qaf-navdock__link qaf-navdock__sublink' + activeClass + '" href="' + href + '" style="padding-left:44px;">' +
              '<i class="qaf-navdock__icon ' + iconClass + '" style="color:' + iconColor + ';" aria-hidden="true"></i>' +
              '<span class="qaf-navdock__label">' + label + '</span>' +
            '</a>' +
          '</div>'
        );
      })
      .join("");

    return '<div class="qaf-navdock__submenu" hidden>' + items + '</div>';
  }

  function renderNavDock(items, listElementId) {
    var navDockList = document.getElementById(listElementId || "qafNavdockList");
    if (!navDockList) return;

    navDockList.innerHTML = getMenuItems(items)
      .map(function (item) {
        var label = escapeHtml(item.DisplayName || item.PageTitle || "Unnamed");
        var iconClass = escapeHtml(item.Icon || "fa fa-circle");
        var iconColor = "#000000";
        var hasChildren = Array.isArray(item.Children) && item.Children.length > 0;
        var href = hasChildren ? "#" : toRelativeNavigateUrl(item.Url);
        var activeClass = hasChildren ? "" : (isNavItemActive(item) ? " is-active" : "");
        var subMenuHtml = hasChildren ? renderSubMenu(item.Children) : "";
        var expandAttr = hasChildren ? ' data-has-submenu="true"' : "";
        var toggleAttrs = hasChildren ? ' aria-expanded="false" aria-haspopup="true"' : "";
        var chevronHtml = hasChildren
          ? '<i class="qaf-navdock__chevron fa fa-angle-down" style="color:' + iconColor + ';transform:rotate(0deg);transition:transform 180ms ease;" aria-hidden="true"></i>'
          : "";

        return (
          '<div class="qaf-navdock__item"' + expandAttr + '>' +
            '<a class="qaf-navdock__link' + activeClass + '" href="' + escapeHtml(href) + '"' + toggleAttrs + '>' +
              '<i class="qaf-navdock__icon ' + iconClass + '" style="color:' + iconColor + ';" aria-hidden="true"></i>' +
              '<span class="qaf-navdock__label">' + label + '</span>' +
              chevronHtml +
            '</a>' +
            subMenuHtml +
          '</div>'
        );
      })
      .join("");

    bindSubMenuToggles(navDockList);
    expandActiveSubMenus(navDockList);
  }

  /* ------------------------------------------------------------------ */
  /* Submenu interactions                                               */
  /* ------------------------------------------------------------------ */

  function openSubMenu(item) {
    if (!item) return;

    var submenu = item.querySelector(".qaf-navdock__submenu");
    if (!submenu) return;

    submenu.hidden = false;
    item.classList.add("is-expanded");

    var link = item.querySelector(".qaf-navdock__link");
    if (link) link.setAttribute("aria-expanded", "true");

    var chevron = item.querySelector(".qaf-navdock__chevron");
    if (chevron) chevron.style.transform = "rotate(180deg)";
  }

  function closeAllSubMenus(navDockList) {
    if (!navDockList) return;

    navDockList.querySelectorAll('[data-has-submenu="true"]').forEach(function (item) {
      var submenu = item.querySelector(".qaf-navdock__submenu");
      if (submenu) submenu.hidden = true;

      item.classList.remove("is-expanded");

      var link = item.querySelector(".qaf-navdock__link");
      if (link) link.setAttribute("aria-expanded", "false");

      var chevron = item.querySelector(".qaf-navdock__chevron");
      if (chevron) chevron.style.transform = "rotate(0deg)";
    });
  }

  function expandActiveSubMenus(navDockList) {
    if (!navDockList) return;

    navDockList.querySelectorAll('[data-has-submenu="true"]').forEach(function (item) {
      var submenu = item.querySelector(".qaf-navdock__submenu");
      if (!submenu) return;

      var hasActive = submenu.querySelector(".qaf-navdock__sublink.is-active");
      if (!hasActive) return;

      openSubMenu(item);
    });
  }

  /* Re-bound after every render since renderNavDock() replaces the DOM nodes;
     no lingering listeners to worry about since old nodes are discarded. */
  function bindSubMenuToggles(navDockList) {
    if (!navDockList) return;

    navDockList.querySelectorAll('[data-has-submenu="true"] > .qaf-navdock__link').forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();

        var item = link.parentElement;
        var submenu = item.querySelector(".qaf-navdock__submenu");
        if (!submenu) return;

        var isOpen = item.classList.contains("is-expanded");
        closeAllSubMenus(navDockList);
        if (!isOpen) openSubMenu(item);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Toggle / init wiring                                               */
  /* ------------------------------------------------------------------ */

  function bindToggle(toggleElementId) {
    var navToggle = document.getElementById(toggleElementId || "qafNavToggle");
    if (!navToggle || navToggle.__qafNavBound) return;
    navToggle.__qafNavBound = true;

    navToggle.addEventListener("click", function () {
      var expanded = document.body.classList.toggle("qaf-navdock-expanded");
      navToggle.setAttribute("aria-expanded", String(expanded));
    });
  }

  function closeFloatingRowMenus() {
    document.querySelectorAll(".row-actions__menu, .more-menu").forEach(function (menu) {
      menu.setAttribute("hidden", "");
      menu.classList.remove("is-open");
    });
  }

  function bindNavDockClosesFloatingMenus() {
    if (document.documentElement.__qafNavDockCloseFloatingMenusBound) return;

    var dock = document.querySelector(".qaf-navdock");
    if (!dock) return;

    document.documentElement.__qafNavDockCloseFloatingMenusBound = true;
    dock.addEventListener("pointerenter", closeFloatingRowMenus);
  }

  function init(options) {
    var config = options || {};
    bindToggle(config.toggleElementId);
    renderNavDock(config.items, config.listElementId);
    bindNavDockClosesFloatingMenus();
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  window.QafNavDock = {
    init: init,
    render: renderNavDock,
    defaults: NAV_MENU_ITEMS.slice(),
    parseNewLpEntries: parseNewLpEntries,
    filterMenuItemsByNewLp: filterMenuItemsByNewLp,
  };

  /* ------------------------------------------------------------------ */
  /* Auto-init                                                          */
  /* ------------------------------------------------------------------ */

  function onDocumentReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function autoInitNavDock() {
    if (!document.getElementById("qafNavdockList")) return;

    var api = window.QafNavDock;
    if (!api || typeof api.init !== "function") return;

    api.init({
      items: api.defaults,
      toggleElementId: "qafNavToggle",
      listElementId: "qafNavdockList",
    });
  }

  onDocumentReady(autoInitNavDock);

  window.renderNavDock = function (items, listElementId) {
    var api = window.QafNavDock;

    if (api && typeof api.init === "function") {
      api.init({
        items: items || api.defaults,
        toggleElementId: "qafNavToggle",
        listElementId: listElementId || "qafNavdockList",
      });
      return;
    }

    init({
      items: items,
      toggleElementId: "qafNavToggle",
      listElementId: listElementId || "qafNavdockList",
    });
  };

  window.toggleQafNavDockCollapse = function () {
    var expanded = document.body.classList.toggle("qaf-navdock-expanded");
    var navToggle = document.getElementById("qafNavToggle");
    if (navToggle) navToggle.setAttribute("aria-expanded", String(expanded));
  };
})();