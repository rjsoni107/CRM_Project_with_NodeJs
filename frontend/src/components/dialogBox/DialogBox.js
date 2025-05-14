import { Dialog, DialogTitle, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import './confirmationStyle.css';

function DialogBox({ open, onClose, title, content, footerContent }) {
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="dialog-overlay" onClose={onClose} aria-labelledby="dialog-title">
                <div className="dialog-container">
                    <div className="dialog-backdrop" />

                    <TransitionChild >
                        <DialogPanel className="dialog-panel">
                            {title && (
                                <DialogTitle id="dialog-title" className="dialog-title">
                                    {title}
                                </DialogTitle>
                            )}
                            <div className="dialog-content">{content}</div>
                            {footerContent && <div className="dialog-footer">{footerContent}</div>}
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

export default DialogBox;