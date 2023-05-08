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
    if(!isActionItem)
    {
        focusCallback = null;
        focusCallback = callback;
    }
    else
    {
        focusActionItemCallback = null;
        focusActionItemCallback = callback;
    }
}

/**
 * Request focus on the ReportActionComposer
 *
 */
function focus() {
    if (_.isFunction(focusActionItemCallback)) {
        console.log("[ReportActionComposeFocusManager][focus]");
        focusActionItemCallback();
        return;
    }
    if (_.isFunction(focusCallback)) {
        console.log("[ReportActionCompose][focus]");
        focusCallback();
        return;
    }
}

/**
 * Clear the registered focus callback
 *
 */
function clear(isActionItem = false) {
    if(isActionItem)
    {
        focusCallback = null;
    }
    else
    {
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

export default {
    composerRef,
    onComposerFocus,
    focus,
    clear,
    isFocused,
};
