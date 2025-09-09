"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@vueuse/core");
var utils_1 = require("@/lib/utils");
var TableCell_vue_1 = require("./TableCell.vue");
var TableRow_vue_1 = require("./TableRow.vue");
var props = withDefaults(defineProps(), {
    colspan: 1,
});
var delegatedProps = (0, core_1.reactiveOmit)(props, "class");
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    colspan: 1,
});
var __VLS_ctx = {};
var __VLS_elements;
var __VLS_components;
var __VLS_directives;
/** @type {[typeof TableRow, typeof TableRow, ]} */ ;
// @ts-ignore
var __VLS_0 = __VLS_asFunctionalComponent(TableRow_vue_1.default, new TableRow_vue_1.default({}));
var __VLS_1 = __VLS_0.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_0), false));
var __VLS_3 = {};
var __VLS_4 = __VLS_2.slots.default;
/** @type {[typeof TableCell, typeof TableCell, ]} */ ;
// @ts-ignore
var __VLS_5 = __VLS_asFunctionalComponent(TableCell_vue_1.default, new TableCell_vue_1.default(__assign({ class: (__VLS_ctx.cn('p-4 whitespace-nowrap align-middle text-sm text-foreground', props.class)) }, (__VLS_ctx.delegatedProps))));
var __VLS_6 = __VLS_5.apply(void 0, __spreadArray([__assign({ class: (__VLS_ctx.cn('p-4 whitespace-nowrap align-middle text-sm text-foreground', props.class)) }, (__VLS_ctx.delegatedProps))], __VLS_functionalComponentArgsRest(__VLS_5), false));
var __VLS_8 = __VLS_7.slots.default;
// @ts-ignore
[utils_1.cn, delegatedProps,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)(__assign({ class: "flex items-center justify-center py-10" }));
var __VLS_9 = {};
var __VLS_7;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
// @ts-ignore
var __VLS_10 = __VLS_9;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () { return ({
        cn: utils_1.cn,
        TableCell: TableCell_vue_1.default,
        TableRow: TableRow_vue_1.default,
        delegatedProps: delegatedProps,
    }); },
    __typeProps: {},
    props: {},
});
var __VLS_component = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeProps: {},
    props: {},
});
exports.default = {};
; /* PartiallyEnd: #4569/main.vue */
