import * as Composer from '../actions/Composer';

export default () => {
    console.log("setShouldShowComposeInput[In openReportActionComposeViewWhenClosingMessageEdit(WEB)]");
    Composer.setShouldShowComposeInput(true);
};
