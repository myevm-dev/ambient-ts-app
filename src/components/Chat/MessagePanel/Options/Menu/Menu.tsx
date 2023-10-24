import { Dispatch, SetStateAction } from 'react';
import styles from './Menu.module.css';
import { FiArrowLeft, FiDelete, FiInfo, FiRotateCw } from 'react-icons/fi';
import { BsFillReplyFill, BsEmojiSmileUpsideDown } from 'react-icons/bs';
import useChatApi from '../../../Service/ChatApi';
import { Message } from '../../../Model/MessageModel';
interface propsIF {
    isMessageDeleted: boolean;
    setIsMessageDeleted: Dispatch<SetStateAction<boolean>>;
    setIsMoreButtonPressed: Dispatch<SetStateAction<boolean>>;
    setFlipped: Dispatch<SetStateAction<boolean>>;
    deleteMsgFromList: any;
    id: string;
    isModerator: boolean;
    isUsersMessage: boolean;
    setIsReplyButtonPressed: Dispatch<SetStateAction<boolean>>;
    isReplyButtonPressed: boolean;
    replyMessageContent: Message | undefined;
    setReplyMessageContent: Dispatch<SetStateAction<Message | undefined>>;
    message: Message | undefined;
    addReactionListener: (message?: Message) => void;
    isUserVerified: boolean;
    riseToBottom: boolean;
}
export default function Menu(props: propsIF) {
    const { deleteMessage } = useChatApi();
    const closePanel = () => {
        // props.deleteMsgFromList(props.id)
        // deleteMessage(props.id).then((result: any) => {
        //     if (result.status === 'OK') {
        //         props.setIsMessageDeleted(true);
        //         props.deleteMsgFromList(props.id, props.isModerator);
        //         return result;
        //     } else {
        //         props.setIsMessageDeleted(false);
        //     }
        // });

        props.deleteMsgFromList(props.id);
    };

    const setReplyMessage = () => {
        console.log(props.message);
        props.setIsReplyButtonPressed(!props.isReplyButtonPressed);
        props.setReplyMessageContent(props.message);
    };

    const addReaction = () => {
        props.addReactionListener(props.message);
    };

    const options = [
        {
            label: 'Reply',
            icon: <BsFillReplyFill size={10} />,
            listener: setReplyMessage,
        },
        {
            label: 'Add Reaction',
            icon: <BsEmojiSmileUpsideDown size={10} />,
            listener: addReaction,
        },
        { label: 'Delete', icon: <FiDelete size={10} />, listener: closePanel },
        {
            label: 'Details',
            icon: <FiArrowLeft size={10} />,
            listener: () => props.setFlipped(true),
        },
    ];

    const filteredOptions =
        !(props.isUsersMessage && props.isUserVerified) && !props.isModerator
            ? options.filter((option) => option.label !== 'Delete')
            : options;

    console.log('........................................');
    console.log(props.riseToBottom);
    console.log('........................................');

    return (
        <div
            className={`${styles.dropdown_item}
        ${props.riseToBottom ? styles.rise_to_bottom : ''}
        `}
            onMouseOver={() => {
                console.log('mouse over');
                props.setIsMoreButtonPressed(true);
            }}
            onMouseEnter={() => {
                console.log('mouse enter');
                props.setIsMoreButtonPressed(true);
            }}
            onMouseLeave={() => {
                console.log('mouse leave');
                props.setIsMoreButtonPressed(false);
            }}
        >
            {props.isUserVerified}
            {filteredOptions.map((option, index) => {
                return (
                    <>
                        <div
                            className={styles.dropdown_node}
                            onClick={() => {
                                if (option.listener) option.listener();
                            }}
                            style={{
                                animationDelay: `${
                                    (options.length - index - 1) * 0.1
                                }s`,
                            }}
                        >
                            <div className={styles.dropdown_node_icon}>
                                {option.icon}
                            </div>
                            <div className={styles.dropdown_node_label}>
                                {option.label}
                            </div>
                        </div>
                    </>
                );
            })}

            {/*             
            <BsFillReplyFill size={10} />
            <BsEmojiSmileUpsideDown size={10} />
            <FiDelete
                size={10}
                color='red'
                onClick={() => {
                    closePanel();
                }}
            /> */}
        </div>
    );
}
