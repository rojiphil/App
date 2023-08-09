import * as Composer from '../actions/Composer';

export default () => {
    console.log("openReportActionComposeViewWhenClosingMessageEdit(WEB):setShouldShowComposeInput[true]");
    Composer.setShouldShowComposeInput(true);
};
