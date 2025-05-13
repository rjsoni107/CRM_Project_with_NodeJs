import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { GrClose } from 'react-icons/gr';
import './confirmationStyle.css';

const DialogBox = props => {    
    // DIALOG ACTION
    let dialogAction = null;
    if (props.isFooter && props.isAlternateBtn) {
        dialogAction = (
            <DialogActions>
                {props.alternateBtnContent}
                {props.footerContent}
            </DialogActions>
        );
    } else if(props.isFooter){
        dialogAction = (
            <DialogActions>
                {props.footerContent}
            </DialogActions>
        );
    }

    return (
        <Dialog className={props.mainClass} scroll="body" maxWidth={props.maxWidth} fullWidth={props.fullWidth} open={props.open} onClose={props.onClose}>
            <DialogTitle>
                {props.title}
                {props.closeIcon ? (
                    <GrClose onClick={props.onClose} />
                ) : (null)}
            </DialogTitle>
            <DialogContent className={props.contentClass}>
                {props.content}
            </DialogContent>

            {dialogAction}
        </Dialog>
    );
}

export const ImagePreviewBox = (props) => {
    return (
        <Dialog scroll="body" maxWidth={props.maxWidth} fullWidth={props.fullWidth} open={props.open} onClose={props.onClose}>
            <DialogTitle>
                {props.closeIcon ? (
                    <GrClose onClick={props.onClose} />
                ) : (null)}
            </DialogTitle>
            <DialogContent className={props.contentClass}>
                {props.content}
            </DialogContent>
        </Dialog>
    );
}

export default DialogBox;