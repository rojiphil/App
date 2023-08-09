import _ from 'underscore';
import React from 'react';

const composerRef = React.createRef();
let focusCallback = null;
let focusActionItemCallback = null;

/**
 * Register a callback to be called when focus is requested.
 * Typical uses of this would be call the focus on the ReportActionComposer.
 *
 * @param {Function} callback callback to register
 */
function onComposerFocus(callback, isActionItem = false) {
    console.log("ReportActionComposeFocusManager:onComposerFocus["+isActionItem+"]");
    if(isActionItem)
    {
        focusCallback = null;
        console.log("ReportActionComposeFocusManager:CALLBACK[ReportActionCompose]");
        focusCallback = callback;
    }
    else
    {
        console.log("ReportActionComposeFocusManager:CALLBACK[ReportActionMessageEdit]");
        focusActionItemCallback = null;
        focusActionItemCallback = callback;
    }
}

/**
 * Request focus on the ReportActionComposer
 *
 */
function focus() {
    // console.log("ReportActionComposeFocusManager");
    if (_.isObject(focusActionItemCallback)) {
        console.log("ReportActionComposeFocusManager:FOCUS[ReportActionMessageEdit]");
        focusActionItemCallback.current();
        return;
    }
    if (_.isFunction(focusCallback)) {
        console.log("ReportActionComposeFocusManager:FOCUS[ReportActionCompose]");
        focusCallback();
        return;
    }
}

/**
 * Clear the registered focus callback
 *
 */
function clear(isActionItem = false) {
    // console.log("ReportActionComposeFocusManager");
    if(isActionItem)
    {
        console.log("ReportActionComposeFocusManager:CLEAR[ReportActionCompose]");
        focusCallback = null;
    }
    else
    {
        console.log("ReportActionComposeFocusManager:CLEAR[ReportActionMessageEdit]");
        focusActionItemCallback = null;
    }
}

/**
 * Exposes the current focus state of the report action composer.
 * @return {Boolean} isFocused
 */
function isFocused() {
    return composerRef.current && composerRef.current.isFocused();
}

function isCurrentActionItem(onFocusCallback) {
    console.log("focusActionItemCallback["+focusActionItemCallback+"],onFocusCallback["+onFocusCallback+"]");
    return focusActionItemCallback === onFocusCallback;
}

export default {
    composerRef,
    onComposerFocus,
    focus,
    clear,
    isFocused,
    isCurrentActionItem,
};
