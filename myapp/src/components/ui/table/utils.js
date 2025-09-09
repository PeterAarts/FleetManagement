"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.valueUpdater = valueUpdater;
var vue_table_1 = require("@tanstack/vue-table");
function valueUpdater(updaterOrValue, ref) {
    ref.value = (0, vue_table_1.isFunction)(updaterOrValue)
        ? updaterOrValue(ref.value)
        : updaterOrValue;
}
