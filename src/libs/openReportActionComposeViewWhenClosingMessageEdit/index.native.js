import {Keyboard} from 'react-native';
import * as Composer from '../actions/Composer';

export default () => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        console.log("setShouldShowComposeInput[In openReportActionComposeViewWhenClosingMessageEdit(NATIVE)]");
        Composer.setShouldShowComposeInput(true);
        keyboardDidHideListener.remove();
    });
};
