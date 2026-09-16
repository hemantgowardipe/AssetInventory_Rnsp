/*! For license information please see qafLiteComponents.bundle.js.LICENSE.txt */
(() => {
    var __webpack_modules__ = {
        978: t => {
            var e;
            self, e = () => (() => {
                "use strict";
                var t = {
                    d: (e, r) => {
                        for (var n in r) t.o(r, n) && !t.o(e, n) && Object.defineProperty(e, n, {
                            enumerable: !0,
                            get: r[n]
                        });
                    },
                    o: (t, e) => Object.prototype.hasOwnProperty.call(t, e),
                    r: t => {
                        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
                            value: "Module"
                        }), Object.defineProperty(t, "__esModule", {
                            value: !0
                        });
                    }
                },
                    e = {};
                t.r(e), t.d(e, {
                    QafLiteElement: () => g,
                    elementSelector: () => E
                });
                var r = function (t, e, r) {
                    var o = t.attachShadow({
                        mode: "open"
                    }),
                        i = document.createElement("template");
                    r && (i.innerHTML = "<style>" + r + "</style>"), e && (i.innerHTML += n(e, t));
                    var a = i.content;
                    o.appendChild(a.cloneNode(!0));
                },
                    n = function (t, e) {
                        var r = (Window.lastComponentId ? Window.lastComponentId : 0) + 1;
                        Window.lastComponentId = r;
                        var n = "component" + r;
                        return Window[n] = e, t.replaceAll("this.", "Window." + n + ".");
                    };
                function o(t) {
                    return o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                        return typeof t;
                    } : function (t) {
                        return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
                    }, o(t);
                }
                function i(t, e) {
                    var r = Object.keys(t);
                    if (Object.getOwnPropertySymbols) {
                        var n = Object.getOwnPropertySymbols(t);
                        e && (n = n.filter((function (e) {
                            return Object.getOwnPropertyDescriptor(t, e).enumerable;
                        }))), r.push.apply(r, n);
                    }
                    return r;
                }
                function a(t) {
                    for (var e = 1; e < arguments.length; e++) {
                        var r = null != arguments[e] ? arguments[e] : {};
                        e % 2 ? i(Object(r), !0).forEach((function (e) {
                            l(t, e, r[e]);
                        })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : i(Object(r)).forEach((function (e) {
                            Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(r, e));
                        }));
                    }
                    return t;
                }
                function s(t, e) {
                    return function (t) {
                        if (Array.isArray(t)) return t;
                    }(t) || function (t, e) {
                        var r = null == t ? null : "undefined" != typeof Symbol && t[Symbol.iterator] || t["@@iterator"];
                        if (null != r) {
                            var n, o, i, a, s = [],
                                l = !0,
                                c = !1;
                            try {
                                if (i = (r = r.call(t)).next, 0 === e) {
                                    if (Object(r) !== r) return;
                                    l = !1;
                                } else
                                    for (; !(l = (n = i.call(r)).done) && (s.push(n.value), s.length !== e); l = !0);
                            } catch (t) {
                                c = !0, o = t;
                            } finally {
                                try {
                                    if (!l && null != r.return && (a = r.return(), Object(a) !== a)) return;
                                } finally {
                                    if (c) throw o;
                                }
                            }
                            return s;
                        }
                    }(t, e) || u(t, e) || function () {
                        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }();
                }
                function l(t, e, r) {
                    return (e = p(e)) in t ? Object.defineProperty(t, e, {
                        value: r,
                        enumerable: !0,
                        configurable: !0,
                        writable: !0
                    }) : t[e] = r, t;
                }
                function c(t) {
                    return function (t) {
                        if (Array.isArray(t)) return f(t);
                    }(t) || function (t) {
                        if ("undefined" != typeof Symbol && null != t[Symbol.iterator] || null != t["@@iterator"]) return Array.from(t);
                    }(t) || u(t) || function () {
                        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
                    }();
                }
                function u(t, e) {
                    if (t) {
                        if ("string" == typeof t) return f(t, e);
                        var r = Object.prototype.toString.call(t).slice(8, -1);
                        return "Object" === r && t.constructor && (r = t.constructor.name), "Map" === r || "Set" === r ? Array.from(t) : "Arguments" === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r) ? f(t, e) : void 0;
                    }
                }
                function f(t, e) {
                    (null == e || e > t.length) && (e = t.length);
                    for (var r = 0, n = new Array(e); r < e; r++) n[r] = t[r];
                    return n;
                }
                function d(t, e) {
                    for (var r = 0; r < e.length; r++) {
                        var n = e[r];
                        n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, p(n.key), n);
                    }
                }
                function p(t) {
                    var e = function (t, e) {
                        if ("object" !== o(t) || null === t) return t;
                        var r = t[Symbol.toPrimitive];
                        if (void 0 !== r) {
                            var n = r.call(t, "string");
                            if ("object" !== o(n)) return n;
                            throw new TypeError("@@toPrimitive must return a primitive value.");
                        }
                        return String(t);
                    }(t);
                    return "symbol" === o(e) ? e : String(e);
                }
                function y(t) {
                    if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return t;
                }
                function h(t) {
                    var e = "function" == typeof Map ? new Map : void 0;
                    return h = function (t) {
                        if (null === t || (r = t, -1 === Function.toString.call(r).indexOf("[native code]"))) return t;
                        var r;
                        if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function");
                        if (void 0 !== e) {
                            if (e.has(t)) return e.get(t);
                            e.set(t, n);
                        }
                        function n() {
                            return v(t, arguments, b(this).constructor);
                        }
                        return n.prototype = Object.create(t.prototype, {
                            constructor: {
                                value: n,
                                enumerable: !1,
                                writable: !0,
                                configurable: !0
                            }
                        }), _(n, t);
                    }, h(t);
                }
                function v(t, e, r) {
                    return v = m() ? Reflect.construct.bind() : function (t, e, r) {
                        var n = [null];
                        n.push.apply(n, e);
                        var o = new (Function.bind.apply(t, n));
                        return r && _(o, r.prototype), o;
                    }, v.apply(null, arguments);
                }
                function m() {
                    if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                    if (Reflect.construct.sham) return !1;
                    if ("function" == typeof Proxy) return !0;
                    try {
                        return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                    } catch (t) {
                        return !1;
                    }
                }
                function _(t, e) {
                    return _ = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                        return t.__proto__ = e, t;
                    }, _(t, e);
                }
                function b(t) {
                    return b = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                        return t.__proto__ || Object.getPrototypeOf(t);
                    }, b(t);
                }
                var g = function (t) {
                    ! function (t, e) {
                        if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                        t.prototype = Object.create(e && e.prototype, {
                            constructor: {
                                value: t,
                                writable: !0,
                                configurable: !0
                            }
                        }), Object.defineProperty(t, "prototype", {
                            writable: !1
                        }), e && _(t, e);
                    }(h, t);
                    var e, n, i, u, f, p = (u = h, f = m(), function () {
                        var t, e = b(u);
                        if (f) {
                            var r = b(this).constructor;
                            t = Reflect.construct(e, arguments, r);
                        } else t = e.apply(this, arguments);
                        return function (t, e) {
                            if (e && ("object" === o(e) || "function" == typeof e)) return e;
                            if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                            return y(t);
                        }(this, t);
                    });
                    function h(t, e) {
                        var n;
                        return function (t, e) {
                            if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                        }(this, h), (n = p.call(this)).state = {}, r(y(n), t, e), n.getAllAttributes(), n;
                    }
                    return e = h, n = [{
                        key: "connectedCallback",
                        value: function () {
                            this.init();
                        }
                    }, {
                        key: "disconnectedCallback",
                        value: function () {
                            this.onDestroy();
                        }
                    }, {
                        key: "attributeChangedCallback",
                        value: function (t, e, r) {
                            this.changeEvent(t, e, r);
                        }
                    }, {
                        key: "adoptedCallback",
                        value: function () { }
                    }, {
                        key: "getAllAttributes",
                        value: function () {
                            for (var t = 0; t < this.attributes.length; t++) this.attributes[t];
                        }
                    }, {
                        key: "init",
                        value: function () { }
                    }, {
                        key: "onDestroy",
                        value: function () { }
                    }, {
                        key: "changeEvent",
                        value: function (t, e, r) { }
                    }, {
                        key: "isCustomElement",
                        value: function (t) {
                            var e = !1;
                            try {
                                void 0 !== customElements.get(t.tagName.toLowerCase()) && (e = "CustomElement" === Object.getPrototypeOf(customElements.get(t.tagName.toLowerCase())).name);
                            } catch (t) {
                                e = !1;
                            }
                            return e;
                        }
                    }, {
                        key: "updateBindings",
                        value: function (t) {
                            var e = this,
                                r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "";
                            c(this.selectAll('[data-bind$="'.concat(t, '"]'))).forEach((function (t) {
                                var n = t.dataset.bind,
                                    o = n.includes(":") ? n.split(":").shift() : n,
                                    i = n.includes(".") ? n.split(".").slice(1).reduce((function (t, e) {
                                        return t[e];
                                    }), r) : r,
                                    a = c(e.selectAll(t.tagName)).find((function (e) {
                                        return e === t;
                                    }));
                                n.includes(":") && e.isCustomElement(a) ? a.setState(l({}, "".concat(o), i)) : e.isArray(i) ? a[o] = i : t.textContent = i.toString(), "function" == typeof a.render && a.render();
                            })), c(this.selectAll('[data-bind-html$="'.concat(t, '"]'))).forEach((function (t) {
                                var n = t.dataset.bindHtml,
                                    o = n.includes(":") ? n.split(":").shift() : n,
                                    i = n.includes(".") ? n.split(".").slice(1).reduce((function (t, e) {
                                        return t[e];
                                    }), r) : r,
                                    a = c(e.selectAll(t.tagName)).find((function (e) {
                                        return e === t;
                                    })),
                                    s = n.includes(":") && e.isCustomElement(a);
                                s ? a.setState(l({}, "".concat(o), i)) : e.isArray(i) ? a[o] = i : t.innerHTML = i.toString(), s && a.render();
                            })), c(this.selectAll('[data-bind$="'.concat(t, '"]'))), c(this.selectAll('[data-loading$="'.concat(t, '"]'))).forEach((function (t) {
                                var n = t.dataset.loading,
                                    o = n.includes(":") ? n.split(":").shift() : n,
                                    i = n.includes(".") ? n.split(".").slice(1).reduce((function (t, e) {
                                        return t[e];
                                    }), r) : r,
                                    a = c(e.selectAll(t.tagName)).find((function (e) {
                                        return e === t;
                                    }));
                                n.includes(":") && e.isCustomElement(a) ? a.setState(l({}, "".concat(o), i)) : e.isArray(i) || "boolean" == typeof i ? a[o] = i : t.textContent = i.toString(), "function" == typeof a.render && a.render();
                            }));
                        }
                    }, {
                        key: "setState",
                        value: function (t) {
                            var e = this;
                            Object.entries(t).forEach((function (t) {
                                var r = s(t, 2),
                                    n = r[0],
                                    o = r[1];
                                e.state[n] = e.isObject(e.state[n]) && e.isObject(o) ? a(a({}, e.state[n]), o) : o;
                                var i = e.isObject(o) ? e.getBindKey(n, o) : n;
                                (e.isArray(i) ? i : [i]).forEach((function (t) {
                                    return e.updateBindings(t, o);
                                }));
                            }));
                        }
                    }, {
                        key: "getBindKey",
                        value: function (t, e) {
                            var r = this;
                            return Object.keys(e).map((function (n) {
                                return r.isObject(e[n]) ? "".concat(t, ".").concat(r.getBindKey(n, e[n])) : "".concat(t, ".").concat(n);
                            }));
                        }
                    }, {
                        key: "isArray",
                        value: function (t) {
                            return Array.isArray(t);
                        }
                    }, {
                        key: "isObject",
                        value: function (t) {
                            return "[object Object]" === Object.prototype.toString.call(t);
                        }
                    }, {
                        key: "select",
                        value: function (t) {
                            return this.shadowRoot ? this.shadowRoot.querySelector(t) : this.querySelector(t);
                        }
                    }, {
                        key: "selectAll",
                        value: function (t) {
                            return this.shadowRoot ? this.shadowRoot.querySelectorAll(t) : this.querySelectorAll(t);
                        }
                    }, {
                        key: "multiSelect",
                        value: function (t) {
                            var e = this;
                            Object.entries(t).forEach((function (t) {
                                var r = s(t, 2),
                                    n = r[0],
                                    o = r[1];
                                e[n] = e.select(o);
                            }));
                        }
                    }, {
                        key: "show",
                        value: function () {
                            var t = (arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null) || this;
                            (Array.isArray(t) || NodeList.prototype.isPrototypeOf(t) ? t : [t]).forEach((function (t) {
                                t.style.display = "", t.removeAttribute("hidden");
                            }));
                        }
                    }, {
                        key: "hide",
                        value: function () {
                            var t = (arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null) || this;
                            (Array.isArray(t) || NodeList.prototype.isPrototypeOf(t) ? t : [t]).forEach((function (t) {
                                t.style.display = "none", t.setAttribute("hidden", "");
                            }));
                        }
                    }, {
                        key: "css",
                        value: function (t, e) {
                            (Array.isArray(t) ? t : [t]).forEach((function (t) {
                                return Object.assign(t.style, e);
                            }));
                        }
                    }, {
                        key: "addTemplate",
                        value: function (t, e) {
                            var r = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
                                n = this.select(e).content.cloneNode(!0);
                            r && (t.innerHTML = ""), t.appendChild(n);
                        }
                    }], i = [{
                        key: "observedAttributes",
                        get: function () {
                            return [];
                        }
                    }], n && d(e.prototype, n), i && d(e, i), Object.defineProperty(e, "prototype", {
                        writable: !1
                    }), h;
                }(h(HTMLElement));
                function w(t) {
                    return w = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                        return typeof t;
                    } : function (t) {
                        return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
                    }, w(t);
                }
                function E(t) {
                    return function (e) {
                        void 0 === customElements.get(t) && customElements.define(t, w(e));
                    };
                }
                return e;
            })(), t.exports = e();
        },
        262: t => {
            self,
                t.exports = (() => {
                    "use strict";
                    var t, e, r = {
                        d: (t, e) => {
                            for (var n in e) r.o(e, n) && !r.o(t, n) && Object.defineProperty(t, n, {
                                enumerable: !0,
                                get: e[n]
                            });
                        },
                        o: (t, e) => Object.prototype.hasOwnProperty.call(t, e),
                        r: t => {
                            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
                                value: "Module"
                            }), Object.defineProperty(t, "__esModule", {
                                value: !0
                            });
                        }
                    },
                        n = {};
                    r.r(n), r.d(n, {
                        QafService: () => t,
                        QafUtility: () => e
                    });
                    class o {
                        static GET_ITEMS = "/api/GetRecordsForFields";
                        static ADD_ITEM = "/api/SaveRecord";
                        static UPDATE_ITEM = "/api/UpdateRecord";
                        static DELETE_ITEM = "/api/DeleteRecord";
                        static GET_NEW_GUID = "/api/NewRecordGuid";
                        static GET_MY_TEAMS = "/api/myTeams";
                        static GET_OBJECT_BY_ID = "/api/ObjectGet";
                        static GET_VIEW_BY_OBJECT_ID = "/api/ViewGet";
                        static DELETE_BULK_ITEMS = "/api/Dbt";
                        static UPDATE_BULK_ITEMS = "/api/Rubwr";
                        static ADD_BULK_ITEMS = "/api/Rubwr";
                        static IMPORT_ITEMS = "/api/ImportRecords";
                        static RFDF = "/api/Rfdf";
                        static S145CA4EFS = "/api/s145ca4efS";
                    }
                    return function (t) {
                        let e = localStorage.getItem("env");
                        t.SetEnvUrl = function (t) {
                            localStorage.setItem("env", t);
                        };
                        let r = function () {
                            let t = window.localStorage.getItem("user_key");
                            if (t) return JSON.parse(t);
                        };
                        t.GetItems = function (t, n, i, a, s, l, c = !0) {
                            return new Promise(((u, f) => {
                                if (0 === t.length) u([]);
                                else {
                                    let d = [];
                                    d.push(`objectName=${t}`), Array.isArray(n) && n.length > 0 && d.push(`fieldList=${n.join(",")}`), l ? d.push(`orderBy=${l}`) : d.push("orderBy="), s ? d.push(`whereClause=${s}`) : d.push("whereClause="), d.push(`pageSize=${i}`), d.push(`pageNumber=${a}`), d.push(`isAscending=${c}`);
                                    let p = `${e}${o.GET_ITEMS}?${d.join("&")}`,
                                        y = "",
                                        h = "",
                                        v = "",
                                        m = r();
                                    m && (y = m.value.EmployeeGUID, h = m.value.Email, v = m.value.EmployeeID), fetch(p, {
                                        method: "POST",
                                        headers: {
                                            Accept: "application/json",
                                            "Content-Type": "application/json",
                                            "Access-Control-Allow-Origin": "*",
                                            EmployeeGUID: y,
                                            Hrzemail: h,
                                            HrzempId: v
                                        }
                                    }).then((t => t.json())).then((t => {
                                        u(t);
                                    })).catch((t => {
                                        f(t);
                                    }));
                                }
                            }));
                        }, t.CreateItem = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.ADD_ITEM}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(a, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.UpdateItem = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.UPDATE_ITEM}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(a, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.DeleteItem = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.DELETE_ITEM}?recordID=${t}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(a, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    }
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.GetNewGUID = function () {
                            return new Promise(((t, n) => {
                                let i = `${e}${o.GET_NEW_GUID}`,
                                    a = "",
                                    s = "",
                                    l = "",
                                    c = r();
                                c && (a = c.value.EmployeeGUID, s = c.value.Email, l = c.value.EmployeeID), fetch(i, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: a,
                                        Hrzemail: s,
                                        HrzempId: l
                                    }
                                }).then((e => {
                                    e.json().then((e => {
                                        t(e);
                                    }));
                                })).catch((t => {
                                    n(t);
                                }));
                            }));
                        }, t.GetMyTeams = function () {
                            return new Promise(((t, n) => {
                                let i = `${e}${o.GET_MY_TEAMS}`,
                                    a = "",
                                    s = "",
                                    l = "",
                                    c = r();
                                c && (a = c.value.EmployeeGUID, s = c.value.Email, l = c.value.EmployeeID), fetch(`${i}?employeeGuid=${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: a,
                                        Hrzemail: s,
                                        HrzempId: l
                                    }
                                }).then((e => {
                                    e.json().then((e => {
                                        t(e);
                                    }));
                                })).catch((t => {
                                    n(t);
                                }));
                            }));
                        }, t.GetObjectById = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.GET_OBJECT_BY_ID}?option=object&objectID=${t}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    }
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.GetViewById = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.GET_VIEW_BY_OBJECT_ID}?objectID=${t}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    }
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.DeleteItems = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.DELETE_BULK_ITEMS}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.UpdateItems = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.UPDATE_BULK_ITEMS}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.AddItems = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.ADD_BULK_ITEMS}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.ImportItems = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.IMPORT_ITEMS}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.Rfdf = function (t) {
                            return new Promise(((n, i) => {
                                let a = `${e}${o.RFDF}`,
                                    s = "",
                                    l = "",
                                    c = "",
                                    u = r();
                                u && (s = u.value.EmployeeGUID, l = u.value.Email, c = u.value.EmployeeID), fetch(`${a}`, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                        EmployeeGUID: s,
                                        Hrzemail: l,
                                        HrzempId: c
                                    },
                                    body: JSON.stringify(t)
                                }).then((t => {
                                    t.json().then((t => {
                                        n(t);
                                    }));
                                })).catch((t => {
                                    i(t);
                                }));
                            }));
                        }, t.s145ca4efS = function (t, n, i, a, s, l, c = !0) {
                            return new Promise(((u, f) => {
                                if (0 === t.length) u([]);
                                else {
                                    let d = [];
                                    d.push(`objectName=${t}`), Array.isArray(n) && n.length > 0 && d.push(`fieldList=${n.join(",")}`), l ? d.push(`orderBy=${l}`) : d.push("orderBy="), s ? d.push(`whereClause=${s}`) : d.push("whereClause="), d.push(`pageSize=${i}`), d.push(`pageNumber=${a}`), d.push(`isAscending=${c}`);
                                    let p = `${e}${o.GET_ITEMS}?${d.join("&")}`,
                                        y = "",
                                        h = "",
                                        v = "",
                                        m = r();
                                    m && (y = m.value.EmployeeGUID, h = m.value.Email, v = m.value.EmployeeID), fetch(p, {
                                        method: "POST",
                                        headers: {
                                            Accept: "application/json",
                                            "Content-Type": "application/json",
                                            "Access-Control-Allow-Origin": "*",
                                            EmployeeGUID: y,
                                            Hrzemail: h,
                                            HrzempId: v
                                        }
                                    }).then((t => t.json())).then((t => {
                                        u(t);
                                    })).catch((t => {
                                        f(t);
                                    }));
                                }
                            }));
                        };
                    }(t || (t = {})), window.QafService = t,
                        function (t) {
                            t.format = function (t) {
                                return t;
                            };
                        }(e || (e = {})), n;
                })();
        },
        60: (__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
            "use strict";
            __webpack_require__.d(__webpack_exports__, {
                l: () => QafGrid
            });
            var _qaf_lite_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(978),
                _qaf_lite_core__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_qaf_lite_core__WEBPACK_IMPORTED_MODULE_0__),
                _qaf_lite_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(262),
                _qaf_lite_service__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_qaf_lite_service__WEBPACK_IMPORTED_MODULE_1__),
                _qaf_grid_html__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9),
                _qaf_grid_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(970);
            function _typeof(t) {
                return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                    return typeof t;
                } : function (t) {
                    return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
                }, _typeof(t);
            }
            function _regeneratorRuntime() {
                _regeneratorRuntime = function () {
                    return t;
                };
                var t = {},
                    e = Object.prototype,
                    r = e.hasOwnProperty,
                    n = Object.defineProperty || function (t, e, r) {
                        t[e] = r.value;
                    },
                    o = "function" == typeof Symbol ? Symbol : {},
                    i = o.iterator || "@@iterator",
                    a = o.asyncIterator || "@@asyncIterator",
                    s = o.toStringTag || "@@toStringTag";
                function l(t, e, r) {
                    return Object.defineProperty(t, e, {
                        value: r,
                        enumerable: !0,
                        configurable: !0,
                        writable: !0
                    }), t[e];
                }
                try {
                    l({}, "");
                } catch (t) {
                    l = function (t, e, r) {
                        return t[e] = r;
                    };
                }
                function c(t, e, r, o) {
                    var i = e && e.prototype instanceof d ? e : d,
                        a = Object.create(i.prototype),
                        s = new P(o || []);
                    return n(a, "_invoke", {
                        value: w(t, r, s)
                    }), a;
                }
                function u(t, e, r) {
                    try {
                        return {
                            type: "normal",
                            arg: t.call(e, r)
                        };
                    } catch (t) {
                        return {
                            type: "throw",
                            arg: t
                        };
                    }
                }
                t.wrap = c;
                var f = {};
                function d() { }
                function p() { }
                function y() { }
                var h = {};
                l(h, i, (function () {
                    return this;
                }));
                var v = Object.getPrototypeOf,
                    m = v && v(v(x([])));
                m && m !== e && r.call(m, i) && (h = m);
                var _ = y.prototype = d.prototype = Object.create(h);
                function b(t) {
                    ["next", "throw", "return"].forEach((function (e) {
                        l(t, e, (function (t) {
                            return this._invoke(e, t);
                        }));
                    }));
                }
                function g(t, e) {
                    function o(n, i, a, s) {
                        var l = u(t[n], t, i);
                        if ("throw" !== l.type) {
                            var c = l.arg,
                                f = c.value;
                            return f && "object" == _typeof(f) && r.call(f, "__await") ? e.resolve(f.__await).then((function (t) {
                                o("next", t, a, s);
                            }), (function (t) {
                                o("throw", t, a, s);
                            })) : e.resolve(f).then((function (t) {
                                c.value = t, a(c);
                            }), (function (t) {
                                return o("throw", t, a, s);
                            }));
                        }
                        s(l.arg);
                    }
                    var i;
                    n(this, "_invoke", {
                        value: function (t, r) {
                            function n() {
                                return new e((function (e, n) {
                                    o(t, r, e, n);
                                }));
                            }
                            return i = i ? i.then(n, n) : n();
                        }
                    });
                }
                function w(t, e, r) {
                    var n = "suspendedStart";
                    return function (o, i) {
                        if ("executing" === n) throw new Error("Generator is already running");
                        if ("completed" === n) {
                            if ("throw" === o) throw i;
                            return {
                                value: void 0,
                                done: !0
                            };
                        }
                        for (r.method = o, r.arg = i; ;) {
                            var a = r.delegate;
                            if (a) {
                                var s = E(a, r);
                                if (s) {
                                    if (s === f) continue;
                                    return s;
                                }
                            }
                            if ("next" === r.method) r.sent = r._sent = r.arg;
                            else if ("throw" === r.method) {
                                if ("suspendedStart" === n) throw n = "completed", r.arg;
                                r.dispatchException(r.arg);
                            } else "return" === r.method && r.abrupt("return", r.arg);
                            n = "executing";
                            var l = u(t, e, r);
                            if ("normal" === l.type) {
                                if (n = r.done ? "completed" : "suspendedYield", l.arg === f) continue;
                                return {
                                    value: l.arg,
                                    done: r.done
                                };
                            }
                            "throw" === l.type && (n = "completed", r.method = "throw", r.arg = l.arg);
                        }
                    };
                }
                function E(t, e) {
                    var r = e.method,
                        n = t.iterator[r];
                    if (void 0 === n) return e.delegate = null, "throw" === r && t.iterator.return && (e.method = "return", e.arg = void 0, E(t, e), "throw" === e.method) || "return" !== r && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + r + "' method")), f;
                    var o = u(n, t.iterator, e.arg);
                    if ("throw" === o.type) return e.method = "throw", e.arg = o.arg, e.delegate = null, f;
                    var i = o.arg;
                    return i ? i.done ? (e[t.resultName] = i.value, e.next = t.nextLoc, "return" !== e.method && (e.method = "next", e.arg = void 0), e.delegate = null, f) : i : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f);
                }
                function O(t) {
                    var e = {
                        tryLoc: t[0]
                    };
                    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
                }
                function S(t) {
                    var e = t.completion || {};
                    e.type = "normal", delete e.arg, t.completion = e;
                }
                function P(t) {
                    this.tryEntries = [{
                        tryLoc: "root"
                    }], t.forEach(O, this), this.reset(!0);
                }
                function x(t) {
                    if (t) {
                        var e = t[i];
                        if (e) return e.call(t);
                        if ("function" == typeof t.next) return t;
                        if (!isNaN(t.length)) {
                            var n = -1,
                                o = function e() {
                                    for (; ++n < t.length;)
                                        if (r.call(t, n)) return e.value = t[n], e.done = !1, e;
                                    return e.value = void 0, e.done = !0, e;
                                };
                            return o.next = o;
                        }
                    }
                    return {
                        next: j
                    };
                }
                function j() {
                    return {
                        value: void 0,
                        done: !0
                    };
                }
                return p.prototype = y, n(_, "constructor", {
                    value: y,
                    configurable: !0
                }), n(y, "constructor", {
                    value: p,
                    configurable: !0
                }), p.displayName = l(y, s, "GeneratorFunction"), t.isGeneratorFunction = function (t) {
                    var e = "function" == typeof t && t.constructor;
                    return !!e && (e === p || "GeneratorFunction" === (e.displayName || e.name));
                }, t.mark = function (t) {
                    return Object.setPrototypeOf ? Object.setPrototypeOf(t, y) : (t.__proto__ = y, l(t, s, "GeneratorFunction")), t.prototype = Object.create(_), t;
                }, t.awrap = function (t) {
                    return {
                        __await: t
                    };
                }, b(g.prototype), l(g.prototype, a, (function () {
                    return this;
                })), t.AsyncIterator = g, t.async = function (e, r, n, o, i) {
                    void 0 === i && (i = Promise);
                    var a = new g(c(e, r, n, o), i);
                    return t.isGeneratorFunction(r) ? a : a.next().then((function (t) {
                        return t.done ? t.value : a.next();
                    }));
                }, b(_), l(_, s, "Generator"), l(_, i, (function () {
                    return this;
                })), l(_, "toString", (function () {
                    return "[object Generator]";
                })), t.keys = function (t) {
                    var e = Object(t),
                        r = [];
                    for (var n in e) r.push(n);
                    return r.reverse(),
                        function t() {
                            for (; r.length;) {
                                var n = r.pop();
                                if (n in e) return t.value = n, t.done = !1, t;
                            }
                            return t.done = !0, t;
                        };
                }, t.values = x, P.prototype = {
                    constructor: P,
                    reset: function (t) {
                        if (this.prev = 0, this.next = 0, this.sent = this._sent = void 0, this.done = !1, this.delegate = null, this.method = "next", this.arg = void 0, this.tryEntries.forEach(S), !t)
                            for (var e in this) "t" === e.charAt(0) && r.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = void 0);
                    },
                    stop: function () {
                        this.done = !0;
                        var t = this.tryEntries[0].completion;
                        if ("throw" === t.type) throw t.arg;
                        return this.rval;
                    },
                    dispatchException: function (t) {
                        if (this.done) throw t;
                        var e = this;
                        function n(r, n) {
                            return a.type = "throw", a.arg = t, e.next = r, n && (e.method = "next", e.arg = void 0), !!n;
                        }
                        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
                            var i = this.tryEntries[o],
                                a = i.completion;
                            if ("root" === i.tryLoc) return n("end");
                            if (i.tryLoc <= this.prev) {
                                var s = r.call(i, "catchLoc"),
                                    l = r.call(i, "finallyLoc");
                                if (s && l) {
                                    if (this.prev < i.catchLoc) return n(i.catchLoc, !0);
                                    if (this.prev < i.finallyLoc) return n(i.finallyLoc);
                                } else if (s) {
                                    if (this.prev < i.catchLoc) return n(i.catchLoc, !0);
                                } else {
                                    if (!l) throw new Error("try statement without catch or finally");
                                    if (this.prev < i.finallyLoc) return n(i.finallyLoc);
                                }
                            }
                        }
                    },
                    abrupt: function (t, e) {
                        for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                            var o = this.tryEntries[n];
                            if (o.tryLoc <= this.prev && r.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                                var i = o;
                                break;
                            }
                        }
                        i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
                        var a = i ? i.completion : {};
                        return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, f) : this.complete(a);
                    },
                    complete: function (t, e) {
                        if ("throw" === t.type) throw t.arg;
                        return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), f;
                    },
                    finish: function (t) {
                        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                            var r = this.tryEntries[e];
                            if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), S(r), f;
                        }
                    },
                    catch: function (t) {
                        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                            var r = this.tryEntries[e];
                            if (r.tryLoc === t) {
                                var n = r.completion;
                                if ("throw" === n.type) {
                                    var o = n.arg;
                                    S(r);
                                }
                                return o;
                            }
                        }
                        throw new Error("illegal catch attempt");
                    },
                    delegateYield: function (t, e, r) {
                        return this.delegate = {
                            iterator: x(t),
                            resultName: e,
                            nextLoc: r
                        }, "next" === this.method && (this.arg = void 0), f;
                    }
                }, t;
            }
            function asyncGeneratorStep(t, e, r, n, o, i, a) {
                try {
                    var s = t[i](a),
                        l = s.value;
                } catch (t) {
                    return void r(t);
                }
                s.done ? e(l) : Promise.resolve(l).then(n, o);
            }
            function _asyncToGenerator(t) {
                return function () {
                    var e = this,
                        r = arguments;
                    return new Promise((function (n, o) {
                        var i = t.apply(e, r);
                        function a(t) {
                            asyncGeneratorStep(i, n, o, a, s, "next", t);
                        }
                        function s(t) {
                            asyncGeneratorStep(i, n, o, a, s, "throw", t);
                        }
                        a(void 0);
                    }));
                };
            }
            function _classCallCheck(t, e) {
                if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
            }
            function _defineProperties(t, e) {
                for (var r = 0; r < e.length; r++) {
                    var n = e[r];
                    n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, _toPropertyKey(n.key), n);
                }
            }
            function _createClass(t, e, r) {
                return e && _defineProperties(t.prototype, e), r && _defineProperties(t, r), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), t;
            }
            function _toPropertyKey(t) {
                var e = _toPrimitive(t, "string");
                return "symbol" === _typeof(e) ? e : String(e);
            }
            function _toPrimitive(t, e) {
                if ("object" !== _typeof(t) || null === t) return t;
                var r = t[Symbol.toPrimitive];
                if (void 0 !== r) {
                    var n = r.call(t, e || "default");
                    if ("object" !== _typeof(n)) return n;
                    throw new TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === e ? String : Number)(t);
            }
            function _inherits(t, e) {
                if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                t.prototype = Object.create(e && e.prototype, {
                    constructor: {
                        value: t,
                        writable: !0,
                        configurable: !0
                    }
                }), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), e && _setPrototypeOf(t, e);
            }
            function _setPrototypeOf(t, e) {
                return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                    return t.__proto__ = e, t;
                }, _setPrototypeOf(t, e);
            }
            function _createSuper(t) {
                var e = _isNativeReflectConstruct();
                return function () {
                    var r, n = _getPrototypeOf(t);
                    if (e) {
                        var o = _getPrototypeOf(this).constructor;
                        r = Reflect.construct(n, arguments, o);
                    } else r = n.apply(this, arguments);
                    return _possibleConstructorReturn(this, r);
                };
            }
            function _possibleConstructorReturn(t, e) {
                if (e && ("object" === _typeof(e) || "function" == typeof e)) return e;
                if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                return _assertThisInitialized(t);
            }
            function _assertThisInitialized(t) {
                if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                return t;
            }
            function _isNativeReflectConstruct() {
                if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ("function" == typeof Proxy) return !0;
                try {
                    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                } catch (t) {
                    return !1;
                }
            }
            function _getPrototypeOf(t) {
                return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                    return t.__proto__ || Object.getPrototypeOf(t);
                }, _getPrototypeOf(t);
            }
            var QafGrid = function (_QafLiteElement) {
                _inherits(QafGrid, _QafLiteElement);
                var _super = _createSuper(QafGrid),
                    _sortField;
                function QafGrid() {
                    var t;
                    return _classCallCheck(this, QafGrid), (t = _super.call(this, _qaf_grid_html__WEBPACK_IMPORTED_MODULE_2__.Z, _qaf_grid_css__WEBPACK_IMPORTED_MODULE_3__.Z)).apiEndPoint = "", t.svgMenuIcon = '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29.96 122.88"><defs><style>.cls-1{fill-rule:evenodd;}</style></defs><title>menu</title><path class="cls-1" d="M15,0A15,15,0,1,1,0,15,15,15,0,0,1,15,0Zm0,92.93a15,15,0,1,1-15,15,15,15,0,0,1,15-15Zm0-46.47a15,15,0,1,1-15,15,15,15,0,0,1,15-15Z"/></svg>', t.getCurrentUser = function () {
                        var t = window.localStorage.getItem("user_key");
                        return t ? JSON.parse(t) : void 0;
                    }, t.currentPage = 1, t.pageSize = 10, t.rowTemplate = '<div class="qaf-grid__row">{ROW}</div>', t.rowItemTemplate = '<div class="qaf-grid__row-item">{ITEM}</div>', t.itemBindEvent, t.setState({
                        columns: [],
                        repository: "",
                        title: "",
                        rowItemTemplate: "",
                        show: !0,
                        showAction: !1,
                        data: {
                            gridData: []
                        },
                        currentSortField: "",
                        sortOrderAscending: !1,
                        filterCondition: null,
                        view: ""
                    }), t;
                }
                return _createClass(QafGrid, [{
                    key: "columns",
                    set: function (t) {
                        t = this.sortColumns(t), this.setState({
                            columns: t
                        }), this.init();
                    }
                }, {
                    key: "show",
                    set: function (t) {
                        this.setState({
                            show: t
                        }), this.init();
                    }
                }, {
                    key: "Data",
                    set: function (t) {
                        this.setState({
                            data: {
                                gridData: t
                            },
                            show: !1
                        }), this.buildDataRows();
                    }
                }, {
                    key: "sortColumns",
                    value: function (t) {
                        return Array.isArray(t) ? t = t.sort((function (t, e) {
                            return t.sequence ? t.sequence < e.sequence ? -1 : t.sequence > e.sequence ? 1 : 0 : 0;
                        })) : t;
                    }
                }, {
                    key: "onDestroy",
                    value: function () {
                        console.log("destroying component"), this.setState({
                            columns: [],
                            repository: "",
                            title: "",
                            rowItemTemplate: "",
                            show: !0,
                            showAction: !1,
                            data: {
                                gridData: []
                            },
                            currentSortField: "",
                            sortOrderAscending: !1,
                            filterCondition: null,
                            view: ""
                        });
                    }
                }, {
                    key: "init",
                    value: function init() {
                        var _this2 = this;
                        console.log("grid initialize");
                        var title = this.getAttribute("data-bind-title");
                        title && this.setState({
                            title
                        });
                        var repo = this.getAttribute("data-bind-reposiory");
                        repo && (this.setState({
                            repository: repo
                        }), title || this.setState({
                            title: repo
                        }));
                        var showAction = this.getAttribute("action");
                        showAction && this.setState({
                            showAction: "true" === showAction.toLowerCase()
                        });
                        var filter = this.getAttribute("data-bind-filter");
                        filter && this.setState({
                            filterCondition: filter
                        });
                        var view = this.getAttribute("view");
                        if (view) {
                            this.setState({
                                view
                            });
                            var grid = this.shadowRoot.querySelector(".qaf-grid");
                            "card" === this.state.view && grid.classList.add("card");
                        }
                        var columns = this.getAttribute("columns");
                        if (columns) {
                            var colunmsObject = this.sortColumns(eval(columns));
                            this.setState({
                                columns: colunmsObject
                            });
                        }
                        var rowItemTemplate = this.getAttribute("data-bind-row-temp");
                        rowItemTemplate && this.setState({
                            rowItemTemplate
                        });
                        var objectName = this.state.repository;
                        if (this.state.repository) {
                            var fieldList = this.getColumnDisplayNames();
                            fieldList.length > 0 ? (this.setState({
                                show: !0
                            }), this.GetItems(objectName, fieldList).then((function (t) {
                                _this2.setState({
                                    data: {
                                        gridData: t
                                    },
                                    show: !1
                                }), _this2.buildDataRows();
                            }), (function (t) { }))) : this.setState({
                                show: !1
                            });
                        }
                    }
                }, {
                    key: "changeEvent",
                    value: function (t, e, r) { }
                }, {
                    key: "render",
                    value: function () {
                        console.log("render");
                    }
                }, {
                    key: "buildDataRows",
                    value: function buildDataRows() {
                        var _this3 = this,
                            rows = this.state.data.gridData,
                            columns = this.state.columns,
                            dataRowsCollections = [];
                        if ("" === this.state.view && Array.isArray(columns) && Array.isArray(rows)) {
                            columns = this.sortColumns(columns);
                            var colmnArray = [];
                            rows.forEach((function (row) {
                                colmnArray = [], columns.forEach((function (col) {
                                    var rowVal = row[col.field],
                                        itemRender = _this3.getAttribute("data-bind-onItemRender");
                                    if (itemRender) rowVal = eval(itemRender)(col.field, rowVal, row);
                                    else try {
                                        var id = _this3.getAttribute("id") ? _this3.getAttribute("id") : "qaf_grid_".concat(Math.random),
                                            funName = "".concat(id, "_onItemRender");
                                        rowVal = eval(funName)(col.field, rowVal, row);
                                    } catch (t) { }
                                    var rowHtml = _this3.rowItemTemplate.replace("{ITEM}", rowVal);
                                    colmnArray.push(rowHtml);
                                }));
                                var actionEvent = _this3.actionEvent,
                                    grid = _this3.shadowRoot.querySelector(".qaf-grid");
                                _this3.state.showAction && colmnArray.unshift('<div class="qaf-grid__row-item_action"><div class="row-menu"><button type=\'button\'>'.concat(_this3.svgMenuIcon, '</button><div class="action-content"><div class="action-items"><button type=\'button\' title="view" data-id=\'').concat(row.RecordID, '\' data-action=\'VIEW\'><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 68.18"><defs><style>.cls-1{fill-rule:evenodd;}</style></defs><title>view</title><path class="cls-1" d="M61.44,13.81a20.31,20.31,0,1,1-14.34,6,20.24,20.24,0,0,1,14.34-6ZM1.05,31.31A106.72,106.72,0,0,1,11.37,20.43C25.74,7.35,42.08.36,59,0s34.09,5.92,50.35,19.32a121.91,121.91,0,0,1,12.54,12,4,4,0,0,1,.25,5,79.88,79.88,0,0,1-15.38,16.41A69.53,69.53,0,0,1,63.43,68.18,76,76,0,0,1,19.17,53.82,89.35,89.35,0,0,1,.86,36.44a3.94,3.94,0,0,1,.19-5.13Zm15.63-5A99.4,99.4,0,0,0,9.09,34,80.86,80.86,0,0,0,23.71,47.37,68.26,68.26,0,0,0,63.4,60.3a61.69,61.69,0,0,0,38.41-13.72,70.84,70.84,0,0,0,12-12.3,110.45,110.45,0,0,0-9.5-8.86C89.56,13.26,74.08,7.58,59.11,7.89S29.63,14.48,16.68,26.27Zm39.69-7.79a7.87,7.87,0,1,1-7.87,7.87,7.86,7.86,0,0,1,7.87-7.87Z"/></svg><span>View</span></button><button type=\'button\' title="edit" data-id=\'').concat(row.RecordID, '\' data-action=\'EDIT\'><?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 117.74 122.88" style="enable-background:new 0 0 117.74 122.88" xml:space="preserve"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M94.62,2c-1.46-1.36-3.14-2.09-5.02-1.99c-1.88,0-3.56,0.73-4.92,2.2L73.59,13.72l31.07,30.03l11.19-11.72 c1.36-1.36,1.88-3.14,1.88-5.02s-0.73-3.66-2.09-4.92L94.62,2L94.62,2L94.62,2z M41.44,109.58c-4.08,1.36-8.26,2.62-12.35,3.98 c-4.08,1.36-8.16,2.72-12.35,4.08c-9.73,3.14-15.07,4.92-16.22,5.23c-1.15,0.31-0.42-4.18,1.99-13.6l7.74-29.61l0.64-0.66 l30.56,30.56L41.44,109.58L41.44,109.58L41.44,109.58z M22.2,67.25l42.99-44.82l31.07,29.92L52.75,97.8L22.2,67.25L22.2,67.25z"/></g></svg><span>Edit</span></button><button type=\'button\' title="delete" data-id=\'').concat(row.RecordID, '\' data-action=\'DELETE\'><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105.16 122.88"><defs><style>.cls-1{fill-rule:evenodd;}</style></defs><title>delete</title><path class="cls-1" d="M11.17,37.16H94.65a8.4,8.4,0,0,1,2,.16,5.93,5.93,0,0,1,2.88,1.56,5.43,5.43,0,0,1,1.64,3.34,7.65,7.65,0,0,1-.06,1.44L94,117.31v0l0,.13,0,.28v0a7.06,7.06,0,0,1-.2.9v0l0,.06v0a5.89,5.89,0,0,1-5.47,4.07H17.32a6.17,6.17,0,0,1-1.25-.19,6.17,6.17,0,0,1-1.16-.48h0a6.18,6.18,0,0,1-3.08-4.88l-7-73.49a7.69,7.69,0,0,1-.06-1.66,5.37,5.37,0,0,1,1.63-3.29,6,6,0,0,1,3-1.58,8.94,8.94,0,0,1,1.79-.13ZM5.65,8.8H37.12V6h0a2.44,2.44,0,0,1,0-.27,6,6,0,0,1,1.76-4h0A6,6,0,0,1,43.09,0H62.46l.3,0a6,6,0,0,1,5.7,6V6h0V8.8h32l.39,0a4.7,4.7,0,0,1,4.31,4.43c0,.18,0,.32,0,.5v9.86a2.59,2.59,0,0,1-2.59,2.59H2.59A2.59,2.59,0,0,1,0,23.62V13.53H0a1.56,1.56,0,0,1,0-.31v0A4.72,4.72,0,0,1,3.88,8.88,10.4,10.4,0,0,1,5.65,8.8Zm42.1,52.7a4.77,4.77,0,0,1,9.49,0v37a4.77,4.77,0,0,1-9.49,0v-37Zm23.73-.2a4.58,4.58,0,0,1,5-4.06,4.47,4.47,0,0,1,4.51,4.46l-2,37a4.57,4.57,0,0,1-5,4.06,4.47,4.47,0,0,1-4.51-4.46l2-37ZM25,61.7a4.46,4.46,0,0,1,4.5-4.46,4.58,4.58,0,0,1,5,4.06l2,37a4.47,4.47,0,0,1-4.51,4.46,4.57,4.57,0,0,1-5-4.06l-2-37Z"/></svg><span>Delete</span></button></div></div></div></div>'));
                                var rowTemp = _this3.rowTemplate.replace("{ROW}", colmnArray.join(""));
                                dataRowsCollections.push(rowTemp);
                            }));
                        }
                        if ("card" === this.state.view && Array.isArray(columns) && Array.isArray(rows)) {
                            var _colmnArray = [];
                            rows.forEach((function (row) {
                                columns.forEach((function (col) {
                                    var rowVal = row[col.field],
                                        itemRender = _this3.getAttribute("data-bind-onItemRender");
                                    if (itemRender) rowVal = eval(itemRender)(col.field, rowVal, row);
                                    else try {
                                        var id = _this3.getAttribute("id") ? _this3.getAttribute("id") : "qaf_grid_".concat(Math.random),
                                            funName = "".concat(id, "_onItemRender");
                                        rowVal = eval(funName)(col.field, rowVal, row);
                                    } catch (t) { }
                                    if (rowVal && rowVal.length > 0) {
                                        var rowHtml = _this3.rowItemTemplate.replace("{ITEM}", rowVal);
                                        _colmnArray.push(rowHtml);
                                    }
                                }));
                            }));
                            var rowTemp = this.rowTemplate.replace("{ROW}", _colmnArray.join(""));
                            dataRowsCollections.push(rowTemp);
                        }
                        var htmlRowTemplate = dataRowsCollections.join("");
                        this.setState({
                            rowItemTemplate: htmlRowTemplate
                        });
                        var pageSizeElement = this.shadowRoot.querySelector(".pageSizeSelect");
                        pageSizeElement && pageSizeElement.addEventListener("change", (function (t) {
                            console.log(t.currentTarget.value), _this3.onPageSizeChange(t.currentTarget.value);
                        }));
                        var intervalForActionBind = setInterval((function () {
                            var t = _this3.shadowRoot.querySelectorAll(".qaf-grid__row-item_action .action-items>button");
                            if (t.length > 0) {
                                for (var e = 0; e < t.length; e++) {
                                    var r = t[e];
                                    r && r.addEventListener("click", (function (t) {
                                        var e = _this3.state.data.gridData,
                                            r = t.target.attributes["data-id"];
                                        r || (r = t.target.parentElement.attributes["data-id"]);
                                        var n = t.target.attributes["data-action"];
                                        if (n || (n = t.target.parentElement.attributes["data-action"]), r && n) {
                                            var o = r.value,
                                                i = n.value,
                                                a = e.find((function (t) {
                                                    return t.RecordID === o;
                                                }));
                                            _this3.actionEvent(i, a);
                                        }
                                    }));
                                }
                                clearInterval(intervalForActionBind);
                            }
                        }), 100);
                    }
                }, {
                    key: "GetItems",
                    value: function (t, e) {
                        return _qaf_lite_service__WEBPACK_IMPORTED_MODULE_1__.QafService.GetItems(t, e, this.pageSize, this.currentPage, this.state.filterCondition);
                    }
                }, {
                    key: "GetItemsbySort",
                    value: function (t, e, r, n) {
                        return _qaf_lite_service__WEBPACK_IMPORTED_MODULE_1__.QafService.GetItems(t, e, this.pageSize, this.currentPage, this.state.filterCondition, r, n);
                    }
                }, {
                    key: "sortby",
                    value: function (t, e) {
                        var r = this;
                        if (this.currentPage = 0, this.dispatchEvent(new CustomEvent("onGridSortEvent", {
                            bubbles: !0,
                            detail: {
                                target: this,
                                eventName: "Next",
                                field: t,
                                order: e
                            }
                        })), this.state.repository) {
                            var n = this.state.repository,
                                o = this.getColumnDisplayNames();
                            this.gridLoading(), this.GetItemsbySort(n, o, t, e).then((function (t) {
                                r.setState({
                                    data: {
                                        gridData: t
                                    },
                                    show: !1
                                }), r.buildDataRows();
                            }));
                        }
                    }
                }, {
                    key: "gridLoading",
                    value: function () {
                        this.setState({
                            data: {
                                gridData: []
                            },
                            show: !0,
                            rowItemTemplate: ""
                        });
                    }
                }, {
                    key: "nextPage",
                    value: function () {
                        var t = this;
                        if (this.currentPage = this.currentPage + 1, this.dispatchEvent(new CustomEvent("onNextPageEvent", {
                            bubbles: !0,
                            detail: {
                                target: this,
                                eventName: "Next",
                                currentPage: this.currentPage
                            }
                        })), this.state.repository) {
                            var e = this.state.repository,
                                r = this.getColumnDisplayNames();
                            this.gridLoading(), this.GetItems(e, r).then((function (e) {
                                t.setState({
                                    data: {
                                        gridData: e
                                    },
                                    show: !1
                                }), t.buildDataRows();
                            }));
                        }
                    }
                }, {
                    key: "prevPage",
                    value: function () {
                        var t = this;
                        if (this.currentPage = this.currentPage - 1, this.dispatchEvent(new CustomEvent("onPrevPageEvent", {
                            bubbles: !0,
                            detail: {
                                target: this,
                                eventName: "Next",
                                currentPage: this.currentPage
                            }
                        })), this.state.repository) {
                            var e = this.state.repository,
                                r = this.getColumnDisplayNames();
                            this.gridLoading(), this.GetItems(e, r).then((function (e) {
                                t.setState({
                                    data: {
                                        gridData: e
                                    },
                                    show: !1
                                }), t.buildDataRows();
                            }));
                        }
                    }
                }, {
                    key: "refreshGridOnEvents",
                    value: function () {
                        var t = this,
                            e = this.state.repository,
                            r = this.getColumnDisplayNames();
                        this.setState({
                            show: !0
                        }), this.GetItems(e, r).then((function (e) {
                            t.setState({
                                data: {
                                    gridData: e
                                },
                                show: !1
                            }), t.buildDataRows();
                        }), (function (t) { }));
                    }
                }, {
                    key: "onPageSizeChange",
                    value: function (t) {
                        this.pageSize = parseInt(t), this.dispatchEvent(new CustomEvent("onPageSizeEvent", {
                            bubbles: !0,
                            detail: {
                                target: this,
                                eventName: "PageSize",
                                pageSize: this.pageSize
                            }
                        })), this.state.repository && this.refreshGridOnEvents();
                    }
                }, {
                    key: "getColumnDisplayNames",
                    value: function () {
                        var t = [];
                        return this.state.columns.forEach((function (e) {
                            t.push(e.field);
                        })), t;
                    }
                }, {
                    key: "sortField",
                    value: (_sortField = _asyncToGenerator(_regeneratorRuntime().mark((function t(e) {
                        var r, n, o, i, a, s, l, c;
                        return _regeneratorRuntime().wrap((function (t) {
                            for (; ;) switch (t.prev = t.next) {
                                case 0:
                                    (r = this.state.columns.find((function (t) {
                                        return t.field === e;
                                    }))) && r.sorting && (n = !0, (o = this.shadowRoot.querySelector("qaf-repeater").shadowRoot.querySelector('[data-col$="'.concat(r.field, '"]'))) && (this.shadowRoot.querySelector("qaf-repeater").shadowRoot.querySelectorAll(".qaf-grid__header-item").forEach((function (t) {
                                        t.querySelector(".fa.fa-solid.fa-sort-up").style.display = "none", t.querySelector(".fa.fa-solid.fa-sort-down").style.display = "none";
                                    })), (i = o.getAttribute("data-sort")) ? (n = "ASC" !== i, a = o.querySelector(".fa.fa-solid.fa-sort-up"), s = o.querySelector(".fa.fa-solid.fa-sort-down"), n ? (o.setAttribute("data-sort", "ASC"), a && (a.style.display = "block"), s && (s.style.display = "none")) : (o.setAttribute("data-sort", "DESC"), s && (s.style.display = "block"), a && (a.style.display = "none"))) : (o.setAttribute("data-sort", "ASC"), l = o.querySelector(".fa.fa-solid.fa-sort-up"), c = o.querySelector(".fa.fa-solid.fa-sort-down"), l && (l.style.display = "block"), c && (c.style.display = "none"))), this.setState({
                                        currentSortField: r.displayName
                                    }), this.sortby(e, n));
                                case 2:
                                case "end":
                                    return t.stop();
                            }
                        }), t, this);
                    }))), function (t) {
                        return _sortField.apply(this, arguments);
                    })
                }, {
                    key: "actionEvent",
                    value: function actionEvent(eventName, row) {
                        var id = this.getAttribute("id") ? this.getAttribute("id") : "qaf_grid_".concat(Math.random),
                            funName = "".concat(id, "_onRowActionEvent"),
                            isEventDefined = !0;
                        try {
                            rowVal = eval(funName)(eventName, row);
                        } catch (t) {
                            isEventDefined = !1;
                        }
                        if (window.QafPageService && !isEventDefined && this.state.repository) {
                            var gridCurrent = this;
                            "VIEW" === eventName ? window.QafPageService.ViewItem(this.state.repository, row.RecordID, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "EDIT" === eventName ? window.QafPageService.EditItem(this.state.repository, row.RecordID, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "DELETE" === eventName ? window.QafPageService.DeleteItem(row.RecordID, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "IMPORT" === eventName ? window.QafPageService.ImportBulkData(this.state.repository, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "IMPORT_LEAD" === eventName ? window.QafPageService.ImportBulkLead(this.state.repository, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "IMPORT_TRACKER" === eventName ? window.QafPageService.ImportBulkTracker(this.state.repository, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "IMPORT_TASK" === eventName ? window.QafPageService.ImportBulkTask(this.state.repository, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "JOB_OFFER" === eventName ? window.QafPageService.JobOfferForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "ENQUIRY" === eventName ? window.QafPageService.EnquiryForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "SITE_VISIT" === eventName ? window.QafPageService.SiteVisitForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "POST_REQUIREMENT" === eventName ? window.QafPageService.PostRequirementForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "TASK_POPUP" === eventName ? window.QafPageService.TaskPopupForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "PLANNER" === eventName ? window.QafPageService.PlannerForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "SALES" === eventName ? window.QafPageService.SalesForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : "SURVEY_SETTING" === eventName ? window.QafPageService.SurveySettingForm({ repository: this.state.repository, recordID: row.RecordID }, (function () {
                                gridCurrent.refreshGridOnEvents();
                            })) : null;
                        }
                    }
                }]), QafGrid;
            }(_qaf_lite_core__WEBPACK_IMPORTED_MODULE_0__.QafLiteElement);
        },
        572: (__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
            "use strict";
            __webpack_require__.d(__webpack_exports__, {
                _: () => QafRepeater
            });
            var _qaf_lite_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(978),
                _qaf_lite_core__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_qaf_lite_core__WEBPACK_IMPORTED_MODULE_0__);
            function _typeof(t) {
                return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                    return typeof t;
                } : function (t) {
                    return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
                }, _typeof(t);
            }
            function _classCallCheck(t, e) {
                if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
            }
            function _defineProperties(t, e) {
                for (var r = 0; r < e.length; r++) {
                    var n = e[r];
                    n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, _toPropertyKey(n.key), n);
                }
            }
            function _createClass(t, e, r) {
                return e && _defineProperties(t.prototype, e), r && _defineProperties(t, r), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), t;
            }
            function _toPropertyKey(t) {
                var e = _toPrimitive(t, "string");
                return "symbol" === _typeof(e) ? e : String(e);
            }
            function _toPrimitive(t, e) {
                if ("object" !== _typeof(t) || null === t) return t;
                var r = t[Symbol.toPrimitive];
                if (void 0 !== r) {
                    var n = r.call(t, e || "default");
                    if ("object" !== _typeof(n)) return n;
                    throw new TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === e ? String : Number)(t);
            }
            function _inherits(t, e) {
                if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                t.prototype = Object.create(e && e.prototype, {
                    constructor: {
                        value: t,
                        writable: !0,
                        configurable: !0
                    }
                }), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), e && _setPrototypeOf(t, e);
            }
            function _setPrototypeOf(t, e) {
                return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                    return t.__proto__ = e, t;
                }, _setPrototypeOf(t, e);
            }
            function _createSuper(t) {
                var e = _isNativeReflectConstruct();
                return function () {
                    var r, n = _getPrototypeOf(t);
                    if (e) {
                        var o = _getPrototypeOf(this).constructor;
                        r = Reflect.construct(n, arguments, o);
                    } else r = n.apply(this, arguments);
                    return _possibleConstructorReturn(this, r);
                };
            }
            function _possibleConstructorReturn(t, e) {
                if (e && ("object" === _typeof(e) || "function" == typeof e)) return e;
                if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                return _assertThisInitialized(t);
            }
            function _assertThisInitialized(t) {
                if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                return t;
            }
            function _isNativeReflectConstruct() {
                if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ("function" == typeof Proxy) return !0;
                try {
                    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                } catch (t) {
                    return !1;
                }
            }
            function _getPrototypeOf(t) {
                return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                    return t.__proto__ || Object.getPrototypeOf(t);
                }, _getPrototypeOf(t);
            }
            var QafRepeater = function (_QafLiteElement) {
                _inherits(QafRepeater, _QafLiteElement);
                var _super = _createSuper(QafRepeater);
                function QafRepeater() {
                    var t;
                    return _classCallCheck(this, QafRepeater), (t = _super.call(this, null, null)).state = {
                        list: []
                    }, t;
                }
                return _createClass(QafRepeater, [{
                    key: "data",
                    set: function (t) {
                        this.list = t, this.render();
                    }
                }, {
                    key: "init",
                    value: function init() {
                        var list = this.getAttribute("list");
                        list ? this.setState({
                            list: eval(list)
                        }) : this.setState({
                            list: this.data
                        });
                    }
                }, {
                    key: "changeEvent",
                    value: function changeEvent(name, oldVal, newVal) {
                        "list" === name && oldVal !== newVal && (this.setState({
                            list: eval(newVal)
                        }), this.render());
                    }
                }, {
                    key: "render",
                    value: function () {
                        var t = this,
                            e = "";
                        if (Array.isArray(this.list) || Array.isArray(this.data)) {
                            var r = this.list || this.data;
                            if (r.forEach((function (r) {
                                e += t.interpolate(t.innerHTML, r);
                            })), r.length > 0 && e.length > 0) {
                                this.shadowRoot.innerHTML = e;
                                var n = document.querySelector(this.getAttribute("data-bind-style"));
                                n && (this.shadowRoot.innerHTML += "<style>" + n.shadowRoot.querySelector("style").innerText + "</style>");
                            } else {
                                this.shadowRoot.innerHTML = e;
                                var o = document.querySelector(this.getAttribute("data-bind-style"));
                                o && (this.shadowRoot.innerHTML += "<style>" + o.shadowRoot.querySelector("style").innerText + "</style>");
                            }
                        } else if (Array.isArray(this.state.list) && this.state.list.length > 0) {
                            var i = "";
                            this.state.list.forEach((function (e) {
                                i += t.interpolate(t.innerHTML, e);
                            })), this.shadowRoot.innerHTML = i;
                        }
                    }
                }, {
                    key: "interpolate",
                    value: function (t, e) {
                        var r = this.getAttribute("data-bind-item");
                        if ("object" == _typeof(e))
                            for (var n in e) {
                                var o = "${" + r + "." + n + "}";
                                t.indexOf(o) > -1 && (t = t.replaceAll(o, e[n]));
                                var i = "${" + r + "}";
                                t.indexOf(i) > -1 && (t = t.replaceAll(o, e[n]));
                            }
                        return t;
                    }
                }], [{
                    key: "observedAttributes",
                    get: function () {
                        return ["list"];
                    }
                }]), QafRepeater;
            }(_qaf_lite_core__WEBPACK_IMPORTED_MODULE_0__.QafLiteElement);
        },
        970: (t, e, r) => {
            "use strict";
            r.d(e, {
                Z: () => n
            });
            const n = '@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");.qaf-grid {box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);background-color: var(--qaf-grid-bg-color, #fff);border: var(--qaf-grid-border, 2px solid #959393);border-radius: var(--qaf-grid-border, 5px);padding: var(--qaf-grid-pdding, 0 0);margin: var(--qaf-grid-margin, 16px 0);font-family: inherit;}.qaf-grid__top-bar {display: flex;align-items: center;justify-content: flex-start;}.qaf-grid-title {padding: 12px 24px;font-weight: 600;}.qaf-grid-actions {margin-left: auto;margin-right: 8px;}.qaf-grid-actions > button {margin-left: 8px;background-color: var(--qaf-grid-button-bg-color, #313CBF);border: none;color: var(--qaf-grid-button-color, #fff);padding: var(--qaf-grid-button-color, 6px 12px);text-align: center;text-decoration: none;display: inline-block;font-size: var(--qaf-grid-button-font-size, 16px);border-radius: var(--qaf-grid-button-border-radius, 24px);cursor: pointer;}.qaf-grid__header {display: flex;background-color: var(--qaf-grid-header-bg-color, #C8C6C6);align-items: center;justify-content: flex-start;font-size: 14px;padding-left: 4px;}.qaf-grid.card .qaf-grid__header {display: none;}.qaf-grid__header-item { padding: 12px 24px; font-weight: 600; width: 20%; cursor: pointer;}.qaf-grid__header-item > .fa.fa-solid { float: right;}.qaf-grid__body { display: flex; padding: 0; flex-direction: column; background-color: var(--qaf-grid-body-bg-color, #f8f8f8);}.qaf-grid__row { display: flex; border-bottom: 1px solid #d4d4d4; align-items: center; justify-content: flex-start; font-size: 12px; font-weight: 600; padding-left: 8px;}.qaf-grid__row:hover{ background-color: var(--qaf-grid-row-hover-bg-color, #C9F1F1);}.qaf-grid.card .qaf-grid__row { align-items: baseline;}.qaf-grid.card .qaf-grid__row:hover { background-color: transparent;}.qaf-grid__row:last-child { border-bottom-width: 0;}.qaf-grid__row-item { padding: 12px 24px; width: 20%;}.qaf-grid__footer { padding: 8px 16px; display: flex; justify-content: flex-end; background-color: var(--qaf-grid-header-bg-color, #F3F4F9); border-top: 1px solid #9F9F9F;}.qaf-grid__footer > button { margin-left: 8px; background-color: var(--qaf-grid-button-bg-color, #313CBF); border: none; color: var(--qaf-grid-button-color, #fff); padding: var(--qaf-grid-button-color, 8px 16px); text-align: center; text-decoration: none; display: inline-block; font-size: var(--qaf-grid-button-font-size, 16px); border-radius: var(--qaf-grid-button-border-radius, 24px); cursor: pointer;}.qaf-grid__footer > button > svg { height: 14px; width: 14px; fill: #fff;}.qaf-grid__row-item > button { background-color: var(--qaf-grid-button-bg-color, #313CBF); border: none; color: var(--qaf-grid-button-color, #fff); padding: var(--qaf-grid-button-color, 8px 16px); text-align: center; text-decoration: none; display: inline-block; font-size: var(--qaf-grid-button-font-size, 16px); border-radius: var(--qaf-grid-button-border-radius, 24px); cursor: pointer;}.qaf-grid__row-item_action { position: absolute; display: block;}.qaf-grid__row-item_action svg { width: 16px; height: 16px; cursor: pointer;}.qaf-grid-page-size { display: flex; align-items: center; }.qaf-grid-page-size label { padding-left: 8px; padding-right: 8px; font-weight: 600;}.qaf-grid-page-size select{ padding: 8px;  border:none; border-radius: 4px; background-color: var(--qaf-grid-button-bg-color, #d4d4d4); color: var(--qaf-grid-button-color, #fff);}.qaf-grid__row-item_action .action-content { display: none; position: absolute; width: 200px; overflow: auto; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); background-color: #fff; z-index: 99;}.qaf-grid__row-item_action .action-content .action-items { display: flex; align-items: center; flex-direction: column; justify-content: center;}.qaf-grid__row-item_action .action-content .action-items > button { cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; padding: 8px 16px; text-align: left; text-decoration: none; width: 100%; border: none; background: transparent; border-top: 1px solid #ededed; font-weight: 600; border-radius: 4px;}.qaf-grid__row-item_action .action-content .action-items > button:hover { background: rgba(0, 0, 0, 0.04); }.qaf-grid__row-item_action .action-content > button:first-child { border-top-width: 0;}.qaf-grid__row-item_action .row-menu > button { border: none; width: auto; background: transparent; color: var(--qaf-grid-button-bg-color, #000); padding-left: 0;}.qaf-grid__row-item_action .row-menu > button > svg { fill: var(--qaf-grid-button-bg-color, #000);}.qaf-grid__row-item_action .row-menu:hover .action-content { display: block;}';
        },
        9: (t, e, r) => {
            "use strict";
            r.d(e, {
                Z: () => n
            });
            const n = '<div class="qaf-grid"> <div class="qaf-grid__top-bar"> \x3c!-- <div class="qaf-grid-title" data-bind="title"></div>  <div class="qaf-grid-actions"> <button class="qaf-btn-primary" type="button">Add</button> </div> --\x3e </div> <div class="qaf-grid__header">  <qaf-repeater data-bind="data:columns" data-bind-item="col" class="qaf-grid__header" style="width: 100%;" data-bind-style="qaf-grid"> <div class="qaf-grid__header-item" data-col="${col.field}" data-sort="" onclick="this.sortField(`${col.field}`)"> ${col.displayName} <i class="fa fa-solid fa-sort-up" style="display: none;"></i> <i class="fa fa-solid fa-sort-down" style="display: none;"></i> </div> </qaf-repeater> </div> <div class="qaf-grid__body"> <qaf-loader data-loading="show"></qaf-loader> \x3c!-- <qaf-list data-bind="data:data.gridData" data-bind-item="it"> <div data-bind-html="rowItemTemplate"></div> </qaf-list> --\x3e <div data-bind-html="rowItemTemplate"></div> </div> <div class="qaf-grid__footer"> <div class="qaf-grid-page-size"> <label for="page-size">Page Size:</label> <select name="page-size" id="pagesize" class="pageSizeSelect"> <option value="10">10</option> <option value="15">15</option> <option value="25">25</option> <option value="40">40</option> <option value="50">50</option> </select> </div> <button type="button" onclick="this.prevPage()"> <?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 66.91 122.88" style="enable-background:new 0 0 66.91 122.88" xml:space="preserve"><g><path d="M64.96,111.2c2.65,2.73,2.59,7.08-0.13,9.73c-2.73,2.65-7.08,2.59-9.73-0.14L1.97,66.01l4.93-4.8l-4.95,4.8 c-2.65-2.74-2.59-7.1,0.15-9.76c0.08-0.08,0.16-0.15,0.24-0.22L55.1,2.09c2.65-2.73,7-2.79,9.73-0.14 c2.73,2.65,2.78,7.01,0.13,9.73L16.5,61.23L64.96,111.2L64.96,111.2L64.96,111.2z"/></g></svg> </button> <button type="button" onclick="this.nextPage()"> <?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 66.91 122.88" style="enable-background:new 0 0 66.91 122.88" xml:space="preserve"><g><path d="M1.95,111.2c-2.65,2.72-2.59,7.08,0.14,9.73c2.72,2.65,7.08,2.59,9.73-0.14L64.94,66l-4.93-4.79l4.95,4.8 c2.65-2.74,2.59-7.11-0.15-9.76c-0.08-0.08-0.16-0.15-0.24-0.22L11.81,2.09c-2.65-2.73-7-2.79-9.73-0.14 C-0.64,4.6-0.7,8.95,1.95,11.68l48.46,49.55L1.95,111.2L1.95,111.2L1.95,111.2z"/></g></svg> </button> </div></div>';
        }
    },
        __webpack_module_cache__ = {};
    function __webpack_require__(t) {
        var e = __webpack_module_cache__[t];
        if (void 0 !== e) return e.exports;
        var r = __webpack_module_cache__[t] = {
            exports: {}
        };
        return __webpack_modules__[t](r, r.exports, __webpack_require__), r.exports;
    }
    __webpack_require__.n = t => {
        var e = t && t.__esModule ? () => t.default : () => t;
        return __webpack_require__.d(e, {
            a: e
        }), e;
    }, __webpack_require__.d = (t, e) => {
        for (var r in e) __webpack_require__.o(e, r) && !__webpack_require__.o(t, r) && Object.defineProperty(t, r, {
            enumerable: !0,
            get: e[r]
        });
    }, __webpack_require__.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
    var __webpack_exports__ = {};
    (() => {
        "use strict";
        var t = __webpack_require__(978);
        const e = '<div class="qaf-avatar"> <div class="qaf-avatar-img"> <div class="qaf-avatar-initial" data-bind="initials"></div> </div> <div class="qaf-avatar-text"> <div class="qaf-avatar-text-primary" data-bind="primary"></div> <div class="qaf-avatar-text-secondary" data-bind="secondary"></div> </div></div>',
            r = " .qaf-avatar { display: flex;  } .qaf-avatar-initial { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: hotpink; border-radius: 50%; font-family: sans-serif; color: #fff; font-weight: bold; font-size: 16px; } .qaf-avatar-img { position: relative; padding: 0; height: 50px; font-size: 16px; line-height: 50px; border-radius: 25px; background-color: #f1f1f1; }  .qaf-avatar img { float: left; /* margin: 0 10px 0 -25px; */ height: 50px; width: 50px; border-radius: 50%; position: absolute; top: 0; display: none; } .qaf-avatar-img.show img{ display: block; } .qaf-avatar-text { padding: 8px 12px; } .qaf-avatar-text-primary { font-size: 18px; } .qaf-avatar-text-secondary { font-size: 14px; }";
        function n(t) {
            return n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                return typeof t;
            } : function (t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
            }, n(t);
        }
        function o(t, e) {
            for (var r = 0; r < e.length; r++) {
                var o = e[r];
                o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(t, (void 0, i = function (t, e) {
                    if ("object" !== n(t) || null === t) return t;
                    var r = t[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var o = r.call(t, "string");
                        if ("object" !== n(o)) return o;
                        throw new TypeError("@@toPrimitive must return a primitive value.");
                    }
                    return String(t);
                }(o.key), "symbol" === n(i) ? i : String(i)), o);
            }
            var i;
        }
        function i(t, e) {
            return i = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                return t.__proto__ = e, t;
            }, i(t, e);
        }
        function a(t) {
            return a = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                return t.__proto__ || Object.getPrototypeOf(t);
            }, a(t);
        }
        var s = function (t) {
            ! function (t, e) {
                if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                t.prototype = Object.create(e && e.prototype, {
                    constructor: {
                        value: t,
                        writable: !0,
                        configurable: !0
                    }
                }), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), e && i(t, e);
            }(p, t);
            var s, l, c, u, f, d = (u = p, f = function () {
                if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ("function" == typeof Proxy) return !0;
                try {
                    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                } catch (t) {
                    return !1;
                }
            }(), function () {
                var t, e = a(u);
                if (f) {
                    var r = a(this).constructor;
                    t = Reflect.construct(e, arguments, r);
                } else t = e.apply(this, arguments);
                return function (t, e) {
                    if (e && ("object" === n(e) || "function" == typeof e)) return e;
                    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                    return function (t) {
                        if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        return t;
                    }(t);
                }(this, t);
            });
            function p() {
                var t;
                return function (t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                }(this, p), (t = d.call(this, e, r)).employeeId = "", t.state = {
                    employeeId: "",
                    imageSrc: "",
                    initials: "",
                    primary: "",
                    secondary: ""
                }, t;
            }
            return s = p, c = [{
                key: "observedAttributes",
                get: function () {
                    return ["employeeId", "initials"];
                }
            }], (l = [{
                key: "init",
                value: function () {
                    var t = this.getAttribute("initials");
                    t && this.setState({
                        initials: t
                    });
                    var e = this.getAttribute("primary");
                    e && this.setState({
                        primary: e
                    });
                    var r = this.getAttribute("secondary");
                    r && this.setState({
                        secondary: r
                    });
                }
            }, {
                key: "render",
                value: function () {
                    var t = this;
                    console.log(this._employeeId);
                    var e = "https://qaf.quickappflow.com/DocStorage/qaf.quickappflow.com/Employees/Photos/{{ID}}_pp.jpg".replace("{{ID}}", this._employeeId);
                    this.setState({
                        imageSrc: e
                    });
                    var r = new Image;
                    r.src = e, r.onload = function () {
                        console.log("image loaded");
                        var r = t.shadowRoot.querySelector(".qaf-avatar-img"),
                            n = '<img src="'.concat(e, '" alt="Person" width="96" height="96">');
                        r.insertAdjacentHTML("beforeend", n), r.classList.add("show");
                    }, r.onerror = function () {
                        console.log("image could not be loaded");
                    };
                }
            }, {
                key: "changeEvent",
                value: function (t, e, r) {
                    "employeeId" === t && e !== r && this.render();
                }
            }, {
                key: "employeeId",
                get: function () {
                    console.log(this.getAttribute("data-bind-employeeId"));
                },
                set: function (t) {
                    this._employeeId = this.getAttribute("data-bind-employeeId") || t, this.render();
                }
            }]) && o(s.prototype, l), c && o(s, c), Object.defineProperty(s, "prototype", {
                writable: !1
            }), p;
        }(t.QafLiteElement);
        const l = '<div class="qaf-card"> <div class="qaf-card-title" data-bind="title"></div> <div class="qaf-card-content" data-bind-html="content"></div> <div class="qaf-card-footer"> </div></div>',
            c = ".qaf-card { box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2); max-width: 300px; font-family: inherit; border-radius: 5px; background-color: var(--qaf-card-bg-color, #D6DADA);}.qaf-card-title { font-size: 14px; font-weight: 600; padding: 8px 16px; border-bottom: var(--qaf-card-separator, 2px solid #959393);}.qaf-card-content { padding: 8px 16px; margin: 0 8px;}.qaf-card-content * { padding: 0; margin: 0;}";
        function u(t) {
            return u = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                return typeof t;
            } : function (t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
            }, u(t);
        }
        function f(t, e) {
            for (var r = 0; r < e.length; r++) {
                var n = e[r];
                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, (void 0, o = function (t, e) {
                    if ("object" !== u(t) || null === t) return t;
                    var r = t[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var n = r.call(t, "string");
                        if ("object" !== u(n)) return n;
                        throw new TypeError("@@toPrimitive must return a primitive value.");
                    }
                    return String(t);
                }(n.key), "symbol" === u(o) ? o : String(o)), n);
            }
            var o;
        }
        function d(t, e) {
            return d = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                return t.__proto__ = e, t;
            }, d(t, e);
        }
        function p(t) {
            return p = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                return t.__proto__ || Object.getPrototypeOf(t);
            }, p(t);
        }
        var y = function (t) {
            ! function (t, e) {
                if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                t.prototype = Object.create(e && e.prototype, {
                    constructor: {
                        value: t,
                        writable: !0,
                        configurable: !0
                    }
                }), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), e && d(t, e);
            }(s, t);
            var e, r, n, o, i, a = (o = s, i = function () {
                if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ("function" == typeof Proxy) return !0;
                try {
                    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                } catch (t) {
                    return !1;
                }
            }(), function () {
                var t, e = p(o);
                if (i) {
                    var r = p(this).constructor;
                    t = Reflect.construct(e, arguments, r);
                } else t = e.apply(this, arguments);
                return function (t, e) {
                    if (e && ("object" === u(e) || "function" == typeof e)) return e;
                    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                    return function (t) {
                        if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        return t;
                    }(t);
                }(this, t);
            });
            function s() {
                var t;
                return function (t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                }(this, s), (t = a.call(this, l, c)).title = "", t.state = {
                    title: "",
                    image: "",
                    content: "",
                    footer: ""
                }, t;
            }
            return e = s, n = [{
                key: "observedAttributes",
                get: function () {
                    return ["title"];
                }
            }], (r = [{
                key: "init",
                value: function () {
                    var t = this.getAttribute("title");
                    t && this.setState({
                        title: t
                    });
                    var e = this.getAttribute("template");
                    if (e) {
                        var r = document.getElementById(e);
                        r.content.cloneNode(!0), this.setState({
                            content: r.innerHTML
                        });
                    }
                }
            }, {
                key: "render",
                value: function () { }
            }, {
                key: "changeEvent",
                value: function (t, e, r) {
                    "title" === t && e !== r && this.render();
                }
            }, {
                key: "title",
                set: function (t) {
                    this._title = this.getAttribute("data-bind-title") || t, this.render();
                }
            }]) && f(e.prototype, r), n && f(e, n), Object.defineProperty(e, "prototype", {
                writable: !1
            }), s;
        }(t.QafLiteElement),
            h = __webpack_require__(572),
            v = __webpack_require__(60);
        const m = ".qaf-grid__row { display: flex; padding: 12px 0; border-bottom: 1px solid #d4d4d4;}.qaf-grid__row:hover{ background-color: var(--qaf-list-row-bg, #f8f8f8);}.qaf-grid__row:last-child { border-bottom-width: var(--qaf-list-row-bottom-width, 0);;}.qaf-grid__row-item { padding: 0 16px; width: 20%;}";
        function _(t) {
            return _ = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                return typeof t;
            } : function (t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
            }, _(t);
        }
        function b(t, e) {
            for (var r = 0; r < e.length; r++) {
                var n = e[r];
                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, (void 0, o = function (t, e) {
                    if ("object" !== _(t) || null === t) return t;
                    var r = t[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var n = r.call(t, "string");
                        if ("object" !== _(n)) return n;
                        throw new TypeError("@@toPrimitive must return a primitive value.");
                    }
                    return String(t);
                }(n.key), "symbol" === _(o) ? o : String(o)), n);
            }
            var o;
        }
        function g(t, e) {
            return g = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                return t.__proto__ = e, t;
            }, g(t, e);
        }
        function w(t) {
            return w = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                return t.__proto__ || Object.getPrototypeOf(t);
            }, w(t);
        }
        var E = function (t) {
            ! function (t, e) {
                if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                t.prototype = Object.create(e && e.prototype, {
                    constructor: {
                        value: t,
                        writable: !0,
                        configurable: !0
                    }
                }), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), e && g(t, e);
            }(a, t);
            var e, r, n, o, i = (n = a, o = function () {
                if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ("function" == typeof Proxy) return !0;
                try {
                    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                } catch (t) {
                    return !1;
                }
            }(), function () {
                var t, e = w(n);
                if (o) {
                    var r = w(this).constructor;
                    t = Reflect.construct(e, arguments, r);
                } else t = e.apply(this, arguments);
                return function (t, e) {
                    if (e && ("object" === _(e) || "function" == typeof e)) return e;
                    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                    return function (t) {
                        if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        return t;
                    }(t);
                }(this, t);
            });
            function a() {
                return function (t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                }(this, a), i.call(this, null, m);
            }
            return e = a, (r = [{
                key: "changeEvent",
                value: function (t, e, r) {
                    alert(t);
                }
            }, {
                key: "render",
                value: function () {
                    var t = this,
                        e = "";
                    Array.isArray(this._items) && (this._items.forEach((function (r) {
                        e += t.interpolate(t.innerHTML, r);
                    })), this._items.length > 0 && e.length, this.shadowRoot.innerHTML = e, this.shadowRoot.innerHTML += "<style>" + m + "</style>");
                }
            }, {
                key: "interpolate",
                value: function (t, e) {
                    var r = this.getAttribute("data-bind-item");
                    if ("object" == _(e))
                        for (var n in e) {
                            var o = "${" + r + "." + n + "}";
                            t.indexOf(o) > -1 && (t = t.replaceAll(o, e[n]));
                            var i = "${" + r + "}";
                            t.indexOf(i) > -1 && (t = t.replaceAll(o, e[n]));
                        }
                    return t;
                }
            }, {
                key: "data",
                get: function () {
                    return this._items;
                },
                set: function (t) {
                    this._items = t, this.render();
                }
            }]) && b(e.prototype, r), Object.defineProperty(e, "prototype", {
                writable: !1
            }), a;
        }(t.QafLiteElement);
        const O = '<div class="lds-ellipsis"> <div></div> <div></div> <div></div> <div></div></div>',
            S = "qaf-loader { position: relative; } .lds-ellipsis { position: relative; width: 10%; height: 80px; margin: 0 auto; } .lds-ellipsis div { position: absolute; top: 33px; width: 13px; height: 13px; border-radius: 50%; background: #fcf; animation-timing-function: cubic-bezier(0, 1, 1, 0); } .lds-ellipsis div:nth-child(1) { left: 8px; animation: lds-ellipsis1 0.6s infinite; } .lds-ellipsis div:nth-child(2) { left: 8px; animation: lds-ellipsis2 0.6s infinite; } .lds-ellipsis div:nth-child(3) { left: 32px; animation: lds-ellipsis2 0.6s infinite; } .lds-ellipsis div:nth-child(4) { left: 56px; animation: lds-ellipsis3 0.6s infinite; } @keyframes lds-ellipsis1 { 0% { transform: scale(0); } 100% { transform: scale(1); } } @keyframes lds-ellipsis3 { 0% { transform: scale(1); } 100% { transform: scale(0); } } @keyframes lds-ellipsis2 { 0% { transform: translate(0, 0); } 100% { transform: translate(24px, 0); } } ";
        function P(t) {
            return P = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (t) {
                return typeof t;
            } : function (t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
            }, P(t);
        }
        function x(t, e) {
            for (var r = 0; r < e.length; r++) {
                var n = e[r];
                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, (void 0, o = function (t, e) {
                    if ("object" !== P(t) || null === t) return t;
                    var r = t[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var n = r.call(t, "string");
                        if ("object" !== P(n)) return n;
                        throw new TypeError("@@toPrimitive must return a primitive value.");
                    }
                    return String(t);
                }(n.key), "symbol" === P(o) ? o : String(o)), n);
            }
            var o;
        }
        function j(t, e) {
            return j = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
                return t.__proto__ = e, t;
            }, j(t, e);
        }
        function A(t) {
            return A = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
                return t.__proto__ || Object.getPrototypeOf(t);
            }, A(t);
        }
        var q = function (t) {
            ! function (t, e) {
                if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                t.prototype = Object.create(e && e.prototype, {
                    constructor: {
                        value: t,
                        writable: !0,
                        configurable: !0
                    }
                }), Object.defineProperty(t, "prototype", {
                    writable: !1
                }), e && j(t, e);
            }(s, t);
            var e, r, n, o, i, a = (o = s, i = function () {
                if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                if (Reflect.construct.sham) return !1;
                if ("function" == typeof Proxy) return !0;
                try {
                    return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function () { }))), !0;
                } catch (t) {
                    return !1;
                }
            }(), function () {
                var t, e = A(o);
                if (i) {
                    var r = A(this).constructor;
                    t = Reflect.construct(e, arguments, r);
                } else t = e.apply(this, arguments);
                return function (t, e) {
                    if (e && ("object" === P(e) || "function" == typeof e)) return e;
                    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                    return function (t) {
                        if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        return t;
                    }(t);
                }(this, t);
            });
            function s() {
                var t;
                return function (t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                }(this, s), (t = a.call(this, O, S)).state = {
                    show: !1
                }, t;
            }
            return e = s, n = [{
                key: "observedAttributes",
                get: function () {
                    return ["data-loading"];
                }
            }], (r = [{
                key: "init",
                value: function () { }
            }, {
                key: "render",
                value: function () {
                    this._show ? this.shadowRoot.lastChild.style.display = "block" : this.shadowRoot.lastChild.style.display = "none";
                }
            }, {
                key: "changeEvent",
                value: function (t, e, r) {
                    "show" === t && this.render();
                }
            }, {
                key: "show",
                set: function (t) {
                    this._show = t, this.render();
                }
            }]) && x(e.prototype, r), n && x(e, n), Object.defineProperty(e, "prototype", {
                writable: !1
            }), s;
        }(t.QafLiteElement);
        void 0 === customElements.get("qaf-loader") && customElements.define("qaf-loader", q), void 0 === customElements.get("qaf-repeater") && customElements.define("qaf-repeater", h._), void 0 === customElements.get("qaf-list") && customElements.define("qaf-list", E), void 0 === customElements.get("qaf-grid") && customElements.define("qaf-grid", v.l), void 0 === customElements.get("qaf-avatar") && customElements.define("qaf-avatar", s), void 0 === customElements.get("qaf-card") && customElements.define("qaf-card", y);
    })();
    (function () {
        function callWhenReady(fnName, args) {
            var tries = 0, max = 50;
            var t = setInterval(function () {
                tries++;
                try {
                    if (window.QafPageService && typeof window.QafPageService[fnName] === 'function') {
                        clearInterval(t);
                        try { window.QafPageService[fnName].apply(window.QafPageService, args); } catch (e) { }
                        return;
                    }
                } catch (e) { }
                if (tries >= max) { clearInterval(t); console.warn('QafPageService.' + fnName + ' not available'); }
            }, 100);
        }
        window.QafPageService = window.QafPageService || {};
        var wrappers = {
            // CRUD aliases
            openAddItem: ['AddItem'],
            openViewItem: ['ViewItem'],
            openEditItem: ['EditItem'],
            openDeleteItem: ['DeleteItem'],
            // Import / Bulk
            openImportBulkData: ['ImportBulkData'],
            openImportBulkLead: ['ImportBulkLead'],
            openImportBulkTracker: ['ImportBulkTracker'],
            openImportBulkTask: ['ImportBulkTask'],
            // Forms
            openJobOfferForm: ['JobOfferForm'],
            openEnquiryForm: ['EnquiryForm'],
            openSiteVisitForm: ['SiteVisitForm'],
            openPostRequirementForm: ['PostRequirementForm'],
            openTaskPopupForm: ['TaskPopupForm', 'CrmTaskFormPopup'],
            openPlannerForm: ['PlannerForm'],
            openSalesForm: ['SalesForm'],
            openSurveySettingForm: ['SurveySettingForm'],
            openPublicUrlForm: ['PublicUrlForm'],
            openAdminResetForm: ['AdminResetForm'],
            openCrmTaskFormPopup: ['CrmTaskFormPopup']
        };
        // Argument builders normalize call arguments to match Angular handler signatures.
        var argBuilders = {
            // CRUD: accept either positional or named-object {objectName, recordID, callback, ...}
            AddItem: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.objectName || o.repository || o.objectId, o.callback || null, o.showFields, o.showFieldsWithValue, o.fieldFilterConditions, o.fieldConversion, o.hiddenFields, o.excludeFieldFromForm, o.onSaveAction, o.changeTitles, o.openAsPopup, o.addUpdateApi, o.readOnlyFormField, o.whereclauseForRecordID, o.requiredFormField, o.UFieldID];
                } return a;
            },
            ViewItem: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.objectName || o.repository || o.objectId, o.recordID, o.callback || null, o.showFields, o.showFieldsWithValue, o.changeTitles, o.openAsPopup];
                } return a;
            },
            EditItem: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.objectName || o.repository || o.objectId, o.recordID, o.callback || null, o.showFields, o.showFieldsWithValue, o.fieldFilterConditions, o.fieldConversion, o.hiddenFields, o.excludeFieldFromForm, o.onSaveAction, o.changeTitles, o.openAsPopup, o.addUpdateApi, o.readOnlyFormField, o.requiredFormField, o.whereclauseForRecordID];
                } return a;
            },
            DeleteItem: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.recordID, o.callback || null];
                } return a;
            },
            // Import builders: accept (repository, callback, options...) or {repository, callback, options}
            ImportBulkData: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.objectName || o.repository || o.objectId, o.callback || null, o.hiddenFieldsWithValue, o.hiddenFields];
                } return a;
            },
            ImportBulkLead: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.repository || o.objectName, o.callback || null, o.hiddenFieldsWithValue, o.hiddenFields];
                } return a;
            },
            ImportBulkTracker: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.repository || o.objectName, o.callback || null, o.options || null];
                } return a;
            },
            ImportBulkTask: function (a) {
                if (a.length === 1 && typeof a[0] === 'object') {
                    var o = a[0]; return [o.repository || o.objectName, o.callback || null, o.options || null];
                } return a;
            },
            // Generic form builders: expect (inputsObject?, callback?)
            JobOfferForm: function (a) {
                if (a.length === 0) return [null, null];
                if (a.length === 1 && typeof a[0] === 'function') return [null, a[0]];
                if (a.length === 1 && typeof a[0] === 'object') return [a[0], null]; return a;
            },
            EnquiryForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            SiteVisitForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            PostRequirementForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            TaskPopupForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            CrmTaskFormPopup: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            PlannerForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            SalesForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            SurveySettingForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            PublicUrlForm: function (a) {
                return argBuilders.JobOfferForm(a);
            },
            AdminResetForm: function (a) {
                return argBuilders.JobOfferForm(a);
            }
        };
        Object.keys(wrappers).forEach(function (alias) {
            window.QafPageService[alias] = function () {
                var args = Array.prototype.slice.call(arguments);
                var methods = wrappers[alias];
                var target = methods[0];
                // normalize args using argBuilders if available
                try {
                    if (argBuilders[target]) {
                        args = argBuilders[target](args) || args;
                    }
                } catch (e) { }
                for (var i = 0; i < methods.length; i++) {
                    var m = methods[i];
                    if (window.QafPageService && typeof window.QafPageService[m] === 'function') {
                        try { window.QafPageService[m].apply(window.QafPageService, args); return; } catch (e) { }
                    }
                }
                callWhenReady(target, args);
            };
        });
    })();
})();