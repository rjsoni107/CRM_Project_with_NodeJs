import React, { useState } from "react";

const FadeInContent =(props)=> {

    return (
        <div ref={props.ref} className={`content-wrapper ${props.customClass} ${props.isVisible ? 'content-wrapper__show' : ''}`} style={{width: `${props.width}px`}}>
            { props.component }
            { props.isFooter &&
                <>
                    <div className="content-btn_wrapper text-end w-100">
                        <button className="lpay_button lpay_button-md lpay_button-secondary" onClick={props.buttonMethod.closeFadeFilter}>Cancel</button>
                        <button className="lpay_button lpay_button-md lpay_button-primary" onClick={(e) => {props.buttonMethod.dataRenderingMethod(e);props.buttonMethod.closeFadeFilter("selectableFilters")}}>Apply</button>
                    </div>
                </> }
        </div>
    )

} 
export default FadeInContent ;