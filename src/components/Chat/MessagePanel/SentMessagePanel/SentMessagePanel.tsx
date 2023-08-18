import styles from './SentMessagePanel.module.css';
import { Message } from '../../Model/MessageModel';
import PositionBox from '../PositionBox/PositionBox';
import {
    Dispatch,
    SetStateAction,
    memo,
    useEffect,
    useRef,
    useState,
} from 'react';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { FiDelete } from 'react-icons/fi';
import useChatApi from '../../Service/ChatApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../../Model/UserModel';
import { AiOutlineCheck, AiOutlineCheckCircle } from 'react-icons/ai';
import { DefaultTooltip } from '../../../Global/StyledTooltip/StyledTooltip';

import { IoReturnUpForwardSharp } from 'react-icons/io5';
import ReplyMessage from '../ReplyMessage/ReplyMessage';
import Options from '../Options/Options';
import Menu from '../Options/Menu/Menu';

interface SentMessageProps {
    message: Message;
    ensName: string;
    isCurrentUser: boolean;
    currentUser: string | undefined;
    resolvedAddress: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectedAccountActive: any;
    isUserLoggedIn: boolean;
    isModerator: boolean;
    room: string;
    isMessageDeleted: boolean;
    setIsMessageDeleted: Dispatch<SetStateAction<boolean>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    previousMessage: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextMessage: any;
    deleteMsgFromList: (id: string) => void;
    isLinkInCrocodileLabsLinks(word: string): boolean;
    mentionIndex?: number;
    updateLikeDislike: (messageId: string, like: any) => void;
    socketRef: any;
    userMap?: Map<string, User>;
    verifyWallet: (
        verificationType: number,
        verificationDate: Date,
        e?: any,
    ) => void;
    isUserVerified: boolean;
    formatURL(url: string): void;
    isLinkInCrocodileLabsLinksForInput(word: string): boolean;
    showPopUp: boolean;
    setShowPopUp: Dispatch<SetStateAction<boolean>>;
    popUpText: string;
    setPopUpText: Dispatch<SetStateAction<string>>;
    isReplyButtonPressed: boolean;
    setIsReplyButtonPressed: Dispatch<SetStateAction<boolean>>;
    replyMessageContent: Message | undefined;
    setReplyMessageContent: Dispatch<SetStateAction<Message | undefined>>;
}

function SentMessagePanel(props: SentMessageProps) {
    const [isMoreButtonPressed, setIsMoreButtonPressed] = useState(false);
    const [hasSeparator, setHasSeparator] = useState(false);
    const [isClickedOptions, setIsClickedOptions] = useState(false);
    const [isPosition, setIsPosition] = useState(false);
    const [showAvatar, setShowAvatar] = useState<boolean>(true);
    const [showName, setShowName] = useState<boolean>(true);
    const [daySeparator, setdaySeparator] = useState('');
    const [ok, setOk] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [flipRead, setFlipRead] = useState(false);
    const [count, setCount] = useState(0);
    const [repliedMessageText, setRepliedMessageText] = useState<string>('');
    const [repliedMessageEnsName, setRepliedMessageEnsName] =
        useState<string>('');
    const [repliedMessageDate, setRepliedMessageDate] = useState<string>('');
    const [repliedMessageWalletID, setRepliedMessageWalletID] =
        useState<string>('');

    const likeCount = props.message.likes ? props.message.likes.length : 0;
    const dislikeCount = props.message.dislikes
        ? props.message.dislikes.length
        : 0;

    const { deleteMessage, getRepliedMessageInfo } = useChatApi();

    const navigate = useNavigate();
    const location = useLocation();

    const handleInitialLikeDislike = () => {
        let retVal = 0;
        const liked = props.message.likes?.filter(
            (e) => e === props.currentUser,
        );
        const disliked = props.message.dislikes?.filter(
            (e) => e === props.currentUser,
        );

        if (liked && disliked) {
            retVal = liked?.length > 0 ? 1 : disliked?.length > 0 ? -1 : 0;
        }

        return retVal;
    };

    const messageVoted = handleInitialLikeDislike();

    useEffect(() => {
        const previousMessageDate = new Date(props.previousMessage?.createdAt);
        const currentMessageDate = new Date(props.message?.createdAt);
        const nextMessageDate = new Date(props.nextMessage?.createdAt);
        const currentPreviousDiffInMs = Math.abs(
            currentMessageDate.getTime() - previousMessageDate.getTime(),
        );
        const nextCurrentDiffInMs = Math.abs(
            nextMessageDate.getTime() - currentMessageDate.getTime(),
        );
        getDayAndName(
            props.previousMessage?.createdAt,
            props.message?.createdAt,
        );

        if (props.previousMessage?.sender === props.message?.sender) {
            if (currentPreviousDiffInMs < 1 * 60 * 1000) {
                setShowAvatar(false);
                setShowName(false);
                setOk(true);
                if (
                    nextCurrentDiffInMs < 1 * 60 * 1000 &&
                    props.nextMessage?.sender === props.message?.sender
                ) {
                    setHasSeparator(false);
                } else {
                    setHasSeparator(true);
                }
            } else {
                if (
                    nextCurrentDiffInMs < 1 * 60 * 1000 &&
                    props.message?.sender === props.nextMessage?.sender
                ) {
                    setShowAvatar(true);
                    setShowName(true);
                    setHasSeparator(false);
                } else {
                    setShowAvatar(true);
                    setShowName(true);
                    setHasSeparator(true);
                }
            }
        } else {
            setShowAvatar(true);
            setShowName(true);
            if (
                nextCurrentDiffInMs < 1 * 60 * 1000 &&
                props.nextMessage?.sender === props.message?.sender
            ) {
                setHasSeparator(false);
            } else {
                setHasSeparator(true);
            }
        }
    }, [props.message, props.nextMessage, props.previousMessage]);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsMoreButtonPressed(false);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [setIsMoreButtonPressed]);

    useEffect(() => {
        if (
            props.previousMessage &&
            props.message &&
            props.previousMessage.sender === props.message.sender
        ) {
            const previousMessageDate = new Date(
                props.previousMessage.createdAt,
            );
            const currentMessageDate = new Date(props.message.createdAt);
            const currentPreviousDiffInMs = Math.abs(
                currentMessageDate.getTime() - previousMessageDate.getTime(),
            );

            if (currentPreviousDiffInMs < 1 * 60 * 1000) {
                setCount((prevCount) => prevCount + 1);
            } else {
                setCount(0);
            }
        } else {
            setCount(0);
        }
    }, [props.previousMessage, props.message]);

    useEffect(() => {
        if ('repliedMessage' in props.message) {
            getReplyMessageInfo(props.message.repliedMessage as string);
        }
    }, [props.message]);

    const formatAMPM = (str: string) => {
        const date = new Date(str);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const _min = minutes.toString().padStart(2, '0');
        const strTime = hours + ':' + _min + ' ' + ampm;
        return strTime;
    };

    const getDayAndName = (previousDay: string, currentDay: string) => {
        const today = new Date();
        const previousMessageDate = new Date(previousDay);
        const currentMessageDate = new Date(currentDay);
        const todayDayNumber = today.getUTCDate();
        const todayMonthNumber = today.toLocaleString('default', {
            month: 'long',
        });
        const previousDayNumber = previousMessageDate.getUTCDate();
        const currentDayNumber = currentMessageDate.getUTCDate();
        const currentDayMonthNumber = currentMessageDate.toLocaleString(
            'default',
            {
                month: 'long',
            },
        );
        if (
            todayDayNumber === currentDayNumber &&
            todayMonthNumber === currentDayMonthNumber &&
            previousDayNumber !== currentDayNumber
        ) {
            setdaySeparator('Today');
        } else {
            if (previousDayNumber !== currentDayNumber) {
                setdaySeparator(currentDayNumber + ' ' + currentDayMonthNumber);
            } else {
                setdaySeparator('');
            }
        }
    };

    function getName() {
        if (
            props.message.ensName === 'defaultValue' ||
            props.message.ensName === null ||
            props.message.ensName === 'null' ||
            props.message.ensName === undefined ||
            props.message.ensName === 'undefined'
        ) {
            return props.message.walletID.slice(0, 6) + '...';
        } else {
            return props.message.ensName;
        }
    }

    function handleOpenExplorer(url: string) {
        window.open(url);
    }

    function handleOpenExplorerAddHttp(url: string) {
        window.open(convertToFullUrl(url));
    }

    function convertToFullUrl(domain: string): string {
        const protocol = 'https://';
        return protocol + domain;
    }

    function returnDomain(word: string) {
        if (props.isLinkInCrocodileLabsLinks(word)) {
            const url = new URL(word);
            return url.hostname + url.pathname;
        } else {
            return word;
        }
    }

    function detectLinksFromMessage(url: string) {
        if (url.includes(' ')) {
            const words: string[] = url.split(' ');
            return (
                <>
                    {words.map((word, index) => (
                        <span
                            onClick={() =>
                                props.isLinkInCrocodileLabsLinks(word)
                                    ? handleOpenExplorer(word)
                                    : props.isLinkInCrocodileLabsLinksForInput(
                                          word,
                                      )
                                    ? handleOpenExplorerAddHttp(word)
                                    : ''
                            }
                            key={index}
                            style={
                                props.isLinkInCrocodileLabsLinks(word) ||
                                props.isLinkInCrocodileLabsLinksForInput(word)
                                    ? { color: '#ab7de7', cursor: 'pointer' }
                                    : { color: 'white', cursor: 'default' }
                            }
                        >
                            {' ' + returnDomain(word)}
                            {}
                        </span>
                    ))}
                </>
            );
        } else {
            if (
                props.isLinkInCrocodileLabsLinks(url) ||
                props.isLinkInCrocodileLabsLinksForInput(url)
            ) {
                return (
                    <p
                        style={{ color: '#ab7de7', cursor: 'pointer' }}
                        onClick={() =>
                            props.isLinkInCrocodileLabsLinks(url)
                                ? handleOpenExplorer(url)
                                : props.isLinkInCrocodileLabsLinksForInput(url)
                                ? handleOpenExplorerAddHttp(url)
                                : ''
                        }
                    >
                        {returnDomain(url)}
                    </p>
                );
            } else {
                return url;
            }
        }
    }

    function mentionedMessage() {
        const messagesArray = props.message.message.split(' ');
        if (showAvatar === true) {
            if (props.message.isMentionMessage === true) {
                return (
                    <div className={` ${styles.mention_message_block}`}>
                        {messagesArray.map((word, index) => (
                            <span
                                key={index}
                                className={` ${styles.mention_message}`}
                                style={{
                                    color:
                                        word.slice(1) === props.ensName ||
                                        word.slice(1) ===
                                            props.connectedAccountActive
                                            ? '#7371FC'
                                            : 'white',
                                }}
                            >
                                {' ' + detectLinksFromMessage(word)}
                            </span>
                        ))}
                        <div className={styles.roomInfo_with_mention}>
                            {' '}
                            {props.room === 'Admins'
                                ? props.message.roomInfo
                                : ''}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className={styles.message}>
                        {detectLinksFromMessage(props.message.message)}
                        <div className={styles.roomInfo}>
                            {' '}
                            {props.room === 'Admins'
                                ? props.message.roomInfo
                                : ''}{' '}
                        </div>
                    </div>
                );
            }
        } else {
            if (props.message.isMentionMessage === true) {
                return (
                    <div
                        className={` ${styles.mention_message_block_without_avatar}`}
                    >
                        {messagesArray.map((word, index) => (
                            <span
                                key={index}
                                className={` ${styles.mention_message}`}
                                style={{
                                    color:
                                        word.slice(1) === props.ensName ||
                                        word.slice(1) ===
                                            props.connectedAccountActive
                                            ? '#7371FC'
                                            : 'white',
                                }}
                            >
                                {' ' + detectLinksFromMessage(word)}
                            </span>
                        ))}
                        <div className={styles.roomInfo}>
                            {' '}
                            {props.room === 'Admins'
                                ? props.message.roomInfo
                                : ''}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className={styles.message_without_avatar}>
                        {detectLinksFromMessage(props.message.message)}
                        <div className={styles.roomInfo}>
                            {props.room === 'Admins'
                                ? props.message.roomInfo
                                : ''}
                        </div>
                    </div>
                );
            }
        }
    }

    function deleteMessages(id: string) {
        // eslint-disable-next-line
        // props.setIsMessageDeleted(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteMessage(id).then((result: any) => {
            if (result.status === 'OK') {
                props.setIsMessageDeleted(true);
                props.deleteMsgFromList(id);
                return result;
            } else {
                props.setIsMessageDeleted(false);
            }
        });
    }

    const jazziconsSeed = props.message.walletID.toLowerCase();

    const myJazzicon = (
        <Jazzicon diameter={25} seed={jsNumberForAddress(jazziconsSeed)} />
    );

    const repliedJazzicon =
        'repliedMessage' in props.message ? (
            <Jazzicon
                svgStyles={{ marginBottom: '8px' }}
                diameter={10}
                seed={jsNumberForAddress(repliedMessageWalletID.toLowerCase())}
            />
        ) : undefined;

    // function blockUser(userId: string) {

    // }
    function getReplyMessageInfo(_id: string) {
        getRepliedMessageInfo(_id).then((result: any) => {
            setRepliedMessageText(result[0].message);
            setRepliedMessageDate(formatAMPM(result[0].createdAt));
            setRepliedMessageEnsName(result[0].ensName);
            setRepliedMessageWalletID(result[0].walletID);
        });
        return repliedMessageText;
    }
    function clickOptionButton() {
        setIsClickedOptions(!isClickedOptions);
    }

    function verificationDateCheck() {
        let ret = false;
        const sender = props.message.sender;
        const user = props.userMap?.get(sender);

        if (user?.verifyDate !== undefined && user.verifyDate != undefined) {
            if (
                new Date(user.verifyDate) <= new Date(props.message.createdAt)
            ) {
                ret = true;
            }
        }
        return ret;
    }

    function handleLikeAndDislikeLS(messageId: string, val: number) {
        const currObj = localStorage.getItem('lkds');
        let newObj = {};
        if (currObj != null && currObj != undefined) {
            newObj = { ...JSON.parse(currObj), [messageId]: val };
        } else {
            newObj = { [messageId]: val };
        }
        localStorage.setItem('lkds', JSON.stringify(newObj));

        const payloadObj = {
            userId: props.currentUser,
            actionType: val,
        };

        console.log(payloadObj);

        props.updateLikeDislike(props.message._id, payloadObj);
    }

    function messageStyle() {
        if (ok) {
            if (!hasSeparator) {
                return { width: '90%', marginBottom: -15 };
            } else {
                return { width: '90%', marginBottom: 0 };
            }
        } else {
            return { width: '90%', marginBottom: -7 };
        }
    }

    return (
        <div
            className={`${styles.msg_bubble_container} ${
                props.mentionIndex !== undefined
                    ? 'mentionedMessage mentIndex-' + props.mentionIndex
                    : ''
            }  ${flipped ? styles.flipped : ''}  ${
                flipRead ? styles.flip_read : ''
            } `}
            style={messageStyle()}
            data-ment-index={props.mentionIndex}
        >
            <div className={styles.msg_bubble_content}>
                <div className={styles.msg_bubble_front}>
                    <div
                        className={styles.flip_trigger}
                        onClick={() => {
                            setFlipped(true);
                        }}
                    ></div>
                    <div className={styles.options_button}>
                        <Options
                            setIsReplyButtonPressed={
                                props.setIsReplyButtonPressed
                            }
                            message={props.message}
                            isReplyButtonPressed={props.isReplyButtonPressed}
                            replyMessageContent={props.replyMessageContent}
                            setReplyMessageContent={
                                props.setReplyMessageContent
                            }
                            isMoreButtonPressed={isMoreButtonPressed}
                            setIsMoreButtonPressed={setIsMoreButtonPressed}
                        />
                    </div>
                    <div>
                        {daySeparator === '' ? (
                            ''
                        ) : daySeparator !== '' ? (
                            <p className={styles.separator}>{daySeparator}</p>
                        ) : (
                            ''
                        )}
                        {'repliedMessage' in props.message &&
                            (showAvatar ? (
                                <IoReturnUpForwardSharp
                                    style={{
                                        position: 'absolute',
                                        top: '-0.3rem',
                                        left: '0.6rem',
                                    }}
                                />
                            ) : (
                                <IoReturnUpForwardSharp
                                    style={{
                                        position: 'absolute',
                                        top: '-0.3rem',
                                        left: '0.6rem',
                                        transform: 'scaleY(-1)',
                                    }}
                                />
                            ))}

                        {'repliedMessage' in props.message ? (
                            <div className={styles.replied_box}>
                                <ReplyMessage
                                    message={repliedMessageText}
                                    ensName={repliedMessageEnsName}
                                    time={repliedMessageDate}
                                    setIsReplyButtonPressed={
                                        props.setIsReplyButtonPressed
                                    }
                                    isReplyButtonPressed={false}
                                    myJazzicon={repliedJazzicon}
                                    walletID={repliedMessageWalletID}
                                />
                            </div>
                        ) : (
                            ''
                        )}
                        <div
                            className={
                                props.isUserLoggedIn
                                    ? props.message.isMentionMessage === false
                                        ? styles.sent_message_body
                                        : props.message.mentionedName?.trim() ===
                                              props.ensName?.trim() ||
                                          props.message.mentionedName?.trim() ===
                                              props.connectedAccountActive?.trim()
                                        ? styles.sent_message_body_with_mention
                                        : styles.sent_message_body
                                    : styles.sent_message_body
                            }
                        >
                            {showAvatar && (
                                <div className={styles.avatar_jazzicons}>
                                    {myJazzicon}
                                </div>
                            )}
                            {!showAvatar && (
                                <div
                                    style={{
                                        display: 'none',
                                        marginLeft: '10px',
                                    }}
                                >
                                    <div className={styles.nft_container}>
                                        {myJazzicon}
                                    </div>
                                </div>
                            )}
                            <div className={styles.message_item}>
                                <div
                                    className={
                                        showName && props.isCurrentUser
                                            ? styles.current_user_name
                                            : showName && !props.isCurrentUser
                                            ? styles.name
                                            : !showName && !props.isCurrentUser
                                            ? ''
                                            : ''
                                    }
                                    onClick={() => {
                                        if (
                                            location.pathname !==
                                            `/${
                                                props.message.ensName ===
                                                'defaultValue'
                                                    ? props.message.walletID
                                                    : props.message.ensName
                                            }`
                                        ) {
                                            navigate(
                                                `/${
                                                    props.isCurrentUser
                                                        ? 'account'
                                                        : props.message
                                                              .ensName ===
                                                          'defaultValue'
                                                        ? props.message.walletID
                                                        : props.message.ensName
                                                }`,
                                            );
                                        }
                                    }}
                                >
                                    {showName && getName()}
                                    {showAvatar && verificationDateCheck() && (
                                        <div className={styles.verified_icon}>
                                            <AiOutlineCheck
                                                color='var(--other-green)'
                                                size={10}
                                            />
                                        </div>
                                    )}
                                </div>
                                {showAvatar &&
                                    !verificationDateCheck() &&
                                    props.isCurrentUser && (
                                        <>
                                            <DefaultTooltip
                                                interactive
                                                title={
                                                    props.isUserVerified
                                                        ? 'Update verification date'
                                                        : 'Verify wallet since this message'
                                                }
                                                placement={'left'}
                                                arrow
                                                enterDelay={400}
                                                leaveDelay={200}
                                            >
                                                <div
                                                    className={
                                                        styles.update_verify_date_icon
                                                    }
                                                    onClick={() => {
                                                        props.verifyWallet(
                                                            1,
                                                            new Date(
                                                                props.message.createdAt,
                                                            ),
                                                        );
                                                    }}
                                                >
                                                    <AiOutlineCheck
                                                        color='var(--other-red)'
                                                        size={10}
                                                    />
                                                </div>
                                            </DefaultTooltip>
                                        </>
                                    )}
                                <PositionBox
                                    message={props.message.message}
                                    isInput={false}
                                    isPosition={isPosition}
                                    setIsPosition={setIsPosition}
                                    walletExplorer={getName()}
                                    isCurrentUser={props.isCurrentUser}
                                    showAvatar={showAvatar}
                                />
                                {!isPosition && mentionedMessage()}
                                {isMoreButtonPressed ? (
                                    <Options
                                        setIsReplyButtonPressed={
                                            props.setIsReplyButtonPressed
                                        }
                                        message={props.message}
                                        isReplyButtonPressed={
                                            props.isReplyButtonPressed
                                        }
                                        replyMessageContent={
                                            props.replyMessageContent
                                        }
                                        setReplyMessageContent={
                                            props.setReplyMessageContent
                                        }
                                        isMoreButtonPressed={
                                            isMoreButtonPressed
                                        }
                                        setIsMoreButtonPressed={
                                            setIsMoreButtonPressed
                                        }
                                    />
                                ) : (
                                    <></>
                                )}
                            </div>

                            {/* {props.moderator ? (
                                <FiDelete
                                    color='red'
                                    onClick={() =>
                                        deleteMessages(props.message._id)
                                    }
                                    style={{ cursor: 'pointer' }}
                                />
                            ) : (
                                ''
                            )} */}
                            <div className={styles.reply_message}>
                                <p className={styles.message_date}>
                                    {formatAMPM(props.message.createdAt)}
                                </p>

                                <div></div>
                            </div>

                            {/* {snackbarContent} */}
                        </div>
                        {hasSeparator ? (
                            <hr style={{ cursor: 'default' }} />
                        ) : (
                            <></>
                        )}
                    </div>
                </div>

                <div className={styles.msg_bubble_back}>
                    <div
                        className={styles.flip_trigger}
                        onClick={() => {
                            setFlipped(false);
                            setFlipRead(false);
                        }}
                    ></div>
                    <div
                        className={styles.flip_trigger_lefted}
                        onMouseEnter={() => {
                            setFlipRead(true);
                        }}
                        onMouseLeave={() => {
                            setFlipRead(false);
                        }}
                    >
                        💬
                    </div>
                    {/* <div className={styles.like_btn_base}> + </div>
                    <div className={styles.like_btn_base}> - </div> */}

                    <div className={styles.msg_bubble_back_content}>
                        <div
                            className={`${
                                messageVoted == 1 ? styles.active : ''
                            } ${styles.like_btn_base} 
                            ${!props.isUserVerified ? styles.disabled : ''}
                            `}
                            onClick={() => {
                                if (props.isUserVerified) {
                                    handleLikeAndDislikeLS(
                                        props.message._id,
                                        1,
                                    );
                                }
                            }}
                        >
                            {' '}
                            👍{' '}
                        </div>

                        <div
                            className={`${
                                messageVoted == -1 ? styles.active : ''
                            } ${styles.like_btn_base} ${styles.dislike_btn}
                            ${!props.isUserVerified ? styles.disabled : ''}
                            `}
                            onClick={() => {
                                if (props.isUserVerified) {
                                    handleLikeAndDislikeLS(
                                        props.message._id,
                                        -1,
                                    );
                                }
                            }}
                        >
                            {' '}
                            👎{' '}
                        </div>

                        {likeCount + dislikeCount > 0 && (
                            <>
                                <div
                                    className={styles.like_dislike_bar_wrapper}
                                >
                                    <div
                                        className={
                                            styles.like_dislike_node_wrapper
                                        }
                                        style={{
                                            width:
                                                (likeCount /
                                                    (dislikeCount +
                                                        likeCount)) *
                                                    100 +
                                                '%',
                                        }}
                                    >
                                        <div
                                            className={styles.like_dislike_node}
                                        ></div>
                                    </div>
                                    <div
                                        className={
                                            styles.like_dislike_node_wrapper
                                        }
                                        style={{
                                            width:
                                                (dislikeCount /
                                                    (dislikeCount +
                                                        likeCount)) *
                                                    100 +
                                                '%',
                                        }}
                                    >
                                        <div
                                            className={`${styles.like_dislike_node} ${styles.dislike_node}`}
                                        ></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(SentMessagePanel);
