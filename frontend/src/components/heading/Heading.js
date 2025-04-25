
function Heading(props) {
    return (
        <div className={props.customClass}>
            <div className={`heading_with_icon ${props.headingWrapper}`}>
                {props.icon && <span className={`heading_icon_box ${props.iconClass}`} style={props.iconStyle}><i className="fas fa-chart-bar" aria-hidden="true"></i></span>}
                <h2 className={`heading_text ${props.headingClass}`}>{props.title}</h2>
            </div>
        </div>
    )
}

export default Heading;