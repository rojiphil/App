import {Keyboard} from 'react-native';
import * as Composer from '../actions/Composer';

export default () => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        console.log("openReportActionComposeViewWhenClosingMessageEdit,index.native[setShouldShowComposeInput(true)]");
        Composer.setShouldShowComposeInput(true);
        keyboardDidHideListener.remove();
    });
};
