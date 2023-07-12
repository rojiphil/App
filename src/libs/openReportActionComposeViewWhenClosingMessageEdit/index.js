import * as Composer from '../actions/Composer';

export default () => {
    console.log("openReportActionComposeViewWhenClosingMessageEdit,index[setShouldShowComposeInput(true)]");
    Composer.setShouldShowComposeInput(true);
};
