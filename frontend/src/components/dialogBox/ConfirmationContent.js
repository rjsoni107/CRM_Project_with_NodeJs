import { BsExclamationCircle, BsCheck2Circle, BsXCircle } from 'react-icons/bs';
const ConfimationContent = props => {
    let _responseIcon = (_data) => {
        switch (_data) {
            case 'confirmation':
                return <BsExclamationCircle />
            case 'success':
                return <BsCheck2Circle />
            case 'error':
                return <BsXCircle />
            default:
                return null
        }
    }
    return (
        <div className={`content_wrapper ${props.dialogTypeClass} ${props.dialogType}`}>
            {props.dialogType !== null ? (
                <div className="content_wrapper-icon">
                    {_responseIcon(props.dialogType)}
                </div>

            ) : null}
            <div className="content_wrapper-text">
                {props.content ? (
                    props.content
                ) : (<h5>Do you really want to perform this action !<small>This process cannot be undone</small></h5>)}

            </div>
        </div>
    )
}

export default ConfimationContent;