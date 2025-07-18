import Onyx from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import * as API from '@libs/API';
import type {GenerateSpotnanaTokenParams} from '@libs/API/parameters';
import {SIDE_EFFECT_REQUEST_COMMANDS} from '@libs/API/types';
import asyncOpenURL from '@libs/asyncOpenURL';
import * as Environment from '@libs/Environment/Environment';
import Navigation from '@libs/Navigation/Navigation';
import * as Url from '@libs/Url';
import CONFIG from '@src/CONFIG';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Route} from '@src/ROUTES';
import ROUTES from '@src/ROUTES';
import {canAnonymousUserAccessRoute, isAnonymousUser, signOutAndRedirectToSignIn} from './Session';

let isNetworkOffline = false;
Onyx.connect({
    key: ONYXKEYS.NETWORK,
    callback: (value) => (isNetworkOffline = value?.isOffline ?? false),
});

let currentUserEmail = '';
let currentUserAccountID: number = CONST.DEFAULT_NUMBER_ID;
Onyx.connect({
    key: ONYXKEYS.SESSION,
    callback: (value) => {
        currentUserEmail = value?.email ?? '';
        currentUserAccountID = value?.accountID ?? CONST.DEFAULT_NUMBER_ID;
    },
});

function buildOldDotURL(url: string, shortLivedAuthToken?: string): Promise<string> {
    const hashIndex = url.lastIndexOf('#');
    const hasHashParams = hashIndex !== -1;
    const hasURLParams = url.indexOf('?') !== -1;
    let originURL = url;
    let hashParams = '';
    if (hasHashParams) {
        originURL = url.substring(0, hashIndex);
        hashParams = url.substring(hashIndex);
    }

    const authTokenParam = shortLivedAuthToken ? `authToken=${shortLivedAuthToken}` : '';
    const emailParam = `email=${encodeURIComponent(currentUserEmail)}`;
    const paramsArray = [authTokenParam, emailParam];
    const params = paramsArray.filter(Boolean).join('&');

    return Environment.getOldDotEnvironmentURL().then((environmentURL) => {
        const oldDotDomain = Url.addTrailingForwardSlash(environmentURL);

        // If the URL contains # or ?, we can assume they don't need to have the `?` token to start listing url parameters.
        return `${oldDotDomain}${originURL}${hasURLParams ? '&' : '?'}${params}${hashParams}`;
    });
}

/**
 * @param shouldSkipCustomSafariLogic When true, we will use `Linking.openURL` even if the browser is Safari.
 */
function openExternalLink(url: string, shouldSkipCustomSafariLogic = false, shouldOpenInSameTab = false) {
    asyncOpenURL(Promise.resolve(), url, shouldSkipCustomSafariLogic, shouldOpenInSameTab);
}

function openOldDotLink(url: string, shouldOpenInSameTab = false) {
    if (isNetworkOffline) {
        buildOldDotURL(url).then((oldDotURL) => openExternalLink(oldDotURL, undefined, shouldOpenInSameTab));
        return;
    }

    // If shortLivedAuthToken is not accessible, fallback to opening the link without the token.
    asyncOpenURL(
        // eslint-disable-next-line rulesdir/no-api-side-effects-method
        API.makeRequestWithSideEffects(SIDE_EFFECT_REQUEST_COMMANDS.OPEN_OLD_DOT_LINK, {}, {})
            .then((response) => (response ? buildOldDotURL(url, response.shortLivedAuthToken) : buildOldDotURL(url)))
            .catch(() => buildOldDotURL(url)),
        (oldDotURL) => oldDotURL,
        undefined,
        shouldOpenInSameTab,
    );
}

function buildTravelDotURL(spotnanaToken: string, isTestAccount: boolean, postLoginPath?: string): string {
    const environmentURL = isTestAccount ? CONST.STAGING_TRAVEL_DOT_URL : CONST.TRAVEL_DOT_URL;
    const tmcID = isTestAccount ? CONST.STAGING_SPOTNANA_TMC_ID : CONST.SPOTNANA_TMC_ID;

    const authCode = `authCode=${spotnanaToken}`;
    const tmcIDParam = `tmcId=${tmcID}`;
    const redirectURL = postLoginPath ? `redirectUrl=${Url.addLeadingForwardSlash(postLoginPath)}` : '';

    const paramsArray = [authCode, tmcIDParam, redirectURL];
    const params = paramsArray.filter(Boolean).join('&');
    const travelDotDomain = Url.addTrailingForwardSlash(environmentURL);
    return `${travelDotDomain}auth/code?${params}`;
}

/**
 * @param postLoginPath When provided, we will redirect the user to this path post login on travelDot. eg: 'trips/:tripID'
 */
function openTravelDotLink(policyID: OnyxEntry<string>, postLoginPath?: string) {
    if (policyID === null || policyID === undefined) {
        return;
    }

    const parameters: GenerateSpotnanaTokenParams = {
        policyID,
    };

    return new Promise((resolve, reject) => {
        const error = new Error('Failed to generate spotnana token.');

        asyncOpenURL(
            // eslint-disable-next-line rulesdir/no-api-side-effects-method
            API.makeRequestWithSideEffects(SIDE_EFFECT_REQUEST_COMMANDS.GENERATE_SPOTNANA_TOKEN, parameters, {})
                .then((response) => {
                    if (!response?.spotnanaToken) {
                        reject(error);
                        throw error;
                    }
                    const travelURL = buildTravelDotURL(response.spotnanaToken, response.isTestAccount ?? false, postLoginPath);
                    resolve(undefined);
                    return travelURL;
                })
                .catch(() => {
                    reject(error);
                    throw error;
                }),
            (travelDotURL) => travelDotURL ?? '',
        );
    });
}

function getInternalNewExpensifyPath(href: string) {
    if (!href) {
        return '';
    }
    const attrPath = Url.getPathFromURL(href);
    return (Url.hasSameExpensifyOrigin(href, CONST.NEW_EXPENSIFY_URL) || Url.hasSameExpensifyOrigin(href, CONST.STAGING_NEW_EXPENSIFY_URL) || href.startsWith(CONST.DEV_NEW_EXPENSIFY_URL)) &&
        !CONST.PATHS_TO_TREAT_AS_EXTERNAL.find((path) => attrPath.startsWith(path))
        ? attrPath
        : '';
}

function getInternalExpensifyPath(href: string) {
    if (!href) {
        return '';
    }

    const attrPath = Url.getPathFromURL(href);
    const hasExpensifyOrigin = Url.hasSameExpensifyOrigin(href, CONFIG.EXPENSIFY.EXPENSIFY_URL) || Url.hasSameExpensifyOrigin(href, CONFIG.EXPENSIFY.STAGING_API_ROOT);
    if (!hasExpensifyOrigin || attrPath.startsWith(CONFIG.EXPENSIFY.CONCIERGE_URL_PATHNAME) || attrPath.startsWith(CONFIG.EXPENSIFY.DEVPORTAL_URL_PATHNAME)) {
        return '';
    }

    return attrPath;
}

function openLink(href: string, environmentURL: string, isAttachment = false) {
    const hasSameOrigin = Url.hasSameExpensifyOrigin(href, environmentURL);
    const hasExpensifyOrigin = Url.hasSameExpensifyOrigin(href, CONFIG.EXPENSIFY.EXPENSIFY_URL) || Url.hasSameExpensifyOrigin(href, CONFIG.EXPENSIFY.STAGING_API_ROOT);
    const internalNewExpensifyPath = getInternalNewExpensifyPath(href);
    const internalExpensifyPath = getInternalExpensifyPath(href);

    // There can be messages from Concierge with links to specific NewDot reports. Those URLs look like this:
    // https://www.expensify.com.dev/newdotreport?reportID=3429600449838908 and they have a target="_blank" attribute. This is so that when a user is on OldDot,
    // clicking on the link will open the chat in NewDot. However, when a user is in NewDot and clicks on the concierge link, the link needs to be handled differently.
    // Normally, the link would be sent to Link.openOldDotLink() and opened in a new tab, and that's jarring to the user. Since the intention is to link to a specific NewDot chat,
    // the reportID is extracted from the URL and then opened as an internal link, taking the user straight to the chat in the same tab.
    if (hasExpensifyOrigin && href.indexOf('newdotreport?reportID=') > -1) {
        const reportID = href.split('newdotreport?reportID=').pop();
        const reportRoute = ROUTES.REPORT_WITH_ID.getRoute(reportID);
        Navigation.navigate(reportRoute);
        return;
    }

    // If we are handling a New Expensify link then we will assume this should be opened by the app internally. This ensures that the links are opened internally via react-navigation
    // instead of in a new tab or with a page refresh (which is the default behavior of an anchor tag)
    if (internalNewExpensifyPath && hasSameOrigin) {
        if (isAnonymousUser() && !canAnonymousUserAccessRoute(internalNewExpensifyPath)) {
            signOutAndRedirectToSignIn();
            return;
        }
        Navigation.navigate(internalNewExpensifyPath as Route);
        return;
    }
    // If we are handling an old dot Expensify link we need to open it with openOldDotLink() so we can navigate to it with the user already logged in.
    // As attachments also use expensify.com we don't want it working the same as links.
    const isPublicOldDotURL = (Object.values(CONST.OLD_DOT_PUBLIC_URLS) as string[]).includes(href);
    if (internalExpensifyPath && !isAttachment && !isPublicOldDotURL) {
        openOldDotLink(internalExpensifyPath);
        return;
    }

    openExternalLink(href);
}

function buildURLWithAuthToken(url: string, shortLivedAuthToken?: string) {
    const authTokenParam = shortLivedAuthToken ? `shortLivedAuthToken=${shortLivedAuthToken}` : '';
    const emailParam = `email=${encodeURIComponent(currentUserEmail)}`;
    const exitTo = `exitTo=${encodeURIComponent(url)}`;
    const accountID = `accountID=${currentUserAccountID}`;
    const referrer = 'referrer=desktop';
    const paramsArray = [accountID, emailParam, authTokenParam, exitTo, referrer];
    const params = paramsArray.filter(Boolean).join('&');

    return `${CONFIG.EXPENSIFY.NEW_EXPENSIFY_URL}transition?${params}`;
}

/**
 * @param shouldSkipCustomSafariLogic When true, we will use `Linking.openURL` even if the browser is Safari.
 */
function openExternalLinkWithToken(url: string, shouldSkipCustomSafariLogic = false) {
    asyncOpenURL(
        // eslint-disable-next-line rulesdir/no-api-side-effects-method
        API.makeRequestWithSideEffects(SIDE_EFFECT_REQUEST_COMMANDS.OPEN_OLD_DOT_LINK, {}, {})
            .then((response) => (response ? buildURLWithAuthToken(url, response.shortLivedAuthToken) : buildURLWithAuthToken(url)))
            .catch(() => buildURLWithAuthToken(url)),
        (link) => link,
        shouldSkipCustomSafariLogic,
    );
}

function getTravelDotLink(policyID: OnyxEntry<string>) {
    if (policyID === null || policyID === undefined) {
        return Promise.reject(new Error('Policy ID is required'));
    }

    const parameters: GenerateSpotnanaTokenParams = {
        policyID,
    };

    // eslint-disable-next-line rulesdir/no-api-side-effects-method
    return API.makeRequestWithSideEffects(SIDE_EFFECT_REQUEST_COMMANDS.GENERATE_SPOTNANA_TOKEN, parameters, {}).then((response) => {
        if (!response?.spotnanaToken) {
            throw new Error('Failed to generate spotnana token.');
        }
        return response;
    });
}

export {
    buildOldDotURL,
    openOldDotLink,
    openExternalLink,
    openLink,
    getInternalNewExpensifyPath,
    getInternalExpensifyPath,
    openTravelDotLink,
    buildTravelDotURL,
    openExternalLinkWithToken,
    getTravelDotLink,
};
